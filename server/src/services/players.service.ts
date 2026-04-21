import * as supercell from './supercell.service';
import { normaliseTag } from '../utils/normalise-tag';
import { InvalidTagError } from '../utils/supercell-errors';
import { Battle, BattleType, BattleDeckCard, Player, UpcomingChest } from '../../../shared/types';

const TAG_REGEX = /^[0-9A-Z]{3,10}$/;

function validateTag(tag: string): string {
  const norm = normaliseTag(tag);
  if (!TAG_REGEX.test(norm)) throw new InvalidTagError(tag);
  return norm;
}

export async function getPlayer(tag: string): Promise<Player> {
  validateTag(tag);
  const raw = await supercell.getPlayer(tag);

  const wins = raw.wins ?? 0;
  const losses = raw.losses ?? 0;
  const battleCount = raw.battleCount ?? wins + losses;
  const winRate = battleCount > 0 ? Math.round((wins / battleCount) * 10000) / 100 : 0;

  const season = raw.leagueStatistics?.currentSeason;
  const best = raw.leagueStatistics?.bestSeason;

  return {
    tag: raw.tag,
    name: raw.name,
    level: raw.expLevel,
    trophies: raw.trophies,
    bestTrophies: raw.bestTrophies,
    arena: { id: raw.arena.id, name: raw.arena.name },
    wins,
    losses,
    threeCrownWins: raw.threeCrownWins ?? 0,
    battleCount,
    winRate,
    starPoints: raw.starPoints ?? 0,
    clan: raw.clan
      ? { tag: raw.clan.tag, name: raw.clan.name, role: raw.clan.role, badgeId: raw.clan.badgeId }
      : undefined,
    cards: (raw.cards ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      starLevel: c.starLevel ?? 0,
      maxLevel: c.maxLevel,
      count: c.count,
      iconUrl: c.iconUrls?.medium ?? '',
    })),
    currentSeason: {
      rank: season?.rank,
      trophies: season?.trophies ?? 0,
      bestTrophies: season?.bestTrophies ?? 0,
    },
    bestSeason: {
      id: best?.id ?? '',
      rank: best?.rank ?? 0,
      trophies: best?.trophies ?? 0,
    },
  };
}

function mapBattleType(type: string): BattleType {
  const t = type.toLowerCase();
  if (t === 'pathoflegend' || t === 'pvp' || t === 'ranked') return 'pathOfLegend';
  if (t.includes('war')) return 'clanWar';
  if (t.includes('challenge') || t.includes('tournament') || t.includes('special')) return 'challenge';
  if (t.includes('friendly')) return 'friendly';
  return 'other';
}

function mapDeckCard(c: { id: number; name: string; level: number; iconUrls?: { medium?: string } }): BattleDeckCard {
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    iconUrl: c.iconUrls?.medium ?? '',
  };
}

export async function getPlayerChests(tag: string): Promise<UpcomingChest[]> {
  validateTag(tag);
  const raw = await supercell.getPlayerChests(tag);
  return raw.map((c) => ({
    index: c.index,
    name: c.name,
    iconUrl: undefined,
  }));
}

export async function getPlayerBattles(tag: string): Promise<Battle[]> {
  const norm = validateTag(tag);
  const raw = await supercell.getPlayerBattles(tag);

  return raw.slice(0, 25).map((b) => {
    const me = b.team?.[0];
    const opp = b.opponent?.[0];
    const playerCrowns = me?.crowns ?? 0;
    const opponentCrowns = opp?.crowns ?? 0;

    return {
      id: `${norm}_${b.battleTime}`,
      battleType: mapBattleType(b.type),
      battleTime: b.battleTime,
      elapsedSeconds: b.elapsedSeconds ?? 0,
      playerWon: playerCrowns > opponentCrowns,
      playerCrowns,
      opponentCrowns,
      playerDeck: (me?.cards ?? []).map(mapDeckCard),
      opponent: {
        tag: opp?.tag ?? '',
        name: opp?.name ?? 'Unknown',
        deck: (opp?.cards ?? []).map(mapDeckCard),
      },
      trophyChange: me?.trophyChange,
      arena: { id: b.arena.id, name: b.arena.name },
    };
  });
}
