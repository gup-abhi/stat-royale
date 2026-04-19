import 'dotenv/config';
import axios from 'axios';
import { pool } from './pool';
import { logger } from '../utils/logger';

interface SupercellCard {
  id: number;
  name: string;
  elixirCost?: number;
  rarity?: string;
  type?: string;
  arena?: number;
  iconUrls?: { medium?: string };
  maxLevel?: number;
}

interface SupercellCardsResponse {
  items: SupercellCard[];
}

async function seed(): Promise<void> {
  const apiKey = process.env.SUPERCELL_API_KEY;
  if (!apiKey) {
    logger.error('SUPERCELL_API_KEY is not set');
    process.exit(1);
  }

  logger.info('Fetching cards from Supercell API...');

  const { data } = await axios.get<SupercellCardsResponse>(
    'https://api.clashroyale.com/v1/cards',
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  const cards = data.items;
  logger.info(`Fetched ${cards.length} cards — upserting into database...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const card of cards) {
      await client.query(
        `INSERT INTO cards (id, name, elixir_cost, rarity, card_type, arena, image_url, max_level, raw_data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name        = EXCLUDED.name,
           elixir_cost = EXCLUDED.elixir_cost,
           rarity      = EXCLUDED.rarity,
           card_type   = EXCLUDED.card_type,
           arena       = EXCLUDED.arena,
           image_url   = EXCLUDED.image_url,
           max_level   = EXCLUDED.max_level,
           raw_data    = EXCLUDED.raw_data,
           updated_at  = NOW()`,
        [
          card.id,
          card.name,
          card.elixirCost ?? null,
          card.rarity ?? null,
          card.type ?? null,
          card.arena ?? null,
          card.iconUrls?.medium ?? null,
          card.maxLevel ?? null,
          JSON.stringify(card),
        ],
      );
    }

    await client.query('COMMIT');
    logger.info(`Seeded ${cards.length} cards successfully`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await pool.end();
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
