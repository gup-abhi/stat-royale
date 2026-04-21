import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import * as model from '../models/savedPlayers.model';
import { normaliseTag } from '../utils/normalise-tag';
import { ValidationError, NotFoundError } from '../utils/supercell-errors';

export const savedPlayersRouter = Router();

savedPlayersRouter.use(requireAuth);

savedPlayersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const saved = await model.getSavedPlayers(id);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

savedPlayersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const { playerTag, nickname } = req.body as { playerTag?: string; nickname?: string };

    if (!playerTag || typeof playerTag !== 'string') {
      throw new ValidationError('playerTag is required');
    }

    const count = await model.countSavedPlayers(id);
    if (count >= 20) {
      throw new ValidationError('Maximum of 20 saved players reached');
    }

    const tag = normaliseTag(playerTag);
    const saved = await model.savePlayer(id, tag, nickname ?? null);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});

savedPlayersRouter.delete('/:tag', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const tag = normaliseTag(req.params.tag);
    const deleted = await model.deleteSavedPlayer(id, tag);
    if (!deleted) throw new NotFoundError(`Saved player ${tag} not found`);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});
