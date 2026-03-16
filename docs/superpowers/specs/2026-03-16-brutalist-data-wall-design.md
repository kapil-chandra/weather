# Nimbus — Brutalist Data Wall Visual Redesign

**Date:** 2026-03-16
**Status:** Draft
**Author:** Architect Agent

## Revision History

| Rev | Date | Description |
|-----|------|-------------|
| 1.0 | 2026-03-16 | Initial design spec |
| 1.1 | 2026-03-16 | Spec review fixes: missing features, border contradiction, tablet layout, accessibility, data fields |
| 1.2 | 2026-03-16 | Fix Open-Meteo API accuracy, remove unavailable fields, update grid layout, remove stagger animation |

---

## 1. Overview

A complete visual identity overhaul for the Nimbus weather app, replacing the current dark glassmorphic aesthetic (dark navy, blur cards, cyan accents, DM Sans + Playfair Display) with a **Brutalist Data Wall** design — Swiss-style information design meets raw concrete. The design is IP-distinct from every other weather app by rejecting decoration entirely and letting the data be the visual experience.

### Design Philosophy

1. **Grid = Architecture.** Every piece of data lives in a hard-bordered cell. No rounded corners, no shadows, no blur. Borders are the visual system.
2. **Typography = Hierarchy.** One font (Space Grotesk) at different sizes creates all hierarchy. Numbers are oversized hero content.
3. **Data = Decoration.** No weather icons. Conditions spelled out in bold text. Forecast uses bar charts. The data itself is the visual interest.
4. **Monochrome + Signal.** 95% black, white, and gray. A single condition-driven "signal" color provides the only chromatic accent.

### Target Audience

Weather enthusiasts who want dense, data-rich interfaces that reward exploration — not a 2-second-glance consumer app.

## 2. Design Tokens (CSS Custom Properties)

### 2.1 Colors

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
  --text-muted: #767676;       /* WCAG AA compliant (4.54:1 on #fafafa) */
  --text-inverse: #fafafa;

  /* Signal colors (condition-driven, set dynamically) */
  --signal-hot: #d4402b;       /* Hot / Clear */
  --signal-cold: #2b7fd4;      /* Cold / Snow */
  --signal-storm: #5a6a7a;     /* Rain / Storms */
  --signal-mild: #8a8478;      /* Mild / Overcast */
  --signal-current: var(--signal-mild);  /* Set by JS based on conditions */

  /* Error */
  --error: #d4402b;

  /* Disabled */
  --disabled-border: #cccccc;
  --disabled-text: #cccccc;
}
```

### 2.2 Typography

**Font:** Space Grotesk (Google Fonts) — single font, all weights.

```css
:root {
  --font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;

  /* Scale */
  --text-hero: 72px;        /* Temperature display (desktop) */
  --text-hero-mobile: 56px;  /* Temperature display (mobile) */
  --text-xlarge: 40px;       /* Secondary metrics (pressure) */
  --text-large: 32px;        /* Tertiary metrics (wind, humidity) */
  --text-heading: 28px;      /* Condition text, page headings */
  --text-subheading: 22px;   /* Condition text (mobile) */
  --text-brand: 18px;        /* NIMBUS wordmark */
  --text-body: 13px;         /* Body text, input values */
  --text-detail: 11px;       /* Supporting details */
  --text-label: 9px;         /* Cell labels, metadata */
  --text-micro: 8px;         /* Forecast day labels (mobile) */

  /* Weights */
  --weight-bold: 700;
  --weight-medium: 500;

  /* Letter spacing */
  --tracking-tight: -0.03em;   /* Hero numbers */
  --tracking-brand: -0.02em;   /* Brand wordmark */
  --tracking-normal: 0;
  --tracking-label: 0.15em;    /* Uppercase labels */
  --tracking-wide: 0.12em;     /* Sublabels */
  --tracking-button: 0.1em;    /* Button text */
}
```

### 2.3 Spacing

```css
:root {
  /* Cell padding */
  --space-cell-lg: 20px;      /* Primary data cells */
  --space-cell-md: 16px;      /* Secondary data cells */
  --space-cell-sm: 12px;      /* Forecast cells, mobile cells */
  --space-cell-xs: 8px;       /* Compact elements */

  /* Container */
  --space-container: 16px;     /* Horizontal page padding */
  --space-container-mobile: 12px;

  /* Max width */
  --max-width: 1120px;
}
```

### 2.4 Borders

```css
:root {
  /* Border widths — the core visual system */
  --border-major: 3px;    /* Primary grid divisions, header, search */
  --border-minor: 2px;    /* Secondary divisions, inputs, buttons */
  --border-subtle: 1px;   /* Tertiary divisions, metadata rows */

  /* Border radius — always zero */
  --radius: 0;

  /* Signal bar */
  --signal-bar-height: 4px;
}
```

## 3. Component Specifications

### 3.1 Layout (Layout.tsx / Layout.module.css)

**Structure:**
```
<div class="layout">          /* Full viewport, flex column, bg-primary */
  <header class="header">     /* Sticky, border-bottom: major */
    <div class="brand">        /* "NIMBUS" + "WEATHER TERMINAL" */
    <div class="actions">      /* Username + logout button */
  </header>
  <main class="main">         /* flex: 1, max-width container */
    {children}
  </main>
