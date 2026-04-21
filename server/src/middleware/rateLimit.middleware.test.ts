jest.mock('../services/auth.service');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../cache/redis', () => {
  const incr = jest.fn();
  const expire = jest.fn();
  const instance = { incr, expire, on: jest.fn() };
  return { __esModule: true, default: instance, __incr: incr, __expire: expire };
});

import { Request, Response, NextFunction } from 'express';
import redisMock from '../cache/redis';
import { rateLimitMiddleware } from './rateLimit.middleware';
import { RateLimitedError } from '../utils/supercell-errors';
import * as authService from '../services/auth.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockIncr = (redisMock as any).incr as jest.Mock;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockExpire = (redisMock as any).expire as jest.Mock;
const mockVerify = authService.verifyAccessToken as jest.Mock;

function makeReq(opts: { authHeader?: string; ip?: string } = {}): Request {
  return {
    headers: { authorization: opts.authHeader },
    socket: { remoteAddress: opts.ip ?? '1.2.3.4' },
  } as unknown as Request;
}

const res = {} as Response;

// rateLimitMiddleware is [optionalAuth, rateLimitHandler] — run both in sequence
async function runMiddleware(req: Request): Promise<unknown> {
  return new Promise((resolve) => {
    const [optAuth, limiter] = rateLimitMiddleware as Array<
      (req: Request, res: Response, next: NextFunction) => void
    >;
    optAuth(req, res, (err?: unknown) => {
      if (err) { resolve(err); return; }
      limiter(req, res, (err2?: unknown) => resolve(err2));
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockExpire.mockResolvedValue(1);
});

describe('rate limiting — anonymous', () => {
  it('allows request when under limit', async () => {
    mockVerify.mockImplementation(() => { throw new Error(); });
    mockIncr.mockResolvedValue(1);

    const result = await runMiddleware(makeReq());
    expect(result).toBeUndefined();
  });

  it('allows request at exactly the limit (60)', async () => {
    mockVerify.mockImplementation(() => { throw new Error(); });
    mockIncr.mockResolvedValue(60);

    const result = await runMiddleware(makeReq());
    expect(result).toBeUndefined();
  });

  it('blocks request when over limit (61)', async () => {
    mockVerify.mockImplementation(() => { throw new Error(); });
    mockIncr.mockResolvedValue(61);

    const result = await runMiddleware(makeReq());
    expect(result).toBeInstanceOf(RateLimitedError);
  });

  it('sets TTL on first request (incr returns 1)', async () => {
    mockVerify.mockImplementation(() => { throw new Error(); });
    mockIncr.mockResolvedValue(1);

    await runMiddleware(makeReq({ ip: '5.5.5.5' }));
    expect(mockExpire).toHaveBeenCalledWith(expect.stringContaining('rl:ip:5.5.5.5'), 60);
  });

  it('does not reset TTL on subsequent requests', async () => {
    mockVerify.mockImplementation(() => { throw new Error(); });
    mockIncr.mockResolvedValue(5);

    await runMiddleware(makeReq());
    expect(mockExpire).not.toHaveBeenCalled();
  });
});

describe('rate limiting — authenticated', () => {
  it('allows request when under limit (120)', async () => {
    mockVerify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
    mockIncr.mockResolvedValue(1);

    const result = await runMiddleware(makeReq({ authHeader: 'Bearer valid.token' }));
    expect(result).toBeUndefined();
  });

  it('blocks request when over limit (121)', async () => {
    mockVerify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
    mockIncr.mockResolvedValue(121);

    const result = await runMiddleware(makeReq({ authHeader: 'Bearer valid.token' }));
    expect(result).toBeInstanceOf(RateLimitedError);
  });

  it('uses user-scoped key, not IP key', async () => {
    mockVerify.mockReturnValue({ sub: 'user-42', email: 'x@y.com' });
    mockIncr.mockResolvedValue(1);

    await runMiddleware(makeReq({ authHeader: 'Bearer valid.token', ip: '9.9.9.9' }));
    expect(mockIncr).toHaveBeenCalledWith(expect.stringContaining('rl:user:user-42'));
    expect(mockIncr).not.toHaveBeenCalledWith(expect.stringContaining('rl:ip:'));
  });
});
