import { Router } from 'express';
import { z } from 'zod';
import { weatherService } from '../services/weatherService.js';
import { sendSuccess } from '../helpers.js';

const router = Router();

router.get('/current/:city', async (req, res, next) => {
  try {
    const city = req.params.city;
    const data = await weatherService.getCurrentWeather(city);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

router.get('/forecast/:city', async (req, res, next) => {
  try {
    const city = req.params.city;
    const data = await weatherService.getForecast(city);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
});

router.get('/search', async (req, res, next) => {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const cities = await weatherService.searchCities(q);
    sendSuccess(res, { cities });
  } catch (err) {
    next(err);
  }
});

export default router;
