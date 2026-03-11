import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { searchCities } from '../../api/weather';
import type { City } from '../../types';
import styles from './SearchBar.module.css';

interface Props {
  onSelectCity: (city: string) => void;
}

export function SearchBar({ onSelectCity }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    searchCities(debounced)
      .then((cities) => {
        if (!cancelled) {
          setResults(cities);
          setIsOpen(cities.length > 0);
          setActiveIndex(-1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setIsOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debounced]);

  function select(city: City) {
    setQuery(city.name);
    setIsOpen(false);
    onSelectCity(city.name);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrap}>
        <span className={styles.icon} aria-hidden="true">&#x1F50D;</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search for a city\u2026"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-listbox"
          aria-activedescendant={activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
          aria-label="Search for a city"
          autoComplete="off"
        />
        {loading && <span className={styles.spinner} aria-label="Loading" />}
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          id="city-listbox"
          role="listbox"
          className={styles.dropdown}
        >
          {results.map((city, i) => (
            <li
              key={`${city.name}-${city.country}`}
              id={`city-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.option} ${i === activeIndex ? styles.active : ''}`}
              onMouseDown={() => select(city)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className={styles.cityName}>{city.name}</span>
              <span className={styles.country}>{city.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
