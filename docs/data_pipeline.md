# data_pipeline.md — Data Pipeline Design

This document describes how RoyaleStats collects, stores, and processes data beyond what the Supercell API returns in real time. This is required for V1 features: deck analytics, trophy history, clan history, and meta reports.

Read this before implementing any V1 tasks.

---

## Why We Need a Pipeline

The Supercell API is stateless — it only returns the current state. It does not give us:
- A player's trophy history over time
- Who joined or left a clan
- Win rates of specific decks across millions of battles
- Meta statistics (most-used cards, highest win rate decks per trophy range)

To provide these features, we must poll the API on a schedule, store the data, and aggregate it.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Polling Jobs (run on server, scheduled with node-cron)     │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────────────────────┐ │
│  │ Player Poller   │   │ Clan Poller                     │ │
│  │ Every 6 hours   │   │ Every 15 minutes                │ │
│  │                 │   │                                 │ │
│  │ For each tracked│   │ For each tracked clan:          │ │
│  │ player:         │   │ - Fetch /clans/{tag}            │ │
│  │ - Fetch /players│   │ - Compare to last snapshot      │ │
│  │ - Fetch /battles│   │ - Write join/leave events       │ │
│  │ - Store snapshot│   │ - Store new snapshot            │ │
│  │ - Store new     │   │                                 │ │
│  │   battles       │   └─────────────────────────────────┘ │
│  └─────────────────┘                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Meta Aggregation Job (daily at 02:00 UTC)           │   │
│  │                                                     │   │
│  │ - Count deck usage in last 7 days of battle_logs    │   │
│  │ - Compute win rates per deck                        │   │
│  │ - Compute card usage rates                          │   │
│  │ - Write aggregated results to Redis                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Tracked Players

We do not poll every Clash Royale player — there are over 100 million of them. We poll players selectively.

**A player becomes tracked when:**
- A logged-in user saves them to their saved players list
- Any user looks up the player's profile (we add them at priority 1 for 30 days)
- They appear in the global leaderboard (added at priority 3)

**Priority levels:**
| Priority | Description | Poll frequency |
|---|---|---|
| 3 | Leaderboard player | Every 1 hour |
| 2 | Saved by a user | Every 3 hours |
| 1 | Recently looked up | Every 6 hours |

**A player is removed from tracking when:**
- They have not been looked up in 30 days and are not saved by anyone
- A cleanup job runs daily to prune stale tracked_players rows

---

## Player Poller Job (`jobs/poll-players.job.ts`)

**Schedule:** Runs every 10 minutes, processes players due for a poll

**Logic:**
```
1. Query tracked_players WHERE last_polled_at < NOW() - poll_interval(priority)
   ORDER BY priority DESC, last_polled_at ASC
   LIMIT 50 (batches to stay under Supercell rate limits)

2. For each player:
   a. Fetch /players/{tag} from Supercell API
   b. If successful:
      - Snapshot trophies: INSERT INTO trophy_history (player_tag, trophies)
      - Update tracked_players SET last_polled_at = NOW(), last_seen_at = NOW()
   
   c. Fetch /players/{tag}/battlelog from Supercell API
   d. For each battle not already in battle_logs:
      - INSERT INTO battle_logs (all fields)
      - Use ON CONFLICT (player_tag, battle_time) DO NOTHING

3. Sleep 200ms between each player to avoid rate limit spikes
```

**Rate limit safety:**
- 50 players per 10-minute run = 5 players/minute = 10 Supercell requests/minute (safe)
- Increase batch size gradually as you confirm rate limit headroom

---

## Clan Poller Job (`jobs/poll-clans.job.ts`)

**Schedule:** Runs every 15 minutes

**Which clans are tracked:**
- Clans of any tracked player
- Clans looked up directly in the last 30 days

**Logic:**
```
1. Query tracked_clans due for a poll (LIMIT 20 per run)

2. For each clan:
   a. Fetch /clans/{tag} (members list included)
   b. Load last snapshot from clan_snapshots WHERE clan_tag = ? ORDER BY snapshotted_at DESC LIMIT 1
   c. Diff current members against last snapshot:
      - New members (in current but not in last snapshot) → INSERT clan_membership_events (type='join')
      - Left members (in last snapshot but not in current) → INSERT clan_membership_events (type='leave')
   d. INSERT new snapshot into clan_snapshots

3. Retain snapshots for 90 days, then delete (storage cleanup job)
```

---

## Meta Aggregation Job (`jobs/aggregate-meta.job.ts`)

