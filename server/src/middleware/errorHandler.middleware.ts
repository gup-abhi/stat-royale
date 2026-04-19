import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  InvalidTagError,
  SupercellUnavailableError,
  ValidationError,
  UnauthorisedError,
  ForbiddenError,
  RateLimitedError,
} from '../utils/supercell-errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    return;
  }
  if (err instanceof InvalidTagError) {
    res.status(400).json({ success: false, error: { code: 'INVALID_TAG', message: err.message } });
    return;
  }
  if (err instanceof ValidationError) {
    res
      .status(400)
      .json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    return;
  }
  if (err instanceof UnauthorisedError) {
    res
      .status(401)
      .json({ success: false, error: { code: 'UNAUTHORISED', message: err.message } });
    return;
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
    return;
  }
  if (err instanceof RateLimitedError) {
    res
      .status(429)
      .json({ success: false, error: { code: 'RATE_LIMITED', message: err.message } });
    return;
  }
  if (err instanceof SupercellUnavailableError) {
    res.status(503).json({
      success: false,
      error: { code: 'SUPERCELL_UNAVAILABLE', message: err.message },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res
    .status(500)
    .json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
