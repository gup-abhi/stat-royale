-- Migration 002: V1 — battle logs and polling tables

CREATE TABLE IF NOT EXISTS trophy_history (
  id             BIGSERIAL PRIMARY KEY,
  player_tag     VARCHAR(20) NOT NULL,
  trophies       INTEGER NOT NULL,
  snapshotted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS trophy_history_player_tag_idx ON trophy_history (player_tag, snapshotted_at DESC);

CREATE TABLE IF NOT EXISTS clan_snapshots (
  id             BIGSERIAL PRIMARY KEY,
  clan_tag       VARCHAR(20) NOT NULL,
  snapshot       JSONB NOT NULL,
  snapshotted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clan_snapshots_clan_tag_idx ON clan_snapshots (clan_tag, snapshotted_at DESC);

CREATE TABLE IF NOT EXISTS clan_membership_events (
  id          BIGSERIAL PRIMARY KEY,
  clan_tag    VARCHAR(20) NOT NULL,
  player_tag  VARCHAR(20) NOT NULL,
  player_name VARCHAR(100),
  event_type  VARCHAR(10) CHECK (event_type IN ('join', 'leave')),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clan_membership_events_clan_tag_idx ON clan_membership_events (clan_tag, occurred_at DESC);

CREATE TABLE IF NOT EXISTS battle_logs (
  id              BIGSERIAL PRIMARY KEY,
  player_tag      VARCHAR(20) NOT NULL,
  battle_type     VARCHAR(50),
  battle_time     TIMESTAMPTZ NOT NULL,
  player_deck     JSONB NOT NULL,
  opponent_tag    VARCHAR(20),
  opponent_deck   JSONB,
  player_crowns   INTEGER,
  opponent_crowns INTEGER,
  player_won      BOOLEAN,
  trophy_change   INTEGER,
  arena           INTEGER,
  raw_data        JSONB,
  UNIQUE(player_tag, battle_time)
);
CREATE INDEX IF NOT EXISTS battle_logs_player_tag_idx ON battle_logs (player_tag, battle_time DESC);
CREATE INDEX IF NOT EXISTS battle_logs_battle_type_idx ON battle_logs (battle_type, battle_time DESC);
CREATE INDEX IF NOT EXISTS battle_logs_player_won_idx ON battle_logs (player_won);

CREATE TABLE IF NOT EXISTS tracked_players (
  player_tag     VARCHAR(20) PRIMARY KEY,
  last_polled_at TIMESTAMPTZ,
  last_seen_at   TIMESTAMPTZ,
  priority       INTEGER DEFAULT 1
);