**Schedule:** Daily at 02:00 UTC

**What it produces:**
1. Top 100 most popular decks globally (last 7 days of battle_logs)
2. Top decks by trophy range (0–4000, 4000–6000, 6000+)
3. Card usage rates (% of battles each card appears in)
4. Card win rates (win rate of battles where this card was in player_deck)
5. Deck win rates (win rate for each unique 8-card combination)

**Aggregation SQL examples:**

```sql
-- Card usage rate (last 7 days)
SELECT
  card_id,
  COUNT(*) AS appearances,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM battle_logs WHERE battle_time > NOW() - INTERVAL '7 days'), 2) AS usage_rate_pct
FROM battle_logs
CROSS JOIN LATERAL jsonb_array_elements_text(player_deck) AS card_id
WHERE battle_time > NOW() - INTERVAL '7 days'
GROUP BY card_id
ORDER BY appearances DESC;

-- Popular decks (normalise card order before grouping)
SELECT
  sorted_deck,
  COUNT(*) AS usage_count,
  ROUND(AVG(CASE WHEN player_won THEN 1.0 ELSE 0.0 END) * 100, 2) AS win_rate_pct
FROM (
  SELECT
    player_won,
    (SELECT jsonb_agg(value ORDER BY value) FROM jsonb_array_elements_text(player_deck)) AS sorted_deck
  FROM battle_logs
  WHERE battle_time > NOW() - INTERVAL '7 days'
    AND battle_type = 'pathOfLegend'
) decks
GROUP BY sorted_deck
HAVING COUNT(*) > 100          -- minimum threshold to be statistically meaningful
ORDER BY usage_count DESC
LIMIT 100;
```

**Output:** Write aggregated results as JSON to Redis:
- `rs:meta:report` — full meta report (TTL: 25 hours, refreshed daily)
- `rs:decks:popular` — top 100 decks (TTL: 25 hours)
- `rs:cards:usage` — card usage rates (TTL: 25 hours)

---

## Deck Normalisation

A deck is 8 cards. Two decks with the same 8 cards but in different selection order are the same deck. Always sort card IDs numerically before storing or comparing decks.

```typescript
function normaliseDeck(cardIds: number[]): number[] {
  return [...cardIds].sort((a, b) => a - b);
}
```

Store the normalised array as JSONB in `battle_logs.player_deck`. Always normalise before inserting.

---

## Storage Estimates

| Table | Rows after 90 days | Estimated size |
|---|---|---|
| `battle_logs` | ~50M (at 500 tracked players × 25 battles/poll × 4 polls/day × 90 days) | ~20GB |
| `trophy_history` | ~1.8M | ~100MB |
| `clan_snapshots` | ~260K | ~500MB |
| `clan_membership_events` | ~500K | ~50MB |

**Storage strategy:**
- Partition `battle_logs` by month using PostgreSQL table partitioning
- Archive partitions older than 6 months to cold storage or delete
- Index only the columns used in aggregation queries: `player_tag`, `battle_time`, `battle_type`, `player_won`

---

## Running Jobs in Development

Jobs are implemented using `node-cron` and run in the same process as the Express server in development.

```typescript
// server/src/index.ts (dev only)
if (process.env.NODE_ENV !== 'production') {
  import('./jobs/poll-players.job').then(j => j.start());
  import('./jobs/poll-clans.job').then(j => j.start());
}
```

In production, run jobs as separate processes or use a job queue (BullMQ with Redis) to handle retries and concurrency. For V1 as a solo developer, running in-process is acceptable.

---

## Error Handling in Jobs

- Wrap each player/clan poll in a try/catch — one failure should not stop the batch
- Log all failures with player/clan tag and error details
- If the Supercell API returns 503, pause the job for 5 minutes before retrying
- Track consecutive failures per player: if a player returns 404 three times in a row, remove them from tracking

---

## Adding a Player to Tracking

Call this whenever a player is looked up or saved:

```typescript
// server/src/services/players.service.ts
async function ensureTracked(tag: string, priority: 1 | 2 | 3 = 1): Promise<void> {
  await db.query(`
    INSERT INTO tracked_players (player_tag, priority, last_polled_at)
    VALUES ($1, $2, NOW() - INTERVAL '7 days')
    ON CONFLICT (player_tag) DO UPDATE
    SET priority = GREATEST(tracked_players.priority, EXCLUDED.priority)
  `, [tag, priority]);
}
```

Setting `last_polled_at` in the past ensures the player is polled on the next job run.
