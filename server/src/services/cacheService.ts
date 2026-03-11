import db from '../db/connection.js';

export async function get(key: string): Promise<any | null> {
  const row = await db('weather_cache')
    .where({ cache_key: key })
    .where('expires_at', '>', new Date().toISOString())
    .first();

  return row ? JSON.parse(row.data) : null;
}

export async function set(key: string, data: any, ttlMinutes: number): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const json = JSON.stringify(data);

  const existing = await db('weather_cache').where({ cache_key: key }).first();
  if (existing) {
    await db('weather_cache').where({ cache_key: key }).update({ data: json, expires_at: expiresAt });
  } else {
    await db('weather_cache').insert({ cache_key: key, data: json, expires_at: expiresAt });
  }
}

export async function cleanup(): Promise<number> {
  const deleted = await db('weather_cache')
    .where('expires_at', '<=', new Date().toISOString())
    .delete();
  return deleted;
}
