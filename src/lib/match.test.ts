import { describe, expect, it } from 'vitest';
import type { Match } from '../games/types';
import { replaceSameGame } from './match';

const m = (id: string, gameId: string, status: Match['status'], rounds = 1): Match => ({
  id,
  gameId,
  modeId: 'x',
  sides: [],
  rounds: Array.from({ length: rounds }, () => ({ sideId: 's', points: 1, at: 0 })),
  target: 13,
  status,
  startedAt: 0,
});

describe('replaceSameGame', () => {
  it('keeps games of other types in progress', () => {
    const out = replaceSameGame([m('g', 'gris', 'active'), m('p', 'petanque', 'active')], 'petanque');
    expect(out.find((x) => x.id === 'g')?.status).toBe('active');
    expect(out.find((x) => x.id === 'p')?.status).toBe('abandoned');
  });

  it('drops an untouched game of the same type instead of keeping it as abandoned', () => {
    expect(replaceSameGame([m('p', 'petanque', 'active', 0)], 'petanque')).toEqual([]);
  });

  it('never touches finished games', () => {
    expect(replaceSameGame([m('p', 'petanque', 'finished')], 'petanque')[0].status).toBe('finished');
  });
});
