import axios, { AxiosInstance, AxiosError } from 'axios';
import { City, CurrentWeather, Forecast, ForecastDay, WeatherService } from '../types/weather.js';
import { NotFoundError, AppError } from '../errors.js';
import { config } from '../config.js';
import * as cacheService from './cacheService.js';
import { MockWeatherService } from './mockWeatherService.js';

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com';
const WEATHER_BASE = 'https://api.open-meteo.com';

function createAxiosInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL, timeout: 10000 });

  // Retry interceptor: 3 retries with exponential backoff for 5xx / network errors
  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const cfg = error.config as any;
    if (!cfg) return Promise.reject(error);

    cfg._retryCount = cfg._retryCount || 0;

    const status = error.response?.status;
    const isRetryable = !status || status >= 500;

    if (!isRetryable || cfg._retryCount >= 3) {
      return Promise.reject(error);
    }

    cfg._retryCount += 1;
    const delay = Math.pow(2, cfg._retryCount - 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return instance.request(cfg);
  });

  return instance;
}

const geoHttp = createAxiosInstance(GEOCODING_BASE);
const weatherHttp = createAxiosInstance(WEATHER_BASE);

// --- WMO Weather Code mapping ---

interface WmoInfo {
  description: string;
  icon: string;
}

const WMO_CODES: Record<number, WmoInfo> = {
  0:  { description: 'Clear sky',            icon: '☀️' },
  1:  { description: 'Mainly clear',         icon: '🌤️' },
  2:  { description: 'Partly cloudy',        icon: '⛅' },
  3:  { description: 'Overcast',             icon: '☁️' },
  45: { description: 'Fog',                  icon: '🌫️' },
  48: { description: 'Depositing rime fog',  icon: '🌫️' },
  51: { description: 'Light drizzle',        icon: '🌦️' },
  53: { description: 'Moderate drizzle',     icon: '🌦️' },
  55: { description: 'Dense drizzle',        icon: '🌧️' },
  56: { description: 'Light freezing drizzle', icon: '🌧️' },
  57: { description: 'Dense freezing drizzle', icon: '🌧️' },
  61: { description: 'Slight rain',          icon: '🌧️' },
  63: { description: 'Moderate rain',        icon: '🌧️' },
  65: { description: 'Heavy rain',           icon: '🌧️' },
  66: { description: 'Light freezing rain',  icon: '🌧️' },
  67: { description: 'Heavy freezing rain',  icon: '🌧️' },
  71: { description: 'Slight snow fall',     icon: '🌨️' },
  73: { description: 'Moderate snow fall',   icon: '🌨️' },
  75: { description: 'Heavy snow fall',      icon: '❄️' },
  77: { description: 'Snow grains',          icon: '❄️' },
  80: { description: 'Slight rain showers',  icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '🌧️' },
  85: { description: 'Slight snow showers',  icon: '🌨️' },
  86: { description: 'Heavy snow showers',   icon: '🌨️' },
  95: { description: 'Thunderstorm',         icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail',  icon: '⛈️' },
};

function wmoToInfo(code: number): WmoInfo {
  return WMO_CODES[code] || { description: 'Unknown', icon: '❓' };
}

function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

// --- Geocoding helper with cache ---

interface GeoResult {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

async function geocodeCity(city: string): Promise<GeoResult> {
  const cacheKey = `geo:${city.toLowerCase()}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await geoHttp.get('/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
    });

    if (!data.results || data.results.length === 0) {
      throw new NotFoundError(`City '${city}' not found`, 'CITY_NOT_FOUND');
    }

    const r = data.results[0];
    const result: GeoResult = {
      name: r.name,
      country: r.country || '',
      countryCode: r.country_code?.toUpperCase() || '',
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1,
    };

    await cacheService.set(cacheKey, result, 60); // cache geocoding for 60 min
    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    handleApiError(error as AxiosError, city);
  }
}

function handleApiError(error: AxiosError, city?: string): never {
  const status = error.response?.status;
  const data = error.response?.data as any;

  if (status === 404) {
    throw new NotFoundError(`City '${city || 'unknown'}' not found`, 'CITY_NOT_FOUND');
  }
  if (status === 429) {
    throw new AppError(502, 'WEATHER_API_ERROR', 'Weather service rate limit exceeded');
  }

  throw new AppError(
    502,
    'WEATHER_API_ERROR',
    data?.reason || data?.message || 'Weather service unavailable',
  );
}

class OpenMeteoService implements WeatherService {
  async getCurrentWeather(city: string): Promise<CurrentWeather> {
    const cacheKey = `current:${city.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const geo = await geocodeCity(city);

    try {
      const { data } = await weatherHttp.get('/v1/forecast', {
        params: {
          latitude: geo.latitude,
          longitude: geo.longitude,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,surface_pressure,wind_direction_10m',
          daily: 'temperature_2m_max,temperature_2m_min',
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
          forecast_days: 1,
        },
      });

      const current = data.current;
      const info = wmoToInfo(current.weather_code);
      const tempF = Math.round(current.temperature_2m * 10) / 10;
      const feelsLikeF = Math.round(current.apparent_temperature * 10) / 10;

      // Today's high/low from daily data
      const daily = data.daily;
      const todayHighF = daily?.temperature_2m_max?.[0] != null
        ? Math.round(daily.temperature_2m_max[0] * 10) / 10
        : null;
      const todayLowF = daily?.temperature_2m_min?.[0] != null
        ? Math.round(daily.temperature_2m_min[0] * 10) / 10
        : null;

      const result: CurrentWeather = {
        city: geo.name,
        country: geo.countryCode,
        temp_f: tempF,
        temp_c: fahrenheitToCelsius(tempF),
        description: info.description,
        humidity: current.relative_humidity_2m,
        wind_mph: Math.round(current.wind_speed_10m * 10) / 10,
        icon: info.icon,
        feels_like_f: feelsLikeF,
        feels_like_c: fahrenheitToCelsius(feelsLikeF),
        pressure: Math.round(current.surface_pressure),
        wind_direction: Math.round(current.wind_direction_10m),
        temp_high_f: todayHighF,
        temp_high_c: todayHighF != null ? fahrenheitToCelsius(todayHighF) : null,
        temp_low_f: todayLowF,
        temp_low_c: todayLowF != null ? fahrenheitToCelsius(todayLowF) : null,
      };

      await cacheService.set(cacheKey, result, 10);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleApiError(error as AxiosError, city);
    }
  }

  async getForecast(city: string): Promise<Forecast> {
    const cacheKey = `forecast:${city.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const geo = await geocodeCity(city);

    try {
      const { data } = await weatherHttp.get('/v1/forecast', {
        params: {
          latitude: geo.latitude,
          longitude: geo.longitude,
          daily: 'temperature_2m_max,temperature_2m_min,weather_code',
          temperature_unit: 'fahrenheit',
          forecast_days: 6,
        },
      });

      const daily = data.daily;
      const today = new Date().toISOString().split('T')[0];

      const forecast: ForecastDay[] = [];
      for (let i = 0; i < daily.time.length; i++) {
        if (daily.time[i] === today) continue;
        if (forecast.length >= 5) break;

        const highF = Math.round(daily.temperature_2m_max[i] * 10) / 10;
        const lowF = Math.round(daily.temperature_2m_min[i] * 10) / 10;
        const info = wmoToInfo(daily.weather_code[i]);

        forecast.push({
          date: daily.time[i],
          high_f: highF,
          high_c: fahrenheitToCelsius(highF),
          low_f: lowF,
          low_c: fahrenheitToCelsius(lowF),
          description: info.description,
          icon: info.icon,
        });
      }

      const result: Forecast = {
        city: geo.name,
        country: geo.countryCode,
        forecast,
      };

      await cacheService.set(cacheKey, result, 30);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleApiError(error as AxiosError, city);
    }
  }

  async searchCities(query: string): Promise<City[]> {
    try {
      const { data } = await geoHttp.get('/v1/search', {
        params: { name: query, count: 10, language: 'en', format: 'json' },
      });

      if (!data.results) return [];

      // Deduplicate by name+country_code
      const seen = new Set<string>();
      const cities: City[] = [];
      for (const item of data.results) {
        const key = `${item.name}:${item.country_code}`;
        if (!seen.has(key)) {
          seen.add(key);
          cities.push({
            name: item.name,
            country: item.country_code?.toUpperCase() || '',
          });
        }
      }
      return cities;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleApiError(error as AxiosError);
    }
  }
}

const useMock = config.useMock || config.nodeEnv === 'test';

if (useMock) {
  console.log('⚠  USE_MOCK=true or NODE_ENV=test — using mock weather data.');
} else {
  console.log('✓ Using Open-Meteo API (no key required)');
}

export const weatherService: WeatherService = useMock
  ? new MockWeatherService()
  : new OpenMeteoService();
