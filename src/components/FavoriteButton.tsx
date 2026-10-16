import { motion, useAnimate } from 'motion/react';
import type { MouseEvent } from 'react';
import { useT } from '../i18n';
import { pop } from '../lib/confetti';
import { fx } from '../lib/feedback';
import { useApp } from '../store/app';
import { useOverlay } from './ui';

/** ♥ toggle for pinning a game to the home screen. `onDark` for use on coloured cards. */
export function FavoriteButton({ gameId, onDark, size = 44 }: { gameId: string; onDark?: boolean; size?: number }) {
  const t = useT();
  const on = useApp((s) => s.favorites.includes(gameId));
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const [scope, animate] = useAnimate();

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    // Cards behind the heart are tappable too; the heart must not start a game.
    e.stopPropagation();
    const nowOn = toggleFavorite(gameId);
    if (nowOn) {
      fx.select();
      const r = e.currentTarget.getBoundingClientRect();
      pop(r.left + r.width / 2, r.top + r.height / 2, ['#ff5c8a', '#ff8fb3', '#ffd45c', '#ffffff'], 24);
      void animate(scope.current, { scale: [1, 1.5, 0.9, 1.1, 1], rotate: [0, -15, 10, 0] }, { duration: 0.5 });
    } else {
      fx.tap();
      void animate(scope.current, { scale: [1, 0.7, 1] }, { duration: 0.25 });
    }
    useOverlay.getState().show(t(nowOn ? 'fav.added' : 'fav.removed'));
  };

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={toggle}
      aria-pressed={on}
      aria-label="favourite"
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: onDark ? 'rgba(255,255,255,.25)' : on ? '#ffe3ec' : 'var(--bg)',
        border: onDark ? 'none' : `2px solid ${on ? '#ff8fb3' : 'var(--line)'}`,
      }}
    >
      <span ref={scope} style={{ display: 'inline-flex', width: size * 0.52, height: size * 0.52 }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path
            d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"
            fill={on ? '#ff5c8a' : 'none'}
            stroke={on ? '#d93a6a' : onDark ? '#fff' : 'var(--ink-soft)'}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </motion.button>
  );
}
