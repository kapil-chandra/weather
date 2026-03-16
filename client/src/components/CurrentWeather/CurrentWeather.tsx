import type { CurrentWeather as CurrentWeatherData } from '../../types';
import styles from './CurrentWeather.module.css';

function getSignalColor(tempF: number, description: string): string {
  const desc = description.toLowerCase();
  if (tempF >= 85 || desc.includes('clear') || desc.includes('sun')) return 'var(--signal-hot)';
  if (tempF <= 32 || desc.includes('snow') || desc.includes('ice')) return 'var(--signal-cold)';
  if (desc.includes('rain') || desc.includes('storm') || desc.includes('thunder')) return 'var(--signal-storm)';
  return 'var(--signal-mild)';
}

function degreesToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

interface Props {
  data: CurrentWeatherData | null;
  loading: boolean;
  useCelsius: boolean;
  onToggleUnit: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  showFavoriteBtn: boolean;
}

export function CurrentWeather({ data, loading, useCelsius, onToggleUnit, isFavorited, onToggleFavorite, showFavoriteBtn }: Props) {
  if (loading) {
    return (
      <section className={styles.grid} aria-label="Loading weather data">
        <div className={styles.signalBar} style={{ background: 'var(--border-secondary)' }}>
          <div className={styles.loadingBar} />
        </div>
        <div className={styles.primaryRow}>
          <div className={styles.cellLoading} />
          <div className={styles.cellLoading} />
          <div className={styles.cellLoading} />
        </div>
      </section>
    );
  }

  if (!data) return null;

  const signal = getSignalColor(data.temp_f, data.description);
  const temp = useCelsius ? data.temp_c : data.temp_f;
  const feelsLike = useCelsius ? data.feels_like_c : data.feels_like_f;
  const high = useCelsius ? data.temp_high_c : data.temp_high_f;
  const low = useCelsius ? data.temp_low_c : data.temp_low_f;
  const compass = degreesToCompass(data.wind_direction);

  return (
    <section className={styles.grid} aria-label={`Current weather in ${data.city}`}>
      <div className={styles.signalBar} style={{ background: signal }} />

      <div className={styles.primaryRow}>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>TEMPERATURE</span>
          <span className={styles.tempValue} style={{ color: signal }}>
            {Math.round(temp)}&deg;
          </span>
          <span className={styles.cellDetail}>
            FEELS {Math.round(feelsLike)}&deg;
            {high != null && <> &middot; HIGH {Math.round(high)}&deg;</>}
            {low != null && <> &middot; LOW {Math.round(low)}&deg;</>}
          </span>
          <div className={styles.cellActions}>
            <button
              className={`${styles.unitBtn} ${!useCelsius ? styles.unitActive : ''}`}
              onClick={useCelsius ? onToggleUnit : undefined}
              type="button"
            >
              &deg;F
            </button>
            <button
              className={`${styles.unitBtn} ${useCelsius ? styles.unitActive : ''}`}
              onClick={!useCelsius ? onToggleUnit : undefined}
              type="button"
            >
              &deg;C
            </button>
            {showFavoriteBtn && (
              <button
                className={`${styles.favBtn} ${isFavorited ? styles.favActive : ''}`}
                onClick={onToggleFavorite}
                aria-label={isFavorited ? `Remove ${data.city} from favorites` : `Add ${data.city} to favorites`}
                type="button"
              >
                {isFavorited ? '\u2605 SAVED' : '\u2606 SAVE'}
              </button>
            )}
          </div>
        </div>

        <div className={styles.cell}>
          <span className={styles.cellLabel}>CONDITION</span>
          <span className={styles.condValue}>{data.description.toUpperCase()}</span>
        </div>

        <div className={styles.cell}>
          <span className={styles.cellLabel}>BAROMETRIC</span>
          <span className={styles.baroValue}>
            {data.pressure}<span className={styles.unit}> hPa</span>
          </span>
        </div>
      </div>

      <div className={styles.secondaryRow}>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>WIND</span>
          <span className={styles.secValue}>
            {data.wind_mph}<span className={styles.unit}> mph</span>
          </span>
          <span className={styles.cellDetail}>{compass} {data.wind_direction}&deg;</span>
        </div>

        <div className={styles.cell}>
          <span className={styles.cellLabel}>HUMIDITY</span>
          <span className={styles.secValue}>
            {data.humidity}<span className={styles.unit}>%</span>
          </span>
        </div>
      </div>
    </section>
  );
}
