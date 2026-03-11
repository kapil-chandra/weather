import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess } from '../helpers.js';
import db from '../db/connection.js';

const router = Router();

router.use(requireAuth);

const limitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

router.get('/', async (req, res, next) => {
  try {
    const { limit } = limitSchema.parse(req.query);
    const searches = await db('search_history')
      .where({ user_id: req.user!.id })
      .orderBy('searched_at', 'desc')
      .limit(limit);
    sendSuccess(res, { searches });
  } catch (err) {
    next(err);
  }
});

export default router;
