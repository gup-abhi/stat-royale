import { Request, Response, NextFunction } from 'express';
import * as clansService from '../services/clans.service';

export const clansController = {
  getClan: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clan = await clansService.getClan(req.params.tag);
      res.json({ success: true, data: clan });
    } catch (err) {
      next(err);
    }
  },

  getMembers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clan = await clansService.getClan(req.params.tag);
      res.json({ success: true, data: clan.members });
    } catch (err) {
      next(err);
    }
  },

  getWarlog: async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    // TODO: MVP-024 warlog (V1 feature, not in MVP acceptance criteria)
  },

  search: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, type, minTrophies, locationId } = req.query;
      const results = await clansService.searchClans({
        name: name as string | undefined,
        type: type as string | undefined,
        minTrophies: minTrophies ? Number(minTrophies) : undefined,
        locationId: locationId ? Number(locationId) : undefined,
      });
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
};
