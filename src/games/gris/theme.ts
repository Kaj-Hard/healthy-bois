import type { GameTheme } from '../types';

/** Fresh pitch mint vs. hot bubblegum pink: complementary, instantly "football in the park". */
export const theme: GameTheme = {
  vars: {
    '--bg': '#eafaf0',
    '--bg-2': '#d5f4e0',
    '--surface': '#ffffff',
    '--ink': '#173a28',
    '--ink-soft': '#5c8a71',
    '--line': '#cbeed9',
    '--primary': '#43c77a',
    '--primary-deep': '#259a56',
    '--primary-soft': '#d2f4df',
    '--accent': '#ff7aa8',
    '--accent-deep': '#d9497c',
    '--accent-soft': '#ffe0ec',
  },
  sideColors: [
    { base: '#43c77a', deep: '#259a56', soft: '#d2f4df' },
    { base: '#ff7aa8', deep: '#d9497c', soft: '#ffe0ec' },
  ],
};

/** Letter tiles use the accent pink: getting a letter is bad news, so it should pop. */
export const LETTER = { base: '#ff7aa8', deep: '#d9497c', soft: '#ffe0ec' };
