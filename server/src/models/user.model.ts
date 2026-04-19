import { pool } from '../db/pool';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  fcm_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<UserRow> {
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [email, passwordHash],
  );
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function isTokenBlacklisted(tokenHash: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM refresh_token_blacklist WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash],
  );
  return rows.length > 0;
}

export async function blacklistToken(
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_token_blacklist (token_hash, expires_at)
     VALUES ($1, $2)
     ON CONFLICT (token_hash) DO NOTHING`,
    [tokenHash, expiresAt],
  );
}
