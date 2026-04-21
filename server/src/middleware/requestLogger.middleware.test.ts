jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { Request, Response, NextFunction } from 'express';
import { requestLogger } from './requestLogger.middleware';
import { logger } from '../utils/logger';

function makeReq(method = 'GET', path = '/api/v1/players/ABC'): Request {
  return { method, path } as unknown as Request;
}

function makeRes(statusCode: number): Response {
  const handlers: Record<string, () => void> = {};
  return {
    statusCode,
    on: (event: string, cb: () => void) => { handlers[event] = cb; },
    emit: (event: string) => handlers[event]?.(),
  } as unknown as Response;
}

function runAndFinish(req: Request, res: Response): void {
  const next = jest.fn() as NextFunction;
  requestLogger(req, res, next);
  expect(next).toHaveBeenCalledWith();
  (res as unknown as { emit: (e: string) => void }).emit('finish');
}

beforeEach(() => jest.clearAllMocks());

it('logs at info level for 2xx responses', () => {
  runAndFinish(makeReq(), makeRes(200));
  expect(logger.info).toHaveBeenCalledWith(
    expect.objectContaining({ method: 'GET', path: '/api/v1/players/ABC', status: 200 }),
  );
});

it('logs at warn level for 4xx responses', () => {
  runAndFinish(makeReq('GET', '/api/v1/missing'), makeRes(404));
  expect(logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({ status: 404 }),
  );
});

it('logs at error level for 5xx responses', () => {
  runAndFinish(makeReq('POST', '/api/v1/auth/login'), makeRes(500));
  expect(logger.error).toHaveBeenCalledWith(
    expect.objectContaining({ status: 500 }),
  );
});

it('includes durationMs in the log entry', () => {
  runAndFinish(makeReq(), makeRes(200));
  const call = (logger.info as jest.Mock).mock.calls[0][0];
  expect(typeof call.durationMs).toBe('number');
});
