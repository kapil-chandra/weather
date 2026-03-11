import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter, authLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/health.js';
import weatherRoutes from './routes/weather.js';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import historyRoutes from './routes/history.js';
import db from './db/connection.js';
import * as cacheService from './services/cacheService.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(globalLimiter);

app.use('/api/health', healthRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/history', historyRoutes);

app.use(errorHandler);

async function start() {
  await db.migrate.latest();
  const deleted = await cacheService.cleanup();
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} expired cache entries`);
  }
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();
