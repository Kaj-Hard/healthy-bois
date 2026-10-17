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

/**
 * One game in progress per game type: starting a new pétanque abandons the unfinished pétanque
 * (or drops it if nothing was scored yet), while a GRIS game in progress is left alone.
 */
export function replaceSameGame(matches: Match[], gameId: string): Match[] {
  return matches
    .filter((m) => !(m.status === 'active' && m.gameId === gameId && m.rounds.length === 0))
    .map((m) => (m.status === 'active' && m.gameId === gameId ? { ...m, status: 'abandoned' as const } : m));
}
