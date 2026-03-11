import client from './client';
import type { CurrentWeather, Forecast, City } from '../types';

export async function getCurrentWeather(city: string): Promise<CurrentWeather> {
  const { data } = await client.get<{ data: CurrentWeather }>(`/weather/current/${encodeURIComponent(city)}`);
  return data.data;
}

export async function getForecast(city: string): Promise<Forecast> {
  const { data } = await client.get<{ data: Forecast }>(`/weather/forecast/${encodeURIComponent(city)}`);
  return data.data;
}

export async function searchCities(query: string): Promise<City[]> {
  const { data } = await client.get<{ data: { cities: City[] } }>('/weather/search', {
    params: { q: query },
  });
  return data.data.cities;
}
