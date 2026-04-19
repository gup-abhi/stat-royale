jest.mock('ioredis', () => {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, { value });
    }),
    setex: jest.fn(async (key: string, ttl: number, value: string) => {
      store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    _store: store,
  }));
});

import { get, set, setex, del } from './redis';

describe('redis helpers', () => {
  it('set and get round-trip', async () => {
    await set('test:key', 'hello');
    expect(await get('test:key')).toBe('hello');
  });

  it('get returns null for missing key', async () => {
    expect(await get('test:missing')).toBeNull();
  });

  it('setex stores value retrievable within TTL', async () => {
    await setex('test:ttl', 60, 'world');
    expect(await get('test:ttl')).toBe('world');
  });

  it('del removes a key', async () => {
    await set('test:del', 'bye');
    await del('test:del');
    expect(await get('test:del')).toBeNull();
  });
});
