import { City, CurrentWeather, Forecast, ForecastDay, WeatherService } from '../types/weather.js';
import { NotFoundError } from '../errors.js';

const MOCK_CITIES: Record<string, { country: string }> = {
  'London': { country: 'GB' },
  'New York': { country: 'US' },
  'Tokyo': { country: 'JP' },
  'Paris': { country: 'FR' },
  'Sydney': { country: 'AU' },
  'Berlin': { country: 'DE' },
  'Toronto': { country: 'CA' },
  'Mumbai': { country: 'IN' },
  'São Paulo': { country: 'BR' },
  'Cairo': { country: 'EG' },
};

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function mockCurrentWeather(city: string, country: string): CurrentWeather {
  const r = seededRandom(city + new Date().toISOString().split('T')[0]);
  const tempC = Math.round((r * 35 - 5) * 10) / 10;
  const tempF = Math.round((tempC * 9 / 5 + 32) * 10) / 10;
  const descriptions = ['Clear sky', 'Mainly clear', 'Partly cloudy', 'Slight rain', 'Overcast'];
  const icons = ['☀️', '🌤️', '⛅', '🌧️', '☁️'];
  const idx = Math.floor(r * descriptions.length);

  return {
    city,
    country,
    temp_f: tempF,
    temp_c: tempC,
    description: descriptions[idx],
    humidity: Math.round(40 + r * 50),
    wind_mph: Math.round(r * 20 * 10) / 10,
    icon: icons[idx],
    feels_like_f: Math.round((tempF - 2 + r * 4) * 10) / 10,
    feels_like_c: Math.round((tempC - 1 + r * 2) * 10) / 10,
    pressure: Math.round(1000 + r * 30),
    wind_direction: Math.round(r * 360),
    temp_high_f: Math.round((tempF + 3 + r * 5) * 10) / 10,
    temp_high_c: Math.round((tempC + 2 + r * 3) * 10) / 10,
    temp_low_f: Math.round((tempF - 5 - r * 5) * 10) / 10,
    temp_low_c: Math.round((tempC - 3 - r * 3) * 10) / 10,
  };
}

function mockForecast(city: string, country: string): Forecast {
  const forecast: ForecastDay[] = [];
  const today = new Date();

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const r = seededRandom(city + dateStr);

    const highC = Math.round((r * 30 + 5) * 10) / 10;
    const lowC = Math.round((highC - 5 - r * 10) * 10) / 10;
    const descriptions = ['Clear sky', 'Mainly clear', 'Partly cloudy', 'Slight rain', 'Overcast'];
    const icons = ['☀️', '🌤️', '⛅', '🌧️', '☁️'];
    const idx = Math.floor(r * descriptions.length);

    forecast.push({
      date: dateStr,
      high_f: Math.round((highC * 9 / 5 + 32) * 10) / 10,
      high_c: highC,
      low_f: Math.round((lowC * 9 / 5 + 32) * 10) / 10,
      low_c: lowC,
      description: descriptions[idx],
      icon: icons[idx],
    });
  }

  return { city, country, forecast };
}

export class MockWeatherService implements WeatherService {
  async getCurrentWeather(city: string): Promise<CurrentWeather> {
    const entry = Object.entries(MOCK_CITIES).find(
      ([name]) => name.toLowerCase() === city.toLowerCase(),
    );

    if (!entry) {
      // For any unknown city, still return mock data instead of 404
      return mockCurrentWeather(city, '??');
    }

    return mockCurrentWeather(entry[0], entry[1].country);
  }

  async getForecast(city: string): Promise<Forecast> {
    const entry = Object.entries(MOCK_CITIES).find(
      ([name]) => name.toLowerCase() === city.toLowerCase(),
    );

    if (!entry) {
      return mockForecast(city, '??');
    }

    return mockForecast(entry[0], entry[1].country);
  }

  async searchCities(query: string): Promise<City[]> {
    const q = query.toLowerCase();
    return Object.entries(MOCK_CITIES)
      .filter(([name]) => name.toLowerCase().includes(q))
      .map(([name, { country }]) => ({ name, country }));
  }
}
