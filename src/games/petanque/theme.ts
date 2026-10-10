import type { GameTheme } from '../types';

/** Sunny terracotta coral vs. Mediterranean teal: complementary, instantly "pétanque". */
export const theme: GameTheme = {
  vars: {
    '--bg': '#fff2e4',
    '--bg-2': '#ffe3c8',
    '--surface': '#ffffff',
    '--ink': '#3a2618',
    '--ink-soft': '#97765f',
    '--line': '#f6dcc3',
    '--primary': '#ff8a5c',
    '--primary-deep': '#d65f30',
    '--primary-soft': '#ffe1d2',
    '--accent': '#3fc7b7',
    '--accent-deep': '#1e9a8b',
    '--accent-soft': '#d3f4ef',
  },
  sideColors: [
    { base: '#ff8a5c', deep: '#d65f30', soft: '#ffe1d2' },
    { base: '#3fc7b7', deep: '#1e9a8b', soft: '#d3f4ef' },
  ],
};
