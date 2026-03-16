import { useState, useCallback, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { CurrentWeather } from '../components/CurrentWeather/CurrentWeather';
import { ForecastCard } from '../components/ForecastCard/ForecastCard';
import { FavoritesList } from '../components/FavoritesList/FavoritesList';
import { RecentSearches } from '../components/RecentSearches/RecentSearches';
import { useAuth } from '../context/AuthContext';
import * as weatherApi from '../api/weather';
import * as favoritesApi from '../api/favorites';
import type { CurrentWeather as CurrentWeatherData, Forecast, Favorite } from '../types';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [current, setCurrent] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [useCelsius, setUseCelsius] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [sidebarKey, setSidebarKey] = useState(0);

  // Load favorites when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    favoritesApi.getFavorites().then(setFavorites).catch(() => {});
  }, [isAuthenticated]);

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
      // Refresh sidebar to show new search history entry
      setSidebarKey((k) => k + 1);
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

  const isFavorited = current ? favorites.some((f) => f.city === current.city) : false;

  const handleToggleFavorite = useCallback(async () => {
    if (!current) return;

    if (isFavorited) {
      const fav = favorites.find((f) => f.city === current.city);
      if (fav) {
        await favoritesApi.removeFavorite(fav.id);
        setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
        setSidebarKey((k) => k + 1);
      }
    } else {
      try {
        const newFav = await favoritesApi.addFavorite(current.city, current.country);
        setFavorites((prev) => [newFav, ...prev]);
        setSidebarKey((k) => k + 1);
      } catch {
        // Already favorited or error
      }
    }
  }, [current, isFavorited, favorites]);

  return (
    <div className={styles.layout}>
      {isAuthenticated && (
        <aside className={styles.sidebar}>
          <FavoritesList onSelectCity={handleSelectCity} refreshKey={sidebarKey} />
          <RecentSearches onSelectCity={handleSelectCity} refreshKey={sidebarKey} />
        </aside>
      )}
      <div className={styles.main}>
        <SearchBar onSelectCity={handleSelectCity} />

        {error && (
          <div className={styles.errorCard} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">ERROR:</span>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!hasSearched && !loading && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">NIMBUS WEATHER TERMINAL</span>
            <h2 className={styles.emptyTitle}>SEARCH A STATION</h2>
            <p className={styles.emptyText}>Enter a city above to view current conditions and 5-day forecast data.</p>
          </div>
        )}

        <CurrentWeather
          data={current}
          loading={loading}
          useCelsius={useCelsius}
          onToggleUnit={() => setUseCelsius((v) => !v)}
          isFavorited={isFavorited}
          onToggleFavorite={handleToggleFavorite}
          showFavoriteBtn={isAuthenticated && !!current}
        />

        {forecast && !loading && (
          <ForecastCard days={forecast.forecast} useCelsius={useCelsius} />
        )}
      </div>
    </div>
  );
}
