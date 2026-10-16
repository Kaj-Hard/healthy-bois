import type { ComponentType } from 'react';
import type { TKey } from '../i18n';

/** One competing unit: a single player (free-for-all) or a team. */
export interface Side {
  id: string;
  playerIds: string[];
}

/**
 * One scored event. Its meaning is up to the game: in pétanque an end won
 * (`points` scored), in GRIS a dropped ball (`points` letters received).
 */
export interface Round {
  sideId: string;
  points: number;
  at: number;
}

export type MatchStatus = 'active' | 'finished' | 'abandoned';

export interface Match {
  id: string;
  gameId: string;
  modeId: string;
  sides: Side[];
  rounds: Round[];
  target: number;
  status: MatchStatus;
  winnerSideId?: string;
  /** Side that starts (e.g. throws the jack first). Decided by coin flip or tap. */
  firstSideId?: string;
  /** Path of the winner photo inside the app's private storage. */
  photo?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface GameTheme {
  /** CSS custom properties applied to the app root while this game is on screen. */
  vars: Record<string, string>;
  /** Colours for team sides (index 0 / 1). Free-for-all games use player colours. */
  sideColors: { base: string; deep: string; soft: string }[];
}

export interface GameMode {
  id: string;
  name: TKey;
  tagline: TKey;
  rules: TKey;
  emoji: string;
  /** true: players are split into equal teams. false: every player is a side. */
  teams: boolean;
  /** Allowed total player counts. */
  playerCounts: number[];
  /** Points to reach (pétanque) or lives to lose (GRIS). */
  target: number;
}

/** Library filter tags. Keep the list short: every tag becomes a filter chip. */
export type GameTag = 'outdoor' | 'ball' | 'teams' | 'ffa' | 'elimination';

export interface PlayProps {
  match: Match;
}

export interface GameDefinition {
  id: string;
  name: TKey;
  tagline: TKey;
  /** One-line "what is this" for the library. */
  blurb: TKey;
  /** "{n} ends played" style summary on the winner screen (defaults to win.ends). */
  roundsLabel?: TKey;
  /** Rough length of one game, e.g. "20 min". */
  duration: TKey;
  tags: GameTag[];
  theme: GameTheme;
  modes: GameMode[];
  /** Large illustration used on cards and headers. */
  Art: ComponentType<{ size?: number }>;
  /** The in-game scoring screen. */
  Play: ComponentType<PlayProps>;
  /** Returns the winning side id after the latest round, if the game is over. */
  winnerOf(match: Match): string | undefined;
  /** Side ids, best first (winner on top). */
  ranking(match: Match): string[];
  /** Short score shown next to a side in lists, e.g. "13" or "GRI". */
  scoreText(match: Match, sideId: string): string;
  /** Losing sides that deserve a FANNY (lost without scoring). */
  fannySides?(match: Match): string[];
  /** The winner had a perfect game (e.g. no GRIS letters at all). */
  flawless?(match: Match): boolean;
}

export function playerRange(game: GameDefinition): [number, number] {
  const counts = game.modes.flatMap((m) => m.playerCounts);
  return [Math.min(...counts), Math.max(...counts)];
}