</div>
```

**Header:**
- Background: `--bg-primary`
- Bottom border: `--border-major` solid `--border-primary`
- Padding: 10px `--space-container`
- Brand: "NIMBUS" at `--text-brand`, weight 700, tracking `--tracking-brand`
- Subtitle: "WEATHER TERMINAL" at `--text-label`, color `--text-muted`, tracking `--tracking-wide`
- No backdrop blur, no glass effect
- Logout button: `--border-minor` solid border, padding 4px 12px, `--text-label` size, weight 700

**Authenticated state:** Username (uppercased, truncated) at `--text-label`, color `--text-muted` + "LOGOUT" button.

**Unauthenticated state:** "SIGN IN" link at `--text-label`, weight 700, underlined. No logout button.

**Removal list:** Delete all glassmorphic properties — `backdrop-filter`, `--glass-bg`, `--glass-border`, background gradients, `--accent`, `--accent-hover`, `--accent-glow`, `--font-display` (Playfair Display), brand icon/emoji, `fadeUp` animation.

### 3.2 SearchBar (SearchBar.tsx / SearchBar.module.css)

**Structure:**
```
<div class="searchRow">         /* border-bottom: major, flex row */
  <span class="label">          /* "STATION:" */
  <div class="inputWrapper">    /* flex: 1, border: minor */
    <input class="input" />
    <span class="coords">       /* "40.71°N 74.01°W" */
  </div>
  <button class="searchBtn">    /* "SEARCH" inverted button */
  <div class="dropdown">        /* Results listbox */
</div>
```

**Search input:**
- Border: `--border-minor` solid `--border-primary`
- Background: `--bg-input`
- Padding: 8px 12px
- Font: `--text-body`, weight `--weight-medium`
- No border-radius, no backdrop blur
- Placeholder color: `--text-muted`

**Search button:**
- Background: `--bg-active` (black)
- Color: `--text-inverse` (white)
- Border: `--border-minor` solid `--border-primary`
- Font: `--text-label`, weight 700, tracking `--tracking-button`
- Text: "SEARCH"

**Dropdown:**
- Border: `--border-minor` solid `--border-primary`
- Background: `--bg-primary`
- No border-radius, no backdrop blur
- Items separated by `--border-subtle` solid `--border-secondary`
- Hover: `--bg-hover`
- Active/selected: `--bg-active` with `--text-inverse`

**Search behavior:** The search input retains the existing autocomplete/type-ahead behavior. The "SEARCH" button is purely visual framing — it is not a submit button. Typing triggers the debounced city lookup, and clicking a dropdown result calls `onSelectCity` as before. The button is decorative branding, not functional. If desired, it can be omitted in implementation.

**Dropdown empty state:** When no results are found, show a single dropdown item: "NO RESULTS" at `--text-label`, color `--text-muted`, centered. On search error, show "ERROR: SEARCH FAILED" in `--error` color.

**Search spinner replacement:** Replace the existing spinner with a 4px-tall horizontal progress bar (`--bg-active`) inside the input wrapper that animates left-to-right during loading.

**Live indicator row (below search):**
- Border-bottom: `--border-subtle` solid `--border-secondary`
- Content: Black dot (6px) + "LIVE — UPDATED {time} {timezone} — {date}"
- Timestamp source: `new Date().toLocaleTimeString()` captured when weather data is received. Timezone from Intl.DateTimeFormat. No backend change needed.
- Font: `--text-label`, color `--text-muted`, tracking `--tracking-label`

### 3.3 CurrentWeather (CurrentWeather.tsx / CurrentWeather.module.css)

**City/Country display:** The city name and country are displayed in the search bar's input field (e.g., "NEW YORK CITY, US") after selection — not repeated in the weather grid. The grid is purely data.

**Unit toggle (°F / °C):** Placed inside the temperature cell, below the detail line. Rendered as two adjacent inline buttons: `°F` and `°C`. The active unit is inverted (black bg, white text); the inactive is outline-only. Uses existing `useCelsius` / `onToggleUnit` props.

**Favorites button:** Placed as a small outline button labeled "★ SAVE" (or "★ SAVED" when active) in the temperature cell, positioned to the right of the unit toggle. Uses existing `isFavorited` / `onToggleFavorite` props. When favorited, the star and text are black; when not, `--text-muted`.

**Structure:**
```
<div class="weatherGrid">
  <div class="signalBar" />         /* 4px colored bar spanning full width */
  <div class="gridRow gridRow--primary">
    <div class="cell cell--temp">    /* Temperature + unit toggle + favorite */
    <div class="cell cell--cond">    /* Condition */
    <div class="cell cell--baro">    /* Barometric pressure */
  </div>
  <div class="gridRow gridRow--secondary">   /* 2-column row */
    <div class="cell cell--wind">    /* Wind */
    <div class="cell cell--humid">   /* Humidity */
  </div>
