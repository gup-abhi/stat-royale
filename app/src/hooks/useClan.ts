import { useQuery } from '@tanstack/react-query';
import { getClanApi } from '../api/clans.api';

export function useClan(tag: string) {
  return useQuery({
    queryKey: ['clan', tag],
    queryFn: () => getClanApi(tag),
    enabled: tag.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}
