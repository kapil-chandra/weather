import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../helpers.js';
import { AppError, NotFoundError } from '../errors.js';
import db from '../db/connection.js';

const router = Router();

router.use(requireAuth);

const addFavoriteSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().default(''),
});

router.get('/', async (req, res, next) => {
  try {
    const favorites = await db('favorites')
      .where({ user_id: req.user!.id })
      .orderBy('created_at', 'desc');
    sendSuccess(res, { favorites });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { city, country } = addFavoriteSchema.parse(req.body);

    const existing = await db('favorites')
      .where({ user_id: req.user!.id, city })
      .first();
    if (existing) {
      throw new AppError(409, 'ALREADY_FAVORITED', 'City is already in favorites');
    }

    const [id] = await db('favorites').insert({ user_id: req.user!.id, city, country });
    const favorite = await db('favorites').where({ id }).first();
    sendSuccess(res, { favorite }, 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const favorite = await db('favorites').where({ id }).first();

    if (!favorite || favorite.user_id !== req.user!.id) {
      throw new NotFoundError('Favorite not found');
    }

    await db('favorites').where({ id }).delete();
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
