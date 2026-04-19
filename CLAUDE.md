# CLAUDE.md — RoyaleStats Project Guide

This file is the primary reference for Claude Code when working on RoyaleStats. Read this before writing any code. For full product detail, see `docs/project_spec.md`. For system design, see `docs/architecture.md`. For task breakdown, see `docs/milestones.md`.

---

## Project Overview

**RoyaleStats** is a mobile app (React Native, iOS + Android) that provides Clash Royale player analytics, deck tools, clan insights, and leaderboard tracking — similar to RoyaleAPI.com. It is backed by a Node.js + Express API, PostgreSQL + Redis, and integrates with the official Supercell Clash Royale API.

**Current milestone: MVP** — see `docs/milestones.md` for active tasks.

---

## Monorepo Structure

```
stat-royale/
├── CLAUDE.md                  ← you are here
├── docs/
│   ├── project_spec.md        ← product requirements and feature specs
│   ├── architecture.md        ← system design, DB schema, folder structure
│   ├── milestones.md          ← task breakdown per milestone
│   └── data_pipeline.md       ← polling jobs and data collection design
├── app/                       ← React Native mobile app
│   ├── src/
│   │   ├── api/               ← API client (Axios instances, endpoint functions)
│   │   ├── components/        ← shared UI components
│   │   ├── screens/           ← one folder per screen
│   │   ├── navigation/        ← React Navigation stack and tab configs
│   │   ├── store/             ← Zustand global state
│   │   ├── hooks/             ← custom React hooks
│   │   ├── utils/             ← formatting, helpers, constants
│   │   └── theme/             ← colours, typography, spacing tokens
│   ├── assets/                ← card images, icons
│   └── App.tsx
├── server/                    ← Node.js + Express backend
│   ├── src/
│   │   ├── routes/            ← Express routers (one file per domain)
│   │   ├── controllers/       ← request handlers
│   │   ├── services/          ← business logic, Supercell API calls
│   │   ├── models/            ← PostgreSQL query functions (no ORM)
│   │   ├── jobs/              ← polling and data pipeline workers
│   │   ├── middleware/        ← auth, rate limiting, error handling
│   │   ├── cache/             ← Redis helpers
│   │   └── db/                ← pg pool, migrations, seeds
│   ├── .env.example
│   └── index.ts
└── shared/                    ← types shared between app and server
    └── types.ts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.74+, TypeScript |
| Navigation | React Navigation v6 (stack + bottom tabs) |
| State | Zustand |
| Data fetching | TanStack Query (React Query) v5 |
| UI components | Custom — see `app/src/theme/` for tokens |
| Backend | Node.js 20 LTS, Express 4, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| DB access | `pg` (node-postgres) — no ORM |
| Auth | JWT (access + refresh tokens) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Ads | Google AdMob (React Native Google Mobile Ads) |
| External API | Supercell Clash Royale API (`https://api.clashroyale.com/v1`) |

---

## Environment Variables

### Server (`server/.env`)
```
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/royalestats
REDIS_URL=redis://localhost:6379
SUPERCELL_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FCM_SERVER_KEY=your_fcm_key
NODE_ENV=development
```

### App (`app/.env`)
```
API_BASE_URL=http://localhost:3000
ADMOB_APP_ID_IOS=your_id
ADMOB_APP_ID_ANDROID=your_id
ADMOB_BANNER_ID=your_id
ADMOB_INTERSTITIAL_ID=your_id
```

---

## Key Conventions

### TypeScript
- Strict mode on everywhere. No `any` — use `unknown` and narrow properly.
- All shared data shapes live in `shared/types.ts`.
- Prefix interfaces with `I` only for non-data types (e.g. `IService`). Data types are plain: `Player`, `Clan`, `Deck`.

### Backend
- No ORM. Write raw SQL in `models/`. Use parameterised queries always — never string interpolation.
- All Supercell API calls go through `server/src/services/supercell.service.ts`. Never call the Supercell API directly from routes or controllers.
- Cache all Supercell API responses in Redis. Default TTL: 2 minutes for player data, 10 minutes for clan data, 1 hour for card list.
- Player tags must be normalised before use: uppercase, strip `#`, trim whitespace.
- All routes are prefixed `/api/v1/`.
- Error responses always follow `{ success: false, error: { code: string, message: string } }`.
- Success responses always follow `{ success: true, data: T }`.

