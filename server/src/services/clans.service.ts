import * as supercell from './supercell.service';
import { normaliseTag } from '../utils/normalise-tag';
import { InvalidTagError } from '../utils/supercell-errors';
import { Clan, ClanMember } from '../../../shared/types';

const TAG_REGEX = /^[0-9A-Z]{3,10}$/;

function validateTag(tag: string): string {
  const norm = normaliseTag(tag);
  if (!TAG_REGEX.test(norm)) throw new InvalidTagError(tag);
  return norm;
}

export async function getClan(tag: string): Promise<Clan> {
  validateTag(tag);
  const raw = await supercell.getClan(tag);
  const members = await supercell.getClanMembers(tag);

  return {
    tag: raw.tag,
    name: raw.name,
    description: raw.description ?? '',
    badgeId: raw.badgeId,
    type: (raw.type as Clan['type']) ?? 'open',
    clanScore: raw.clanScore,
    clanWarTrophies: raw.clanWarTrophies,
    location: raw.location,
    requiredTrophies: raw.requiredTrophies,
    donationsPerWeek: raw.donationsPerWeek,
    memberCount: members.length,
    members: members.map(
      (m): ClanMember => ({
        tag: m.tag,
        name: m.name,
        role: m.role as ClanMember['role'],
        trophies: m.trophies,
        arena: { id: m.arena.id, name: m.arena.name },
        clanRank: m.clanRank,
        previousClanRank: m.previousClanRank,
        donations: m.donations,
        donationsReceived: m.donationsReceived,
        lastSeen: m.lastSeen,
      }),
    ),
  };
}
