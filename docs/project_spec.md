# project_spec.md — RoyaleStats Product Specification

## Product Summary

RoyaleStats is a mobile app for Clash Royale players on iOS and Android. It provides player profile analytics, deck discovery tools, clan management insights, and leaderboards — inspired by RoyaleAPI.com. It is free to use and supported by non-intrusive ads. Users can create accounts to save favourite players and receive push notifications.

---

## Target Users

- **Casual players** — want to check their stats, upcoming chests, and find a better deck.
- **Competitive players** — want meta analysis, leaderboard tracking, win rate data, and war deck help.
- **Clan leaders** — want to monitor member activity, donation history, and war participation.

---

## Core Principles

1. **Fast** — all screens should feel instant. Use aggressive caching and optimistic UI.
2. **Accurate** — data should never be stale beyond 2 minutes for player info.
3. **Simple first** — surface the most important stat prominently. Don't overwhelm with numbers.
4. **Mobile-native** — not a web wrapper. Gestures, native navigation, platform conventions.

---

## Milestone Overview

| Milestone | Theme | Timeline |
|---|---|---|
| MVP | Core lookup features, Supercell API only | 8 weeks |
| V1 | Analytics, deck tools, stored history | 12 weeks |
| V2 | Power features, notifications, esports | 14 weeks |

---

## MVP Feature Specifications

### 1. Player Profile

**Purpose:** Let a user look up any Clash Royale player by tag and see their full profile.

**Entry points:**
- Search bar on the Home screen
- Tapping a player tag anywhere in the app

**Data displayed:**
- Name, player tag, level (King Tower level)
- Current trophies and best trophies (personal best)
- Current arena / league badge
- Wins, losses, 3-crown wins, battle count
- Win rate percentage (calculated: wins / (wins + losses))
- Star points, clan role if in a clan
- Card collection: all cards with level and count owned
- Current season stats and best season stats

**UX behaviour:**
- Player tag input normalises automatically (uppercase, `#` prepended if missing)
- Recent searches saved locally (last 10, ordered by most recent)
- Pull-to-refresh to reload data
- Share button — copies a deep link like `royalestats://player/PLAYERTAG`

**API:** `GET /api/v1/players/:tag`
**Cache TTL:** 2 minutes in Redis

---

### 2. Battle Log

**Purpose:** Show a player's last 25 battles with full detail.

**Data displayed per battle:**
- Win / loss badge
- Battle type (ladder, challenge, clan war, friendly)
- Time elapsed since battle
- Player's deck (8 cards with levels) vs opponent's deck
- Crowns won/lost by each side
- Opponent name and tag (tappable to view their profile)

**UX behaviour:**
- Lazy-loaded card images
- Tapping a deck card shows a brief card info popup
- Filter tabs: All / Ladder / Challenge / War

**API:** `GET /api/v1/players/:tag/battles`
**Cache TTL:** 2 minutes

---

### 3. Chest Cycle

**Purpose:** Show a player's upcoming chests in order.

**Data displayed:**
- Next 8 upcoming chests with chest type and position in cycle
- Visual chest icons (Silver, Gold, Magical, Giant, Epic, Legendary, etc.)
- Chests per day estimate (based on game averages)

**API:** `GET /api/v1/players/:tag/chests`
**Cache TTL:** 5 minutes

---

### 4. Clan Profile

**Purpose:** Let a user look up any clan by tag or search by name.

**Data displayed:**
- Clan name, tag, description, badge, location
- Trophy requirement, type (open/invite/closed), member count
- Clan score / war trophies
- Member list: name, role, trophies, last seen, donations given/received
- Member list sortable by: trophies, donations, last seen

**Entry points:**
- Search by name from Home screen
- Tapping a player's clan link on their profile

**API:** `GET /api/v1/clans/:tag`, `GET /api/v1/clans/search?name=`
**Cache TTL:** 10 minutes

---

### 5. Card Database

**Purpose:** Full browsable list of all Clash Royale cards with stats.

**Data displayed per card:**
- Card name, image, rarity, elixir cost, type (troop/spell/building)
- Max level, damage, HP, hit speed, range, deploy time (where applicable)
- Evolution info if applicable

**Filters:**
- By rarity (Common, Rare, Epic, Legendary, Champion)
- By elixir cost
- By type (Troop, Spell, Building)
- Search by name

**Data source:** `GET /cards` from Supercell API, cached for 24 hours. Supplemented with static JSON for stats not in the API.

**API:** `GET /api/v1/cards`
**Cache TTL:** 24 hours

---

### 6. Global Leaderboard

**Purpose:** Show the top players worldwide and by region.

**Data displayed:**
- Rank, player name, clan name, trophies, league badge
- Tabs: Global / by Region (country selector)

**UX behaviour:**
- Shows top 200 players
- Tap a player to go to their profile

**API:** `GET /api/v1/leaderboard/players?location=global`
**Cache TTL:** 10 minutes

---

### 7. Player Search & Saved Players

**Purpose:** Let users search for players and save favourites.

**Behaviour:**
- Search by tag (instant lookup)
- Recent searches list (stored locally, last 10)
- Saved players list (stored in backend, linked to account — up to 20 in MVP)
- Saved players shown on Home screen for quick access

**Auth requirement:** Saving players requires a logged-in account.

---

### 8. Clan Search

**Purpose:** Find clans to join or track.

**Filters:**
- Name (minimum 3 characters)
- Minimum trophies
- Type: All / Open / Invite Only / Closed
- Location

**Data displayed in results:**
- Clan badge, name, tag, member count, trophies, type

**API:** `GET /api/v1/clans/search`
**Cache TTL:** 5 minutes

---

