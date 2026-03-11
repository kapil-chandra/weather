import { Router } from 'express';
import { sendSuccess } from '../helpers.js';

const router = Router();

router.get('/', (_req, res) => {
  sendSuccess(res, { status: 'ok', uptime: process.uptime() });
});

export default router;
