import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { UnauthorisedError } from '../utils/supercell-errors';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

export interface OptionalAuthRequest extends Request {
  user: { id: string; email: string } | null;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorisedError('Missing access token'));
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    (req as OptionalAuthRequest).user = null;
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    (req as OptionalAuthRequest).user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    (req as OptionalAuthRequest).user = null;
    next();
  }
}
