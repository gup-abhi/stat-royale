import { useQuery } from '@tanstack/react-query';
import { getPlayerApi, getPlayerBattlesApi, getPlayerChestsApi } from '../api/players.api';

export function usePlayer(tag: string) {
  return useQuery({
    queryKey: ['player', tag],
    queryFn: () => getPlayerApi(tag),
    enabled: tag.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePlayerBattles(tag: string) {
  return useQuery({
    queryKey: ['player', tag, 'battles'],
    queryFn: () => getPlayerBattlesApi(tag),
    enabled: tag.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePlayerChests(tag: string) {
  return useQuery({
    queryKey: ['player', tag, 'chests'],
    queryFn: () => getPlayerChestsApi(tag),
    enabled: tag.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}
