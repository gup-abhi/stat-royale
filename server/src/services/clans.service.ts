import * as supercell from './supercell.service';
import { normaliseTag } from '../utils/normalise-tag';
import { InvalidTagError, ValidationError } from '../utils/supercell-errors';
import { Clan, ClanMember, ClanSearchResult } from '../../../shared/types';

const TAG_REGEX = /^[0-9A-Z]{3,10}$/;

function validateTag(tag: string): string {
  const norm = normaliseTag(tag);
  if (!TAG_REGEX.test(norm)) throw new InvalidTagError(tag);
  return norm;
}

export async function searchClans(params: {
  name?: string;
  type?: string;
  minTrophies?: number;
  locationId?: number;
}): Promise<ClanSearchResult[]> {
  const name = params.name?.trim() ?? '';
  if (name.length < 3) throw new ValidationError('Clan name must be at least 3 characters');

  const raw = await supercell.searchClans({
    name,
    type: params.type,
    minTrophies: params.minTrophies,
    locationId: params.locationId,
    limit: 20,
  });

  return raw.map((c): ClanSearchResult => ({
    tag: c.tag,
    name: c.name,
    type: (c.type as ClanSearchResult['type']) ?? 'open',
    badgeId: c.badgeId,
    clanScore: c.clanScore,
    clanWarTrophies: c.clanWarTrophies,
    location: c.location,
    memberCount: c.memberCount ?? 0,
    requiredTrophies: c.requiredTrophies,
  }));
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
