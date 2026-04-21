import { pool } from '../db/pool';
import { Card } from '../../../shared/types';

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as number,
    name: row.name as string,
    elixirCost: (row.elixir_cost as number) ?? 0,
    rarity: (row.rarity as Card['rarity']) ?? 'common',
    cardType: (row.card_type as Card['cardType']) ?? 'troop',
    arena: (row.arena as number) ?? 0,
    iconUrl: (row.image_url as string) ?? '',
    maxLevel: (row.max_level as number) ?? 14,
  };
}

export async function getAllCards(): Promise<Card[]> {
  const { rows } = await pool.query(
    `SELECT id, name, elixir_cost, rarity, card_type, arena, image_url, max_level
     FROM cards
     ORDER BY elixir_cost ASC NULLS LAST, name ASC`,
  );
  return rows.map(rowToCard);
}

export async function getCardById(id: number): Promise<Card | null> {
  const { rows } = await pool.query(
    `SELECT id, name, elixir_cost, rarity, card_type, arena, image_url, max_level
     FROM cards WHERE id = $1`,
    [id],
  );
  return rows.length > 0 ? rowToCard(rows[0]) : null;
}

export async function countCards(): Promise<number> {
  const { rows } = await pool.query('SELECT COUNT(*) FROM cards');
  return parseInt(rows[0].count as string, 10);
}
