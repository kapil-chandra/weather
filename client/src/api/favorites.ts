import client from './client';
import type { Favorite } from '../types';

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await client.get<{ data: { favorites: Favorite[] } }>('/favorites');
  return data.data.favorites;
}

export async function addFavorite(city: string, country: string): Promise<Favorite> {
  const { data } = await client.post<{ data: { favorite: Favorite } }>('/favorites', { city, country });
  return data.data.favorite;
}

export async function removeFavorite(id: number): Promise<void> {
  await client.delete(`/favorites/${id}`);
}
