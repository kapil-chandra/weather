import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { SafeUser, JwtPayload, AuthResult } from '../types/auth.js';
import { AuthError, ValidationError } from '../errors.js';
import db from '../db/connection.js';

function toSafeUser(row: any): SafeUser {
  return { id: row.id, email: row.email, name: row.name };
}

function generateToken(user: SafeUser): string {
  const payload: JwtPayload = { id: user.id, email: user.email };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw new ValidationError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [id] = await db('users').insert({ email, password: hashedPassword, name });

  const user: SafeUser = { id, email, name };
  return { user, token: generateToken(user) };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const row = await db('users').where({ email }).first();
  if (!row) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, row.password);
  if (!valid) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const user = toSafeUser(row);
  return { user, token: generateToken(user) };
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export async function getUserById(id: number): Promise<SafeUser | undefined> {
  const row = await db('users').where({ id }).first();
  return row ? toSafeUser(row) : undefined;
}
