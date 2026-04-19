# milestones.md — RoyaleStats Task Breakdown

Each task has an ID, description, scope (backend/app/both), and acceptance criteria. Work through tasks in order within each milestone. Do not start V1 tasks until all MVP tasks are marked done.

---

## MVP Milestone — ~8 weeks

**Goal:** A working app that lets anyone look up players, clans, and cards using the Supercell API. No database writes required except for user auth and saved players.

**Status: 🔴 Not started**

---

### Phase 0 — Project Setup

#### MVP-000 — Monorepo scaffold
**Scope:** Both
**Tasks:**
- Create monorepo folder structure as defined in `architecture.md`
- Initialise `server/` with TypeScript, Express, `pg`, `ioredis`, `jsonwebtoken`, `bcrypt`, `zod`
- Initialise `app/` with React Native (TypeScript template), React Navigation v6, TanStack Query v5, Zustand, Axios
- Set up ESLint + Prettier for both packages
- Add `.env.example` files for both packages
- Add base `tsconfig.json` for both packages
- Add `shared/types.ts` with initial empty exports

**Acceptance criteria:**
- `cd server && npm run dev` starts Express on port 3000 with no errors
- `cd app && npm run ios` opens the app on iOS simulator
- TypeScript compiles with no errors in both packages

---

#### MVP-001 — Database setup
**Scope:** Backend
**Tasks:**
- Set up `pg` Pool in `server/src/db/pool.ts`
- Write migration runner script (`npm run db:migrate`)
- Write and run `001_initial.sql` (users, refresh_token_blacklist, saved_players, saved_decks, cards tables)
- Write `npm run db:seed` to populate the `cards` table from Supercell API
- Write `npm run db:reset` for dev use

**Acceptance criteria:**
- `npm run db:migrate` runs `001_initial.sql` idempotently
- `npm run db:seed` populates the cards table with all current Clash Royale cards
- All tables and indexes exist as defined in `architecture.md`

---

