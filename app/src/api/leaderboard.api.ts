import { LeaderboardPlayer } from '../../../shared/types';
import { apiClient } from './client';

export async function getLeaderboardApi(location: string): Promise<LeaderboardPlayer[]> {
  const { data } = await apiClient.get('/leaderboard/players', { params: { location } });
  return data.data;
}
