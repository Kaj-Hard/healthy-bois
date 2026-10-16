import type { GameTheme } from '../types';

/**
 * Street pitch: mowed pastel-mint stripes, kit green and referee-card yellow
 * (red for the final letter). The scoreboard band is near-black pitch green.
 */
export const theme: GameTheme = {
  vars: {
    '--bg': '#c4ecd0',
    '--bg-2': '#b3e3c2',
    '--surface': '#ffffff',
    '--ink': '#0f3b22',
    '--ink-soft': '#3f7356',
    '--line': '#a6d9b6',
    '--primary': '#1f9d55',
    '--primary-deep': '#13703b',
    '--primary-soft': '#d3f2de',
    '--accent': '#ffd23f',
    '--accent-deep': '#d9a90c',
    '--accent-soft': '#fff4c4',
  },
  sideColors: [
    { base: '#1f9d55', deep: '#13703b', soft: '#d3f2de' },
    { base: '#ffd23f', deep: '#d9a90c', soft: '#fff4c4' },
  ],
};

/** Referee cards: G, R, I are yellow; the final S is the red card. */
export const YELLOW = { base: '#ffd23f', deep: '#d9a90c', ink: '#3a2a00' };
export const RED = { base: '#ef4136', deep: '#b5251c', ink: '#ffffff' };
export const BOARD = '#0f3b22';

export function cardColor(index: number, total: number) {
  return index === total - 1 ? RED : YELLOW;
}
