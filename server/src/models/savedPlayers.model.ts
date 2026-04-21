import { pool } from '../db/pool';
import { SavedPlayer } from '../../../shared/types';

export async function getSavedPlayers(userId: string): Promise<SavedPlayer[]> {
  const { rows } = await pool.query(
    `SELECT player_tag, nickname, saved_at
     FROM saved_players WHERE user_id = $1
     ORDER BY saved_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    playerTag: r.player_tag as string,
    nickname: r.nickname as string | null,
    savedAt: (r.saved_at as Date).toISOString(),
  }));
}

export async function countSavedPlayers(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM saved_players WHERE user_id = $1`,
    [userId],
  );
  return parseInt(rows[0].count as string, 10);
}

export async function savePlayer(
  userId: string,
  playerTag: string,
  nickname: string | null,
): Promise<SavedPlayer> {
  const { rows } = await pool.query(
    `INSERT INTO saved_players (user_id, player_tag, nickname)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, player_tag) DO UPDATE SET nickname = EXCLUDED.nickname
     RETURNING player_tag, nickname, saved_at`,
    [userId, playerTag, nickname ?? null],
  );
  return {
    playerTag: rows[0].player_tag as string,
    nickname: rows[0].nickname as string | null,
    savedAt: (rows[0].saved_at as Date).toISOString(),
  };
}

export async function deleteSavedPlayer(userId: string, playerTag: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM saved_players WHERE user_id = $1 AND player_tag = $2`,
    [userId, playerTag],
  );
  return (rowCount ?? 0) > 0;
}
