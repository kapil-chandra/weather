import axios, { AxiosInstance, AxiosError } from 'axios';
import { City, CurrentWeather, Forecast, ForecastDay, WeatherService } from '../types/weather.js';
import { NotFoundError, AppError } from '../errors.js';
import { config } from '../config.js';
import * as cacheService from './cacheService.js';

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: config.owmBaseUrl,
    timeout: 10000,
  });

  // Retry interceptor: 3 retries with exponential backoff for 5xx / network errors
  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const cfg = error.config as any;
    if (!cfg) return Promise.reject(error);

    cfg._retryCount = cfg._retryCount || 0;

    // Only retry on 5xx or network errors, not 4xx
    const status = error.response?.status;
    const isRetryable = !status || status >= 500;

    if (!isRetryable || cfg._retryCount >= 3) {
      return Promise.reject(error);
    }

    cfg._retryCount += 1;
    const delay = Math.pow(2, cfg._retryCount - 1) * 1000; // 1s, 2s, 4s
    await new Promise((resolve) => setTimeout(resolve, delay));

    return instance.request(cfg);
  });

  return instance;
}

const http = createAxiosInstance();

function kelvinToFahrenheit(k: number): number {
  return Math.round(((k - 273.15) * 9 / 5 + 32) * 10) / 10;
}

function kelvinToCelsius(k: number): number {
  return Math.round((k - 273.15) * 10) / 10;
}

function mpsToMph(mps: number): number {
  return Math.round(mps * 2.237 * 10) / 10;
}

function handleOwmError(error: AxiosError, city?: string): never {
  const status = error.response?.status;
  const data = error.response?.data as any;

  if (status === 404) {
    throw new NotFoundError(`City '${city || 'unknown'}' not found`, 'CITY_NOT_FOUND');
  }
  if (status === 401) {
    throw new AppError(502, 'WEATHER_API_ERROR', 'Weather service authentication failed');
  }
  if (status === 429) {
    throw new AppError(502, 'WEATHER_API_ERROR', 'Weather service rate limit exceeded');
  }

  throw new AppError(
    502,
    'WEATHER_API_ERROR',
    data?.message || 'Weather service unavailable',
  );
}

class OpenWeatherMapService implements WeatherService {
  private get apiKey(): string {
    return config.owmApiKey;
  }

  async getCurrentWeather(city: string): Promise<CurrentWeather> {
    const cacheKey = `current:${city.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await http.get('/data/2.5/weather', {
        params: { q: city, appid: this.apiKey },
      });

      const result: CurrentWeather = {
        city: data.name,
        country: data.sys.country,
        temp_f: kelvinToFahrenheit(data.main.temp),
        temp_c: kelvinToCelsius(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_mph: mpsToMph(data.wind.speed),
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      };

      await cacheService.set(cacheKey, result, 10);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleOwmError(error as AxiosError, city);
    }
  }

  async getForecast(city: string): Promise<Forecast> {
    const cacheKey = `forecast:${city.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await http.get('/data/2.5/forecast', {
        params: { q: city, appid: this.apiKey },
      });

      // Aggregate 3-hour intervals into daily highs/lows
      const dailyMap = new Map<string, { highs: number[]; lows: number[]; description: string; icon: string }>();

      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];
        const today = new Date().toISOString().split('T')[0];
        if (date === today) continue;

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            highs: [],
            lows: [],
            description: item.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
          });
        }

        const day = dailyMap.get(date)!;
        day.highs.push(item.main.temp_max);
        day.lows.push(item.main.temp_min);
      }

      const forecast: ForecastDay[] = [];
      for (const [date, day] of dailyMap) {
        if (forecast.length >= 5) break;
        const highK = Math.max(...day.highs);
        const lowK = Math.min(...day.lows);
        forecast.push({
          date,
          high_f: kelvinToFahrenheit(highK),
          high_c: kelvinToCelsius(highK),
          low_f: kelvinToFahrenheit(lowK),
          low_c: kelvinToCelsius(lowK),
          description: day.description,
          icon: day.icon,
        });
      }

      const result: Forecast = {
        city: data.city.name,
        country: data.city.country,
        forecast,
      };

      await cacheService.set(cacheKey, result, 30);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleOwmError(error as AxiosError, city);
    }
  }

  async searchCities(query: string): Promise<City[]> {
    try {
      const { data } = await http.get('/geo/1.0/direct', {
        params: { q: query, limit: 10, appid: this.apiKey },
      });

      // Deduplicate by name+country
      const seen = new Set<string>();
      const cities: City[] = [];
      for (const item of data) {
        const key = `${item.name}:${item.country}`;
        if (!seen.has(key)) {
          seen.add(key);
          cities.push({ name: item.name, country: item.country });
        }
      }
      return cities;
    } catch (error) {
      if (error instanceof AppError) throw error;
      handleOwmError(error as AxiosError);
    }
  }
}

export const weatherService: WeatherService = new OpenWeatherMapService();
