import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';
import { AuthError } from '../errors.js';
import { JwtPayload } from '../types/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('Authentication required');
  }

  const token = header.slice(7);
  req.user = verifyToken(token);
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      // Token invalid — proceed without user
    }
  }
  next();
}
