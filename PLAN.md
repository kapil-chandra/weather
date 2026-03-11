# Weather App — Implementation Plan

**Spec:** See `docs/superpowers/specs/2026-03-11-weather-app-design.md` for full architecture.

**Stack:** Express 5 + TypeScript | React 18 + Vite + TypeScript | SQLite + Knex | JWT Auth

---

## Phase 1 — Backend API with Mock Data (Epic 1)

### 1.1 Project Scaffolding
- [x] Initialize git repo, create `.gitignore` (node_modules, dist, *.db, .env)
- [x] Create `server/` directory with `package.json`, `tsconfig.json`
- [x] Install deps: express, cors, zod, jsonwebtoken, bcrypt, dotenv, tsx, typescript, and their type packages
- [x] Create `server/src/app.ts` with Express app setup (JSON body parsing, CORS)
- [x] Create `server/src/config.ts` for env vars and constants
- [x] Create `server/.env` with PORT and JWT_SECRET
- [x] Add dev script: `tsx watch src/app.ts`

### 1.2 Error Handling & Response Envelope
- [x] Define `ApiResponse<T>` and `ApiError` types in `server/src/types/`
- [x] Create typed error classes: `AppError`, `NotFoundError`, `ValidationError`, `AuthError`
- [x] Create `server/src/middleware/errorHandler.ts` — catches all errors, maps to envelope
- [x] Create helper: `sendSuccess(res, data, status?)` for consistent success responses

### 1.3 Health Check
- [x] Create `server/src/routes/health.ts` — `GET /api/health` returns status + uptime
- [x] Register route in app.ts
- [x] Test manually with curl

### 1.4 Mock Weather Service
- [x] Define `WeatherService` interface in `server/src/types/weather.ts`
- [x] Create `server/src/services/weatherService.ts` with mock implementation
  - `getCurrentWeather(city)` — returns hardcoded data for ~10 cities, 404 for unknown
  - `getForecast(city)` — returns 5 days of mock data
  - `searchCities(query)` — filters a hardcoded list of ~20 cities by prefix match

### 1.5 Weather Routes
- [x] Create `server/src/routes/weather.ts`
  - `GET /api/weather/current/:city` — calls weatherService.getCurrentWeather
  - `GET /api/weather/forecast/:city` — calls weatherService.getForecast
  - `GET /api/weather/search?q=` — calls weatherService.searchCities, validate q >= 2 chars
- [x] Register routes in app.ts

### 1.6 Auth (In-Memory Store)
- [x] Create `server/src/services/authService.ts`
  - In-memory `Map<string, User>` for user store
  - `register(email, password, name)` — hash password with bcrypt, store user, return JWT
  - `login(email, password)` — verify credentials, return JWT
  - `verifyToken(token)` — decode and validate JWT
- [x] Create `server/src/routes/auth.ts`
  - `POST /api/auth/register` — validate with zod, call authService.register
  - `POST /api/auth/login` — validate with zod, call authService.login
  - `GET /api/auth/me` — requires auth middleware, return current user
- [x] Create `server/src/middleware/auth.ts` — JWT verification middleware, attaches `req.user`
- [x] Register routes in app.ts

### Phase 1 Checkpoint
At this point: all weather and auth endpoints work with mock/in-memory data, consistent JSON responses, proper error handling, CORS enabled.

---

## Phase 2 — API Integration (Epic 2)

### 2.1 OpenWeatherMap Integration
- [x] Sign up for OpenWeatherMap API key, add to `.env`
- [x] Replace mock `weatherService.ts` with real implementation:
  - `getCurrentWeather(city)` — calls OWM Current Weather API, maps response to our shape (both °F and °C)
  - `getForecast(city)` — calls OWM 5-day/3-hour API, aggregates into daily highs/lows
  - `searchCities(query)` — calls OWM Geocoding API
- [x] Map OWM icon codes to icon URLs (`https://openweathermap.org/img/wn/{code}@2x.png`)
- [x] Handle OWM API errors gracefully (key invalid, rate limit, city not found)

### 2.2 Retry Logic
- [x] Add Axios instance in weatherService with retry interceptor
- [x] Exponential backoff: 3 retries, delays of 1s, 2s, 4s
- [x] Only retry on 5xx errors and network failures, not 4xx

### 2.3 Rate Limiting
- [x] Install `express-rate-limit`
- [x] Create `server/src/middleware/rateLimiter.ts` with three tiers:
  - Global: 100 req / 15 min per IP
  - Auth routes: 10 req / 15 min per IP
  - Search route: 30 req / 1 min per IP
- [x] Apply rate limiters to appropriate routes

### 2.4 Protected Routes
- [x] Apply auth middleware to routes that will need it in Phase 4 (favorites, history)
- [x] Ensure weather routes remain public
- [x] Verify `GET /api/auth/me` requires valid token

### Phase 2 Checkpoint
At this point: real weather data from OpenWeatherMap, temp in both units, icons, rate limiting, retry on failures, auth middleware ready for protected routes.

---

## Phase 3 — Frontend Dashboard (Epic 3)

### 3.1 Project Scaffolding
- [ ] Create `client/` with Vite + React + TypeScript template
- [ ] Install deps: axios, react-router-dom
- [ ] Configure Vite proxy: `/api` -> `http://localhost:3001`
- [ ] Set up basic `App.tsx` with React Router (Dashboard and Login routes)
- [ ] Create `client/src/types/` with shared TypeScript types matching API contracts

### 3.2 API Client Layer
- [ ] Create `client/src/api/client.ts` — Axios instance with:
  - Base URL pointing to `/api`
  - Request interceptor to attach Bearer token from localStorage
  - Response interceptor for 401 handling (clear token, redirect to login)
