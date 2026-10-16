import type { GameMode, Match } from '../types';

/** Every drop earns the next letter. Spell the whole word and you're out. */
export const WORD = 'GRIS';
export const CLASSIC = 'classic';

export const modes: GameMode[] = [
  {
    id: CLASSIC,
    name: 'gris.classic',
    tagline: 'gris.classicTag',
    rules: 'gris.classicRules',
    emoji: '⚽',
    teams: false,
    playerCounts: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    target: WORD.length,
  },
];

/** Letters a side has collected (0 = clean, target = out). */
export function letters(match: Match, sideId: string): number {
  let n = 0;
  for (const r of match.rounds) if (r.sideId === sideId) n += r.points;
  return Math.min(n, match.target);
}

export function isOut(match: Match, sideId: string): boolean {
  return letters(match, sideId) >= match.target;
}

export function aliveSides(match: Match): string[] {
  return match.sides.filter((s) => !isOut(match, s.id)).map((s) => s.id);
}

/** Side ids in the order they were knocked out. */
export function eliminationOrder(match: Match): string[] {
  const counts = new Map<string, number>();
  const out: string[] = [];
  for (const r of match.rounds) {
    const n = (counts.get(r.sideId) ?? 0) + r.points;
    counts.set(r.sideId, n);
    if (n >= match.target && !out.includes(r.sideId)) out.push(r.sideId);
  }
  return out;
}

/** Last one standing wins. */
export function winnerOf(match: Match): string | undefined {
  if (match.sides.length < 2) return undefined;
  const alive = aliveSides(match);
  return alive.length === 1 ? alive[0] : undefined;
}

/** Survivors first (fewest letters on top), then the knocked-out in reverse order. */
export function ranking(match: Match): string[] {
  const alive = aliveSides(match).sort((a, b) => letters(match, a) - letters(match, b));
  return [...alive, ...eliminationOrder(match).reverse()];
}

export function scoreText(match: Match, sideId: string): string {
  return WORD.slice(0, letters(match, sideId)) || '–';
}

export function flawless(match: Match): boolean {
  return !!match.winnerSideId && letters(match, match.winnerSideId) === 0;
}
