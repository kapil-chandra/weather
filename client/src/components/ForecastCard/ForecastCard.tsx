import type { ForecastDay } from '../../types';
import styles from './ForecastCard.module.css';

interface Props {
  days: ForecastDay[];
  useCelsius: boolean;
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function computeBarHeight(temp: number, min: number, max: number): number {
  if (max === min) return 20;
  return Math.round(((temp - min) / (max - min)) * 36 + 4);
}

export function ForecastCard({ days, useCelsius }: Props) {
  if (days.length === 0) return null;

  // Compute global min/max for bar normalization
  const allTemps = days.flatMap(d => [
    useCelsius ? d.high_c : d.high_f,
    useCelsius ? d.low_c : d.low_f,
  ]);
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);

  return (
    <section className={styles.strip} aria-label="5-day forecast">
      <div className={styles.stripLabel}>5-DAY FORECAST</div>
      <div className={styles.grid}>
        {days.map((day) => {
          const high = useCelsius ? day.high_c : day.high_f;
          const low = useCelsius ? day.low_c : day.low_f;
          const highBarH = computeBarHeight(high, globalMin, globalMax);
          const lowBarH = computeBarHeight(low, globalMin, globalMax);

          return (
            <div key={day.date} className={styles.day}>
              <span className={styles.dayName}>{formatDay(day.date)}</span>
              <div className={styles.barChart}>
                <div className={styles.barHigh} style={{ height: `${highBarH}px` }} />
                <div className={styles.barLow} style={{ height: `${lowBarH}px` }} />
              </div>
              <span className={styles.high}>{Math.round(high)}&deg;</span>
              <span className={styles.low}>{Math.round(low)}&deg;</span>
              <span className={styles.condition}>{day.description.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
