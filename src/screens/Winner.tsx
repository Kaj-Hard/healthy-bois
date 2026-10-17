import { motion } from 'motion/react';
import { useEffect } from 'react';
import { Polaroid } from '../components/Polaroid';
import { AvatarStack, bouncy } from '../components/ui';
import { getGame } from '../games/registry';
import { useT } from '../i18n';
import { celebrate } from '../lib/confetti';
import { fx } from '../lib/feedback';
import { uid } from '../lib/id';
import { winsFor } from '../lib/stats';
import { useApp, usePlayersById } from '../store/app';

export function Winner({ matchId }: { matchId: string }) {
  const t = useT();
  const match = useApp((s) => s.matches.find((m) => m.id === matchId));
  const matches = useApp((s) => s.matches);
  const resetTo = useApp((s) => s.resetTo);
  const navigate = useApp((s) => s.navigate);
  const reopenMatch = useApp((s) => s.reopenMatch);
  const startMatch = useApp((s) => s.startMatch);
  const replace = useApp((s) => s.replace);
  const playersById = usePlayersById();

  const game = match ? getGame(match.gameId) : undefined;

  useEffect(() => {
    if (!game) return;
    fx.win();
    const v = game.theme.vars;
    celebrate([v['--primary'], v['--accent'], '#ffd45c', '#ffffff']);
  }, [game]);

  if (!match || !game || !match.winnerSideId) return null;

  const winnerSide = match.sides.find((s) => s.id === match.winnerSideId)!;
  const winners = winnerSide.playerIds.map((id) => playersById.get(id));
  const ranking = game.ranking(match);
  const losersOnZero = (game.fannySides?.(match) ?? []).map((id) => match.sides.find((s) => s.id === id)!);
  const fanny = losersOnZero.length > 0;
  const flawless = game.flawless?.(match) ?? false;
  const minutes = Math.max(1, Math.round(((match.finishedAt ?? Date.now()) - match.startedAt) / 60000));
  const v = game.theme.vars;

  const rematch = () => {
    fx.select();
    startMatch({
      gameId: match.gameId,
      modeId: match.modeId,
      sides: match.sides.map((s) => ({ id: uid(), playerIds: s.playerIds })),
    });
    resetTo({ name: 'home' });
    navigate({ name: 'play' });
  };

  const oops = () => {
    fx.undo();
    reopenMatch(match.id);
    resetTo({ name: 'home' });
    navigate({ name: 'play' });
  };

  return (
    <div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'calc(var(--safe-top) + 24px)', textAlign: 'center' }}>
      {/* rotating sun rays */}
      <div style={{ position: 'relative', width: 260, minHeight: match.photo ? 300 : 220, display: 'grid', placeItems: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: 340,
            height: 340,
            borderRadius: '50%',
            willChange: 'transform',
            background: `repeating-conic-gradient(${v['--primary']}33 0deg 12deg, transparent 12deg 24deg)`,
            maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)',
          }}
        />
        {match.photo ? (
          <div style={{ position: 'relative' }}>
            <Polaroid path={match.photo} width={190} delay={0.1} />
            <motion.span
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 12 }}
              transition={{ ...bouncy, delay: 0.6 }}
              style={{ position: 'absolute', right: -26, top: -18, fontSize: 56, filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.12))' }}
            >
              🏆
            </motion.span>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0, rotate: -40, y: 60 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={{ ...bouncy, delay: 0.1 }}
            style={{ fontSize: 110, filter: 'drop-shadow(0 8px 0 rgba(0,0,0,.12))' }}
          >
            🏆
          </motion.div>
        )}
      </div>

      <motion.h1
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...bouncy, delay: 0.25 }}
        className="page-title"
        style={{ fontSize: 44, color: 'var(--primary-deep)' }}
      >
        {winners.length > 1 ? t('win.titleTeam') : t('win.title')}
      </motion.h1>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...bouncy, delay: 0.4 }} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <AvatarStack players={winners} size={72} />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900 }}>{winners.map((p) => p?.name).join(' & ')}</p>
      </motion.div>

      {!match.photo && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...bouncy, delay: 0.7 }}
          className="btn small accent"
          style={{ marginTop: 14 }}
          onClick={() => { fx.tap(); replace({ name: 'photo', matchId: match.id }); }}
        >
          📸 {t('photo.add')}
        </motion.button>
      )}

      {flawless && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 4 }}
          transition={{ ...bouncy, delay: 0.9 }}
          style={{ marginTop: 16, padding: '10px 18px', borderRadius: 18, background: 'var(--primary)', color: '#fff', boxShadow: '0 5px 0 var(--primary-deep)' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900 }}>✨ {t('win.flawless')}</div>
          <div style={{ fontWeight: 800 }}>{t('win.flawlessSub')}</div>
        </motion.div>
      )}

      {fanny && (
        <motion.div
          initial={{ scale: 0, rotate: 20 }}
          animate={{ scale: 1, rotate: -6 }}
          transition={{ ...bouncy, delay: 0.9 }}
          style={{ marginTop: 16, padding: '10px 18px', borderRadius: 18, background: '#ff8fc7', color: '#fff', boxShadow: '0 5px 0 #d9589a' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900 }}>💋 {t('win.fanny')}</div>
          <div style={{ fontWeight: 800 }}>
            {t('win.fannySub', {
              names: losersOnZero.flatMap((s) => s.playerIds.map((id) => playersById.get(id)?.name)).join(' & '),
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...bouncy, delay: 0.55 }}
        className="card"
        style={{ width: '100%', marginTop: 22, overflow: 'hidden', textAlign: 'left' }}
      >
        {ranking.map((sideId, i) => {
          const side = match.sides.find((s) => s.id === sideId)!;
          const ps = side.playerIds.map((id) => playersById.get(id));
          return (
            <div key={sideId} className="list-row" style={{ background: i === 0 ? 'var(--primary-soft)' : undefined }}>
              <span style={{ width: 26, fontWeight: 900, color: 'var(--ink-soft)' }}>{i === 0 ? '👑' : i + 1}</span>
              <AvatarStack players={ps} size={34} />
              <span className="name" style={{ flex: 1, fontSize: 16 }}>{ps.map((p) => p?.name).join(' & ')}</span>
              <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.04em' }}>{game.scoreText(match, sideId)}</span>
            </div>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {winners.map((p) => {
          if (!p) return null;
          const n = winsFor(matches, p.id, match.gameId);
          return (
            <p key={p.id} style={{ fontWeight: 800, color: 'var(--accent-deep)' }}>
              ⭐ {n === 1 ? t('win.firstWin', { game: t(game.name), name: p.name }) : t('win.totalWins', { name: p.name, n, game: t(game.name) })}
            </p>
          );
        })}
        <p className="muted" style={{ fontWeight: 700, fontSize: 14 }}>
          {t(game.roundsLabel ?? 'win.ends', { n: match.rounds.length })} · {t('win.duration', { n: minutes })}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...bouncy, delay: 1 }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24, paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}
      >
        <button className="btn block" onClick={rematch}>🔁 {t('win.rematch')}</button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => { fx.tap(); resetTo({ name: 'home' }); navigate({ name: 'setup', gameId: match.gameId }); }}>
            {t('win.newGame')}
          </button>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => { fx.tap(); resetTo({ name: 'home' }); }}>
            {t('win.home')}
          </button>
        </div>
        <button onClick={oops} style={{ fontWeight: 800, color: 'var(--ink-soft)', padding: 10, textDecoration: 'underline' }}>
          ↩ {t('win.undo')}
        </button>
      </motion.div>
    </div>
  );
}
