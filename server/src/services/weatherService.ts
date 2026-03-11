import { City, CurrentWeather, Forecast, ForecastDay, WeatherService } from '../types/weather.js';
import { NotFoundError } from '../errors.js';

interface CityData {
  country: string;
  temp_f: number;
  temp_c: number;
  description: string;
  humidity: number;
  wind_mph: number;
  icon: string;
}

const CITY_DATA: Record<string, CityData> = {
  london: { country: 'GB', temp_f: 54.5, temp_c: 12.5, description: 'Partly cloudy', humidity: 72, wind_mph: 8.5, icon: '02d' },
  paris: { country: 'FR', temp_f: 59.0, temp_c: 15.0, description: 'Sunny', humidity: 55, wind_mph: 5.2, icon: '01d' },
  tokyo: { country: 'JP', temp_f: 68.0, temp_c: 20.0, description: 'Clear sky', humidity: 60, wind_mph: 6.0, icon: '01d' },
  'new york': { country: 'US', temp_f: 45.0, temp_c: 7.2, description: 'Overcast', humidity: 80, wind_mph: 12.0, icon: '04d' },
  sydney: { country: 'AU', temp_f: 77.0, temp_c: 25.0, description: 'Sunny', humidity: 45, wind_mph: 10.0, icon: '01d' },
  berlin: { country: 'DE', temp_f: 50.0, temp_c: 10.0, description: 'Light rain', humidity: 85, wind_mph: 7.0, icon: '10d' },
  mumbai: { country: 'IN', temp_f: 88.0, temp_c: 31.1, description: 'Haze', humidity: 70, wind_mph: 4.5, icon: '50d' },
  toronto: { country: 'CA', temp_f: 38.0, temp_c: 3.3, description: 'Snow', humidity: 90, wind_mph: 15.0, icon: '13d' },
  dubai: { country: 'AE', temp_f: 95.0, temp_c: 35.0, description: 'Clear sky', humidity: 30, wind_mph: 8.0, icon: '01d' },
  'rio de janeiro': { country: 'BR', temp_f: 86.0, temp_c: 30.0, description: 'Thunderstorm', humidity: 75, wind_mph: 6.5, icon: '11d' },
};

const SEARCHABLE_CITIES: City[] = [
  { name: 'London', country: 'GB' },
  { name: 'Los Angeles', country: 'US' },
  { name: 'Long Beach', country: 'US' },
  { name: 'Paris', country: 'FR' },
  { name: 'Prague', country: 'CZ' },
  { name: 'Tokyo', country: 'JP' },
  { name: 'Toronto', country: 'CA' },
  { name: 'New York', country: 'US' },
  { name: 'New Delhi', country: 'IN' },
  { name: 'Sydney', country: 'AU' },
  { name: 'San Francisco', country: 'US' },
  { name: 'Seoul', country: 'KR' },
  { name: 'Berlin', country: 'DE' },
  { name: 'Barcelona', country: 'ES' },
  { name: 'Mumbai', country: 'IN' },
  { name: 'Melbourne', country: 'AU' },
  { name: 'Dubai', country: 'AE' },
  { name: 'Dublin', country: 'IE' },
  { name: 'Rio de Janeiro', country: 'BR' },
  { name: 'Rome', country: 'IT' },
];

function generateForecast(cityName: string, country: string, baseTemp_f: number): Forecast {
  const forecast: ForecastDay[] = [];
  const conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain', 'Clear sky'];
  const icons = ['01d', '02d', '03d', '10d', '01d'];
  const today = new Date();

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const variation = (i % 3 - 1) * 5;
    const high_f = baseTemp_f + 5 + variation;
    const low_f = baseTemp_f - 5 + variation;
    forecast.push({
      date: date.toISOString().split('T')[0],
      high_f: Math.round(high_f * 10) / 10,
      high_c: Math.round(((high_f - 32) * 5 / 9) * 10) / 10,
      low_f: Math.round(low_f * 10) / 10,
      low_c: Math.round(((low_f - 32) * 5 / 9) * 10) / 10,
      description: conditions[i % conditions.length],
      icon: icons[i % icons.length],
    });
  }

  return { city: cityName, country, forecast };
}

class MockWeatherService implements WeatherService {
  async getCurrentWeather(city: string): Promise<CurrentWeather> {
    const key = city.toLowerCase();
    const data = CITY_DATA[key];
    if (!data) {
      throw new NotFoundError(`City '${city}' not found`, 'CITY_NOT_FOUND');
    }
    // Use the display name from searchable cities if available
    const displayName = SEARCHABLE_CITIES.find(c => c.name.toLowerCase() === key)?.name || city;
    return {
      city: displayName,
      country: data.country,
      temp_f: data.temp_f,
      temp_c: data.temp_c,
      description: data.description,
      humidity: data.humidity,
      wind_mph: data.wind_mph,
      icon: data.icon,
    };
  }

  async getForecast(city: string): Promise<Forecast> {
    const key = city.toLowerCase();
    const data = CITY_DATA[key];
    if (!data) {
      throw new NotFoundError(`City '${city}' not found`, 'CITY_NOT_FOUND');
    }
    const displayName = SEARCHABLE_CITIES.find(c => c.name.toLowerCase() === key)?.name || city;
    return generateForecast(displayName, data.country, data.temp_f);
  }

  async searchCities(query: string): Promise<City[]> {
    const q = query.toLowerCase();
    return SEARCHABLE_CITIES.filter(c => c.name.toLowerCase().startsWith(q));
  }
}

export const weatherService = new MockWeatherService();
