import axios, { AxiosInstance } from 'axios';
import * as redis from '../cache/redis';
import { normaliseTag, encodeTag } from '../utils/normalise-tag';
import { NotFoundError, SupercellUnavailableError } from '../utils/supercell-errors';
import { logger } from '../utils/logger';

// ─── Raw Supercell API types ──────────────────────────────────────────────────

interface RawArena {
  id: number;
  name: string;
}

interface RawCard {
  id: number;
  name: string;
  level: number;
  starLevel?: number;
  maxLevel: number;
  count: number;
  iconUrls?: { medium?: string };
  elixirCost?: number;
  rarity?: string;
  type?: string;
  arena?: number;
}

interface RawPlayer {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  arena: RawArena;
  wins: number;
  losses: number;
  threeCrownWins: number;
  battleCount: number;
  starPoints?: number;
  clan?: { tag: string; name: string; role: string; badgeId: number };
  cards: RawCard[];
  leagueStatistics?: {
    currentSeason?: { rank?: number; trophies: number; bestTrophies: number };
    bestSeason?: { id: string; rank: number; trophies: number };
  };
}

interface RawBattleTeamMember {
  tag: string;
  name: string;
  crowns: number;
  cards: RawCard[];
  trophyChange?: number;
}

interface RawBattle {
  type: string;
  battleTime: string;
  arena: RawArena;
  team: RawBattleTeamMember[];
  opponent: RawBattleTeamMember[];
  deckSelection?: string;
  elapsedSeconds?: number;
}

interface RawChest {
  index: number;
  name: string;
}

interface RawClanMember {
  tag: string;
  name: string;
  role: string;
  trophies: number;
  arena: RawArena;
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
  lastSeen: string;
}

interface RawClan {
  tag: string;
  name: string;
  description?: string;
  badgeId: number;
  type: string;
  clanScore: number;
  clanWarTrophies: number;
  location?: { id: number; name: string; countryCode?: string };
  requiredTrophies: number;
  donationsPerWeek: number;
  memberCount?: number;
  memberList?: RawClanMember[];
}

interface RawWarlog {
  items: unknown[];
  paging?: unknown;
}

interface RawClanSearch {
  items: RawClan[];
}

interface RawCards {
  items: RawCard[];
}

interface RawLeaderboard {
  items: Array<{
    tag: string;
    name: string;
    trophies: number;
    rank: number;
    clan?: { tag: string; name: string; badgeId: number };
    arena: RawArena;
  }>;
}

export interface ClanSearchParams {
  name?: string;
  type?: string;
  minTrophies?: number;
  locationId?: number;
  limit?: number;
}

// ─── Axios client ─────────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: 'https://api.clashroyale.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.SUPERCELL_API_KEY}`,
  },
  timeout: 10_000,
});

// ─── Cache helper ─────────────────────────────────────────────────────────────

// On 503, fall back to a stale copy stored with a much longer TTL.
const STALE_TTL = 86_400; // 24 h

async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const staleKey = `${key}:stale`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  logger.debug({ cacheKey: key }, 'Supercell API cache miss');

  try {
    const data = await fetcher();
    const serialised = JSON.stringify(data);
    await redis.setex(key, ttl, serialised);
    await redis.setex(staleKey, STALE_TTL, serialised);
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        throw new NotFoundError(err.response.data?.reason ?? 'Not found');
      }
      if (err.response?.status === 503 || !err.response) {
        logger.warn({ key }, 'Supercell API unavailable — checking stale cache');
        const stale = await redis.get(staleKey);
        if (stale) return JSON.parse(stale) as T;
        throw new SupercellUnavailableError();
      }
    }
    throw err;
  }
}

// ─── Player ──────────────────────────────────────────────────────────────────

export async function getPlayer(tag: string): Promise<RawPlayer> {
  const norm = normaliseTag(tag);
  return withCache(`rs:player:${norm}`, 120, async () => {
    const { data } = await client.get<RawPlayer>(`/players/${encodeTag(norm)}`);
    return data;
  });
}

export async function getPlayerBattles(tag: string): Promise<RawBattle[]> {
  const norm = normaliseTag(tag);
  return withCache(`rs:player:${norm}:battles`, 120, async () => {
    const { data } = await client.get<{ items: RawBattle[] }>(
      `/players/${encodeTag(norm)}/battlelog`,
    );
    return data.items ?? data;
  });
}

export async function getPlayerChests(tag: string): Promise<RawChest[]> {
  const norm = normaliseTag(tag);
  return withCache(`rs:player:${norm}:chests`, 300, async () => {
    const { data } = await client.get<{ items: RawChest[] }>(
      `/players/${encodeTag(norm)}/upcomingchests`,
    );
    return data.items ?? data;
  });
}

// ─── Clan ────────────────────────────────────────────────────────────────────

export async function getClan(tag: string): Promise<RawClan> {
  const norm = normaliseTag(tag);
  return withCache(`rs:clan:${norm}`, 600, async () => {
    const { data } = await client.get<RawClan>(`/clans/${encodeTag(norm)}`);
    return data;
  });
}

export async function getClanMembers(tag: string): Promise<RawClanMember[]> {
  const norm = normaliseTag(tag);
  return withCache(`rs:clan:${norm}:members`, 600, async () => {
    const { data } = await client.get<{ items: RawClanMember[] }>(
      `/clans/${encodeTag(norm)}/members`,
    );
    return data.items;
  });
}

export async function getClanWarlog(tag: string): Promise<RawWarlog> {
  const norm = normaliseTag(tag);
  return withCache(`rs:clan:${norm}:warlog`, 600, async () => {
    const { data } = await client.get<RawWarlog>(
      `/clans/${encodeTag(norm)}/warlog`,
    );
    return data;
  });
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchClans(params: ClanSearchParams): Promise<RawClan[]> {
  const { data } = await client.get<RawClanSearch>('/clans', { params });
  return data.items;
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export async function getCards(): Promise<RawCard[]> {
  return withCache('rs:cards', 3600, async () => {
    const { data } = await client.get<RawCards>('/cards');
    return data.items;
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(locationId: string | 'global'): Promise<RawLeaderboard['items']> {
  const cacheKey =
    locationId === 'global'
      ? 'rs:leaderboard:global'
      : `rs:leaderboard:${locationId}`;

  const path =
    locationId === 'global'
      ? '/locations/global/rankings/players'
      : `/locations/${locationId}/rankings/players`;

  return withCache(cacheKey, 600, async () => {
    const { data } = await client.get<RawLeaderboard>(path);
    return data.items;
  });
}
