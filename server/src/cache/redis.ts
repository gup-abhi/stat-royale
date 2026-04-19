import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

export async function get(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function set(key: string, value: string): Promise<void> {
  await redis.set(key, value);
}

export async function setex(key: string, ttlSeconds: number, value: string): Promise<void> {
  await redis.setex(key, ttlSeconds, value);
}

export async function del(key: string): Promise<void> {
  await redis.del(key);
}

export default redis;
