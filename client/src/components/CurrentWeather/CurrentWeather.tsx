import type { CurrentWeather as CurrentWeatherData } from '../../types';
import styles from './CurrentWeather.module.css';

interface Props {
  data: CurrentWeatherData | null;
  loading: boolean;
  useCelsius: boolean;
  onToggleUnit: () => void;
}

export function CurrentWeather({ data, loading, useCelsius, onToggleUnit }: Props) {
  if (loading) {
    return (
      <section className={styles.card} aria-label="Loading weather data">
        <div className={styles.skeleton}>
          <div className={styles.skelLine} style={{ width: '40%', height: '1.2rem' }} />
          <div className={styles.skelLine} style={{ width: '50%', height: '4rem', marginTop: '0.75rem' }} />
          <div className={styles.skelLine} style={{ width: '60%', height: '1rem', marginTop: '0.75rem' }} />
          <div className={styles.skelRow}>
            <div className={styles.skelLine} style={{ width: '30%', height: '0.9rem' }} />
            <div className={styles.skelLine} style={{ width: '30%', height: '0.9rem' }} />
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const temp = useCelsius ? data.temp_c : data.temp_f;
  const unit = useCelsius ? '\u00B0C' : '\u00B0F';

  return (
    <section className={styles.card} aria-label={`Current weather in ${data.city}`}>
      <div className={styles.top}>
        <div>
          <h2 className={styles.city}>{data.city}, <span className={styles.country}>{data.country}</span></h2>
          <p className={styles.description}>{data.description}</p>
        </div>
        {data.icon && (
          <img
            src={data.icon}
            alt={data.description}
            className={styles.icon}
            width={80}
            height={80}
          />
        )}
      </div>

      <div className={styles.tempRow}>
        <span className={styles.temp}>{Math.round(temp)}</span>
        <button
          className={styles.unitToggle}
          onClick={onToggleUnit}
          aria-label={`Switch to ${useCelsius ? 'Fahrenheit' : 'Celsius'}`}
          type="button"
        >
          {unit}
        </button>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Humidity</span>
          <span className={styles.detailValue}>{data.humidity}%</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Wind</span>
          <span className={styles.detailValue}>{data.wind_mph} mph</span>
        </div>
      </div>
    </section>
  );
}
