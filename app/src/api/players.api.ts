import { Player, Battle, UpcomingChest } from '../../../shared/types';
import { apiClient } from './client';

function encodeTag(tag: string): string {
  return encodeURIComponent(tag.trim().toUpperCase().replace(/^#?/, '#'));
}

export async function getPlayerApi(tag: string): Promise<Player> {
  const { data } = await apiClient.get(`/players/${encodeTag(tag)}`);
  return data.data;
}

export async function getPlayerBattlesApi(tag: string): Promise<Battle[]> {
  const { data } = await apiClient.get(`/players/${encodeTag(tag)}/battles`);
  return data.data;
}

export async function getPlayerChestsApi(tag: string): Promise<UpcomingChest[]> {
  const { data } = await apiClient.get(`/players/${encodeTag(tag)}/chests`);
  return data.data;
}
