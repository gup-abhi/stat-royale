-- Migration 003: V2 — notification preferences and log

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  enabled    BOOLEAN DEFAULT true,
  player_tag VARCHAR(20),
  PRIMARY KEY (user_id, type)
);

CREATE TABLE IF NOT EXISTS notification_log (
  id      BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type    VARCHAR(50),
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
