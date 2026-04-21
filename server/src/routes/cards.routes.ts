import { Router } from 'express';
import { cardsController } from '../controllers/cards.controller';

export const cardsRouter = Router();

cardsRouter.get('/', cardsController.getAll);
cardsRouter.get('/:id', cardsController.getOne);
