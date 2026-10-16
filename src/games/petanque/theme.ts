import type { GameTheme } from '../types';

/**
 * Provençal terrain: sun-baked terracotta vs. the blue of Provence window shutters
 * (complementary), on cream gravel. Ochre, olive and lavender are decor-only (see skin.css).
 */
export const theme: GameTheme = {
  vars: {
    '--bg': '#f3e6cf',
    '--bg-2': '#ead9bb',
    '--surface': '#fffaf0',
    '--ink': '#3d2414',
    '--ink-soft': '#8c6a52',
    '--line': '#e6d2b2',
    '--primary': '#e2683c',
    '--primary-deep': '#b1451d',
    '--primary-soft': '#fbdcc9',
    '--accent': '#3b8fc9',
    '--accent-deep': '#22679b',
    '--accent-soft': '#d6e9f6',
  },
  sideColors: [
    { base: '#e2683c', deep: '#b1451d', soft: '#fbdcc9' },
    { base: '#3b8fc9', deep: '#22679b', soft: '#d6e9f6' },
  ],
};

/** Steel of a boule, wood of the jack: shared by the skin's tokens. */
export const STEEL = 'radial-gradient(circle at 34% 28%, #ffffff 0%, #e3e7ef 28%, #a9b0c0 70%, #747b8d 100%)';
export const JACK = 'radial-gradient(circle at 35% 30%, #ffe9a8 0%, #f0b43c 55%, #c98a1a 100%)';
