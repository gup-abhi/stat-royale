import 'dotenv/config';
import { pool } from './pool';
import { logger } from '../utils/logger';

// TODO: MVP-001 — fetch cards from Supercell GET /cards and upsert into the cards table

async function seed(): Promise<void> {
  logger.info('Seed script — implement in MVP-001');
  await pool.end();
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
