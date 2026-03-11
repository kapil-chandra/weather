import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User, SafeUser, JwtPayload, AuthResult } from '../types/auth.js';
import { AuthError, ValidationError } from '../errors.js';

const users = new Map<string, User>();
let nextId = 1;

function toSafeUser(user: User): SafeUser {
  return { id: user.id, email: user.email, name: user.name };
}

function generateToken(user: User): string {
  const payload: JwtPayload = { id: user.id, email: user.email };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  if (users.has(email)) {
    throw new ValidationError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user: User = { id: nextId++, email, password: hashedPassword, name };
  users.set(email, user);

  return { user: toSafeUser(user), token: generateToken(user) };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = users.get(email);
  if (!user) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return { user: toSafeUser(user), token: generateToken(user) };
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export function getUserById(id: number): SafeUser | undefined {
  for (const user of users.values()) {
    if (user.id === id) {
      return toSafeUser(user);
    }
  }
  return undefined;
}
