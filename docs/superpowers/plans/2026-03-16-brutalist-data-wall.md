# Brutalist Data Wall — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark glassmorphic visual identity with a brutalist data wall aesthetic — monochrome, hard-bordered grid, Space Grotesk font, zero decoration.

**Architecture:** CSS-first redesign. Backend changes are minimal (expand Open-Meteo API params, add fields to types). Frontend rewrites every component's styles and restructures some JSX. The design token system in `index.css` drives everything.

**Tech Stack:** React, TypeScript, CSS Modules, Open-Meteo API, Google Fonts (Space Grotesk)

**Spec:** `docs/superpowers/specs/2026-03-16-brutalist-data-wall-design.md`

---

## File Structure

### Files to modify

| File | Responsibility |
|------|---------------|
| `client/index.html` | Font imports (swap DM Sans + Playfair for Space Grotesk) |
| `client/src/index.css` | Global design tokens, resets, base styles |
| `client/src/components/Layout/Layout.tsx` | Brand text, auth states |
| `client/src/components/Layout/Layout.module.css` | Header, nav, main container styles |
| `client/src/components/SearchBar/SearchBar.tsx` | Add STATION label, restructure markup |
| `client/src/components/SearchBar/SearchBar.module.css` | Terminal-style search bar |
| `client/src/components/CurrentWeather/CurrentWeather.tsx` | Data grid cells, signal color, unit toggle, favorites |
| `client/src/components/CurrentWeather/CurrentWeather.module.css` | Grid layout, signal bar, cell styles |
| `client/src/components/ForecastCard/ForecastCard.tsx` | Forecast strip with bar charts |
| `client/src/components/ForecastCard/ForecastCard.module.css` | Strip grid, bar chart styles |
| `client/src/components/LoginForm/LoginForm.tsx` | Button text, error prefix, labels |
| `client/src/components/LoginForm/LoginForm.module.css` | Brutalist form styles |
| `server/src/types/weather.ts` | Add new fields to CurrentWeather interface |
| `server/src/services/weatherService.ts` | Expand API params, extract new fields |
| `server/src/services/mockWeatherService.ts` | Add mock values for new fields |
| `client/src/types/index.ts` | Mirror type changes |

### No new files created

All changes modify existing files. No new components or utilities needed.

---

## Chunk 1: Backend Data Layer

### Task 1: Expand CurrentWeather type (server + client)

**Files:**
- Modify: `server/src/types/weather.ts`
- Modify: `client/src/types/index.ts`

- [ ] **Step 1: Add new fields to server type**

In `server/src/types/weather.ts`, update the `CurrentWeather` interface:

```typescript
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
```

- [ ] **Step 2: Mirror type changes in client**

In `client/src/types/index.ts`, make the same changes to the `CurrentWeather` interface. Add the same 8 fields.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/kapil.chandra/dev/weather && npx tsc --noEmit -p server/tsconfig.json 2>&1 | head -30`
Expected: Type errors in weatherService.ts and mockWeatherService.ts (they don't return the new fields yet). That's expected — we fix them next.

- [ ] **Step 4: Commit**

```bash
git add server/src/types/weather.ts client/src/types/index.ts
git commit -m "feat: add feels_like, pressure, wind_direction, high/low to CurrentWeather type"
```

### Task 2: Update Open-Meteo weather service

**Files:**
- Modify: `server/src/services/weatherService.ts`

- [ ] **Step 1: Expand current weather API params**

In `server/src/services/weatherService.ts`, in the `getCurrentWeather` method of `OpenMeteoService`, change the params object:

```typescript
// OLD:
current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',

// NEW:
current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,surface_pressure,wind_direction_10m',
```

- [ ] **Step 2: Add daily params to getCurrentWeather for today's high/low**

In the same `getCurrentWeather` method, add `daily` params to the same API call so we get today's high/low in a single request:

```typescript
const { data } = await weatherHttp.get('/v1/forecast', {
  params: {
    latitude: geo.latitude,
    longitude: geo.longitude,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,surface_pressure,wind_direction_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    forecast_days: 1,
  },
});
```

- [ ] **Step 3: Extract new fields and build result**

Replace the result construction block:

```typescript
const current = data.current;
const info = wmoToInfo(current.weather_code);
const tempF = Math.round(current.temperature_2m * 10) / 10;
const feelsLikeF = Math.round(current.apparent_temperature * 10) / 10;

