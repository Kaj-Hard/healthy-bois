import type { ComponentType } from 'react';
import type { TKey } from '../i18n';

/** One competing unit: a single player (free-for-all) or a team. */
export interface Side {
  id: string;
  playerIds: string[];
}

/** One scored round (an "end" in pétanque). */
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
  target: number;
}

export interface PlayProps {
  match: Match;
}

export interface GameDefinition {
  id: string;
  name: TKey;
  tagline: TKey;
  theme: GameTheme;
  modes: GameMode[];
  /** Large illustration used on cards and headers. */
  Art: ComponentType<{ size?: number }>;
  /** The in-game scoring screen. */
  Play: ComponentType<PlayProps>;
  /** Max points one side can score in a single round. */
  maxPointsPerRound(match: Match): number;
  /** Returns the winning side id after the latest round, if the game is over. */
  winnerOf(match: Match): string | undefined;
}
