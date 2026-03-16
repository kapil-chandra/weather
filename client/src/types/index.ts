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
  // New fields for brutalist redesign
  feels_like_f: number;
  feels_like_c: number;
  pressure: number;        // hPa
  wind_direction: number;  // degrees 0-360
  temp_high_f: number | null;
  temp_high_c: number | null;
  temp_low_f: number | null;
  temp_low_c: number | null;
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