### Mobile app
- Use TanStack Query for all server data. No raw `useEffect` + `fetch`.
- Use Zustand only for truly global client state (auth session, saved players list, theme).
- Every screen is in its own folder: `screens/PlayerProfile/index.tsx` + `screens/PlayerProfile/components/`.
- No inline styles. Use StyleSheet.create() or the theme token system.
- All player tag inputs must normalise on change (uppercase, auto-prepend `#` if missing).

### Database
- Migrations live in `server/src/db/migrations/` and are numbered: `001_initial.sql`, `002_add_trophy_history.sql`.
- Run migrations manually with `npm run db:migrate`.
- Never mutate production data directly — always write a migration.

### Git
- Branch naming: `feature/`, `fix/`, `chore/`
- One feature per branch. Commit messages: `feat:`, `fix:`, `chore:`, `docs:`
- Never commit `.env` files.

---

## Common Commands

```bash
# Install dependencies
cd app && npm install
cd server && npm install

# Start development
cd server && npm run dev        # Express server with ts-node-dev
cd app && npm run start         # Metro bundler
cd app && npm run ios           # Run on iOS simulator
cd app && npm run android       # Run on Android emulator

# Database
cd server && npm run db:migrate      # Run pending migrations
cd server && npm run db:seed         # Seed cards and static data
cd server && npm run db:reset        # Drop and recreate (dev only)

# Jobs (V1+)
cd server && npm run jobs:poll-players   # Start player polling worker
cd server && npm run jobs:poll-clans     # Start clan polling worker

# Testing
cd server && npm test           # Jest
cd app && npm test              # Jest + React Native Testing Library
```

---

## Supercell API Rules

- Base URL: `https://api.clashroyale.com/v1`
- Auth header: `Authorization: Bearer YOUR_KEY`
- Rate limit: ~100 requests/second per key. Stay well under this.
- All player tags in URLs must be URL-encoded: `%23` instead of `#`.
- API keys are IP-whitelisted — use your server IP, not local dev IP in production.
- Handle `503` responses gracefully — the Supercell API goes down sometimes. Return cached data if available, otherwise a clear error.

### Key endpoints used

| Endpoint | Used for |
|---|---|
| `GET /players/{tag}` | Player profile |
| `GET /players/{tag}/battlelog` | Battle log |
| `GET /players/{tag}/upcomingchests` | Chest cycle |
| `GET /clans/{tag}` | Clan info |
| `GET /clans/{tag}/members` | Clan members |
| `GET /clans/{tag}/warlog` | War history |
| `GET /clans/{tag}/currentriverrace` | Current war |
| `GET /clans/{tag}/riverracelog` | River race log |
| `GET /clans?name={name}` | Clan search |
| `GET /locations/global/rankings/players` | Global leaderboard |
| `GET /locations/{id}/rankings/players` | Regional leaderboard |
| `GET /cards` | Full card list |
| `GET /tournaments?name={name}` | Tournament search |
| `GET /globaltournaments` | Global tournaments |

---

## Auth Flow

1. User registers with email + password or signs in.
2. Server returns `accessToken` (15 min) + `refreshToken` (30 days).
3. App stores tokens in secure storage (`react-native-keychain`).
4. All authenticated requests send `Authorization: Bearer {accessToken}`.
5. On 401, the app's Axios interceptor auto-calls `/api/v1/auth/refresh` and retries.
6. On logout, both tokens are invalidated server-side (refresh token blacklisted in Redis).

---

## Ads Strategy (AdMob)

- Banner ad: shown at the bottom of Player Profile, Clan Profile screens.
- Interstitial ad: shown after every 5th deck search. Never on first open.
- Never show ads on loading states or error screens.
- Implement ad-free period: no ads for first 3 days after install (goodwill).
- All ad logic lives in `app/src/hooks/useAds.ts`. Never put AdMob calls directly in screens.

---

## What NOT to do

- Do not call the Supercell API from the mobile app directly. All calls go through our backend.
- Do not use an ORM (Prisma, TypeORM, Sequelize). Write raw SQL.
- Do not store sensitive data (tokens, API keys) in AsyncStorage — use react-native-keychain.
- Do not use `console.log` in production code — use the `logger` utility in `server/src/utils/logger.ts`.
- Do not skip Redis caching for Supercell API responses.
- Do not expose the Supercell API key in any client-side code or public repo.

---

## Current Milestone Focus

**MVP** — 8 features, Supercell API only, no polling jobs needed.

When Claude Code is asked to implement a feature, always check `docs/milestones.md` first to confirm it belongs to the active milestone before building it.

See `docs/milestones.md` for the current task list with acceptance criteria.
