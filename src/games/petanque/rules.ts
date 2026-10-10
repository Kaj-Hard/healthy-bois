import type { GameMode, Match } from '../types';
import type { TKey } from '../../i18n';

export const OFFICIAL = 'official';
export const HOUSE = 'house';
export const TARGET = 13;

export const modes: GameMode[] = [
  {
    id: OFFICIAL,
    name: 'petanque.official',
    tagline: 'petanque.officialTag',
    rules: 'petanque.officialRules',
    emoji: '🏅',
    teams: true,
    playerCounts: [2, 4, 6],
    target: TARGET,
  },
  {
    id: HOUSE,
    name: 'petanque.house',
    tagline: 'petanque.houseTag',
    rules: 'petanque.houseRules',
    emoji: '🎉',
    teams: false,
    playerCounts: [3, 4, 5, 6, 7, 8],
    target: TARGET,
  },
];

/** Players per team in an official match (1 singles, 2 doubles, 3 triples). */
export function teamSize(match: Match): number {
  return match.sides[0]?.playerIds.length ?? 1;
}

/**
 * Official: a team can at most score every boule it threw.
 * Singles: 3 boules (max 3). Doubles: 2x3 boules (max 6). Triples: 3x2 boules (max 6).
 * House rules: capped at 3 per round.
 */
export function maxPointsPerRound(match: Match): number {
  if (match.modeId !== OFFICIAL) return 3;
  return teamSize(match) === 1 ? 3 : 6;
}

export function formatKey(match: Match): TKey {
  if (match.modeId !== OFFICIAL) return 'petanque.ffa';
  return (['petanque.singles', 'petanque.doubles', 'petanque.triples'] as const)[teamSize(match) - 1] ?? 'petanque.doubles';
}

/** First side to reach the target wins. Only one side scores per end, so there are no ties. */
export function winnerOf(match: Match): string | undefined {
  const totals = new Map<string, number>();
  for (const r of match.rounds) {
    const t = (totals.get(r.sideId) ?? 0) + r.points;
    totals.set(r.sideId, t);
    if (t >= match.target) return r.sideId;
  }
  return undefined;
}
