import 'dotenv/config';
import { pool } from './pool';
import { logger } from '../utils/logger';

async function reset(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    logger.error('db:reset must not be run in production');
    process.exit(1);
  }

  await pool.query(`DROP SCHEMA public CASCADE`);
  await pool.query(`CREATE SCHEMA public`);
  logger.info('Database reset complete');
  await pool.end();
}

reset().catch((err) => {
  logger.error(err);
  process.exit(1);
});
