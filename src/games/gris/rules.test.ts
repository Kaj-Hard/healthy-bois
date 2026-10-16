import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { CLASSIC, aliveSides, eliminationOrder, flawless, letters, ranking, scoreText, winnerOf } from './rules';

function match(players: number, drops: string[]): Match {
  return {
    id: 'm',
    gameId: 'gris',
    modeId: CLASSIC,
    sides: Array.from({ length: players }, (_, i) => ({ id: `s${i}`, playerIds: [`p${i}`] })),
    rounds: drops.map((sideId) => ({ sideId, points: 1, at: 0 })),
    target: 4,
    status: 'active',
    startedAt: 0,
  };
}

const times = (id: string, n: number) => Array.from({ length: n }, () => id);

describe('gris rules', () => {
  it('spells the word letter by letter', () => {
    const m = match(3, ['s0', 's0', 's1']);
    expect(scoreText(m, 's0')).toBe('GR');
    expect(scoreText(m, 's1')).toBe('G');
    expect(scoreText(m, 's2')).toBe('–');
  });

  it('knocks a player out on the fourth letter', () => {
    const m = match(3, times('s1', 4));
    expect(letters(m, 's1')).toBe(4);
    expect(aliveSides(m)).toEqual(['s0', 's2']);
    expect(winnerOf(m)).toBeUndefined();
  });

  it('last one standing wins', () => {
    const m = match(3, [...times('s1', 4), 's0', ...times('s2', 4)]);
    expect(winnerOf(m)).toBe('s0');
    expect(eliminationOrder(m)).toEqual(['s1', 's2']);
    expect(ranking(m)).toEqual(['s0', 's2', 's1']);
  });

  it('works heads-up and detects a flawless win', () => {
    const m = { ...match(2, times('s1', 4)), winnerSideId: 's0' };
    expect(winnerOf(m)).toBe('s0');
    expect(flawless(m)).toBe(true);
  });
});
