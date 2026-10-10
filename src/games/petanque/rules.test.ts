import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { HOUSE, OFFICIAL, maxPointsPerRound, winnerOf } from './rules';
import { leaderboard } from '../../lib/stats';

function match(modeId: string, sides: string[][], rounds: [string, number][] = []): Match {
  return {
    id: 'm',
    gameId: 'petanque',
    modeId,
    sides: sides.map((playerIds, i) => ({ id: `s${i}`, playerIds })),
    rounds: rounds.map(([sideId, points]) => ({ sideId, points, at: 0 })),
    target: 13,
    status: 'active',
    startedAt: 0,
  };
}

describe('petanque rules', () => {
  it('caps points per end by format', () => {
    expect(maxPointsPerRound(match(OFFICIAL, [['a'], ['b']]))).toBe(3);
    expect(maxPointsPerRound(match(OFFICIAL, [['a', 'b'], ['c', 'd']]))).toBe(6);
    expect(maxPointsPerRound(match(OFFICIAL, [['a', 'b', 'c'], ['d', 'e', 'f']]))).toBe(6);
    expect(maxPointsPerRound(match(HOUSE, [['a'], ['b'], ['c']]))).toBe(3);
  });

  it('has no winner below 13', () => {
    expect(winnerOf(match(OFFICIAL, [['a'], ['b']], [['s0', 3], ['s1', 3], ['s0', 3], ['s0', 3]]))).toBeUndefined();
  });

  it('first side to reach 13 wins, overshoot allowed', () => {
    const m = match(OFFICIAL, [['a', 'b'], ['c', 'd']], [['s0', 6], ['s1', 5], ['s0', 4], ['s0', 4]]);
    expect(winnerOf(m)).toBe('s0');
  });

  it('works for free-for-all', () => {
    const m = match(HOUSE, [['a'], ['b'], ['c']], [['s0', 3], ['s1', 3], ['s2', 3], ['s1', 3], ['s1', 3], ['s1', 3], ['s1', 1]]);
    expect(winnerOf(m)).toBe('s1');
  });

  it('leaderboard credits every team member and counts fannys', () => {
    const m: Match = {
      ...match(OFFICIAL, [['a', 'b'], ['c', 'd']], [['s0', 6], ['s0', 6], ['s0', 1]]),
      status: 'finished',
      winnerSideId: 's0',
    };
    const board = leaderboard([m]);
    expect(board.find((p) => p.playerId === 'a')?.wins).toBe(1);
    expect(board.find((p) => p.playerId === 'b')?.wins).toBe(1);
    expect(board.find((p) => p.playerId === 'c')?.fannys).toBe(1);
    expect(board.find((p) => p.playerId === 'c')?.played).toBe(1);
  });
});
