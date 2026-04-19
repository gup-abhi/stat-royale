import { Request, Response, NextFunction } from 'express';
import * as playersService from '../services/players.service';

export const playersController = {
  getPlayer: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const player = await playersService.getPlayer(req.params.tag);
      res.json({ success: true, data: player });
    } catch (err) {
      next(err);
    }
  },

  getBattles: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: MVP-022
  },

  getChests: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: MVP-023
  },
};
