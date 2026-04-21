import { Request, Response, NextFunction } from 'express';
import * as cardsService from '../services/cards.service';

export const cardsController = {
  getAll: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cards = await cardsService.getAllCards();
      res.json({ success: true, data: cards });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const card = await cardsService.getCardById(id);
      res.json({ success: true, data: card });
    } catch (err) {
      next(err);
    }
  },
};