#### MVP-002 — Redis setup
**Scope:** Backend
**Tasks:**
- Set up `ioredis` client in `server/src/cache/redis.ts`
- Export `get`, `set`, `setex`, `del` helper functions
- Handle connection errors gracefully (log, don't crash)

**Acceptance criteria:**
- Redis client connects on startup
- `get`/`setex` helpers work correctly in unit tests

---

#### MVP-003 — Supercell API service
**Scope:** Backend
**Tasks:**
- Create `server/src/services/supercell.service.ts`
- Set up Axios instance with base URL and auth header from env
- Implement `normaliseTag(tag: string): string` in `utils/normalise-tag.ts`
  - Strip whitespace, uppercase, remove `#`, handle URL encoding
- Implement `getPlayer(tag)`, `getPlayerBattles(tag)`, `getPlayerChests(tag)`
- Implement `getClan(tag)`, `getClanMembers(tag)`, `getClanWarlog(tag)`
- Implement `searchClans(params)`, `getCards()`, `getLeaderboard(locationId)`
- All methods check Redis first, populate Redis on miss
- Handle `404` → throw typed `NotFoundError`
- Handle `503` → return stale cache if available, else throw `SupercellUnavailableError`

**Acceptance criteria:**
- Calling `getPlayer('#ABC123')` returns player data and caches it
- Second call returns cached data without hitting Supercell API
- `#` and lowercase tags are normalised correctly
- 503 response returns cached data when available

---

#### MVP-004 — Error handling middleware
**Scope:** Backend
**Tasks:**
- Create `errorHandler.middleware.ts` that catches all errors
- Map error types to HTTP status codes and error codes (see `architecture.md`)
- All error responses follow `{ success: false, error: { code, message } }` format
- Log all 5xx errors with stack trace via `logger.ts`

**Acceptance criteria:**
- Throwing `NotFoundError` in any route returns a 404 with correct shape
- Unhandled errors return 500 with `INTERNAL_ERROR` code (no stack trace in response)

---

### Phase 1 — Auth

#### MVP-010 — Auth routes and service
**Scope:** Backend
**Tasks:**
- Implement `POST /api/v1/auth/register` — email + password, bcrypt hash (12 rounds), return tokens
- Implement `POST /api/v1/auth/login` — verify password, return tokens
- Implement `POST /api/v1/auth/logout` — blacklist refresh token in Redis
- Implement `POST /api/v1/auth/refresh` — verify refresh token, check blacklist, return new tokens
- Implement `GET /api/v1/auth/me` — return current user from token
- Validate all inputs with Zod
- Access token: 15 min JWT. Refresh token: 30 day JWT.

**Acceptance criteria:**
- Register with valid email + password → returns 201 with `{ accessToken, refreshToken }`
- Login with wrong password → returns 401
- Refresh with blacklisted token → returns 401
- All inputs validated; invalid email returns 400 with `VALIDATION_ERROR`

---

#### MVP-011 — Auth middleware
**Scope:** Backend
**Tasks:**
- Create `auth.middleware.ts` that extracts and verifies JWT from `Authorization: Bearer` header
- Attaches `req.user = { id, email }` on success
- Returns 401 if token missing or invalid
- Create `optionalAuth.middleware.ts` variant that does not reject unauthenticated requests (attaches `req.user = null`)

**Acceptance criteria:**
- Protected routes return 401 without a valid token
- `optionalAuth` allows through unauthenticated requests with `req.user = null`

---

#### MVP-012 — Auth screens (app)
**Scope:** App
**Tasks:**
- Build `screens/Auth/Login/index.tsx` — email + password form, submit calls `POST /auth/login`
- Build `screens/Auth/Register/index.tsx` — email + password + confirm form
- Store tokens in `react-native-keychain` (not AsyncStorage)
- Build `store/auth.store.ts` with Zustand: `{ user, accessToken, login, logout }`
- Build `navigation/RootNavigator.tsx` — shows Auth stack if not logged in, App stack if logged in
- Build Axios interceptor in `api/client.ts` that auto-refreshes token on 401

**Acceptance criteria:**
- User can register and is navigated to Home screen
- User can log in
- On logout, tokens are cleared and user sees auth screens
- Token refresh happens silently when access token expires

---

### Phase 2 — Core Features

#### MVP-020 — Player profile (backend)
**Scope:** Backend
**Tasks:**
- Implement `GET /api/v1/players/:tag` — returns normalised player data
- Compute `winRate` on the server (wins / (wins + losses))
- Return shaped response — do not pass raw Supercell object directly to the client

**Response shape:**
```typescript
{
  tag: string
  name: string
  level: number            // expLevel
  trophies: number
  bestTrophies: number
  arena: { id: number; name: string }
  wins: number
  losses: number
  threeCrownWins: number
  battleCount: number
  winRate: number          // computed
  starPoints: number
  clan?: { tag: string; name: string; role: string; badgeId: number }
  cards: Array<{ id: number; level: number; count: number; maxLevel: number }>
  currentSeason: { rank?: number; trophies: number; bestTrophies: number }
  bestSeason: { id: string; rank: number; trophies: number }
}
```

**Acceptance criteria:**
- `GET /api/v1/players/%23ABC123` returns correctly shaped data
- Invalid tag format returns 400
- Unknown tag returns 404

---

#### MVP-021 — Player profile (app)
**Scope:** App
**Tasks:**
- Build `screens/PlayerProfile/index.tsx`
- Show all fields from the response shape above
- Pull-to-refresh
- Share button (deep link)
- `components/StatsCard.tsx` — win rate ring, trophy count, battle count
- `components/CardCollection.tsx` — grid of all cards with level badges
- Ad banner at bottom of screen (see ads spec)
- Loading skeleton while data fetches
- Error state if player not found

**Acceptance criteria:**
- Profile loads in < 800ms on a real device
- Pull-to-refresh invalidates the TanStack Query cache and re-fetches
- Error state shows clearly if tag is invalid

---

#### MVP-022 — Battle log (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/players/:tag/battles` — shape and return last 25 battles
- App: `components/BattleLog.tsx` on player profile — show result, time, decks, crowns, opponent
- Filter tabs: All / Ladder / Challenge / War
- Tapping opponent tag navigates to their profile

**Acceptance criteria:**
- Battle list shows correct win/loss colours
- Tapping opponent opens their profile
- Filters work client-side (no re-fetch needed)

---

#### MVP-023 — Chest cycle (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/players/:tag/chests` — return shaped upcoming chests
- App: `components/ChestCycle.tsx` — horizontal scroll of chest icons with position labels

**Acceptance criteria:**
- Shows at least the next 8 chests with correct icons

---

#### MVP-024 — Clan profile (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/clans/:tag` — shaped clan response
- Backend: `GET /api/v1/clans/:tag/members` — member list with roles
- App: `screens/ClanProfile/index.tsx` — clan header, sortable member list
- Ad banner at bottom of screen
- Tapping a member navigates to their player profile

**Acceptance criteria:**
- Member list sorts by trophies, donations, last seen
- Clan badge renders correctly
- Linking from player profile works

---

#### MVP-025 — Clan search (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/clans/search?name=&type=&minTrophies=&location=`
- Require minimum 3 characters for name param
- App: `screens/Search/` — search bar with tabs (Players / Clans)
- Show clan results as a list, tappable to clan profile

**Acceptance criteria:**
- Search with < 3 chars shows inline error, no API call made
- Results appear within 800ms
- Empty state when no results

---

#### MVP-026 — Card database (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/cards` — return all cards from DB (seeded in MVP-001)
- App: `screens/CardDatabase/index.tsx` — filterable grid/list of all cards
- Filters: rarity, elixir cost, type
- Search by name
- Card detail modal with full stats

**Acceptance criteria:**
- All cards display with correct images
- Filters narrow results in real time (client-side)
- Card detail shows all relevant stats

---

#### MVP-027 — Global leaderboard (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET /api/v1/leaderboard/players?location=global`
- Backend: `GET /api/v1/leaderboard/players?location=:code` (country code)
- App: `screens/Leaderboard/index.tsx` — ranked list, global/regional tabs
- Country picker for regional leaderboard
- Tapping a player navigates to their profile

**Acceptance criteria:**
- Top 200 players shown with rank, name, clan, trophies
- Regional filter updates results

---

#### MVP-028 — Saved players (backend + app)
**Scope:** Both
**Tasks:**
- Backend: `GET/POST/DELETE /api/v1/user/saved-players` (auth required)
- App: Home screen shows saved players as quick-access cards
- App: Player profile shows "Save" button (heart icon)
- Unauthenticated users see a prompt to log in when they try to save

**Acceptance criteria:**
- Saving a player appears on Home screen on next load
- Deleting removes from Home screen
- Max 20 saved players enforced server-side (returns 400 if exceeded)

---

### Phase 3 — Polish

#### MVP-030 — Rate limiting
**Scope:** Backend
**Tasks:**
- Implement rate limiting middleware using Redis counters
- Unauthenticated: 60 requests/minute per IP
- Authenticated: 120 requests/minute per user
- Returns 429 with `RATE_LIMITED` error code

---

#### MVP-031 — Analytics and logging
**Scope:** Backend
**Tasks:**
- Set up `logger.ts` using `pino`
- Log all requests with method, path, status, duration
- Log all Supercell API cache misses
- Log all errors with stack trace

---

#### MVP-032 — Ads integration
**Scope:** App
**Tasks:**
- Install `react-native-google-mobile-ads`
- Build `useAds.ts` hook that:
  - Tracks install timestamp in AsyncStorage
  - Returns `{ showBanner: boolean, triggerInterstitial: () => void }`
  - No ads for first 72 hours after install
  - Interstitial fires after every 5th deck search trigger
- Build `components/AdBanner.tsx` — wraps `BannerAd` from AdMob
- Add `AdBanner` to PlayerProfile and ClanProfile screens

---

## V1 Milestone — ~12 weeks after MVP

**Goal:** Add data aggregation, deck tools, stored history, and meta analysis. Requires the polling pipeline to be running.

**Do not start until all MVP tasks are marked complete.**

See `docs/data_pipeline.md` for the full data collection design before implementing any V1 tasks.

### V1-001 — Data pipeline setup
Set up polling jobs for players and clans. See `data_pipeline.md`.

### V1-002 — Trophy history chart
Backend stores snapshots. App shows line chart using Victory Native or Recharts.

### V1-003 — Clan history (join/leave log)
Backend diffs clan snapshots. App shows event log and donation charts.

### V1-004 — Clan war stats
Store and display per-member war performance across the last 10 river races.

### V1-005 — Battle log aggregation
Process stored battle logs into deck usage and win rate tables.

### V1-006 — Deck search
Filter and search deck dataset by included/excluded cards, arena, battle type.

### V1-007 — Popular decks screen
Surface top decks by usage and win rate.

### V1-008 — Meta report
Daily aggregation job. App displays card usage rates and top decks per trophy range.

### V1-009 — Deck builder
Card picker UI, elixir calculator, save to account, share as deep link.

### V1-010 — Card usage stats
Per-card usage rate and win rate trend, derived from battle log aggregations.

---

## V2 Milestone — ~14 weeks after V1

**Goal:** Advanced power features, push notifications, esports, and multi-account support.

**Do not start until all V1 tasks are marked complete.**

### V2-001 — Push notifications (FCM)
Store FCM tokens, implement notification type preferences, send targeted pushes.

### V2-002 — War deck helper
Smart exclusion tool for Clan Wars 2 deck selection.

### V2-003 — Deck matchup tool
Pairwise win rate analysis from stored battle logs.

### V2-004 — Tournament browser
Open tournament search with real-time capacity and time filters.

### V2-005 — Balance change tracker
Season snapshot diffs with before/after card stat view.

### V2-006 — Multi-account support
Up to 5 player accounts per user, with quick switcher on Home screen.

### V2-007 — Esports section
Pro player profiles, CRL standings, GTR leaderboard.

---

## Definition of Done (all tasks)

A task is done when:
1. Feature works end-to-end on both iOS and Android
2. TypeScript compiles with zero errors
3. Error states are handled and shown to the user
4. Loading states are shown while data fetches
5. All API responses are cached in Redis
6. No `console.log` statements in committed code
7. Code follows conventions in `CLAUDE.md`
