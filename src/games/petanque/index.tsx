import { useId } from 'react';
import type { GameDefinition } from '../types';
import { sideScore, standings } from '../../lib/match';
import { modes, winnerOf } from './rules';
import { PetanquePlay } from './Play';
import { theme } from './theme';

export function BouleArt({ size = 96 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={`steel${id}`} cx="34%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#e3e7ef" />
          <stop offset="0.75" stopColor="#a9b0c0" />
          <stop offset="1" stopColor="#7d8496" />
        </radialGradient>
        <radialGradient id={`jack${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="1" stopColor="#f2b51c" />
        </radialGradient>
      </defs>
      <ellipse cx="46" cy="91" rx="32" ry="5" fill="rgba(58,38,24,.14)" />
      <circle cx="46" cy="52" r="36" fill={`url(#steel${id})`} />
      <path d="M13 44 Q46 62 79 40" stroke="#6f7688" strokeWidth="2.4" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M11.5 54 Q46 74 80.5 50" stroke="#6f7688" strokeWidth="2.4" fill="none" opacity=".55" strokeLinecap="round" />
      <ellipse cx="33" cy="33" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 33 33)" />
      <ellipse cx="84" cy="93" rx="10" ry="2.4" fill="rgba(58,38,24,.14)" />
      <circle cx="84" cy="83" r="10" fill={`url(#jack${id})`} />
      <circle cx="81" cy="80" r="2.6" fill="#fff" opacity=".8" />
    </svg>
  );
}

export const petanque: GameDefinition = {
  id: 'petanque',
  name: 'petanque.name',
  tagline: 'petanque.tagline',
  blurb: 'petanque.blurb',
  duration: 'petanque.duration',
  tags: ['outdoor', 'ball', 'teams', 'ffa'],
  theme,
  modes,
  Art: BouleArt,
  Play: PetanquePlay,
  winnerOf,
  ranking: (match) => standings(match).map((s) => s.sideId),
  scoreText: (match, sideId) => String(sideScore(match, sideId)),
  fannySides: (match) =>
    match.sides.filter((s) => s.id !== match.winnerSideId && sideScore(match, s.id) === 0).map((s) => s.id),
};
