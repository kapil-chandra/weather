import { useState, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { CurrentWeather } from '../components/CurrentWeather/CurrentWeather';
import { ForecastCard } from '../components/ForecastCard/ForecastCard';
import * as weatherApi from '../api/weather';
import type { CurrentWeather as CurrentWeatherData, Forecast } from '../types';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const [current, setCurrent] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [useCelsius, setUseCelsius] = useState(false);

  const handleSelectCity = useCallback(async (city: string) => {
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const [currentData, forecastData] = await Promise.all([
        weatherApi.getCurrentWeather(city),
        weatherApi.getForecast(city),
      ]);
      setCurrent(currentData);
      setForecast(forecastData);
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      if (apiError?.code === 'CITY_NOT_FOUND') {
        setError(`City "${city}" not found. Try a different search.`);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setCurrent(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={styles.dashboard}>
      <SearchBar onSelectCity={handleSelectCity} />

      {error && (
        <div className={styles.errorCard} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">!</span>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">&#9729;</span>
          <h2 className={styles.emptyTitle}>Explore the weather</h2>
          <p className={styles.emptyText}>Search for any city to see current conditions and a 5-day forecast.</p>
        </div>
      )}

      <CurrentWeather
        data={current}
        loading={loading}
        useCelsius={useCelsius}
        onToggleUnit={() => setUseCelsius((v) => !v)}
      />

      {forecast && !loading && (
        <ForecastCard days={forecast.forecast} useCelsius={useCelsius} />
      )}
    </div>
  );
}
