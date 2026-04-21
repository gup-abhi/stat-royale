import { Request, Response, NextFunction } from 'express';
import * as leaderboardService from '../services/leaderboard.service';

export const leaderboardController = {
  getPlayers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = (req.query.location as string) ?? 'global';
      const players = await leaderboardService.getPlayerLeaderboard(location);
      res.json({ success: true, data: players });
    } catch (err) {
      next(err);
    }
  },
};
