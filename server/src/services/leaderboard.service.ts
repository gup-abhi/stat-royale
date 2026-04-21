import * as supercell from './supercell.service';
import { LeaderboardPlayer } from '../../../shared/types';

export async function getPlayerLeaderboard(location: string): Promise<LeaderboardPlayer[]> {
  const raw = await supercell.getLeaderboard(location === 'global' ? 'global' : location);
  return raw.map((p): LeaderboardPlayer => ({
    rank: p.rank,
    tag: p.tag,
    name: p.name,
    trophies: p.trophies,
    clan: p.clan
      ? { tag: p.clan.tag, name: p.clan.name, badgeId: p.clan.badgeId }
      : undefined,
    arena: { id: p.arena.id, name: p.arena.name },
  }));
}
