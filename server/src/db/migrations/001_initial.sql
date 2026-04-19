-- Migration 001: Initial schema

-- Users (auth)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  fcm_token     VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh token blacklist (invalidated on logout)
CREATE TABLE refresh_token_blacklist (
  token_hash  VARCHAR(64) PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON refresh_token_blacklist (expires_at);

-- Saved players (per user)
CREATE TABLE saved_players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  player_tag  VARCHAR(20) NOT NULL,
  nickname    VARCHAR(100),
  saved_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_tag)
);
CREATE INDEX ON saved_players (user_id);

-- Saved decks (per user, V1 but schema added in MVP)
CREATE TABLE saved_decks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100),
  cards      JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON saved_decks (user_id);

-- Cards static data (seeded from Supercell API)
CREATE TABLE cards (
  id            INTEGER PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  elixir_cost   INTEGER,
  rarity        VARCHAR(50),
  card_type     VARCHAR(50),
  arena         INTEGER,
  image_url     VARCHAR(255),
  max_level     INTEGER,
  raw_data      JSONB,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
