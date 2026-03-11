import { useState, useEffect, useCallback } from 'react';
import * as favoritesApi from '../../api/favorites';
import type { Favorite } from '../../types';
import styles from './FavoritesList.module.css';

interface Props {
  onSelectCity: (city: string) => void;
  refreshKey: number;
}

export function FavoritesList({ onSelectCity, refreshKey }: Props) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch {
      // Silently fail — sidebar is supplementary
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleRemove(id: number) {
    try {
      await favoritesApi.removeFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // Ignore
    }
  }

  if (loading || favorites.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Favorite cities">
      <h3 className={styles.heading}>Favorites</h3>
      <ul className={styles.list}>
        {favorites.map((fav) => (
          <li key={fav.id} className={styles.item}>
            <button
              className={styles.cityBtn}
              onClick={() => onSelectCity(fav.city)}
              type="button"
            >
              <span className={styles.star} aria-hidden="true">&#9733;</span>
              <span className={styles.name}>{fav.city}</span>
              <span className={styles.country}>{fav.country}</span>
            </button>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemove(fav.id)}
              aria-label={`Remove ${fav.city} from favorites`}
              type="button"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
