jest.mock('../services/auth.service');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, AuthenticatedRequest, OptionalAuthRequest } from './auth.middleware';
import * as authService from '../services/auth.service';
import { UnauthorisedError } from '../utils/supercell-errors';

const mockVerify = authService.verifyAccessToken as jest.Mock;

function makeReq(authHeader?: string): Request {
  return { headers: { authorization: authHeader } } as unknown as Request;
}

const res = {} as Response;

describe('requireAuth', () => {
  it('attaches user and calls next on valid token', () => {
    mockVerify.mockReturnValue({ sub: 'user-1', email: 'a@b.com' });
    const req = makeReq('Bearer valid.token.here');
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', email: 'a@b.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(UnauthorisedError) when no token', () => {
    const req = makeReq();
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorisedError));
  });

  it('calls next(UnauthorisedError) when token is invalid', () => {
    mockVerify.mockImplementation(() => { throw new UnauthorisedError(); });
    const req = makeReq('Bearer bad.token');
    const next = jest.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorisedError));
  });
});

describe('optionalAuth', () => {
  it('attaches user on valid token', () => {
    mockVerify.mockReturnValue({ sub: 'user-2', email: 'c@d.com' });
    const req = makeReq('Bearer valid.token.here');
    const next = jest.fn() as NextFunction;

    optionalAuth(req, res, next);

    expect((req as OptionalAuthRequest).user).toEqual({ id: 'user-2', email: 'c@d.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('sets user to null and calls next when no token', () => {
    const req = makeReq();
    const next = jest.fn() as NextFunction;

    optionalAuth(req, res, next);

    expect((req as OptionalAuthRequest).user).toBeNull();
    expect(next).toHaveBeenCalledWith();
  });

  it('sets user to null and calls next (no error) when token is invalid', () => {
    mockVerify.mockImplementation(() => { throw new UnauthorisedError(); });
    const req = makeReq('Bearer bad.token');
    const next = jest.fn() as NextFunction;

    optionalAuth(req, res, next);

    expect((req as OptionalAuthRequest).user).toBeNull();
    expect(next).toHaveBeenCalledWith();
  });
});
