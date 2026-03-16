import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeEnv = process.env.NODE_ENV || 'development';

const databasePath =
  nodeEnv === 'production'
    ? process.env.DATABASE_PATH || '/data/weather.db'
    : path.resolve(__dirname, '../dev.sqlite3');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  nodeEnv,
  jwtExpiresIn: '24h',
  useMock: process.env.USE_MOCK === 'true',
  databasePath,
} as const;
