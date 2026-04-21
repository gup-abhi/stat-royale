import { useQuery } from '@tanstack/react-query';
import { getLeaderboardApi } from '../api/leaderboard.api';

export function useLeaderboard(location: string) {
  return useQuery({
    queryKey: ['leaderboard', location],
    queryFn: () => getLeaderboardApi(location),
    staleTime: 10 * 60 * 1000,
  });
}
