// shared/types.ts
// Shared data types between the React Native app and the Node.js server.
// Import from this file in both packages. Do not duplicate these types.

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  tag: string;
  name: string;
  level: number;
  trophies: number;
  bestTrophies: number;
  arena: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  threeCrownWins: number;
  battleCount: number;
  winRate: number;
  starPoints: number;
  clan?: {
    tag: string;
    name: string;
    role: string;
    badgeId: number;
  };
  cards: PlayerCard[];
  currentSeason: {
    rank?: number;
    trophies: number;
    bestTrophies: number;
  };
  bestSeason: {
    id: string;
    rank: number;
    trophies: number;
  };
}

export interface PlayerCard {
  id: number;
  name: string;
  level: number;
  starLevel: number;
  maxLevel: number;
  count: number;
  iconUrl: string;
}

// ─── Battle ──────────────────────────────────────────────────────────────────

export type BattleType =
  | 'pathOfLegend'
  | 'clanWar'
  | 'challenge'
  | 'friendly'
  | 'other';

export interface Battle {
  id: string;                    // hash of player_tag + battle_time
  battleType: BattleType;
  battleTime: string;            // ISO 8601
  elapsedSeconds: number;
  playerWon: boolean;
  playerCrowns: number;
  opponentCrowns: number;
  playerDeck: BattleDeckCard[];
  opponent: {
    tag: string;
    name: string;
    deck: BattleDeckCard[];
  };
  trophyChange?: number;
  arena: {
    id: number;
    name: string;
  };
}

export interface BattleDeckCard {
  id: number;
  name: string;
  level: number;
  iconUrl: string;
}

// ─── Chest ───────────────────────────────────────────────────────────────────

export interface UpcomingChest {
  index: number;
  name: string;
  iconUrl?: string;
}

// ─── Clan ────────────────────────────────────────────────────────────────────

export type ClanType = 'open' | 'inviteOnly' | 'closed';

export interface Clan {
  tag: string;
  name: string;
  description: string;
  badgeId: number;
  type: ClanType;
  clanScore: number;
  clanWarTrophies: number;
  location?: {
    id: number;
    name: string;
    countryCode?: string;
  };
  requiredTrophies: number;
  donationsPerWeek: number;
  memberCount: number;
  members: ClanMember[];
}

export interface ClanMember {
  tag: string;
  name: string;
  role: 'leader' | 'coLeader' | 'elder' | 'member';
  trophies: number;
  arena: {
    id: number;
    name: string;
  };
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
  lastSeen: string; // ISO 8601
}

// ─── Clan Search Result ───────────────────────────────────────────────────────

export interface ClanSearchResult {
  tag: string;
  name: string;
  type: ClanType;
  badgeId: number;
  clanScore: number;
  clanWarTrophies: number;
  location?: {
    id: number;
    name: string;
  };
  memberCount: number;
  requiredTrophies: number;
}

// ─── Card ────────────────────────────────────────────────────────────────────

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'champion';
export type CardType = 'troop' | 'spell' | 'building';

export interface Card {
  id: number;
  name: string;
  elixirCost: number;
  rarity: CardRarity;
  cardType: CardType;
  arena: number;
  iconUrl: string;
  maxLevel: number;
  evolutionLevel?: number;
}

// ─── Card Stats (V1) ─────────────────────────────────────────────────────────

export interface CardStats {
  cardId: number;
  usageRatePct: number;
  winRatePct: number;
  trend: Array<{
    season: string;
    usageRatePct: number;
  }>;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardPlayer {
  rank: number;
  tag: string;
  name: string;
  trophies: number;
  clan?: {
    tag: string;
    name: string;
    badgeId: number;
  };
  arena: {
    id: number;
    name: string;
  };
}

// ─── Deck (V1) ───────────────────────────────────────────────────────────────

export interface DeckCard {
  id: number;
  name: string;
  iconUrl: string;
}

export interface Deck {
  cards: DeckCard[];
  elixirAverage: number;
  usageCount: number;
  winRatePct: number;
}

export interface SavedDeck {
  id: string;
  name: string;
  cards: DeckCard[];
  elixirAverage: number;
  createdAt: string;
}

// ─── Trophy History (V1) ─────────────────────────────────────────────────────

export interface TrophySnapshot {
  trophies: number;
  snapshottedAt: string; // ISO 8601
}

// ─── Clan Membership Event (V1) ───────────────────────────────────────────────

export interface ClanMembershipEvent {
  playerTag: string;
  playerName: string;
  eventType: 'join' | 'leave';
  occurredAt: string; // ISO 8601
}

// ─── Meta Report (V1) ─────────────────────────────────────────────────────────

export interface MetaReport {
  generatedAt: string;
  topDecks: Deck[];
  cardUsageRates: Array<{
    cardId: number;
    cardName: string;
    usageRatePct: number;
    winRatePct: number;
  }>;
  decksByTrophyRange: {
    '0-4000': Deck[];
    '4000-6000': Deck[];
    '6000+': Deck[];
  };
}

// ─── Saved Player ─────────────────────────────────────────────────────────────

export interface SavedPlayer {
  playerTag: string;
  nickname: string | null;
  savedAt: string;
}

// ─── Notification (V2) ────────────────────────────────────────────────────────

export type NotificationType =
  | 'war_reminder'
  | 'rank_change'
  | 'balance_change'
  | 'new_season';

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  playerTag?: string;
}
