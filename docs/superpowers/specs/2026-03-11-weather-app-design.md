# Weather Application — Architecture Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Author:** Architect Agent

## Revision History

| Rev | Date | Description |
|-----|------|-------------|
| 1.0 | 2026-03-11 | Initial architecture design |
| 1.1 | 2026-03-11 | Spec review fixes: country in favorites, error contracts, type definitions |

---

## 1. Overview

A full-stack weather dashboard that lets users search for weather by city, view current conditions and 5-day forecasts, create accounts, and save favorite cities. Built as a single-developer project prioritizing simplicity and convention.

### Epics

1. **Backend API (Mock Data)** — Express API with mock weather data, auth, error handling
2. **API Integration** — Replace mocks with OpenWeatherMap, add rate limiting, retry, auth middleware
3. **Frontend Dashboard** — React SPA with search, weather display, auth, responsive design
4. **Database + Full Stack** — SQLite persistence for users, favorites, search history, weather cache

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Backend Runtime | Node.js + TypeScript | Industry standard, strong typing |
| Backend Framework | Express 5 | Minimal, well-understood, huge middleware ecosystem |
| Frontend | React 18 + Vite + TypeScript | Fast dev server, simple config |
| Database | SQLite via `better-sqlite3` | Zero config, file-based, no server needed |
| Query Builder | Knex.js | Migrations, seeds, type-safe queries without ORM weight |
| Auth | JWT (`jsonwebtoken` + `bcrypt`) | Stateless, fits API-first design |
| HTTP Client | Axios | Interceptors for auth tokens and retry logic |
| Styling | CSS Modules | Scoped styles, zero extra dependencies, works with Vite |
| Rate Limiting | `express-rate-limit` | Simple middleware, in-memory store |
| Validation | Zod | Runtime validation + TypeScript type inference |

## 3. Project Structure

```
weather/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # API client functions
│   │   │   ├── auth.ts
│   │   │   ├── weather.ts
│   │   │   ├── favorites.ts
│   │   │   └── client.ts       # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── SearchBar/
│   │   │   ├── CurrentWeather/
│   │   │   ├── ForecastCard/
│   │   │   ├── LoginForm/
│   │   │   ├── FavoritesList/
│   │   │   ├── RecentSearches/
│   │   │   └── Layout/
│   │   ├── hooks/              # useAuth, useWeather, useDebounce
│   │   ├── context/            # AuthContext
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── Login.tsx
│   │   ├── types/              # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── weather.ts
│   │   │   ├── auth.ts
│   │   │   └── favorites.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT verification
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── services/
│   │   │   ├── weatherService.ts   # Mock -> OpenWeatherMap
│   │   │   ├── authService.ts
│   │   │   └── cacheService.ts
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── types/
│   │   ├── config.ts           # Env vars, constants
│   │   └── app.ts              # Express app setup
│   ├── knexfile.ts
│   ├── tsconfig.json
│   └── package.json
├── PLAN.md
└── .gitignore
```

### Component Organization

Each component folder contains:
- `ComponentName.tsx` — the component
- `ComponentName.module.css` — scoped styles

## 4. API Endpoint Contracts

### 4.1 Response Envelope

All responses use a consistent JSON shape:

```typescript
// Success
{ "data": T }

// Error
{ "error": { "code": string, "message": string } }
```

HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 429 (rate limited), 500 (server error).

### 4.2 Auth Routes — `/api/auth`

#### POST `/api/auth/register`
**Auth:** None

Request:
```json
{ "email": "user@example.com", "password": "secret123", "name": "Jane" }
```

Response (201):
```json
{
  "data": {
    "user": { "id": 1, "email": "user@example.com", "name": "Jane" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

Validation: email format, password min 8 chars, name non-empty.

#### POST `/api/auth/login`
**Auth:** None

Request:
```json
{ "email": "user@example.com", "password": "secret123" }
```

Response (200): Same shape as register.

Error (401):
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

#### GET `/api/auth/me`
**Auth:** Bearer token required

Response (200):
```json
{ "data": { "user": { "id": 1, "email": "user@example.com", "name": "Jane" } } }
```

### 4.3 Weather Routes — `/api/weather`

#### GET `/api/weather/current/:city`
**Auth:** None (but if a valid Bearer token is present, the search is recorded in search history)

Response (200):
```json
{
  "data": {
    "city": "London",
    "country": "GB",
    "temp_f": 54.5,
    "temp_c": 12.5,
    "description": "Partly cloudy",
    "humidity": 72,
    "wind_mph": 8.5,
    "icon": "02d"
  }
}
```

Error (404):
```json
{ "error": { "code": "CITY_NOT_FOUND", "message": "City 'Xyz' not found" } }
```

#### GET `/api/weather/forecast/:city`
**Auth:** None

Response (200):
```json
{
  "data": {
    "city": "London",
    "country": "GB",
    "forecast": [
      {
        "date": "2026-03-12",
        "high_f": 58.0,
        "high_c": 14.4,
        "low_f": 45.0,
        "low_c": 7.2,
        "description": "Sunny",
        "icon": "01d"
      }
    ]
  }
}
```

#### GET `/api/weather/search?q=lon`
**Auth:** None
**Query:** `q` — minimum 2 characters

Response (200):
```json
{
  "data": {
    "cities": [
      { "name": "London", "country": "GB" },
      { "name": "Long Beach", "country": "US" }
    ]
  }
}
```

Error (400) — query too short:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Search query must be at least 2 characters" } }
```

### 4.4 Favorites Routes — `/api/favorites`

#### GET `/api/favorites`
**Auth:** Bearer token required

Response (200):
```json
{
  "data": {
    "favorites": [
      { "id": 1, "city": "London", "country": "GB", "created_at": "2026-03-11T10:00:00Z" }
    ]
  }
}
```

