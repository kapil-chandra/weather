import { useState, useEffect, useCallback } from 'react';
import * as historyApi from '../../api/history';
import type { SearchHistoryItem } from '../../types';
import styles from './RecentSearches.module.css';

interface Props {
  onSelectCity: (city: string) => void;
  refreshKey: number;
}

export function RecentSearches({ onSelectCity, refreshKey }: Props) {
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await historyApi.getHistory(10);
      setSearches(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading || searches.length === 0) return null;

  // Deduplicate by city name (show most recent only)
  const seen = new Set<string>();
  const unique = searches.filter((s) => {
    if (seen.has(s.city)) return false;
    seen.add(s.city);
    return true;
  });

  return (
    <section className={styles.section} aria-label="Recent searches">
      <h3 className={styles.heading}>RECENT</h3>
      <ul className={styles.list}>
        {unique.map((item) => (
          <li key={item.id}>
            <button
              className={styles.item}
              onClick={() => onSelectCity(item.city)}
              type="button"
            >
              <span className={styles.icon} aria-hidden="true">{'\u2192'}</span>
              <span className={styles.city}>{item.city}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
