// Variables prefixed with "mock" are hoisted by Jest alongside jest.mock calls
const mockClientGet = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({ get: mockClientGet })),
  isAxiosError: (err: unknown) =>
    !!(err as Record<string, unknown>)?.isAxiosError,
}));

jest.mock('../cache/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import * as redisHelpers from '../cache/redis';
import { NotFoundError, SupercellUnavailableError } from '../utils/supercell-errors';
import * as service from './supercell.service';

const redis = redisHelpers as jest.Mocked<typeof redisHelpers>;

function makeAxiosError(status: number) {
  return Object.assign(new Error(String(status)), {
    isAxiosError: true,
    response: { status, data: { reason: 'error' } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── normaliseTag ─────────────────────────────────────────────────────────────

describe('tag normalisation', () => {
  it('strips # and uppercases before building cache key', async () => {
    const player = { tag: '#ABC123', name: 'Test' };
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue(undefined);
    mockClientGet.mockResolvedValue({ data: player });

    await service.getPlayer('#abc123');
    expect(redis.get).toHaveBeenCalledWith('rs:player:ABC123');
  });
});

// ─── getPlayer ────────────────────────────────────────────────────────────────

describe('getPlayer', () => {
  it('returns cached data without hitting the API', async () => {
    const cached = { tag: '#ABC', name: 'Cached' };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    const result = await service.getPlayer('#ABC');
    expect(result).toEqual(cached);
    expect(mockClientGet).not.toHaveBeenCalled();
  });

  it('fetches from API, caches with 2-min TTL on cache miss', async () => {
    const player = { tag: '#ABC', name: 'Fresh' };
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue(undefined);
    mockClientGet.mockResolvedValue({ data: player });

    const result = await service.getPlayer('#ABC');
    expect(result).toEqual(player);
    expect(redis.setex).toHaveBeenCalledWith('rs:player:ABC', 120, JSON.stringify(player));
  });

  it('throws NotFoundError on 404', async () => {
    redis.get.mockResolvedValue(null);
    mockClientGet.mockRejectedValue(makeAxiosError(404));

    await expect(service.getPlayer('#GONE')).rejects.toThrow(NotFoundError);
  });

  it('returns stale cache on 503 when stale data is available', async () => {
    const stale = { tag: '#ABC', name: 'Stale' };
    redis.get
      .mockResolvedValueOnce(null)                    // fresh key miss
      .mockResolvedValueOnce(JSON.stringify(stale));   // stale key hit

    mockClientGet.mockRejectedValue(makeAxiosError(503));

    const result = await service.getPlayer('#ABC');
    expect(result).toEqual(stale);
  });

  it('throws SupercellUnavailableError on 503 with no stale data', async () => {
    redis.get.mockResolvedValue(null);
    mockClientGet.mockRejectedValue(makeAxiosError(503));

    await expect(service.getPlayer('#ABC')).rejects.toThrow(SupercellUnavailableError);
  });
});

// ─── getCards ─────────────────────────────────────────────────────────────────

describe('getCards', () => {
  it('uses rs:cards key and 1-hour TTL', async () => {
    const cards = [{ id: 1, name: 'Knight' }];
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue(undefined);
    mockClientGet.mockResolvedValue({ data: { items: cards } });

    await service.getCards();
    expect(redis.setex).toHaveBeenCalledWith('rs:cards', 3600, JSON.stringify(cards));
  });
});

// ─── getLeaderboard ───────────────────────────────────────────────────────────

describe('getLeaderboard', () => {
  it('uses global path and cache key for "global"', async () => {
    const items = [{ rank: 1, tag: '#TOP' }];
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue(undefined);
    mockClientGet.mockResolvedValue({ data: { items } });

    await service.getLeaderboard('global');
    expect(mockClientGet).toHaveBeenCalledWith('/locations/global/rankings/players');
    expect(redis.setex).toHaveBeenCalledWith('rs:leaderboard:global', 600, JSON.stringify(items));
  });

  it('uses location path and cache key for a country code', async () => {
    const items = [{ rank: 1, tag: '#TOP' }];
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue(undefined);
    mockClientGet.mockResolvedValue({ data: { items } });

    await service.getLeaderboard('57000249');
    expect(mockClientGet).toHaveBeenCalledWith('/locations/57000249/rankings/players');
    expect(redis.setex).toHaveBeenCalledWith('rs:leaderboard:57000249', 600, JSON.stringify(items));
  });
});
