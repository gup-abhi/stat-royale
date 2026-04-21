import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';

export const leaderboardRouter = Router();

leaderboardRouter.get('/players', leaderboardController.getPlayers);
