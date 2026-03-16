# Nimbus — Weather Dashboard

A full-stack weather dashboard built with React, Express, and SQLite. Search for any city to view current conditions and a 5-day forecast, save favorites, and track search history.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React 19, Vite 7, TypeScript, CSS Modules |
| Backend    | Express 5, TypeScript, Zod          |
| Database   | SQLite 3 (via better-sqlite3 + Knex) |
| Auth       | JWT + bcrypt                        |
| Weather API| OpenWeatherMap                      |

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- An [OpenWeatherMap API key](https://openweathermap.org/appid) (free tier works)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url> && cd weather

# Install server and client dependencies
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env   # or create manually
```

```env
PORT=3001
JWT_SECRET=change-me-to-a-random-secret
NODE_ENV=development
OPENWEATHERMAP_API_KEY=your-api-key-here
```

### 3. Start the app

Open two terminal windows:

```bash
# Terminal 1 — backend (http://localhost:3001)
cd server
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

The Vite dev server proxies `/api` requests to the backend automatically.

### 4. Open the app

Visit **http://localhost:5173** in your browser.

## Available Scripts

### Client (`client/`)

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server with HMR     |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Run ESLint                         |

### Server (`server/`)

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm run dev` | Start Express with hot-reload (`tsx watch`) |

## Project Structure

```
weather/
├── client/                 # React frontend
│   └── src/
│       ├── api/            # Axios API client modules
│       ├── components/     # Reusable UI components
│       ├── context/        # React context (auth state)
│       ├── hooks/          # Custom hooks (useDebounce)
│       ├── pages/          # Route-level page components
│       └── types/          # Shared TypeScript types
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # API route handlers
│       ├── services/       # Business logic (weather, auth, cache)
│       ├── middleware/      # Auth middleware
│       ├── db/             # Knex migrations
│       └── config.ts       # Environment config
└── docs/                   # Architecture specs
```

## API Endpoints

### Public

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/api/health`               | Health check             |
| GET    | `/api/weather/current/:city`| Current weather for city |
| GET    | `/api/weather/forecast/:city`| 5-day forecast          |
| GET    | `/api/weather/search?q=`    | City search suggestions  |

### Auth

| Method | Endpoint             | Description        |
| ------ | -------------------- | ------------------ |
| POST   | `/api/auth/register` | Create account     |
| POST   | `/api/auth/login`    | Sign in            |
| GET    | `/api/auth/me`       | Get current user   |

### Protected (requires auth)

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/favorites`      | List saved favorites |
| POST   | `/api/favorites`      | Add a favorite city  |
| DELETE | `/api/favorites/:id`  | Remove a favorite    |
| GET    | `/api/history`        | Search history       |

## Production Build

```bash
# Build the frontend
cd client && npm run build
# Output: client/dist/ (static files ready to serve)
```

For production deployment, serve the `client/dist/` directory with a static file server and run the backend behind a reverse proxy. Set `NODE_ENV=production` and use a strong `JWT_SECRET`.
