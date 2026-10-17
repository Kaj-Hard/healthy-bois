import { AnimatePresence, motion } from 'motion/react';
import { HeroGameCard, usePlayCounts } from '../components/GameCards';
import { AvatarStack, Icon, bouncy } from '../components/ui';
import { GAMES, getGame } from '../games/registry';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { useApp, useMatchesInProgress, usePlayersById } from '../store/app';
import type { Match } from '../games/types';

export function Home() {
  const t = useT();
  const navigate = useApp((s) => s.navigate);
  const players = useApp((s) => s.players).filter((p) => !p.archived);
  const inProgress = useMatchesInProgress();

  return (
    <div className="scroll">
      <div className="topbar" style={{ padding: 'calc(var(--safe-top) + 18px) 0 6px' }}>
        <div style={{ flex: 1 }}>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="muted" style={{ fontWeight: 800 }}>
            {t('home.greeting')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="page-title"
            style={{ fontSize: 34 }}
          >
            Healthy Bois <motion.span style={{ display: 'inline-block' }} animate={{ rotate: [0, -18, 12, -8, 0] }} transition={{ delay: 0.6, duration: 0.9 }}>💪</motion.span>
          </motion.h1>
        </div>
        <button className="icon-btn" aria-label={t('settings.title')} onClick={() => { fx.tap(); navigate({ name: 'settings' }); }}>
          {Icon.gear}
        </button>
      </div>

      {/* Every unfinished game, newest first: you can have a pétanque and a GRIS going at the same time. */}
      <AnimatePresence initial={false}>
        {inProgress.map((m) => (
          <ResumeCard key={m.id} match={m} />
        ))}
      </AnimatePresence>

      {players.length < 2 && inProgress.length === 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card tappable"
          onClick={() => { fx.tap(); navigate({ name: 'players' }); }}
          style={{ width: '100%', padding: 20, marginTop: 14, textAlign: 'left', display: 'flex', gap: 16, alignItems: 'center', background: 'var(--accent-soft)', borderColor: 'var(--accent)', boxShadow: '0 4px 0 var(--accent)' }}
        >
          <span style={{ fontSize: 46 }}>👋</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 900, fontSize: 19 }}>{t('home.noPlayersTitle')}</span>
            <span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{t('home.noPlayersSub')}</span>
          </span>
        </motion.button>
      )}

      <FavoriteGames />

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...bouncy, delay: 0.25 }}
        whileTap={{ scale: 0.97, y: 4 }}
        className="card"
        onClick={() => { fx.tap(); useApp.getState().resetTo({ name: 'library' }); }}
        style={{ width: '100%', marginTop: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}
      >
        <span style={{ display: 'flex' }}>
          {GAMES.slice(0, 3).map((g, i) => (
            <span
              key={g.id}
              style={{
                marginLeft: i ? -14 : 0,
                width: 46,
                height: 46,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: g.theme.vars['--primary'],
                border: '3px solid var(--surface)',
                zIndex: 3 - i,
              }}
            >
              <g.Art size={34} />
            </span>
          ))}
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 900, fontSize: 17 }}>{t('home.browseAll')}</span>
          <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{t('home.browseSub', { n: GAMES.length })}</span>
        </span>
        <span style={{ fontSize: 22, color: 'var(--primary-deep)', fontWeight: 900 }}>→</span>
      </motion.button>
    </div>
  );
}

/** Pinned games as big hero cards. Until something is pinned, show the most played ones. */
function FavoriteGames() {
  const t = useT();
  const favorites = useApp((s) => s.favorites);
  const plays = usePlayCounts();
  const pinned = favorites.map((id) => GAMES.find((g) => g.id === id)).filter((g) => !!g);
  const shown = pinned.length
    ? pinned
    : [...GAMES].sort((a, b) => (plays.get(b.id) ?? 0) - (plays.get(a.id) ?? 0)).slice(0, 3);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <p className="section-title">{pinned.length ? `♥ ${t('home.favorites')}` : t('home.pickGame')}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((g, i) => (
            <HeroGameCard key={g.id} game={g} index={i} />
          ))}
        </AnimatePresence>
      </div>
      {!pinned.length && (
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, marginTop: 12 }}>{t('home.favHint')}</p>
      )}
    </>
  );
}

function ResumeCard({ match }: { match: Match }) {
  const t = useT();
  const navigate = useApp((s) => s.navigate);
  const playersById = usePlayersById();
    const game = getGame(match.gameId);
    const v = game.theme.vars;
    const sides = game.ranking(match).slice(0, 3).map((id) => match.sides.find((s) => s.id === id)!);
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={bouncy}
        whileTap={{ scale: 0.97 }}
        onClick={() => { fx.select(); useApp.getState().resumeMatch(match.id); navigate({ name: 'play' }); }}
        style={{
          width: '100%',
          marginTop: 14,
          padding: 18,
          borderRadius: 26,
          textAlign: 'left',
          background: v['--surface'],
          border: `3px solid ${v['--primary']}`,
          boxShadow: `0 6px 0 ${v['--primary-deep']}`,
          color: v['--ink'],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <motion.span
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5c7a' }}
          />
          <span className="badge" style={{ background: v['--primary-soft'], color: v['--primary-deep'] }}>{t('home.resume')}</span>
          <span style={{ fontWeight: 900, marginLeft: 'auto' }}>{t(game.name)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sides.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AvatarStack players={s.playerIds.map((id) => playersById.get(id))} size={30} />
              <span className="name" style={{ flex: 1, fontSize: 15 }}>
                {s.playerIds.map((id) => playersById.get(id)?.name).join(' & ')}
              </span>
              <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.04em' }}>{game.scoreText(match, s.id)}</span>
            </div>
          ))}
        </div>
        <div className="btn block small" style={{ marginTop: 14, ['--c' as string]: v['--primary'], ['--d' as string]: v['--primary-deep'] }}>
          {t('home.resumeCta')} →
        </div>
      </motion.button>
    );
}
