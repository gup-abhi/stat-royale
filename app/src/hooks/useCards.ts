import { useQuery } from '@tanstack/react-query';
import { getCardsApi } from '../api/cards.api';

export function useCards() {
  return useQuery({
    queryKey: ['cards'],
    queryFn: getCardsApi,
    staleTime: 60 * 60 * 1000,
  });
}
