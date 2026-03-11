import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { sendSuccess } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const result = await authService.register(email, password, name);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res, next) => {
  try {
    const user = authService.getUserById(req.user!.id);
    if (!user) {
      throw new Error('User not found');
    }
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
});

export default router;
