import { Router } from 'express';
import { clansController } from '../controllers/clans.controller';

export const clansRouter = Router();

clansRouter.get('/search', clansController.search);
clansRouter.get('/:tag', clansController.getClan);
clansRouter.get('/:tag/members', clansController.getMembers);
