import * as cardsModel from '../models/cards.model';
import * as supercell from './supercell.service';
import { NotFoundError } from '../utils/supercell-errors';
import { Card } from '../../../shared/types';

export async function getAllCards(): Promise<Card[]> {
  const count = await cardsModel.countCards();
  if (count > 0) return cardsModel.getAllCards();

  // DB not seeded yet — fall back to Supercell API (1-hour Redis cache)
  const raw = await supercell.getCards();
  return raw.map(
    (c): Card => ({
      id: c.id,
      name: c.name,
      elixirCost: c.elixirCost ?? 0,
      rarity: (c.rarity as Card['rarity']) ?? 'common',
      cardType: (c.type as Card['cardType']) ?? 'troop',
      arena: c.arena ?? 0,
      iconUrl: c.iconUrls?.medium ?? '',
      maxLevel: c.maxLevel ?? 14,
    }),
  );
}

export async function getCardById(id: number): Promise<Card> {
  const card = await cardsModel.getCardById(id);
  if (!card) throw new NotFoundError(`Card ${id} not found`);
  return card;
}