- [ ] Create `client/src/api/weather.ts` — `getCurrentWeather(city)`, `getForecast(city)`, `searchCities(query)`
- [ ] Create `client/src/api/auth.ts` — `register(...)`, `login(...)`, `getMe()`

### 3.3 Auth Context & Login Page
- [ ] Create `client/src/context/AuthContext.tsx`
  - Provides: `user`, `token`, `login()`, `register()`, `logout()`, `isAuthenticated`
  - Persists token in localStorage, loads user on mount via `/api/auth/me`
- [ ] Create `client/src/pages/Login.tsx` — login/signup form with toggle
- [ ] Create `client/src/components/LoginForm/` — email, password, name (for signup) fields
  - Form validation, loading state, error display
  - Redirect to dashboard on success

### 3.4 Layout & Navigation
- [ ] Create `client/src/components/Layout/` — app shell with header, main content area
  - Header: app title, user name + logout button (when logged in), login link (when not)
  - Responsive: hamburger menu on mobile
- [ ] CSS Modules for all styling, mobile-first approach

### 3.5 Search Bar
- [ ] Create `client/src/hooks/useDebounce.ts` — debounces a value by 300ms
- [ ] Create `client/src/components/SearchBar/`
  - Text input with autocomplete dropdown
  - On typing: debounced call to `/api/weather/search`
  - On selecting a city: fetch current weather + forecast
  - Keyboard accessible: arrow keys to navigate suggestions, Enter to select, Escape to close

### 3.6 Weather Display
- [ ] Create `client/src/components/CurrentWeather/`
  - Shows: city name, temperature (toggle °F/°C), condition text, icon, humidity, wind
  - Loading skeleton while fetching
- [ ] Create `client/src/components/ForecastCard/`
  - 5 cards in a horizontal row (scrollable on mobile)
  - Each card: day name, icon, high/low temps
- [ ] Create `client/src/pages/Dashboard.tsx` — composes SearchBar, CurrentWeather, ForecastCards

### 3.7 Error & Loading States
- [ ] Loading spinner component for data fetches
- [ ] Friendly error messages ("City not found", "Something went wrong, please try again")
- [ ] Empty state when no city is selected yet

### 3.8 Responsive & Accessibility
- [ ] Test layout at mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Ensure all interactive elements have focus indicators
- [ ] ARIA labels on icon-only buttons
- [ ] Semantic HTML (main, nav, section, article for forecast cards)

### Phase 3 Checkpoint
At this point: fully functional weather dashboard with search, current weather, forecast, login/signup, responsive design, keyboard accessible.

---

## Phase 4 — Database & Full Stack (Epic 4)

### 4.1 Database Setup
- [ ] Install `better-sqlite3` and `knex` in server
- [ ] Create `server/knexfile.ts` pointing to `./dev.sqlite3`
- [ ] Create `server/src/db/connection.ts` — Knex instance
- [ ] Create migration: `users` table
- [ ] Create migration: `favorites` table (with country column, unique constraint on user_id + city)
- [ ] Create migration: `search_history` table
- [ ] Create migration: `weather_cache` table
- [ ] Run migrations

### 4.2 Migrate Auth to Database
- [ ] Update `authService.ts` to use Knex queries against `users` table instead of in-memory Map
- [ ] Ensure register checks for duplicate email (handle UNIQUE constraint)
- [ ] Verify login, register, and `/api/auth/me` all work with DB

### 4.3 Favorites Feature
- [ ] Create `server/src/routes/favorites.ts`
  - `GET /api/favorites` — list user's favorites
  - `POST /api/favorites` — add city + country to favorites (handle duplicate with 409)
  - `DELETE /api/favorites/:id` — remove favorite (verify ownership, 404 if not found)
- [ ] All routes protected with auth middleware
- [ ] Create `client/src/components/FavoritesList/`
  - List of favorite cities with star icon
  - Click a favorite to load its weather
  - Unfavorite button on each item
- [ ] Add star/unstar toggle to CurrentWeather display
- [ ] Create `client/src/api/favorites.ts` — `getFavorites()`, `addFavorite(city, country)`, `removeFavorite(id)`

### 4.4 Search History
- [ ] Modify `GET /api/weather/current/:city` — optionally parse auth token (don't require it); if user is authenticated, record search in `search_history`
- [ ] Create `server/src/routes/history.ts` (or add to weather routes)
  - `GET /api/history?limit=10` — return recent searches for current user
- [ ] Create `client/src/components/RecentSearches/`
  - Sidebar showing last 10 searches
  - Click to re-search that city
  - Only visible when logged in
- [ ] Add to Dashboard layout

### 4.5 Weather Cache
- [ ] Create `server/src/services/cacheService.ts`
  - `get(key)` — check `weather_cache`, return data if not expired, null otherwise
  - `set(key, data, ttlMinutes)` — upsert into `weather_cache`
  - `cleanup()` — delete expired entries
- [ ] Integrate into weatherService: check cache before calling OpenWeatherMap
  - Current weather TTL: 10 minutes
  - Forecast TTL: 30 minutes
- [ ] Run `cleanup()` on server startup

### 4.6 End-to-End User Journey
- [ ] Verify complete flow:
  1. User opens app, sees empty dashboard with search bar
  2. Searches for a city, sees current weather + forecast
  3. Signs up / logs in
  4. Stars a city as favorite
  5. Sees favorites in sidebar, clicks one to load weather
  6. Sees recent searches in sidebar
  7. Logs out, favorites and history are no longer visible
  8. Logs back in, favorites and history are restored

### Phase 4 Checkpoint
At this point: complete full-stack application with database persistence, favorites, search history, weather caching, and full user journey working end-to-end.
