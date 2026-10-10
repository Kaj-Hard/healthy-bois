import type { Match } from '../games/types';

export function sideScore(match: Match, sideId: string): number {
  let total = 0;
  for (const r of match.rounds) if (r.sideId === sideId) total += r.points;
  return total;
}

/** Side that starts the next round: winner of the previous round, else the first side. */
export function nextStarter(match: Match): string | undefined {
  return match.rounds.at(-1)?.sideId ?? match.firstSideId;
}

/** Side ids ordered by score, best first. */
export function standings(match: Match): { sideId: string; score: number }[] {
  return match.sides
    .map((s) => ({ sideId: s.id, score: sideScore(match, s.id) }))
    .sort((a, b) => b.score - a.score);
}
