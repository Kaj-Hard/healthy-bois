# File skeletons for a new game

Replace `mygame` / `MyGame` with the game id / component prefix. These match the current contracts in
`src/games/types.ts`, `src/components/play.tsx` and `src/components/ui.tsx`. If a contract has changed,
the real files win: read them.

```
src/games/mygame/
  rules.ts        pure rules: modes, winnerOf, ranking, scoreText (+ fannySides, flawless)
  rules.test.ts   vitest
  theme.ts        GameTheme + skin constants
  sfx.ts          signature sounds
  skin.css        the visual world, scoped to [data-skin='mygame']
  index.tsx       font + skin imports, Art SVG, GameDefinition
  Play.tsx        the scoring screen
```

## rules.ts

```ts
import type { GameMode, Match } from '../types';
import { sideScore, standings } from '../../lib/match';

export const CLASSIC = 'classic';

export const modes: GameMode[] = [
  {
    id: CLASSIC,
    name: 'mygame.classic',
    tagline: 'mygame.classicTag',
    rules: 'mygame.classicRules',
    emoji: '🎯',
    teams: false,                 // true → players split into 2 equal teams
    playerCounts: [2, 3, 4, 5, 6],
    target: 21,                   // points to reach, lives to lose, ...
  },
];

export function winnerOf(match: Match): string | undefined {
  for (const s of match.sides) if (sideScore(match, s.id) >= match.target) return s.id;
  return undefined;
}

export const ranking = (match: Match) => standings(match).map((s) => s.sideId);
export const scoreText = (match: Match, sideId: string) => String(sideScore(match, sideId));
```

## rules.test.ts

```ts
import { describe, expect, it } from 'vitest';
import type { Match } from '../types';
import { CLASSIC, ranking, winnerOf } from './rules';

function match(players: number, rounds: [string, number][]): Match {
  return {
    id: 'm', gameId: 'mygame', modeId: CLASSIC,
    sides: Array.from({ length: players }, (_, i) => ({ id: `s${i}`, playerIds: [`p${i}`] })),
    rounds: rounds.map(([sideId, points]) => ({ sideId, points, at: 0 })),
    target: 21, status: 'active', startedAt: 0,
  };
}

describe('mygame rules', () => {
  it('has no winner before the target', () => expect(winnerOf(match(2, [['s0', 20]]))).toBeUndefined());
  it('first to the target wins', () => expect(winnerOf(match(2, [['s0', 20], ['s1', 5], ['s0', 1]]))).toBe('s0'));
  it('ranks best first', () => expect(ranking(match(3, [['s2', 9], ['s0', 4]]))).toEqual(['s2', 's0', 's1']));
});
```

## theme.ts

```ts
import type { GameTheme } from '../types';

/** <World name>: <primary> vs. <complementary accent>, on <setting>. */
export const theme: GameTheme = {
  vars: {
    '--bg': '#…', '--bg-2': '#…', '--surface': '#ffffff',
    '--ink': '#…', '--ink-soft': '#…', '--line': '#…',
    '--primary': '#…', '--primary-deep': '#…', '--primary-soft': '#…',
    '--accent': '#…', '--accent-deep': '#…', '--accent-soft': '#…',
  },
  sideColors: [
    { base: '#…', deep: '#…', soft: '#…' },
    { base: '#…', deep: '#…', soft: '#…' },
  ],
};
```

## sfx.ts

```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { haptic, noise, tone, trill } from '../../lib/feedback';

export const sfx = {
  /** Opening a side. */
  tap() {
    noise(0, 0.08, { freq: 300, q: 0.8, gain: 0.2, type: 'lowpass' });
    haptic(() => Haptics.impact({ style: ImpactStyle.Light }));
  },
  /** One scoring event. */
  score(points: number) {
    for (let i = 0; i < Math.min(points, 6); i++) tone(880 + i * 120, i * 0.08, 0.1, 'triangle', 0.08);
    haptic(() => Haptics.impact({ style: ImpactStyle.Heavy }));
  },
  /** The big moment (knockout, bullseye, match point...). */
  big() {
    trill(1800, 0, 0.5, 0.08);
    noise(0.1, 1, { freq: 600, q: 0.9, gain: 0.15, sweepTo: 250 });
  },
};
```

## skin.css

```css
/*
 * MyGame skin: <one-line description of the world>.
 * Scoped to [data-skin='mygame'], which App.tsx sets on every mygame screen and on the overlays.
 */

[data-skin='mygame'] {
  --font-display: 'My Display Font', <fallback>, sans-serif;
  --font-label: var(--font-display);
  /* font-synthesis: none;  ← if the display face has a single weight */
}

/* the setting: gradients or an inline SVG data URI, never network images */
.screen[data-skin='mygame'] {
  background-color: var(--bg);
  background-image: /* texture layers */ none;
}

/* the top bar treatment (awning, scoreboard, neon sign, chalkboard...) */
[data-skin='mygame'] .topbar {
}
[data-skin='mygame'] .topbar h1 {
}

/* typography of shared components */
[data-skin='mygame'] .btn {
}
[data-skin='mygame'] .name,
[data-skin='mygame'] .badge,
[data-skin='mygame'] .section-title,
[data-skin='mygame'] .sheet h2 {
}
[data-skin='mygame'] .bottom-bar {
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}
```

