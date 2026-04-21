import { Router } from 'express';
import { playersController } from '../controllers/players.controller';

export const playersRouter = Router();

playersRouter.get('/:tag', playersController.getPlayer);
playersRouter.get('/:tag/battles', playersController.getBattles);
