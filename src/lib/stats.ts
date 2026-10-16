import type { Match } from '../games/types';
import { getGame } from '../games/registry';
import { sideScore } from './match';

export interface PlayerStats {
  playerId: string;
  wins: number;
  played: number;
  /** Times this player lost without scoring (game-specific, see GameDefinition.fannySides). */
  fannys: number;
  pointsFor: number;
}

export interface StatsFilter {
  gameId?: string;
  modeId?: string;
}

export function finishedMatches(matches: Match[], filter: StatsFilter = {}): Match[] {
  return matches.filter(
    (m) =>
      m.status === 'finished' &&
      (!filter.gameId || m.gameId === filter.gameId) &&
      (!filter.modeId || m.modeId === filter.modeId),
  );
}

export function leaderboard(matches: Match[], filter: StatsFilter = {}): PlayerStats[] {
  const byPlayer = new Map<string, PlayerStats>();
  const get = (id: string) => {
    let s = byPlayer.get(id);
    if (!s) byPlayer.set(id, (s = { playerId: id, wins: 0, played: 0, fannys: 0, pointsFor: 0 }));
    return s;
  };
  for (const m of finishedMatches(matches, filter)) {
    const fannies = new Set(getGame(m.gameId).fannySides?.(m) ?? []);
    for (const side of m.sides) {
      const score = sideScore(m, side.id);
      for (const pid of side.playerIds) {
        const s = get(pid);
        s.played++;
        s.pointsFor += score;
        if (side.id === m.winnerSideId) s.wins++;
        else if (fannies.has(side.id)) s.fannys++;
      }
    }
  }
  return [...byPlayer.values()].sort(
    (a, b) => b.wins - a.wins || b.wins / b.played - a.wins / a.played || a.played - b.played,
  );
}

export function winsFor(matches: Match[], playerId: string, gameId?: string): number {
  return finishedMatches(matches, { gameId }).filter((m) =>
    m.sides.find((s) => s.id === m.winnerSideId)?.playerIds.includes(playerId),
  ).length;
}
