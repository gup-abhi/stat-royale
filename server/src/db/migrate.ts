import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { logger } from '../utils/logger';

async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT id FROM migrations WHERE filename = $1', [file]);
    if (rows.length > 0) {
      logger.info(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    logger.info(`Applied ${file}`);
  }

  await pool.end();
  logger.info('Migrations complete');
}

migrate().catch((err) => {
  logger.error(err);
  process.exit(1);
});