</div>
```

**Signal bar:**
- Height: `--signal-bar-height` (4px)
- Background: `--signal-current` (set dynamically)
- Full width, no padding

**Data grid:**
- Display: grid, 3 columns (1fr 1fr 1fr)
- Cell borders: `--border-major` solid `--border-primary`
- No gaps — borders create the visual separation

**Temperature cell:**
- Label: "TEMPERATURE" — `--text-label`, color `--text-muted`, tracking `--tracking-label`, uppercase
- Value: `--text-hero` (72px desktop / 56px mobile), weight 700, tracking `--tracking-tight`, color `--signal-current`
- Details: "FEELS {n}° · HIGH {n}° · LOW {n}°" — `--text-detail`, color `--text-secondary`

**Condition cell:**
- Label: "CONDITION" — same label style
- Value: Condition text in `--text-heading`, weight 700, uppercase, color `--text-primary`
- No weather icons — text only. The WMO description text IS the condition (e.g., "PARTLY CLOUDY", "THUNDERSTORM").

**Barometric cell:**
- Label: "BAROMETRIC" — same label style
- Value: `--text-xlarge`, weight 700 + "hPa" in `--text-body` color `--text-muted`
- No trend line (historical pressure data not available from Open-Meteo). Value only.

**Secondary row (2 columns: Wind, Humidity):**
- Grid: `grid-template-columns: 1fr 1fr`
- Same label style as primary
- Values at `--text-large`, weight 700
- Units inline at `--text-body`, color `--text-secondary`
- Wind detail: "{speed} mph" + "NNW {deg}°" (compass direction computed from `wind_direction` degrees using 16-point compass: `['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(deg / 22.5) % 16]`)
- Humidity detail: "DEW POINT" line omitted (not available from API)
- Cell padding: `--space-cell-md`

**Loading state:** When data is loading, show the 4px horizontal progress bar in the signal bar position (sweeping left-to-right). Grid cells render with dashed `--border-secondary` borders and no content — empty frames.

**Signal color logic (JS — always uses Fahrenheit value internally via `temp_f`):**
```
temp_f >= 85 OR condition contains "clear"/"sun" → --signal-hot (#d4402b)
temp_f <= 32 OR condition contains "snow"/"ice"  → --signal-cold (#2b7fd4)
condition contains "rain"/"storm"/"thunder"       → --signal-storm (#5a6a7a)
all other conditions                              → --signal-mild (#8a8478)
```

### 3.4 ForecastCard (ForecastCard.tsx / ForecastCard.module.css)

**Structure — changes from card-per-day to a single forecast strip:**
```
<div class="forecastStrip">
  <div class="forecastLabel">    /* "5-DAY FORECAST" */
  <div class="forecastGrid">     /* 5-column grid */
    <div class="forecastDay">    /* Repeated 5x */
      <span class="dayName">    /* MON, TUE, etc. */
      <div class="barChart">     /* High/low bars */
      <span class="high">
      <span class="low">
      <span class="condition">   /* Text, no icon */
    </div>
  </div>
</div>
```

**Forecast grid:**
- Display: grid, 5 columns (repeat(5, 1fr))
- Top border: `--border-minor` solid `--border-primary`
- Cell dividers: `--border-minor` solid `--border-primary` (right border on each except last)
- Cell padding: `--space-cell-sm`, text-align center

**Bar chart per day:**
- Container: 40px height, flex row, align-items flex-end, centered
- High bar: 12px wide, `--bg-active` (black), height proportional to temp
- Low bar: 12px wide, `--disabled-border` (gray), height proportional to temp
- Gap: 3px between bars
- Bar height formula: `((temp - minOfWeek) / (maxOfWeek - minOfWeek)) * 36 + 4` px (min 4px, max 40px). If `maxOfWeek === minOfWeek` (all temps equal), all bars render at 20px (midpoint).
- Both high and low bars use the same global normalization range: the week's absolute min to absolute max across all high and low values.

**Day label:** `--text-label`, weight 700, tracking `--tracking-button`
**High temp:** `--text-detail`, weight 700
**Low temp:** `--text-detail`, color `--text-muted`
**Condition:** `--text-label`, color `--text-secondary`, uppercase

**Mobile adaptation (< 480px):**
- Bar charts removed to save vertical space
- Grid becomes text-only: day, high, low in compact rows
- Border weight drops to `--border-subtle`

### 3.5 LoginForm (LoginForm.tsx / LoginForm.module.css)

**Structure:**
```
<div class="loginPage">         /* flex center, full height below header */
  <div class="loginForm">       /* max-width: 360px */
    <span class="formLabel">    /* "AUTHENTICATION" */
    <h1 class="formTitle">      /* "SIGN IN" or "REGISTER" */
    <div class="field">
      <label />                 /* "NAME" (register only), "EMAIL", "PASSWORD" */
      <input />
    </div>
    <div class="error" />       /* Conditional error message */
    <button class="submit" />   /* "AUTHENTICATE →" or "REGISTER →" */
    <p class="toggle" />        /* Switch between sign in / register */
  </div>
</div>
```

**Form container:**
- Centered vertically and horizontally in remaining viewport
- Width: 360px max
- No card, no background, no border around the form itself

**Labels:** `--text-label`, weight 700, tracking `--tracking-wide`, margin-bottom 6px

**Inputs:**
- Border: `--border-minor` solid `--border-primary`
- Padding: 10px 12px
- Font: `--text-body`
- Focus state: border thickens to `--border-major`
- No border-radius

**Error message:**
- Border: `--border-minor` solid `--error`
- Color: `--error`
- Padding: 10px 12px
- Font: `--text-detail`, weight 700, tracking 0.05em
- Text: "ERROR: {message}" uppercase

**Submit button:**
- Background: `--bg-active`
- Color: `--text-inverse`
- Border: `--border-minor` solid `--border-primary`
- Font: `--text-body` size, weight 700, tracking `--tracking-wide`
- Text: "AUTHENTICATE →" (sign in) or "REGISTER →" (register)
- Full width
- Hover: `--bg-hover` with `--text-primary` (invert back)
- Active: stays `--bg-active`
- Disabled: dashed border, `--disabled-text`

**Toggle link:**
- Font: `--text-detail`, color `--text-secondary`
- Action word: `--text-primary`, weight 700, underlined

### 3.6 Page Composition (Dashboard)

The dashboard page stacks components vertically with no spacing between them — the border system creates visual separation.

```
<Layout>
  {/* Header is inside Layout */}
  <SearchBar />              /* Directly below header, border-bottom: major */
  <LiveIndicator />          /* 1px bottom border, sits between search and data */
  <CurrentWeather />         /* Signal bar + 2-row data grid, border-bottom: major */
  <ForecastStrip />          /* 5-column strip at bottom */
</Layout>
```

- **No vertical gaps or margins** between components. They share a continuous border system.
- Max-width: `--max-width` (1120px), centered with `margin: 0 auto`
- The entire stack reads as one unified data wall, not separate floating cards.

## 4. Interaction States

All interaction states use instant transitions (no easing, no duration). Brutalist = immediate response.

| Element | Default | Hover | Focus/Active | Disabled |
|---------|---------|-------|--------------|----------|
| Grid cell | 3px border (`--border-major`), white bg | bg shifts to #f0f0f0 | black bg, white text | — |
| Button (outline) | 2px border, white bg | 2px border, #f0f0f0 bg | 2px border, black bg, white text | 2px dashed #ccc border, #ccc text |
| Button (filled/primary) | 2px border, black bg, white text | bg shifts to #333 | bg shifts to #000 | 2px dashed #ccc border, #ccc text |
| Input | 2px border | — | 3px border | 2px dashed #ccc border |
| Link | Underlined, black | Weight 700 | — | #ccc text |

## 5. Responsive Breakpoints

| Breakpoint | Grid columns | Temperature size | Forecast |
|------------|-------------|------------------|----------|
| > 768px (desktop) | 3 columns | 72px | Bar charts + text |
| 481-768px (tablet) | 2 columns | 56px | Bar charts + text |
| ≤ 480px (mobile) | 1 column + special rows | 56px | Text only, compact |

**Tablet layout (481-768px) — 2-column grid mapping:**
- Row 1: Temperature (1 col) | Condition (1 col)
- Row 2: Barometric (span 2 cols, centered) — or split: Barometric (1 col) | Wind (1 col) with Humidity below spanning 2 cols
- Simpler approach: keep 3-col primary row, use 2-col secondary row (same as desktop). Temperature font drops to 56px.
- All cells use `--border-major` borders

**Mobile layout (≤ 480px) — single-column stack:**
- Temperature: Full width
- Condition: Full width
- Barometric: Full width
- Wind + Humidity: 2-column sub-row (`grid-template-columns: 1fr 1fr`)
- All cells use `--border-minor` borders

**Mobile search button:** Text changes from "SEARCH" to "GO" via CSS (`@media (max-width: 480px)`) using content replacement or a conditional render in the component.

**Additional mobile changes:**
- Header: Remove "WEATHER TERMINAL" subtitle
- Search: "SEARCH" button becomes "GO"
- Signal bar: Full width above data cells
- Forecast: Drop bar charts, text-only 5-column strip with `--border-subtle` dividers

## 6. Animation & Motion

**Principle:** No decorative animation. Motion is used only for state feedback and data loading.

- **State changes:** Instant (0ms transition). No easing, no spring physics.
- **Loading state:** A simple horizontal progress bar (4px, black) that sweeps left-to-right. No shimmer, no skeleton screens.
- **Data refresh:** New values snap in place. No fade, no count-up animation.
- **Page transitions:** None. Instant swap between login and dashboard.
- **Forecast stagger:** Remove the existing `animationDelay` stagger on forecast cards. All forecast cells render simultaneously.

## 7. Font Loading Strategy

1. Load Space Grotesk from Google Fonts (weights: 500, 700)
2. `font-display: swap` — show system-ui fallback immediately, swap when loaded
3. Remove DM Sans and Playfair Display imports entirely

## 8. Files to Modify

| File | Changes |
|------|---------|
| `client/src/index.css` | Replace all CSS custom properties. Remove glassmorphic tokens. Add brutalist tokens. Change background to #fafafa. Load Space Grotesk. Remove DM Sans + Playfair Display. |
| `client/src/components/Layout/Layout.module.css` | Rewrite header and main layout styles. Remove glass effects, gradients, animations. |
| `client/src/components/Layout/Layout.tsx` | Update brand text ("NIMBUS" / "WEATHER TERMINAL"). Remove emoji icon. |
| `client/src/components/SearchBar/SearchBar.module.css` | Rewrite search input, button, dropdown styles. Remove blur, radius, glass. |
| `client/src/components/SearchBar/SearchBar.tsx` | Add "STATION:" label, coordinates display, live indicator row. |
| `client/src/components/CurrentWeather/CurrentWeather.module.css` | Rewrite as data grid. Remove card styles, blur, gradients. Add signal bar. |
| `client/src/components/CurrentWeather/CurrentWeather.tsx` | Restructure as grid cells. Remove weather icon. Add signal color logic. Add barometric/visibility cells if data available. |
| `client/src/components/ForecastCard/ForecastCard.module.css` | Rewrite as forecast strip with bar charts. Remove card styles. |
| `client/src/components/ForecastCard/ForecastCard.tsx` | Restructure as single strip component with bar chart rendering. Remove weather icons. |
| `client/src/components/LoginForm/LoginForm.module.css` | Rewrite form styles. Remove glass card, blur, gradients. |
| `client/src/components/LoginForm/LoginForm.tsx` | Update button text ("AUTHENTICATE →" / "REGISTER →"), add "ERROR:" prefix, add "AUTHENTICATION" label, update "NAME" field label. |

## 9. What Gets Removed

- All `backdrop-filter` / `-webkit-backdrop-filter` properties
- All `border-radius` values (set to 0 globally)
- All `box-shadow` and `drop-shadow` properties
- All gradient backgrounds (`linear-gradient`)
- All decorative animations (`fadeUp`, `shimmer`)
- DM Sans and Playfair Display font imports
- Weather icon images (replaced by text conditions)
- Glassmorphic CSS variables (`--glass-bg`, `--glass-border`, `--accent-glow`, etc.)
- The cloud/sun brand emoji in the header

## 10. Required Data Fields (Open-Meteo API)

The app uses the **Open-Meteo API** (free, no key required). The current `getCurrentWeather` call requests:
```
current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
```

### 10.1 Expand the current weather API params

Update to:
```
current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,surface_pressure,wind_direction_10m'
```

New fields to add to the `CurrentWeather` type:

| Field | Type | Open-Meteo param | Extraction |
|-------|------|-----------------|------------|
| `feels_like_f` | number | `apparent_temperature` | Direct (°F with `temperature_unit: 'fahrenheit'`) |
| `feels_like_c` | number | — | `fahrenheitToCelsius(feels_like_f)` |
| `pressure` | number | `surface_pressure` | Direct, in hPa |
| `wind_direction` | number | `wind_direction_10m` | Degrees (0-360) |

### 10.2 Daily high/low for current weather

The existing forecast call already fetches `temperature_2m_max` and `temperature_2m_min`. Currently it skips today (`if (daily.time[i] === today) continue`). Instead, extract today's values before skipping:

```typescript
// Before the forecast loop, extract today's high/low
const todayIndex = daily.time.indexOf(today);
const todayHighF = todayIndex >= 0 ? Math.round(daily.temperature_2m_max[todayIndex] * 10) / 10 : null;
const todayLowF = todayIndex >= 0 ? Math.round(daily.temperature_2m_min[todayIndex] * 10) / 10 : null;
```

Add `temp_high_f`, `temp_high_c`, `temp_low_f`, `temp_low_c` to the `CurrentWeather` type. The `getCurrentWeather` method should make the forecast API call too (or a combined call) to get these values.

### 10.3 Fields NOT available — design adjustments

| Field | Status | Design adjustment |
|-------|--------|------------------|
| Visibility | Not in Open-Meteo free tier | **Omit Visibility cell entirely.** Secondary row becomes 2-column (Wind + Humidity only). |
| Cloud cover % | Not in `current` params | Omit "CLOUD COVER n%" detail. Condition cell shows WMO description text only. |
| Pressure trend | No historical data | Show pressure value only. Omit "▲ RISING" trend. |
| Dew point | Not requested | Omit from Humidity detail. Show value + "%" only. |

### 10.4 Files to update for data changes

| File | Changes |
|------|---------|
| `server/src/types/weather.ts` | Add `feels_like_f`, `feels_like_c`, `pressure`, `wind_direction`, `temp_high_f`, `temp_high_c`, `temp_low_f`, `temp_low_c` to `CurrentWeather` interface |
| `server/src/services/weatherService.ts` | Expand `current` params, extract new fields, fetch today's high/low from forecast call |
| `server/src/services/mockWeatherService.ts` | Add mock values for all new fields |
| `client/src/types/index.ts` | Mirror the `CurrentWeather` type changes |

### 10.5 Wind direction compass conversion (frontend utility)

```typescript
function degreesToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE',
                'S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}
```

## 11. Assumptions

- All new Open-Meteo params (`apparent_temperature`, `surface_pressure`, `wind_direction_10m`) are available in the free tier and require no API key.
- Space Grotesk is freely available via Google Fonts and suitable for production use.
- The bar chart in the forecast strip is rendered with simple CSS `div` elements (no charting library needed).
- The signal color is computed client-side based on `temp_f` (Fahrenheit) thresholds and WMO condition description string matching.
- Coordinates for the "STATION:" display are not available from the current `City` type. For the initial implementation, omit the coordinates `<span>`. They can be added later by surfacing lat/lon from the geocoding response.
- The `getCurrentWeather` method will need to also call the forecast endpoint (or combine into one call) to get today's high/low. This is a minor backend change.

These assumptions should be verified before implementation.
