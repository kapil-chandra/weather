import client from './client';
import type { SearchHistoryItem } from '../types';

export async function getHistory(limit = 10): Promise<SearchHistoryItem[]> {
  const { data } = await client.get<{ data: { searches: SearchHistoryItem[] } }>('/history', {
    params: { limit },
  });
  return data.data.searches;
}
