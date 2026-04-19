-- Migration 001: Initial schema
-- No auth. The app saves player tags locally on-device.
-- Backend is a caching proxy to the Supercell API.
-- The only persistent data is the static cards table seeded from Supercell.

CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  elixir_cost INTEGER,
  rarity      VARCHAR(50),
  card_type   VARCHAR(50),
  arena       INTEGER,
  image_url   VARCHAR(255),
  max_level   INTEGER,
  raw_data    JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