// Today's high/low from daily data
const daily = data.daily;
const todayHighF = daily?.temperature_2m_max?.[0] != null
  ? Math.round(daily.temperature_2m_max[0] * 10) / 10
  : null;
const todayLowF = daily?.temperature_2m_min?.[0] != null
  ? Math.round(daily.temperature_2m_min[0] * 10) / 10
  : null;

const result: CurrentWeather = {
  city: geo.name,
  country: geo.countryCode,
  temp_f: tempF,
  temp_c: fahrenheitToCelsius(tempF),
  description: info.description,
  humidity: current.relative_humidity_2m,
  wind_mph: Math.round(current.wind_speed_10m * 10) / 10,
  icon: info.icon,
  feels_like_f: feelsLikeF,
  feels_like_c: fahrenheitToCelsius(feelsLikeF),
  pressure: Math.round(current.surface_pressure),
  wind_direction: Math.round(current.wind_direction_10m),
  temp_high_f: todayHighF,
  temp_high_c: todayHighF != null ? fahrenheitToCelsius(todayHighF) : null,
  temp_low_f: todayLowF,
  temp_low_c: todayLowF != null ? fahrenheitToCelsius(todayLowF) : null,
};
```

- [ ] **Step 4: Verify server compiles**

Run: `cd /Users/kapil.chandra/dev/weather && npx tsc --noEmit -p server/tsconfig.json 2>&1 | head -20`
Expected: Errors only in mockWeatherService.ts (fixed next task).

- [ ] **Step 5: Commit**

```bash
git add server/src/services/weatherService.ts
git commit -m "feat: expand Open-Meteo params for feels_like, pressure, wind_direction, daily high/low"
```

### Task 3: Update mock weather service

**Files:**
- Modify: `server/src/services/mockWeatherService.ts`

- [ ] **Step 1: Add new fields to mockCurrentWeather function**

In the `mockCurrentWeather` function, add the new fields to the returned object. After the existing fields, add:

```typescript
return {
  city,
  country,
  temp_f: tempF,
  temp_c: tempC,
  description: descriptions[idx],
  humidity: Math.round(40 + r * 50),
  wind_mph: Math.round(r * 20 * 10) / 10,
  icon: icons[idx],
  feels_like_f: Math.round((tempF - 2 + r * 4) * 10) / 10,
  feels_like_c: Math.round((tempC - 1 + r * 2) * 10) / 10,
  pressure: Math.round(1000 + r * 30),
  wind_direction: Math.round(r * 360),
  temp_high_f: Math.round((tempF + 3 + r * 5) * 10) / 10,
  temp_high_c: Math.round((tempC + 2 + r * 3) * 10) / 10,
  temp_low_f: Math.round((tempF - 5 - r * 5) * 10) / 10,
  temp_low_c: Math.round((tempC - 3 - r * 3) * 10) / 10,
};
```

- [ ] **Step 2: Verify full server compiles cleanly**

Run: `cd /Users/kapil.chandra/dev/weather && npx tsc --noEmit -p server/tsconfig.json 2>&1 | head -10`
Expected: No errors.

- [ ] **Step 3: Start the server and test the API**

Run: `cd /Users/kapil.chandra/dev/weather && USE_MOCK=true npx tsx server/src/index.ts &`
Then: `curl -s http://localhost:3000/api/weather/current/London | python3 -m json.tool | head -20`
Expected: JSON response with all new fields (feels_like_f, pressure, wind_direction, temp_high_f, etc.)
Kill: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add server/src/services/mockWeatherService.ts
git commit -m "feat: add mock values for new CurrentWeather fields"
```

---

## Chunk 2: Global Styles and Font

### Task 4: Replace font imports in index.html

**Files:**
- Modify: `client/index.html`

- [ ] **Step 1: Replace Google Fonts link**

Replace the entire `<link href="https://fonts.googleapis.com/css2?family=DM+Sans...` tag with:

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
```

Also remove the two `<link rel="preconnect"...` tags above it (they stay the same domain so can be kept, but replace with clean versions):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Commit**

```bash
git add client/index.html
git commit -m "feat: swap DM Sans + Playfair Display for Space Grotesk"
```

### Task 5: Replace global design tokens in index.css

**Files:**
- Modify: `client/src/index.css`

- [ ] **Step 1: Replace entire :root block**

Replace the full `:root { ... }` block with the brutalist design tokens:

```css
:root {
  /* Backgrounds */
  --bg-primary: #fafafa;
  --bg-hover: #f0f0f0;
  --bg-active: #111111;
  --bg-input: #ffffff;

  /* Borders */
  --border-primary: #111111;
  --border-secondary: #dddddd;

  /* Text */
  --text-primary: #111111;
  --text-secondary: #666666;
  --text-muted: #767676;
  --text-inverse: #fafafa;

  /* Signal colors */
  --signal-hot: #d4402b;
  --signal-cold: #2b7fd4;
  --signal-storm: #5a6a7a;
  --signal-mild: #8a8478;
  --signal-current: var(--signal-mild);

  /* Error */
  --error: #d4402b;

  /* Disabled */
  --disabled-border: #cccccc;
  --disabled-text: #cccccc;

  /* Typography */
  --font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;

  /* Borders */
  --border-major: 3px;
  --border-minor: 2px;
  --border-subtle: 1px;

  /* Spacing */
  --space-cell-lg: 20px;
  --space-cell-md: 16px;
  --space-cell-sm: 12px;
  --space-container: 16px;
  --max-width: 1120px;
}
```

- [ ] **Step 2: Update body styles**

Replace the `body { ... }` block:

```css
body {
  margin: 0;
  font-family: var(--font-family);
  font-size: 16px;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 100vh;
}
```

- [ ] **Step 3: Update button font-family**

```css
button {
  font-family: var(--font-family);
}
```

- [ ] **Step 4: Update focus-visible ring for brutalist style**

```css
:focus-visible {
  outline: var(--border-major) solid var(--border-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Remove scrollbar styling**

Delete the `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, and `::-webkit-scrollbar-thumb` blocks entirely (default browser scrollbars are more brutalist).

- [ ] **Step 6: Add global border-radius reset**

Add after the `*` box-sizing block:

```css
* {
  border-radius: 0 !important;
}
```

- [ ] **Step 7: Verify the app loads**

Run: `cd /Users/kapil.chandra/dev/weather && npm run dev --prefix client &`
Open browser — the app should load with a white background, black text, and Space Grotesk font. Components will look broken (expected — we fix them next).
Kill: `kill %1`

- [ ] **Step 8: Commit**

```bash
git add client/src/index.css
git commit -m "feat: replace glassmorphic tokens with brutalist design system"
```

---

## Chunk 3: Layout and LoginForm Components

### Task 6: Rewrite Layout component

**Files:**
- Modify: `client/src/components/Layout/Layout.tsx`
- Modify: `client/src/components/Layout/Layout.module.css`

- [ ] **Step 1: Rewrite Layout.tsx**

Replace the full contents of `Layout.tsx`:

```typescript
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandName}>NIMBUS</span>
            <span className={styles.brandSub}>WEATHER TERMINAL</span>
          </Link>
          <div className={styles.actions}>
            {isAuthenticated ? (
              <>
                <span className={styles.userName}>{user?.name?.toUpperCase()}</span>
                <button className={styles.logoutBtn} onClick={logout} type="button">
                  LOGOUT
                </button>
              </>
            ) : (
              <Link to="/login" className={styles.loginLink}>SIGN IN</Link>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite Layout.module.css**

Replace the full contents of `Layout.module.css`:

```css
.root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: var(--border-major) solid var(--border-primary);
}

.nav {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 10px var(--space-container);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  text-decoration: none;
  color: var(--text-primary);
}

.brandName {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brandSub {
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.12em;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.userName {
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.logoutBtn {
  background: none;
  border: var(--border-minor) solid var(--border-primary);
  color: var(--text-primary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 4px 12px;
  cursor: pointer;
}

.logoutBtn:hover {
  background: var(--bg-hover);
}

.loginLink {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-primary);
  text-decoration: underline;
}

.main {
  flex: 1;
  max-width: var(--max-width);
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 480px) {
  .brandSub {
    display: none;
  }

  .userName {
    display: none;
  }
}
```

- [ ] **Step 3: Verify layout renders**

Run dev server, confirm header shows "NIMBUS WEATHER TERMINAL" with black border bottom, no glass effects.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/Layout/Layout.tsx client/src/components/Layout/Layout.module.css
git commit -m "feat: rewrite Layout component with brutalist header"
```

### Task 7: Rewrite LoginForm component

**Files:**
- Modify: `client/src/components/LoginForm/LoginForm.tsx`
- Modify: `client/src/components/LoginForm/LoginForm.module.css`

- [ ] **Step 1: Rewrite LoginForm.tsx**

Replace the full contents of `LoginForm.tsx`:

```typescript
import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginForm.module.css';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, register } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <span className={styles.formLabel}>AUTHENTICATION</span>
        <h1 className={styles.title}>{isSignup ? 'REGISTER' : 'SIGN IN'}</h1>

        <form onSubmit={handleSubmit} className={styles.fields}>
          {isSignup && (
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>NAME</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>EMAIL</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>PASSWORD</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              ERROR: {error.toUpperCase()}
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'PLEASE WAIT\u2026' : isSignup ? 'REGISTER \u2192' : 'AUTHENTICATE \u2192'}
          </button>
        </form>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
        >
          {isSignup ? (
            <>HAVE AN ACCOUNT? <span className={styles.toggleAction}>SIGN IN</span></>
          ) : (
            <>NO ACCOUNT? <span className={styles.toggleAction}>REGISTER</span></>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite LoginForm.module.css**

Replace the full contents of `LoginForm.module.css`:

```css
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: var(--space-container);
}

.form {
  width: 100%;
  max-width: 360px;
}

.formLabel {
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: 4px;
}

.title {
  font-family: var(--font-family);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.12em;
}

.input {
  background: var(--bg-input);
  border: var(--border-minor) solid var(--border-primary);
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-family);
}

.input:focus {
  outline: none;
  border-width: var(--border-major);
}

.error {
  border: var(--border-minor) solid var(--error);
  color: var(--error);
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.button {
  background: var(--bg-active);
  color: var(--text-inverse);
  border: var(--border-minor) solid var(--border-primary);
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  cursor: pointer;
  text-align: center;
  width: 100%;
}

.button:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.button:disabled {
  border-style: dashed;
  border-color: var(--disabled-border);
  color: var(--disabled-text);
  background: transparent;
  cursor: not-allowed;
}

.toggle {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 11px;
  font-family: var(--font-family);
  cursor: pointer;
  margin-top: 16px;
  padding: 8px;
  text-align: center;
}

.toggleAction {
  color: var(--text-primary);
  font-weight: 700;
  text-decoration: underline;
}
```

- [ ] **Step 3: Verify login form renders**

Navigate to /login — confirm brutalist form with hard borders, "AUTHENTICATION" label, "AUTHENTICATE →" button.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/LoginForm/LoginForm.tsx client/src/components/LoginForm/LoginForm.module.css
git commit -m "feat: rewrite LoginForm with brutalist styling"
```

---

## Chunk 4: SearchBar Component

### Task 8: Rewrite SearchBar

**Files:**
- Modify: `client/src/components/SearchBar/SearchBar.tsx`
- Modify: `client/src/components/SearchBar/SearchBar.module.css`

- [ ] **Step 1: Rewrite SearchBar.tsx**

Replace the full contents of `SearchBar.tsx`:

```typescript
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
    setQuery(`${city.name}, ${city.country}`);
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
    <div className={styles.searchRow}>
      <span className={styles.label}>STATION:</span>
      <div className={styles.inputWrap}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="SEARCH CITY..."
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-listbox"
          aria-activedescendant={activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
          aria-label="Search for a city"
          autoComplete="off"
        />
        {loading && <div className={styles.progressBar} />}
      </div>
      <span className={styles.searchBtn} aria-hidden="true">SEARCH</span>

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
```

- [ ] **Step 2: Rewrite SearchBar.module.css**

Replace the full contents of `SearchBar.module.css`:

```css
.searchRow {
  position: relative;
  border-bottom: var(--border-major) solid var(--border-primary);
  padding: 10px var(--space-container);
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  white-space: nowrap;
  color: var(--text-primary);
}

.inputWrap {
  flex: 1;
  position: relative;
  border: var(--border-minor) solid var(--border-primary);
}

.input {
  width: 100%;
  background: var(--bg-input);
  border: none;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-family);
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
}

.progressBar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: var(--bg-active);
  animation: progress 1s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0; left: 0; }
  50% { width: 60%; left: 20%; }
  100% { width: 0; left: 100%; }
}

.searchBtn {
  background: var(--bg-active);
  color: var(--text-inverse);
  border: var(--border-minor) solid var(--border-primary);
  padding: 8px 12px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: var(--space-container);
  right: var(--space-container);
  background: var(--bg-primary);
  border: var(--border-minor) solid var(--border-primary);
  border-top: none;
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
  z-index: 50;
}

.option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: var(--border-subtle) solid var(--border-secondary);
}

.option:last-child {
  border-bottom: none;
}

.option:hover,
.active {
  background: var(--bg-hover);
}

.cityName {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}

.country {
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

@media (max-width: 480px) {
  .searchBtn {
    font-size: 0;
  }
  .searchBtn::after {
    content: 'GO';
    font-size: 9px;
  }
}
```

- [ ] **Step 3: Verify search bar renders and autocomplete works**

Type a city name — confirm dropdown appears with brutalist styling, selecting a city populates "CITY, COUNTRY" format.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/SearchBar/SearchBar.tsx client/src/components/SearchBar/SearchBar.module.css
git commit -m "feat: rewrite SearchBar as brutalist terminal-style station selector"
```

---

## Chunk 5: CurrentWeather Component

### Task 9: Rewrite CurrentWeather

**Files:**
- Modify: `client/src/components/CurrentWeather/CurrentWeather.tsx`
- Modify: `client/src/components/CurrentWeather/CurrentWeather.module.css`

- [ ] **Step 1: Create signal color utility**

At the top of `CurrentWeather.tsx` (before the component), add:

```typescript
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
```

- [ ] **Step 2: Rewrite CurrentWeather.tsx component**

Replace the full component (keep the imports and utility functions from step 1):

```typescript
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
```

- [ ] **Step 3: Rewrite CurrentWeather.module.css**

Replace the full contents of `CurrentWeather.module.css`:

```css
.grid {
  border-bottom: var(--border-major) solid var(--border-primary);
}

.signalBar {
  height: 4px;
  width: 100%;
  position: relative;
}

.loadingBar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--bg-active);
  animation: progress 1s ease-in-out infinite;
}

@keyframes progress {
  0% { width: 0; left: 0; }
  50% { width: 60%; left: 20%; }
  100% { width: 0; left: 100%; }
}

.primaryRow {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}

.primaryRow > .cell {
  padding: var(--space-cell-lg);
  border-right: var(--border-major) solid var(--border-primary);
  border-bottom: var(--border-major) solid var(--border-primary);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 140px;
}

.primaryRow > .cell:last-child {
  border-right: none;
}

.secondaryRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.secondaryRow > .cell {
  padding: var(--space-cell-md);
  border-right: var(--border-major) solid var(--border-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.secondaryRow > .cell:last-child {
  border-right: none;
}

.cellLabel {
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.tempValue {
  font-size: 72px;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.condValue {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.baroValue {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.secValue {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.unit {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.cellDetail {
  font-size: 11px;
  color: var(--text-secondary);
}

.cellActions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.unitBtn {
  background: none;
  border: var(--border-minor) solid var(--border-primary);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: var(--text-muted);
}

.unitActive {
  background: var(--bg-active);
  color: var(--text-inverse);
}

.favBtn {
  background: none;
  border: var(--border-minor) solid var(--border-secondary);
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  color: var(--text-muted);
  margin-left: 8px;
}

.favActive {
  border-color: var(--border-primary);
  color: var(--text-primary);
}

.cellLoading {
  border: var(--border-minor) dashed var(--border-secondary);
  min-height: 140px;
}

/* Tablet */
@media (max-width: 768px) {
  .tempValue {
    font-size: 56px;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .primaryRow {
    grid-template-columns: 1fr;
  }

  .primaryRow > .cell {
    border-right: none;
    min-height: auto;
    padding: var(--space-cell-sm);
  }

  .secondaryRow > .cell {
    padding: var(--space-cell-sm);
  }

  .tempValue {
    font-size: 56px;
  }

  .condValue {
    font-size: 22px;
  }

  .baroValue {
    font-size: 28px;
  }

  .secondaryRow > .cell {
    border-bottom: none;
  }
}
```

- [ ] **Step 4: Verify weather grid renders with signal color**

Load the app, search a city — confirm 3-column primary row (temp in signal color, condition text, pressure) + 2-column secondary row (wind with compass, humidity).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/CurrentWeather/CurrentWeather.tsx client/src/components/CurrentWeather/CurrentWeather.module.css
git commit -m "feat: rewrite CurrentWeather as brutalist data grid with signal color"
```

---

## Chunk 6: ForecastCard Component and Final Verification

### Task 10: Rewrite ForecastCard as forecast strip

**Files:**
- Modify: `client/src/components/ForecastCard/ForecastCard.tsx`
- Modify: `client/src/components/ForecastCard/ForecastCard.module.css`

- [ ] **Step 1: Rewrite ForecastCard.tsx**

Replace the full contents of `ForecastCard.tsx`:

```typescript
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
```

- [ ] **Step 2: Rewrite ForecastCard.module.css**

Replace the full contents of `ForecastCard.module.css`:

```css
.strip {
  /* No margin, no padding top — continuous with weather grid above */
}

.stripLabel {
  padding: 12px var(--space-container) 8px;
  font-size: 9px;
  color: var(--text-muted);
  letter-spacing: 0.15em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: var(--border-minor) solid var(--border-primary);
}

.day {
  padding: var(--space-cell-sm);
  border-right: var(--border-minor) solid var(--border-primary);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day:last-child {
  border-right: none;
}

.dayName {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-primary);
}

.barChart {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  margin: 4px 0;
}

.barHigh {
  width: 12px;
  background: var(--bg-active);
}

.barLow {
  width: 12px;
  background: var(--disabled-border);
}

.high {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
}

.low {
  font-size: 11px;
  color: var(--text-muted);
}

.condition {
  font-size: 9px;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

/* Mobile: drop bar charts, text only */
@media (max-width: 480px) {
  .barChart {
    display: none;
  }

  .day {
    padding: 8px 4px;
    border-right-width: var(--border-subtle);
    border-right-color: var(--border-secondary);
  }

  .condition {
    display: none;
  }
}
```

- [ ] **Step 3: Verify forecast strip renders with bar charts**

Load the app, search a city — confirm 5-column forecast strip with black/gray bar charts, uppercase condition text, no weather icons.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ForecastCard/ForecastCard.tsx client/src/components/ForecastCard/ForecastCard.module.css
git commit -m "feat: rewrite ForecastCard as brutalist strip with bar charts"
```

### Task 11: Full integration verification

- [ ] **Step 1: Start the full stack**

Run both server and client:
```bash
cd /Users/kapil.chandra/dev/weather && USE_MOCK=true npx tsx server/src/index.ts &
cd /Users/kapil.chandra/dev/weather && npm run dev --prefix client &
```

- [ ] **Step 2: Verify dashboard flow**

Open browser. Confirm:
- White background, Space Grotesk font
- "NIMBUS WEATHER TERMINAL" header with 3px black border
- Search bar with "STATION:" label
- Search a city → data grid appears with signal color on temperature
- 3-column primary row (temp, condition, pressure)
- 2-column secondary row (wind with compass, humidity)
- 5-column forecast strip with bar charts
- No rounded corners, no shadows, no blur, no gradients anywhere

- [ ] **Step 3: Verify login flow**

Navigate to /login. Confirm:
- "AUTHENTICATION" label, "SIGN IN" heading
- Hard-bordered inputs
- "AUTHENTICATE →" button (black bg, white text)
- Error state shows "ERROR:" prefix

- [ ] **Step 4: Verify mobile responsiveness**

Resize to 375px width. Confirm:
- "WEATHER TERMINAL" subtitle hidden
- Grid collapses to single column
- Temperature still has signal color
- Forecast strips to text-only (no bar charts)

- [ ] **Step 5: Kill dev servers**

```bash
kill %1 %2
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git status
```
If there are any uncommitted changes, commit them:
```bash
git commit -m "chore: final cleanup for brutalist data wall redesign"
```
