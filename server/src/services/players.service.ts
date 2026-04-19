import * as supercell from './supercell.service';
import { normaliseTag } from '../utils/normalise-tag';
import { InvalidTagError } from '../utils/supercell-errors';
import { Player } from '../../../shared/types';

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