#### POST `/api/favorites`
**Auth:** Bearer token required

Request:
```json
{ "city": "London", "country": "GB" }
```

Response (201):
```json
{ "data": { "favorite": { "id": 1, "city": "London", "country": "GB", "created_at": "2026-03-11T10:00:00Z" } } }
```

Error (409):
```json
{ "error": { "code": "ALREADY_FAVORITED", "message": "City is already in favorites" } }
```

#### DELETE `/api/favorites/:id`
**Auth:** Bearer token required

Response (200):
```json
{ "data": { "success": true } }
```

Error (404):
```json
{ "error": { "code": "NOT_FOUND", "message": "Favorite not found" } }
```

### 4.5 Search History Routes — `/api/history`

#### GET `/api/history`
**Auth:** Bearer token required
**Query:** `limit` (default 10, max 20)

Response (200):
```json
{
  "data": {
    "searches": [
      { "id": 1, "city": "London", "searched_at": "2026-03-11T10:00:00Z" }
    ]
  }
}
```

Search history is recorded automatically when a logged-in user calls `/api/weather/current/:city`.

### 4.6 Health Check

#### GET `/api/health`
**Auth:** None

Response (200):
```json
{ "data": { "status": "ok", "uptime": 12345.67 } }
```

## 5. Database Schema

### 5.1 Entity Relationship

```
users 1──* favorites
users 1──* search_history
```

### 5.2 Tables

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| email | TEXT | UNIQUE NOT NULL |
| password | TEXT | NOT NULL (bcrypt hash) |
| name | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT datetime('now') |

#### `favorites`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK -> users(id) ON DELETE CASCADE |
| city | TEXT | NOT NULL |
| country | TEXT | NOT NULL DEFAULT '' |
| created_at | TEXT | DEFAULT datetime('now') |
| | | UNIQUE(user_id, city) |

#### `search_history`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK -> users(id) ON DELETE CASCADE |
| city | TEXT | NOT NULL |
| searched_at | TEXT | DEFAULT datetime('now') |

#### `weather_cache`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| cache_key | TEXT | UNIQUE NOT NULL |
| data | TEXT | NOT NULL (JSON string) |
| expires_at | TEXT | NOT NULL (ISO timestamp) |

Cache key format: `current:<city>` or `forecast:<city>`. TTL: 10 minutes for current weather, 30 minutes for forecast.

## 6. Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns a JWT token (expires in 24h) containing `{ id, email }` (where `id` is the user's DB id)
3. Client stores token in localStorage
4. Client attaches token as `Authorization: Bearer <token>` header on protected requests
5. `auth` middleware verifies token and attaches `req.user = { id, email }` to the request
6. Protected routes (favorites, history, `/api/auth/me`) return 401 if token is missing/invalid

**Note:** Token refresh is intentionally out of scope. On expiry, the client clears the token and redirects to login.

## 7. Key Design Decisions

### Weather Service Abstraction
`weatherService.ts` exports an interface. In Phase 1, a mock implementation returns hardcoded data. In Phase 2, it's replaced with OpenWeatherMap calls. The routes never know the difference.

```typescript
interface City {
  name: string;
  country: string;
}

interface CurrentWeather {
  city: string;
  country: string;
  temp_f: number;
  temp_c: number;
  description: string;
  humidity: number;
  wind_mph: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  high_f: number;
  high_c: number;
  low_f: number;
  low_c: number;
  description: string;
  icon: string;
}

interface Forecast {
  city: string;
  country: string;
  forecast: ForecastDay[];
}

interface WeatherService {
  getCurrentWeather(city: string): Promise<CurrentWeather>;
  getForecast(city: string): Promise<Forecast>;
  searchCities(query: string): Promise<City[]>;
}
```

### Cache Strategy
Server-side only. Before calling OpenWeatherMap, check `weather_cache` table. If a non-expired entry exists, return it. Otherwise, fetch from API, store in cache, return result. A simple cleanup query runs on app startup to delete expired entries.

### Error Handling
A global Express error handler catches all thrown errors. Services throw typed errors (e.g., `CityNotFoundError`, `AuthenticationError`) that the handler maps to appropriate HTTP status codes and the standard error envelope.

### Rate Limiting
- Global: 100 requests per 15 minutes per IP
- Auth routes: 10 requests per 15 minutes per IP (brute-force protection)
- Weather search: 30 requests per minute per IP

### Frontend State
- **Auth state:** React Context (`AuthContext`) wrapping the app
- **Weather data:** Local component state via `useState` (no global store needed)
- **Search debounce:** Custom `useDebounce` hook (300ms delay)

## 8. External Dependencies

### Backend (`server/package.json`)
- `express` — web framework
- `cors` — CORS middleware
- `better-sqlite3` — SQLite driver
- `knex` — query builder + migrations
- `jsonwebtoken` — JWT signing/verification
- `bcrypt` — password hashing
- `zod` — request validation
- `axios` — HTTP client (for OpenWeatherMap)
- `express-rate-limit` — rate limiting
- `dotenv` — environment variables
- `tsx` — TypeScript execution for dev
- `typescript` — compiler

### Frontend (`client/package.json`)
- `react` + `react-dom` — UI library
- `react-router-dom` — client-side routing
- `axios` — HTTP client
- `vite` — build tool
- `typescript` — compiler

## 9. Environment Variables

```env
# server/.env
PORT=3001
JWT_SECRET=your-secret-key
OPENWEATHERMAP_API_KEY=your-api-key   # Phase 2
NODE_ENV=development
```

The frontend uses Vite's proxy to forward `/api` requests to `http://localhost:3001` during development, avoiding CORS issues in dev mode.
