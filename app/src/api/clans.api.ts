import { Clan, ClanMember } from '../../../shared/types';
import { apiClient } from './client';

function encodeTag(tag: string): string {
  return encodeURIComponent(tag.trim().toUpperCase().replace(/^#?/, '#'));
}

export async function getClanApi(tag: string): Promise<Clan> {
  const { data } = await apiClient.get(`/clans/${encodeTag(tag)}`);
  return data.data;
}

export async function getClanMembersApi(tag: string): Promise<ClanMember[]> {
  const { data } = await apiClient.get(`/clans/${encodeTag(tag)}/members`);
  return data.data;
}
