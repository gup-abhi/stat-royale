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

  getBattles: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const battles = await playersService.getPlayerBattles(req.params.tag);
      res.json({ success: true, data: battles });
    } catch (err) {
      next(err);
    }
  },

  getChests: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chests = await playersService.getPlayerChests(req.params.tag);
      res.json({ success: true, data: chests });
    } catch (err) {
      next(err);
    }
  },
};
