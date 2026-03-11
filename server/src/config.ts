import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: '24h',
  owmApiKey: process.env.OPENWEATHERMAP_API_KEY || '',
  owmBaseUrl: 'https://api.openweathermap.org',
} as const;
