export interface City {
  name: string;
  country: string;
}

export interface CurrentWeather {
  city: string;
  country: string;
  temp_f: number;
  temp_c: number;
  description: string;
  humidity: number;
  wind_mph: number;
  icon: string;
}

export interface ForecastDay {
  date: string;
  high_f: number;
  high_c: number;
  low_f: number;
  low_c: number;
  description: string;
  icon: string;
}

export interface Forecast {
  city: string;
  country: string;
  forecast: ForecastDay[];
}

export interface WeatherService {
  getCurrentWeather(city: string): Promise<CurrentWeather>;
  getForecast(city: string): Promise<Forecast>;
  searchCities(query: string): Promise<City[]>;
}
