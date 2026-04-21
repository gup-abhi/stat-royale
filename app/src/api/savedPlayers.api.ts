import { SavedPlayer } from '../../../shared/types';
import { apiClient } from './client';

export async function getSavedPlayersApi(): Promise<SavedPlayer[]> {
  const { data } = await apiClient.get('/user/saved-players');
  return data.data;
}

export async function savePlayerApi(playerTag: string, nickname?: string): Promise<SavedPlayer> {
  const { data } = await apiClient.post('/user/saved-players', { playerTag, nickname });
  return data.data;
}

export async function deleteSavedPlayerApi(playerTag: string): Promise<void> {
  await apiClient.delete(`/user/saved-players/${encodeURIComponent(playerTag)}`);
}
