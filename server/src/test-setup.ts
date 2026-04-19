process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.REDIS_URL = 'redis://localhost:6379';
