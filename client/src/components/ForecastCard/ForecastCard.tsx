import type { ForecastDay } from '../../types';
import styles from './ForecastCard.module.css';

interface Props {
  days: ForecastDay[];
  useCelsius: boolean;
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dateStr === tomorrow.toISOString().split('T')[0]) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function ForecastCard({ days, useCelsius }: Props) {
  if (days.length === 0) return null;

  return (
    <section className={styles.row} aria-label="5-day forecast">
      {days.map((day, i) => (
        <article
          key={day.date}
          className={styles.card}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <span className={styles.day}>{formatDay(day.date)}</span>
          {day.icon && (
            <img
              src={day.icon}
              alt={day.description}
              className={styles.icon}
              width={48}
              height={48}
            />
          )}
          <span className={styles.description}>{day.description}</span>
          <div className={styles.temps}>
            <span className={styles.high}>
              {Math.round(useCelsius ? day.high_c : day.high_f)}&deg;
            </span>
            <span className={styles.low}>
              {Math.round(useCelsius ? day.low_c : day.low_f)}&deg;
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
