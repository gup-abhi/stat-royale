import { Card } from '../../../shared/types';
import { apiClient } from './client';

export async function getCardsApi(): Promise<Card[]> {
  const { data } = await apiClient.get('/cards');
  return data.data;
}