## V1 Feature Specifications

### 9. Deck Search

**Purpose:** Find decks used by real players, filterable by card inclusion/exclusion, arena, and battle type.

**Filters:**
- Include up to 8 specific cards
- Exclude up to 8 specific cards
- Battle type (ladder, challenge, clan war)
- Arena / trophy range
- Sort by: popularity, win rate, elixir average

**Data displayed per deck:**
- 8 card thumbnails with levels
- Elixir average, usage count, win rate
- Example player who used it (tappable)

**Data source:** Aggregated from stored battle logs in our DB. Refreshed every hour.

---

### 10. Popular Decks

**Purpose:** Surface the most-used and highest win rate decks in the current meta.

**Tabs:** Popular / Top Win Rate / Leaderboard / Random

**Filters:** Trophy range, game mode

**Data source:** Our battle log aggregation pipeline (V1 data pipeline).

---

### 11. Trophy History

**Purpose:** Show a player's trophy progression over time as a chart.

**Chart type:** Line chart, x-axis = date, y-axis = trophies
**Time ranges:** 7 days / 30 days / Season / All time

**Data source:** Our polling job snapshots player trophies every 6 hours for any player that has been looked up in the past 30 days.

---

### 12. Clan History

**Purpose:** Show who joined/left a clan, trophy activity, and donation trends.

**Sub-features:**
- Join/Leave log with timestamps
- Trophy activity chart per member
- Donation history: week-by-week table
- Inactivity indicators: last battle time, last donation time

**Data source:** Our clan polling job diffs membership every 15 minutes for tracked clans.

---

### 13. Clan War Stats

**Purpose:** Detailed war performance for each clan member.

**Data displayed:**
- Last 10 river races: attacks made, wins, cards earned
- Per-member breakdown: attack count, win rate, participation rate
- Current river race live status

**API:** `GET /clans/{tag}/riverracelog` + stored history

---

### 14. Meta Report

**Purpose:** Show the current meta: what decks are dominating at each trophy range.

**Sections:**
- Top 10 decks globally
- Top decks by trophy range (0–4000, 4000–6000, 6000+)
- Card usage rates ranked
- Card win rates ranked

**Data source:** Aggregated from stored battle logs. Refreshed daily.

---

### 15. Deck Builder

**Purpose:** Let users build a custom deck and analyse it.

**Features:**
- 8-slot card picker from the full card list
- Real-time elixir average as cards are added
- Cycle speed indicator
- Spell damage overlay (see what your spells counter)
- Share deck as a deep link
- Save deck to account (up to 10 saved decks in free tier)

---

### 16. Card Usage Stats

**Purpose:** Show how each card performs in the current meta.

**Data per card:**
- Usage rate (% of decks that include this card)
- Win rate when included
- Trend line: usage rate over last 4 seasons
- Most common partner cards (cards frequently played with this card)

---

## V2 Feature Specifications

### 17. War Deck Helper

**Purpose:** Given a player's current decks, suggest 4 non-overlapping war decks.

**Logic:**
- User selects decks they want to lock in
- Tool suggests remaining decks with no card overlap
- Suggestions ranked by win rate in war game mode

### 18. Deck Matchup Tool

**Purpose:** For a selected deck, show its win rate against common meta decks.

**Data:** Win rate pulled from our battle log data where both decks appear in the same match.

### 19. Tournament Browser

**Purpose:** Find open joinable tournaments in real time.

**Filters:** Max level, capacity, time remaining
**Feature:** Tap to copy tournament tag

### 20. Balance Change Tracker

**Purpose:** Show what changed each balance patch, and the impact on card usage.

**Data:** Stored card stat snapshots per season. Diff view shows buffs/nerfs clearly.

### 21. Multi-account Support

**Purpose:** Users can save and switch between multiple player profiles (e.g. main + alt accounts).

**Limit:** Up to 5 accounts per user.

### 22. Push Notifications

**Purpose:** Notify users of events they care about.

**Notification types:**
- War attack reminder (configurable hours before deadline)
- Leaderboard rank change for a saved player
- Balance change published
- New season started

**Tech:** Firebase Cloud Messaging (FCM). Users opt in per notification type in Settings.

### 23. Esports Section

**Purpose:** Track professional players and tournament results.

**Features:**
- Pro player profiles linked to their in-game accounts
- CRL standings and bracket
- Global Tournament Rating (GTR) leaderboard

---

## Auth & Account Specification

### Registration
- Email + password
- Email verification required before accessing saved features
- Password: minimum 8 characters

### Login
- Email + password
- Google Sign-In (V1+)
- Apple Sign-In (required for iOS App Store)

### Account features (free tier)
- Save up to 20 players
- Save up to 10 decks
- Push notification opt-in
- Battle log history extended to 100 battles

---

## Ads Specification

- **Banner ad**: 320x50, shown at bottom of Player Profile and Clan Profile screens
- **Interstitial ad**: shown after every 5th deck search action
- **No ads** on: loading screens, error screens, Settings, Auth screens
- **Ad-free grace period**: first 72 hours after first install
- All ads managed through `useAds` hook — never call AdMob directly in screen components
- Ad unit IDs stored in environment variables, never hardcoded

---

## Non-functional Requirements

| Requirement | Target |
|---|---|
| API response time (cached) | < 100ms |
| API response time (uncached) | < 800ms |
| App cold start time | < 2 seconds |
| Screen render time | < 300ms |
| Crash rate | < 0.1% |
| Supercell API cache TTL (player) | 2 minutes |
| Supercell API cache TTL (clan) | 10 minutes |
| Supercell API cache TTL (cards) | 24 hours |
| Offline behaviour | Show last cached data with stale indicator |
