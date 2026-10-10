import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarStack, Icon, bouncy, spring, useOverlay } from '../components/ui';
import { GAMES, getGame } from '../games/registry';
import type { Match } from '../games/types';
import { useT, type T } from '../i18n';
import { fx } from '../lib/feedback';
import { sideScore } from '../lib/match';
import { finishedMatches, leaderboard, type PlayerStats } from '../lib/stats';
import { useApp, usePlayersById, type Player } from '../store/app';

export function Stats() {
  const t = useT();
  const matches = useApp((s) => s.matches);
  const playersById = usePlayersById();
  const [gameId, setGameId] = useState<string | undefined>();
  const [modeId, setModeId] = useState<string | undefined>();

  const board = useMemo(() => leaderboard(matches, { gameId, modeId }), [matches, gameId, modeId]);
  const recent = useMemo(() => finishedMatches(matches, { gameId, modeId }).reverse().slice(0, 30), [matches, gameId, modeId]);
  const game = gameId ? getGame(gameId) : undefined;

  const pickGame = (id?: string) => {
    fx.tap();
    setGameId(id);
    setModeId(undefined);
  };

  return (
    <div className="scroll">
      <div style={{ padding: 'calc(var(--safe-top) + 22px) 4px 14px' }}>
        <h1 className="page-title">{t('stats.title')} 🏆</h1>
      </div>

      <div className="chip-row" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        <button className={`chip ${!gameId ? 'on' : ''}`} onClick={() => pickGame(undefined)}>
          🌍 {t('stats.all')}
        </button>
        {GAMES.map((g) => (
          <button key={g.id} className={`chip ${gameId === g.id ? 'on' : ''}`} onClick={() => pickGame(g.id)}>
            {t(g.name)}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {game && game.modes.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="chip-row"
            style={{ marginTop: 8, overflow: 'hidden' }}
          >
            <button className={`chip ${!modeId ? 'on' : ''}`} onClick={() => { fx.tap(); setModeId(undefined); }}>
              {t('stats.allModes')}
            </button>
            {game.modes.map((m) => (
              <button key={m.id} className={`chip ${modeId === m.id ? 'on' : ''}`} onClick={() => { fx.tap(); setModeId(m.id); }}>
                {m.emoji} {t(m.name)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {board.length === 0 ? (
        <div className="empty">
          <motion.div className="big" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            🏆
          </motion.div>
          {t('stats.empty')}
        </div>
      ) : (
        <>
          <Podium key={`${gameId}-${modeId}`} top={board.slice(0, 3)} playersById={playersById} t={t} />
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="list-row" style={{ paddingTop: 10, paddingBottom: 8, fontSize: 11, fontWeight: 900, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span style={{ width: 22 }}>#</span>
              <span style={{ flex: 1 }} />
              <StatCol>{t('stats.wins')}</StatCol>
              <StatCol>{t('stats.fannys')}</StatCol>
            </div>
            {board.map((s, i) => (
              <motion.div
                key={s.playerId}
                className="list-row"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: Math.min(i, 12) * 0.03 }}
              >
                <span style={{ width: 22, fontWeight: 900, color: 'var(--ink-soft)' }}>{i + 1}</span>
                <Avatar player={playersById.get(s.playerId)} size={38} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="name" style={{ display: 'block', fontSize: 16 }}>{playersById.get(s.playerId)?.name ?? '?'}</span>
                  <span className="muted" style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {s.played} {t('stats.played').toLowerCase()} · {Math.round((s.wins / s.played) * 100)}%
                  </span>
                </span>
                <StatCol strong>{s.wins}</StatCol>
                <StatCol>{s.fannys ? `💋 ${s.fannys}` : '–'}</StatCol>
              </motion.div>
            ))}
          </div>

          <p className="section-title">{t('stats.recent')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
              {recent.map((m) => (
                <RecentMatch key={m.id} match={m} playersById={playersById} t={t} />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

function StatCol({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span style={{ width: 56, flex: 'none', textAlign: 'center', fontWeight: strong ? 900 : 700, fontSize: strong ? 18 : 14, color: strong ? 'var(--primary-deep)' : 'var(--ink-soft)' }}>
      {children}
    </span>
  );
}

function Podium({ top, playersById, t }: { top: PlayerStats[]; playersById: Map<string, Player>; t: T }) {
  const order = [1, 0, 2].filter((i) => top[i]);
  const heights = [136, 106, 92];
  const medals = ['🥇', '🥈', '🥉'];
  const colors = ['var(--accent)', 'var(--primary)', 'var(--primary-soft)'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, margin: '26px 0 20px', minHeight: 250 }}>
      {order.map((rank) => {
        const s = top[rank];
        const p = playersById.get(s.playerId);
        return (
          <div key={s.playerId} style={{ flex: 1, maxWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <motion.div initial={{ scale: 0, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ ...bouncy, delay: 0.35 + (2 - rank) * 0.12 }} style={{ position: 'relative' }}>
              {rank === 0 && (
                <motion.span
                  animate={{ rotate: [-14, -6, -14], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', top: -26, left: '50%', marginLeft: -14, fontSize: 28 }}
                >
                  👑
                </motion.span>
              )}
              <Avatar player={p} size={rank === 0 ? 68 : 54} ring />
            </motion.div>
            <span className="name" style={{ fontSize: 14, maxWidth: '100%' }}>{p?.name ?? '?'}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[rank] }}
              transition={{ ...spring, delay: 0.1 + (2 - rank) * 0.1 }}
              style={{
                width: '100%',
                borderRadius: '18px 18px 8px 8px',
                background: colors[rank],
                boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 10,
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: 26 }}>{medals[rank]}</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: rank === 2 ? 'var(--primary-deep)' : '#fff' }}>{s.wins}</span>
              <span style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: rank === 2 ? 'var(--primary-deep)' : '#fff', opacity: 0.9 }}>
                {t('stats.wins')}
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function dateLabel(ts: number, t: T, lang: string): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  if (same(d, today)) return `${t('stats.today')} ${time}`;
  if (same(d, yesterday)) return `${t('stats.yesterday')} ${time}`;
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' }) + ` ${time}`;
}

function RecentMatch({ match, playersById, t }: { match: Match; playersById: Map<string, Player>; t: T }) {
  const deleteMatch = useApp((s) => s.deleteMatch);
  const lang = useApp((s) => s.settings.lang);
  const game = getGame(match.gameId);
  const mode = game.modes.find((m) => m.id === match.modeId);
  const sides = [...match.sides].sort((a, b) => sideScore(match, b.id) - sideScore(match, a.id));

  const remove = async () => {
    fx.tap();
    if (await useOverlay.getState().ask(t('stats.deleteMatch'), t('common.delete'), true)) deleteMatch(match.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <game.Art size={24} />
        <span style={{ fontWeight: 900, fontSize: 14 }}>{t(game.name)}</span>
        {mode && <span className="muted" style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>· {t(mode.name)}</span>}
        <span className="muted" style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12 }}>{dateLabel(match.finishedAt ?? match.startedAt, t, lang)}</span>
        <button onClick={remove} aria-label={t('common.delete')} style={{ width: 26, height: 26, color: 'var(--ink-soft)', opacity: 0.6, display: 'grid', placeItems: 'center' }}>
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{Icon.close}</span>
        </button>
      </div>
      {sides.map((s) => {
        const won = s.id === match.winnerSideId;
        const ps = s.playerIds.map((id) => playersById.get(id));
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', opacity: won ? 1 : 0.65 }}>
            <AvatarStack players={ps} size={24} />
            <span className="name" style={{ flex: 1, fontSize: 14, fontWeight: won ? 900 : 700 }}>
              {ps.map((p) => p?.name ?? '?').join(' & ')} {won && '🏆'}
            </span>
            <span style={{ fontWeight: 900 }}>{sideScore(match, s.id)}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
