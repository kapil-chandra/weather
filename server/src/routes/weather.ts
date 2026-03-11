import { Router } from 'express';
import { z } from 'zod';
import { weatherService } from '../services/weatherService.js';
import { sendSuccess } from '../helpers.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/auth.js';
import db from '../db/connection.js';

const router = Router();

router.get('/current/:city', optionalAuth, async (req, res, next) => {
  try {
    const city = req.params.city as string;
    const data = await weatherService.getCurrentWeather(city);

    // Record search history if user is authenticated
    if (req.user) {
      await db('search_history').insert({ user_id: req.user.id, city: data.city });
    }

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/forecast/:city', async (req, res, next) => {
  try {
    const city = req.params.city as string;
    const data = await weatherService.getForecast(city);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
});

router.get('/search', searchLimiter, async (req, res, next) => {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const cities = await weatherService.searchCities(q);
    sendSuccess(res, { cities });
  } catch (err) {
    next(err);
  }
});

export default router;
