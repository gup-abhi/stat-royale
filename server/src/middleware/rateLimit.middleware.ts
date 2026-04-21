import { Request, Response, NextFunction } from 'express';
import redis from '../cache/redis';
import { RateLimitedError } from '../utils/supercell-errors';
import { OptionalAuthRequest } from './auth.middleware';
import { optionalAuth } from './auth.middleware';

const WINDOW_SECONDS = 60;
const LIMIT_ANON = 60;
const LIMIT_AUTH = 120;

async function checkLimit(key: string, limit: number): Promise<void> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  if (current > limit) {
    throw new RateLimitedError(`Rate limit exceeded. Max ${limit} requests per minute.`);
  }
}

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

async function rateLimitHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = (req as OptionalAuthRequest).user;
    const minute = Math.floor(Date.now() / 60_000);

    if (user) {
      await checkLimit(`rl:user:${user.id}:${minute}`, LIMIT_AUTH);
    } else {
      const ip = getIp(req);
      await checkLimit(`rl:ip:${ip}:${minute}`, LIMIT_ANON);
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Compose optionalAuth + rate limiter so a single app.use() call registers both
export const rateLimitMiddleware = [optionalAuth, rateLimitHandler];
