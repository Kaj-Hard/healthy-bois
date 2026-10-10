import { motion } from 'motion/react';
import { AvatarStack, Icon, RollingNumber, bouncy } from '../components/ui';
import { GAMES, getGame } from '../games/registry';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { sideScore } from '../lib/match';
import { useActiveMatch, useApp, usePlayersById } from '../store/app';
import type { Match } from '../games/types';

export function Home() {
  const t = useT();
  const navigate = useApp((s) => s.navigate);
  const players = useApp((s) => s.players).filter((p) => !p.archived);
  const active = useActiveMatch();

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

      {active && <ResumeCard match={active} />}

      {players.length < 2 && !active && (
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

      <p className="section-title">{t('home.pickGame')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GAMES.map((g, i) => {
          const v = g.theme.vars;
          return (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...bouncy, delay: 0.1 + i * 0.06 }}
              whileTap={{ scale: 0.97, y: 4 }}
              onClick={() => { fx.select(); navigate({ name: 'setup', gameId: g.id }); }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                minHeight: 150,
                borderRadius: 28,
                padding: 22,
                textAlign: 'left',
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
                <g.Art size={120} />
              </motion.span>
              <span style={{ position: 'relative', display: 'block', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em', textShadow: `0 3px 0 ${v['--primary-deep']}` }}>
                {t(g.name)}
              </span>
              <span style={{ position: 'relative', display: 'block', fontWeight: 800, opacity: 0.95, maxWidth: '58%', marginTop: 4 }}>
                {t(g.tagline)}
              </span>
              <span style={{ position: 'relative', display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap', maxWidth: '62%' }}>
                {g.modes.map((m) => (
                  <span key={m.id} className="badge" style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>
                    {m.emoji} {t(m.name)}
                  </span>
                ))}
              </span>
            </motion.button>
          );
        })}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ border: '3px dashed var(--line)', borderRadius: 28, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}
        >
          <span style={{ fontSize: 36 }}>🎲</span>
          <span>
            <span style={{ display: 'block', fontWeight: 900 }}>{t('home.moreSoon')}</span>
            <span className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{t('home.moreSoonSub')}</span>
          </span>
        </motion.div>
      </div>

    </div>
  );
}

function ResumeCard({ match }: { match: Match }) {
  const t = useT();
  const navigate = useApp((s) => s.navigate);
  const playersById = usePlayersById();
    const game = getGame(match.gameId);
    const v = game.theme.vars;
    const sides = match.sides.map((s) => ({ s, score: sideScore(match, s.id) })).sort((a, b) => b.score - a.score).slice(0, 3);
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={bouncy}
        whileTap={{ scale: 0.97 }}
        onClick={() => { fx.select(); navigate({ name: 'play' }); }}
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
          {sides.map(({ s, score }) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AvatarStack players={s.playerIds.map((id) => playersById.get(id))} size={30} />
              <span className="name" style={{ flex: 1, fontSize: 15 }}>
                {s.playerIds.map((id) => playersById.get(id)?.name).join(' & ')}
              </span>
              <RollingNumber value={score} style={{ fontWeight: 900, fontSize: 24 }} />
            </div>
          ))}
        </div>
        <div className="btn block small" style={{ marginTop: 14, ['--c' as string]: v['--primary'], ['--d' as string]: v['--primary-deep'] }}>
          {t('home.resumeCta')} →
        </div>
      </motion.button>
    );
}
