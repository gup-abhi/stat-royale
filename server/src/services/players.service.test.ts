jest.mock('./supercell.service');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import * as supercell from './supercell.service';
import { getPlayer } from './players.service';
import { InvalidTagError } from '../utils/supercell-errors';

const mockGetPlayer = supercell.getPlayer as jest.Mock;

const rawPlayer = {
  tag: '#ABC123',
  name: 'TestPlayer',
  expLevel: 14,
  trophies: 6000,
  bestTrophies: 6500,
  arena: { id: 54, name: 'Legendary Arena' },
  wins: 800,
  losses: 200,
  threeCrownWins: 150,
  battleCount: 1000,
  starPoints: 5000,
  clan: { tag: '#CLAN1', name: 'TestClan', role: 'member', badgeId: 16000000 },
  cards: [
    { id: 26000000, name: 'Knight', level: 14, starLevel: 2, maxLevel: 14, count: 0, iconUrls: { medium: 'https://example.com/knight.png' } },
  ],
  leagueStatistics: {
    currentSeason: { rank: 1000, trophies: 6000, bestTrophies: 6200 },
    bestSeason: { id: '2024-09', rank: 800, trophies: 6500 },
  },
};

beforeEach(() => jest.clearAllMocks());

describe('getPlayer', () => {
  it('returns correctly shaped player data', async () => {
    mockGetPlayer.mockResolvedValue(rawPlayer);
    const player = await getPlayer('#ABC123');

    expect(player.tag).toBe('#ABC123');
    expect(player.name).toBe('TestPlayer');
    expect(player.level).toBe(14);
    expect(player.trophies).toBe(6000);
    expect(player.arena).toEqual({ id: 54, name: 'Legendary Arena' });
    expect(player.clan).toEqual({ tag: '#CLAN1', name: 'TestClan', role: 'member', badgeId: 16000000 });
  });

  it('computes winRate correctly', async () => {
    mockGetPlayer.mockResolvedValue(rawPlayer);
    const player = await getPlayer('#ABC123');
    expect(player.winRate).toBe(80);
  });

  it('computes winRate as 0 when battleCount is 0', async () => {
    mockGetPlayer.mockResolvedValue({ ...rawPlayer, wins: 0, losses: 0, battleCount: 0 });
    const player = await getPlayer('#ABC123');
    expect(player.winRate).toBe(0);
  });

  it('maps cards array correctly', async () => {
    mockGetPlayer.mockResolvedValue(rawPlayer);
    const player = await getPlayer('#ABC123');
    expect(player.cards).toHaveLength(1);
    expect(player.cards[0]).toEqual({
      id: 26000000,
      name: 'Knight',
      level: 14,
      starLevel: 2,
      maxLevel: 14,
      count: 0,
      iconUrl: 'https://example.com/knight.png',
    });
  });

  it('maps season stats correctly', async () => {
    mockGetPlayer.mockResolvedValue(rawPlayer);
    const player = await getPlayer('#ABC123');
    expect(player.currentSeason).toEqual({ rank: 1000, trophies: 6000, bestTrophies: 6200 });
    expect(player.bestSeason).toEqual({ id: '2024-09', rank: 800, trophies: 6500 });
  });

  it('omits clan when player has no clan', async () => {
    mockGetPlayer.mockResolvedValue({ ...rawPlayer, clan: undefined });
    const player = await getPlayer('#ABC123');
    expect(player.clan).toBeUndefined();
  });

  it('throws InvalidTagError for a tag that is too short', async () => {
    await expect(getPlayer('#AB')).rejects.toThrow(InvalidTagError);
    expect(mockGetPlayer).not.toHaveBeenCalled();
  });

  it('throws InvalidTagError for a tag with invalid characters', async () => {
    await expect(getPlayer('#ABC!@#')).rejects.toThrow(InvalidTagError);
  });
});
