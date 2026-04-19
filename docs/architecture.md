# architecture.md — RoyaleStats System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│  (iOS + Android, TanStack Query, Zustand, React Navigation) │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js + Express API                      │
│                  /api/v1/* routes                           │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth       │  │  Supercell   │  │  Polling Jobs    │  │
│  │  Middleware │  │  Service     │  │  (V1+)           │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└──────────┬──────────────────┬────────────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐ ┌──────────────────────────────────────┐
│   PostgreSQL 16  │ │   Redis 7                            │
│                  │ │                                      │
│  - users         │ │  - Supercell API response cache      │
│  - saved_players │ │  - Rate limit counters               │
│  - saved_decks   │ │  - Refresh token blacklist           │
│  - trophy_history│ │  - Session data                      │
│  - clan_snapshots│ │                                      │
│  - battle_logs   │ │                                      │
│  - cards (static)│ │                                      │
└──────────────────┘ └──────────────────────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────┐
                  │  Supercell Clash Royale  │
                  │  Official API            │
                  │  api.clashroyale.com/v1  │
                  └──────────────────────────┘
```

---

## Backend Folder Structure (server/)

```
server/
├── src/
│   ├── index.ts                   ← app entry, Express setup
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── players.routes.ts
│   │   ├── clans.routes.ts
│   │   ├── cards.routes.ts
│   │   ├── decks.routes.ts        ← V1
│   │   ├── leaderboard.routes.ts
│   │   ├── tournaments.routes.ts  ← V2
│   │   └── notifications.routes.ts ← V2
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── players.controller.ts
│   │   ├── clans.controller.ts
│   │   ├── cards.controller.ts
│   │   ├── decks.controller.ts
│   │   └── leaderboard.controller.ts
│   ├── services/
│   │   ├── supercell.service.ts   ← all Supercell API calls live here
│   │   ├── auth.service.ts
│   │   ├── players.service.ts
│   │   ├── clans.service.ts
│   │   ├── decks.service.ts       ← V1
│   │   └── meta.service.ts        ← V1
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── player.model.ts
│   │   ├── clan.model.ts
│   │   ├── deck.model.ts
│   │   ├── battlelog.model.ts     ← V1
│   │   └── trophy_history.model.ts ← V1
│   ├── jobs/                      ← V1+
│   │   ├── poll-players.job.ts
│   │   ├── poll-clans.job.ts
│   │   └── aggregate-meta.job.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── errorHandler.middleware.ts
│   ├── cache/
│   │   └── redis.ts               ← Redis client + get/set/del helpers
│   ├── db/
│   │   ├── pool.ts                ← pg Pool instance
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql
│   │   │   ├── 002_battle_logs.sql      ← V1
│   │   │   └── 003_notifications.sql   ← V2
│   │   └── seeds/
│   │       └── cards.sql
│   └── utils/
│       ├── logger.ts
│       ├── normalise-tag.ts       ← #ABC123 normalisation
│       ├── paginate.ts
│       └── supercell-errors.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## App Folder Structure (app/)

```
app/
├── src/
│   ├── api/
│   │   ├── client.ts             ← Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── players.api.ts
│   │   ├── clans.api.ts
│   │   ├── cards.api.ts
│   │   ├── decks.api.ts
│   │   └── leaderboard.api.ts
│   ├── screens/
│   │   ├── Home/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   ├── PlayerProfile/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   │       ├── StatsCard.tsx
│   │   │       ├── CardCollection.tsx
│   │   │       ├── BattleLog.tsx
│   │   │       └── ChestCycle.tsx
│   │   ├── ClanProfile/
│   │   ├── CardDatabase/
│   │   ├── DeckSearch/            ← V1
│   │   ├── DeckBuilder/           ← V1
│   │   ├── Leaderboard/
│   │   ├── Search/
│   │   ├── Settings/
│   │   └── Auth/
│   │       ├── Login/
│   │       └── Register/
│   ├── navigation/
│   │   ├── RootNavigator.tsx      ← auth gate
│   │   ├── AppNavigator.tsx       ← bottom tabs
│   │   └── types.ts               ← typed route params
│   ├── components/
│   │   ├── CardImage.tsx
│   │   ├── PlayerTag.tsx
│   │   ├── TrophyBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorState.tsx
│   │   ├── EmptyState.tsx
│   │   └── AdBanner.tsx
│   ├── store/
│   │   ├── auth.store.ts          ← user session
│   │   └── savedPlayers.store.ts  ← locally saved players list
│   ├── hooks/
│   │   ├── usePlayer.ts
│   │   ├── useClan.ts
│   │   ├── useAds.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── format-tag.ts
│   │   ├── format-number.ts
│   │   └── time-ago.ts
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
├── assets/
│   ├── cards/                     ← card image assets
│   └── icons/
├── App.tsx
└── package.json
```

---

## Database Schema (PostgreSQL)

### MVP tables (migration 001)

```sql
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
  cards      JSONB NOT NULL,         -- array of 8 card ids
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
  raw_data      JSONB,               -- full Supercell card object
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### V1 additions (migration 002)

```sql
-- Trophy history snapshots (polled every 6 hours)
CREATE TABLE trophy_history (
  id          BIGSERIAL PRIMARY KEY,
  player_tag  VARCHAR(20) NOT NULL,
  trophies    INTEGER NOT NULL,
  snapshotted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON trophy_history (player_tag, snapshotted_at DESC);

-- Clan membership snapshots (polled every 15 minutes)
CREATE TABLE clan_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  clan_tag    VARCHAR(20) NOT NULL,
  snapshot    JSONB NOT NULL,         -- full members array
  snapshotted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON clan_snapshots (clan_tag, snapshotted_at DESC);

-- Clan join/leave event log (derived from clan snapshot diffs)
CREATE TABLE clan_membership_events (
  id          BIGSERIAL PRIMARY KEY,
  clan_tag    VARCHAR(20) NOT NULL,
  player_tag  VARCHAR(20) NOT NULL,
  player_name VARCHAR(100),
  event_type  VARCHAR(10) CHECK (event_type IN ('join', 'leave')),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON clan_membership_events (clan_tag, occurred_at DESC);

-- Battle logs (stored from polling, used for deck analytics)
CREATE TABLE battle_logs (
  id              BIGSERIAL PRIMARY KEY,
  player_tag      VARCHAR(20) NOT NULL,
  battle_type     VARCHAR(50),
  battle_time     TIMESTAMPTZ NOT NULL,
  player_deck     JSONB NOT NULL,     -- array of 8 card ids
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
CREATE INDEX ON battle_logs (player_tag, battle_time DESC);
CREATE INDEX ON battle_logs (battle_type, battle_time DESC);
CREATE INDEX ON battle_logs (player_won);

-- Tracked players (players we actively poll)
CREATE TABLE tracked_players (
  player_tag      VARCHAR(20) PRIMARY KEY,
  last_polled_at  TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ,
  priority        INTEGER DEFAULT 1  -- higher = poll more often
);
```

### V2 additions (migration 003)

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  type              VARCHAR(50) NOT NULL,
  enabled           BOOLEAN DEFAULT true,
  player_tag        VARCHAR(20),       -- for player-specific notifications
  PRIMARY KEY (user_id, type)
);

-- Notification log
CREATE TABLE notification_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  type       VARCHAR(50),
  payload    JSONB,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Caching Strategy (Redis)

All cache keys are prefixed with `rs:` (RoyaleStats).

| Key pattern | TTL | Contents |
|---|---|---|
| `rs:player:{tag}` | 2 min | Full Supercell player response |
| `rs:player:{tag}:battles` | 2 min | Battle log response |
| `rs:player:{tag}:chests` | 5 min | Upcoming chests response |
| `rs:clan:{tag}` | 10 min | Full Supercell clan response |
| `rs:clan:{tag}:members` | 10 min | Clan members list |
| `rs:clan:{tag}:warlog` | 10 min | War log |
| `rs:leaderboard:global` | 10 min | Global top 200 players |
| `rs:leaderboard:{locationId}` | 10 min | Regional leaderboard |
| `rs:cards` | 24 hr | Full card list |
| `rs:meta:report` | 1 hr | Aggregated meta report (V1) |
| `rs:decks:popular` | 1 hr | Popular decks list (V1) |
| `rs:ratelimit:{ip}` | 1 min | Rate limit counter |
| `rs:blacklist:{tokenHash}` | until exp | Blacklisted refresh tokens |

---

## API Routes Reference

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
```

### Players
```
GET    /api/v1/players/:tag              ← player profile
GET    /api/v1/players/:tag/battles      ← battle log
GET    /api/v1/players/:tag/chests       ← chest cycle
GET    /api/v1/players/:tag/history      ← trophy history (V1)
```

### Clans
```
GET    /api/v1/clans/:tag                ← clan profile
GET    /api/v1/clans/:tag/members        ← member list
GET    /api/v1/clans/:tag/warlog         ← war history
GET    /api/v1/clans/:tag/history        ← join/leave log (V1)
GET    /api/v1/clans/search?name=&type=  ← clan search
```

### Cards
```
GET    /api/v1/cards                     ← all cards
GET    /api/v1/cards/:id                 ← single card
GET    /api/v1/cards/:id/stats           ← usage/win rate stats (V1)
```

### Decks (V1)
```
GET    /api/v1/decks/popular
GET    /api/v1/decks/search?include=&exclude=&type=&arena=
GET    /api/v1/decks/leaderboard
POST   /api/v1/decks/saved               ← save a deck (auth required)
GET    /api/v1/decks/saved               ← get saved decks (auth required)
DELETE /api/v1/decks/saved/:id
```

### Leaderboard
```
GET    /api/v1/leaderboard/players?location=global
GET    /api/v1/leaderboard/players?location=:countryCode
```

### User (auth required)
```
GET    /api/v1/user/saved-players
POST   /api/v1/user/saved-players
DELETE /api/v1/user/saved-players/:tag
PATCH  /api/v1/user/profile
```

### Tournaments (V2)
```
GET    /api/v1/tournaments/open
GET    /api/v1/tournaments/global
```

---

## Supercell API Service Pattern

All Supercell API calls must go through `supercell.service.ts`. This service:
1. Normalises the tag (uppercase, URL-encodes `#` as `%23`)
2. Checks Redis for a cached response
3. If cached, returns cached data
4. If not cached, calls the Supercell API
5. On success, stores response in Redis with appropriate TTL
6. On `503` (API down), returns cached data if available, otherwise throws
7. Logs all cache misses and API errors

```typescript
// Pattern every service method must follow
async function getPlayer(tag: string): Promise<SupercellPlayer> {
  const normalisedTag = normaliseTag(tag);
  const cacheKey = `rs:player:${normalisedTag}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const data = await supercellClient.get(`/players/%23${normalisedTag}`);
  await redis.setex(cacheKey, 120, JSON.stringify(data));
  return data;
}
```

---

## Authentication Flow Detail

```
Register:
  POST /auth/register { email, password }
  → hash password (bcrypt, 12 rounds)
  → insert user row
  → return { accessToken, refreshToken }

Login:
  POST /auth/login { email, password }
  → compare hash
  → return { accessToken, refreshToken }

Authenticated request:
  Header: Authorization: Bearer {accessToken}
  → auth middleware verifies JWT
  → attaches req.user = { id, email }

Token refresh:
  POST /auth/refresh { refreshToken }
  → verify refresh token
  → check not in blacklist (Redis)
  → return new { accessToken, refreshToken }
  → blacklist old refresh token

Logout:
  POST /auth/logout { refreshToken }
  → hash refresh token
  → store hash in Redis blacklist until expiry
```

---

## Error Response Format

All errors follow this shape:

```json
{
  "success": false,
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "No player found with tag #ABC123"
  }
}
```

Standard error codes:

| Code | HTTP | Meaning |
|---|---|---|
| `PLAYER_NOT_FOUND` | 404 | Supercell returned 404 for this player tag |
| `CLAN_NOT_FOUND` | 404 | Supercell returned 404 for this clan tag |
| `INVALID_TAG` | 400 | Tag format is invalid |
| `SUPERCELL_UNAVAILABLE` | 503 | Supercell API is down |
| `RATE_LIMITED` | 429 | Client is sending too many requests |
| `UNAUTHORISED` | 401 | Missing or invalid access token |
| `FORBIDDEN` | 403 | Valid token but insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request body / query param validation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Performance Targets

| Metric | Target |
|---|---|
| Cached API response | < 100ms |
| Uncached API response (Supercell + DB) | < 800ms |
| Deck search query | < 300ms |
| Meta report generation | < 500ms |
| DB query (with index) | < 50ms |

---

## Hosting Notes (TBD)

The architecture is platform-agnostic. Recommended options for a solo developer:

| Option | Pros | Cons |
|---|---|---|
| Railway | Simple deploy, managed Postgres + Redis included, cheap | Less control |
| Render | Free tier for early testing, easy scaling | Slower cold starts on free tier |
| Fly.io | Fast global edge, great for latency | More config needed |
| AWS (EC2 + RDS + ElastiCache) | Full control, scales to anything | Complex, expensive early on |

**Recommendation for MVP:** Start on Railway or Render. Migrate to AWS or Fly.io when you need more control.