## index.tsx

```tsx
import '@fontsource/my-display-font';
import './skin.css';
import { useId } from 'react';
import type { GameDefinition } from '../types';
import { MyGamePlay } from './Play';
import { modes, ranking, scoreText, winnerOf } from './rules';
import { theme } from './theme';

export function MyGameArt({ size = 96 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={`g${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#…" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="91" rx="30" ry="5" fill="rgba(0,0,0,.14)" />
      {/* the object, with a highlight */}
    </svg>
  );
}

export const mygame: GameDefinition = {
  id: 'mygame',
  name: 'mygame.name',
  tagline: 'mygame.tagline',
  blurb: 'mygame.blurb',
  duration: 'mygame.duration',
  // roundsLabel: 'mygame.rounds',   // "{n} …" on the winner screen
  tags: ['ffa'],
  theme,
  modes,
  Art: MyGameArt,
  Play: MyGamePlay,
  winnerOf,
  ranking,
  scoreText,
};
```

## Play.tsx

```tsx
import { useRef, useState, type MouseEvent } from 'react';
import { HistoryStrip, PointsSheet, useRoundActions, type SideView } from '../../components/play';
import { Icon, Sheet, TopBar, useOverlay } from '../../components/ui';
import { useT } from '../../i18n';
import { fx } from '../../lib/feedback';
import { sideScore } from '../../lib/match';
import { colorOf } from '../../lib/palette';
import { useApp, usePlayersById } from '../../store/app';
import type { PlayProps } from '../types';
import { sfx } from './sfx';

export function MyGamePlay({ match }: PlayProps) {
  const t = useT();
  const playersById = usePlayersById();
  const back = useApp((s) => s.back);
  const resetTo = useApp((s) => s.resetTo);
  const abandonMatch = useApp((s) => s.abandonMatch);
  const { score, undo } = useRoundActions();
  const [picking, setPicking] = useState<SideView>();
  const [origin, setOrigin] = useState<{ x: number; y: number }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const pickLock = useRef(false); // one pick per sheet opening

  const sides: SideView[] = match.sides.map((s) => {
    const p = playersById.get(s.playerIds[0]);
    const c = colorOf(p?.color);
    return { id: s.id, players: [p], label: p?.name ?? '?', color: { base: c.base, deep: c.deep, soft: `${c.base}38` } };
  });

  const open = (side: SideView, e: MouseEvent<HTMLElement>) => {
    sfx.tap();
    pickLock.current = false;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setPicking(side);
  };

  const pick = (points: number) => {
    const side = picking;
    if (!side || pickLock.current) return;
    pickLock.current = true;
    setPicking(undefined);
    setTimeout(() => score(side, points, { origin, sound: () => sfx.score(points) }), 120);
  };

  const abandon = async () => {
    setMenuOpen(false);
    if (await useOverlay.getState().ask(t('play.abandonConfirm'), t('play.abandon'), true)) {
      abandonMatch();
      resetTo({ name: 'home' });
    }
  };

  return (
    <>
      <TopBar
        onBack={back}
        title={t('mygame.name')}
        right={<button className="icon-btn" onClick={() => { fx.tap(); setMenuOpen(true); }}>{Icon.dots}</button>}
      />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 12px' }}>
        {sides.map((s) => (
          <button key={s.id} onClick={(e) => open(s, e)}>
            {/* signature side component: big, glanceable, skin-specific */}
            {s.label} {sideScore(match, s.id)}
          </button>
        ))}
      </div>
      <div className="bottom-bar" style={{ paddingTop: 10 }}>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>👆 {t('mygame.tapHint')}</p>
        <HistoryStrip match={match} sides={sides} onUndo={undo} />
      </div>
      <PointsSheet side={picking} max={3} onPick={pick} onClose={() => setPicking(undefined)} />
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <h2 style={{ marginBottom: 18 }}>{t('play.menu')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className="btn block danger" onClick={abandon}>🏳️ {t('play.abandon')}</button>
          <button className="btn block ghost" onClick={() => setMenuOpen(false)}>{t('play.keepPlaying')}</button>
        </div>
      </Sheet>
    </>
  );
}

/* ---------- skin pieces ---------- */
```

## Translation keys (add to BOTH en.ts and da.ts)

```ts
'mygame.name': '…',
'mygame.tagline': '…',          // home hero card, ~35 chars
'mygame.blurb': '…',            // library row, 1–2 short sentences
'mygame.duration': '10–20 min',
'mygame.classic': '…',          // mode name
'mygame.classicTag': '2–6 players · first to 21',
'mygame.classicRules': '…',     // shown on the mode card in setup
'mygame.tapHint': 'Tap whoever …',
```

Write files that contain Danish characters or emoji with the Write/Edit tools, not bash heredocs.
