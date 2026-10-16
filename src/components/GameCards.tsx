import { motion } from 'motion/react';
import { useMemo } from 'react';
import { playerRange, type GameDefinition } from '../games/types';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { useApp } from '../store/app';
import { FavoriteButton } from './FavoriteButton';
import { bouncy } from './ui';

/** Finished games per game id. */
export function usePlayCounts(): Map<string, number> {
  const matches = useApp((s) => s.matches);
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) if (m.status === 'finished') counts.set(m.gameId, (counts.get(m.gameId) ?? 0) + 1);
    return counts;
  }, [matches]);
}

function startSetup(gameId: string) {
  fx.select();
  useApp.getState().navigate({ name: 'setup', gameId });
}

/**
 * Big, bold, themed card: the game's own colours and art so it's obvious at a glance.
 * A div (not a button) because the ♥ inside is its own button.
 */
export function HeroGameCard({ game, index = 0 }: { game: GameDefinition; index?: number }) {
  const t = useT();
  const v = game.theme.vars;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ ...bouncy, delay: 0.08 + index * 0.06 }}
      whileTap={{ scale: 0.97, y: 4 }}
      onClick={() => startSetup(game.id)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: 150,
        borderRadius: 28,
        padding: 22,
        textAlign: 'left',
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${v['--primary']} 0%, ${v['--primary']} 55%, ${v['--accent']} 140%)`,
        boxShadow: `0 7px 0 ${v['--primary-deep']}`,
        color: '#fff',
      }}
    >
      <span style={{ position: 'absolute', right: -30, bottom: -40, width: 170, height: 170, borderRadius: '50%', background: v['--accent'], opacity: 0.9 }} />
      <motion.span
        style={{ position: 'absolute', right: 10, bottom: 4 }}
        animate={{ rotate: [0, 8, 0], y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <game.Art size={120} />
      </motion.span>
      <span style={{ position: 'absolute', top: 14, right: 14 }}>
        <FavoriteButton gameId={game.id} onDark size={40} />
      </span>
      <span style={{ position: 'relative', display: 'block', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', textShadow: `0 3px 0 ${v['--primary-deep']}`, maxWidth: '75%' }}>
        {t(game.name)}
      </span>
      <span style={{ position: 'relative', display: 'block', fontWeight: 800, opacity: 0.95, maxWidth: '58%', marginTop: 4 }}>
        {t(game.tagline)}
      </span>
      <span style={{ position: 'relative', display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap', maxWidth: '62%' }}>
        {game.modes.map((m) => (
          <span key={m.id} className="badge" style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>
            {m.emoji} {t(m.name)}
          </span>
        ))}
      </span>
    </motion.div>
  );
}

/** Compact library row: art tile, name, facts, ♥. */
export function GameRow({ game, plays, index = 0 }: { game: GameDefinition; plays: number; index?: number }) {
  const t = useT();
  const v = game.theme.vars;
  const [min, max] = playerRange(game);
  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ ...bouncy, delay: Math.min(index, 8) * 0.04 }}
      whileTap={{ scale: 0.97, y: 3 }}
      onClick={() => startSetup(game.id)}
      className="card"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, cursor: 'pointer', boxShadow: `0 5px 0 ${v['--primary']}`, borderColor: v['--primary'] }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          flex: 'none',
          borderRadius: 20,
          display: 'grid',
          placeItems: 'center',
          background: `linear-gradient(135deg, ${v['--primary']}, ${v['--accent']})`,
          boxShadow: `inset 0 -5px 0 ${v['--primary-deep']}`,
        }}
      >
        <game.Art size={60} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="name" style={{ fontSize: 19 }}>{t(game.name)}</span>
          {plays === 0 && (
            <span className="badge" style={{ background: v['--accent'], color: '#fff', padding: '2px 8px' }}>{t('library.new')}</span>
          )}
        </div>
        <p className="muted" style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.35, margin: '2px 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {t(game.blurb)}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: v['--primary-soft'], color: v['--primary-deep'] }}>👥 {t('library.playersShort', { min, max })}</span>
          <span className="badge" style={{ background: v['--primary-soft'], color: v['--primary-deep'] }}>⏱ {t(game.duration)}</span>
          {plays > 0 && (
            <span className="badge" style={{ background: v['--accent-soft'], color: v['--accent-deep'] }}>🏆 {t('library.played', { n: plays })}</span>
          )}
        </div>
      </div>
      <FavoriteButton gameId={game.id} />
    </motion.div>
  );
}
