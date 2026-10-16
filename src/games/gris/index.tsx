import '@fontsource/bebas-neue';
import './skin.css';
import { useId } from 'react';
import type { GameDefinition } from '../types';
import { GrisPlay } from './Play';
import { flawless, modes, ranking, scoreText, winnerOf } from './rules';
import { theme } from './theme';

function pentagon(cx: number, cy: number, r: number, rotation: number): string {
  return Array.from({ length: 5 }, (_, i) => {
    const a = ((rotation + i * 72 - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function FootballArt({ size = 96 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const ink = '#2b2f3f';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={`ball${id}`} cx="36%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f1f4f8" />
          <stop offset="1" stopColor="#c9d1dd" />
        </radialGradient>
        <clipPath id={`clip${id}`}>
          <circle cx="50" cy="48" r="34" />
        </clipPath>
      </defs>
      <ellipse cx="50" cy="91" rx="30" ry="5" fill="rgba(23,58,40,.16)" />
      <circle cx="50" cy="48" r="34" fill={`url(#ball${id})`} />
      <g clipPath={`url(#clip${id})`} fill={ink}>
        <polygon points={pentagon(50, 48, 12, 0)} />
        {[0, 72, 144, 216, 288].map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          return <polygon key={deg} points={pentagon(50 + 33 * Math.cos(a), 48 + 33 * Math.sin(a), 11, 36)} />;
        })}
      </g>
      <g stroke={ink} strokeWidth="1.6" opacity=".5" strokeLinecap="round">
        {[0, 72, 144, 216, 288].map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          return <line key={deg} x1={50 + 12 * Math.cos(a)} y1={48 + 12 * Math.sin(a)} x2={50 + 23 * Math.cos(a)} y2={48 + 23 * Math.sin(a)} />;
        })}
      </g>
      <circle cx="50" cy="48" r="34" fill="none" stroke="rgba(43,47,63,.18)" strokeWidth="2" />
      <ellipse cx="37" cy="30" rx="8" ry="4.5" fill="#fff" opacity=".8" transform="rotate(-32 37 30)" />
    </svg>
  );
}

export const gris: GameDefinition = {
  id: 'gris',
  name: 'gris.name',
  tagline: 'gris.tagline',
  blurb: 'gris.blurb',
  duration: 'gris.duration',
  roundsLabel: 'gris.drops',
  tags: ['outdoor', 'ball', 'ffa', 'elimination'],
  theme,
  modes,
  Art: FootballArt,
  Play: GrisPlay,
  winnerOf,
  ranking,
  scoreText,
  flawless,
};
