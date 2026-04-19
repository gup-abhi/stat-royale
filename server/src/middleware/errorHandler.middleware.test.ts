import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler.middleware';
import {
  NotFoundError,
  InvalidTagError,
  SupercellUnavailableError,
  ValidationError,
  UnauthorisedError,
  ForbiddenError,
  RateLimitedError,
} from '../utils/supercell-errors';

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const req = {} as Request;
const next = jest.fn() as NextFunction;

describe('errorHandler middleware', () => {
  afterEach(() => jest.clearAllMocks());

  it('maps NotFoundError → 404 with correct shape', () => {
    const res = makeRes();
    errorHandler(new NotFoundError('Player not found'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Player not found' },
    });
  });

  it('maps InvalidTagError → 400 INVALID_TAG', () => {
    const res = makeRes();
    errorHandler(new InvalidTagError('#BAD'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'INVALID_TAG' }) }),
    );
  });

  it('maps ValidationError → 400 VALIDATION_ERROR', () => {
    const res = makeRes();
    errorHandler(new ValidationError('email is required'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) }),
    );
  });

  it('maps UnauthorisedError → 401 UNAUTHORISED', () => {
    const res = makeRes();
    errorHandler(new UnauthorisedError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'UNAUTHORISED' }) }),
    );
  });

  it('maps ForbiddenError → 403 FORBIDDEN', () => {
    const res = makeRes();
    errorHandler(new ForbiddenError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FORBIDDEN' }) }),
    );
  });

  it('maps RateLimitedError → 429 RATE_LIMITED', () => {
    const res = makeRes();
    errorHandler(new RateLimitedError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'RATE_LIMITED' }) }),
    );
  });

  it('maps SupercellUnavailableError → 503 SUPERCELL_UNAVAILABLE', () => {
    const res = makeRes();
    errorHandler(new SupercellUnavailableError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'SUPERCELL_UNAVAILABLE' }) }),
    );
  });

  it('maps unknown errors → 500 INTERNAL_ERROR without stack trace in body', () => {
    const res = makeRes();
    errorHandler(new Error('something exploded'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body).toEqual({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('response shape always has success:false and error.code + error.message', () => {
    const errors = [
      new NotFoundError('x'),
      new InvalidTagError('#x'),
      new ValidationError('x'),
      new UnauthorisedError(),
      new ForbiddenError(),
      new RateLimitedError(),
      new SupercellUnavailableError(),
      new Error('generic'),
    ];
    for (const err of errors) {
      const res = makeRes();
      errorHandler(err, req, res, next);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(typeof body.error.code).toBe('string');
      expect(typeof body.error.message).toBe('string');
    }
  });
});
