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

export interface SafeUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  city: string;
  country: string;
  created_at: string;
}

export interface SearchHistoryItem {
  id: number;
  user_id: number;
  city: string;
  searched_at: string;
}
