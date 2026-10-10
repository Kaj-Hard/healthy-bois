import type { GameDefinition } from './types';
import { petanque } from './petanque';

/**
 * Every game the app knows about. To add a game, create a folder next to
 * `petanque/` exporting a GameDefinition and list it here.
 */
export const GAMES: GameDefinition[] = [petanque];

export function getGame(id: string): GameDefinition {
  const game = GAMES.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game;
}
