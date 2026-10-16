import { AnimatePresence, LayoutGroup, motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { HistoryStrip, useRoundActions, type SideView } from '../../components/play';
import { Avatar, Icon, Sheet, TopBar, bouncy, spring, useOverlay } from '../../components/ui';
import { useT } from '../../i18n';
import { fx } from '../../lib/feedback';
import { colorOf } from '../../lib/palette';
import { useApp, usePlayersById } from '../../store/app';
import type { Match, PlayProps } from '../types';
import { WORD, aliveSides, eliminationOrder, letters } from './rules';
import { LETTER } from './theme';

export function GrisPlay({ match }: PlayProps) {
  const t = useT();
  const playersById = usePlayersById();
  const back = useApp((s) => s.back);
  const resetTo = useApp((s) => s.resetTo);
  const abandonMatch = useApp((s) => s.abandonMatch);
  const { score, undo } = useRoundActions();

  const [picking, setPicking] = useState<SideView>();
  const [origin, setOrigin] = useState<{ x: number; y: number }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [knockedOut, setKnockedOut] = useState<SideView>();
  // One letter per opening: the sheet is still tappable while it animates away.
  const pickLock = useRef(false);

  const sides: SideView[] = match.sides.map((s) => {
    const p = playersById.get(s.playerIds[0]);
    const c = colorOf(p?.color);
    return { id: s.id, players: [p], label: p?.name ?? '?', color: { base: c.base, deep: c.deep, soft: `${c.base}38` } };
  });
  const byId = new Map(sides.map((s) => [s.id, s]));
  const alive = aliveSides(match);
  const aliveViews = sides.filter((s) => alive.includes(s.id));
  const outViews = eliminationOrder(match).map((id) => byId.get(id)!);
  const fewest = Math.min(...alive.map((id) => letters(match, id)));
  const leaders = alive.filter((id) => letters(match, id) === fewest);
  const finalDuel = alive.length === 2 && match.sides.length > 2;

  const openSheet = (side: SideView, e: MouseEvent<HTMLElement>) => {
    if (match.status !== 'active') return;
    fx.tap();
    pickLock.current = false;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setPicking(side);
  };

  const give = () => {
    const side = picking;
    if (!side || pickLock.current) return;
    pickLock.current = true;
    setPicking(undefined);
    const have = letters(match, side.id);
    const letter = WORD[have];
    const out = have + 1 >= match.target;
    setTimeout(() => {
      const next = score(side, 1, {
        origin,
        sound: out ? fx.knockout : fx.stamp,
        message: out ? t('gris.knockedOut', { name: side.label }) : t('gris.gotLetter', { name: side.label, letter }),
        finishDelay: 1700,
      });
      if (next && out) {
        setKnockedOut(side);
        setTimeout(() => setKnockedOut(undefined), 1500);
      }
    }, 120);
  };

  const abandon = async () => {
    setMenuOpen(false);
    const ok = await useOverlay.getState().ask(t('play.abandonConfirm'), t('play.abandon'), true);
    if (ok) {
      abandonMatch();
      resetTo({ name: 'home' });
    }
  };

  // History chips show the letter each drop earned.
  const letterOf = (index: number) => {
    const sideId = match.rounds[index].sideId;
    const before = match.rounds.slice(0, index).filter((r) => r.sideId === sideId).length;
    return WORD[Math.min(before, WORD.length - 1)];
  };

  return (
    <>
      <TopBar
        onBack={back}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('gris.name')}
            <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)' }}>
              {t('gris.left', { n: alive.length, total: match.sides.length })}
            </span>
          </span>
        }
        right={
          <button className="icon-btn" aria-label={t('play.menu')} onClick={() => { fx.tap(); setMenuOpen(true); }}>
            {Icon.dots}
          </button>
        }
      />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, minHeight: 36, marginBottom: 6 }}>
          <motion.span
            key={match.rounds.length}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={bouncy}
            className="badge"
            style={{ background: 'var(--ink)', color: '#fff', fontSize: 14, padding: '7px 16px' }}
          >
            ⚽ {t('gris.drops', { n: match.rounds.length })}
          </motion.span>
          <AnimatePresence>
            {finalDuel && (
              <motion.span
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [1, 1.08, 1], rotate: -3 }}
                exit={{ scale: 0 }}
                transition={{ scale: { repeat: Infinity, duration: 1.3 }, rotate: bouncy }}
                className="badge"
                style={{ background: 'var(--accent)', color: '#fff', fontSize: 14, padding: '7px 14px' }}
              >
                ⚔️ {t('gris.finalDuel')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <LayoutGroup>
          <div style={{ display: 'grid', gridTemplateColumns: aliveViews.length <= 2 ? '1fr' : '1fr 1fr', gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {aliveViews.map((s) => (
                <PlayerCard
                  key={s.id}
                  side={s}
                  match={match}
                  big={aliveViews.length <= 2}
                  leader={match.rounds.length > 0 && leaders.length === 1 && leaders[0] === s.id}
                  onTap={(e) => openSheet(s, e)}
                />
              ))}
            </AnimatePresence>
          </div>

          {outViews.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 20 }}>💀 {t('gris.outTitle')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {outViews.map((s, i) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...bouncy, delay: 0.25 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px 6px 6px',
                      borderRadius: 999,
                      background: 'var(--surface)',
                      border: '2px solid var(--line)',
                    }}
                  >
                    <span style={{ filter: 'grayscale(1)', opacity: 0.6 }}>
                      <Avatar player={s.players[0]} size={28} />
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>{s.label}</span>
                    <span className="muted" style={{ fontWeight: 900, fontSize: 12 }}>#{match.sides.length - i}</span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </LayoutGroup>
      </div>

      <div className="bottom-bar" style={{ paddingTop: 10 }}>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
          👆 {t('gris.tapDropper')}
        </p>
        <HistoryStrip match={match} sides={sides} onUndo={undo} label={(_, i) => letterOf(i)} emptyLabel="gris.noDrops" />
      </div>

      <LetterSheet side={picking} match={match} onGive={give} onClose={() => setPicking(undefined)} />

      <KnockoutOverlay side={knockedOut} />

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <h2 style={{ marginBottom: 18 }}>{t('play.menu')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className="btn block danger" onClick={abandon}>
            🏳️ {t('play.abandon')}
          </button>
          <button className="btn block ghost" onClick={() => setMenuOpen(false)}>
            {t('play.keepPlaying')}
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** The four GRIS tiles. Earned letters stamp in; the rest wait as dashed outlines. */
export function LetterTiles({ count, size = 30, highlightNext }: { count: number; size?: number; highlightNext?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: size * 0.18, justifyContent: 'center' }}>
      {WORD.split('').map((ch, i) => {
        const earned = i < count;
        const next = highlightNext && i === count;
        return (
          <motion.span
            key={`${i}-${earned}`}
            initial={earned ? { scale: 2.4, rotate: -25, opacity: 0 } : false}
            animate={next ? { scale: [1, 1.12, 1], rotate: 0, opacity: 1 } : { scale: 1, rotate: earned ? (i % 2 ? 4 : -4) : 0, opacity: earned ? 1 : 0.4 }}
            transition={next ? { repeat: Infinity, duration: 1 } : { type: 'spring', stiffness: 700, damping: 18 }}
            style={{
              width: size,
              height: size * 1.12,
              borderRadius: size * 0.28,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: size * 0.62,
              lineHeight: 1,
              background: earned ? LETTER.base : next ? LETTER.soft : 'transparent',
              color: earned ? '#fff' : next ? LETTER.deep : 'var(--ink-soft)',
              border: earned ? 'none' : `2px dashed ${next ? LETTER.base : 'var(--ink-soft)'}`,
              boxShadow: earned ? `0 ${size * 0.1}px 0 ${LETTER.deep}` : 'none',
            }}
          >
            {ch}
          </motion.span>
        );
      })}
    </div>
  );
}

function PlayerCard({
  side,
  match,
  big,
  leader,
  onTap,
}: {
  side: SideView;
  match: Match;
  big: boolean;
  leader: boolean;
  onTap: (e: MouseEvent<HTMLElement>) => void;
}) {
  const t = useT();
  const n = letters(match, side.id);
  const lastLife = n === match.target - 1;
  const [scope, animate] = useAnimate();
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current && scope.current) {
      // A hit: quick shake so the whole circle sees who got the letter.
      void animate(scope.current, { x: [0, -10, 9, -6, 4, 0], rotate: [0, -3, 3, -2, 0] }, { duration: 0.45 });
    }
    prev.current = n;
  }, [n, animate, scope]);

  return (
    <motion.button
      ref={scope}
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.3, opacity: 0, rotate: -20, filter: 'grayscale(1)' }}
      transition={spring}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="card"
      style={{
        position: 'relative',
        padding: big ? '20px 16px 18px' : '14px 10px 12px',
        display: 'flex',
        flexDirection: big ? 'row' : 'column',
        alignItems: 'center',
        gap: big ? 16 : 8,
        background: lastLife ? LETTER.soft : 'var(--surface)',
        borderColor: lastLife ? LETTER.base : leader ? 'var(--primary)' : 'var(--line)',
        boxShadow: `0 5px 0 ${lastLife ? LETTER.base : leader ? 'var(--primary-deep)' : 'var(--line)'}`,
        marginBottom: 5,
        textAlign: big ? 'left' : 'center',
      }}
    >
      <div style={{ position: 'relative', flex: 'none' }}>
        <Avatar player={side.players[0]} size={big ? 68 : 54} />
        <AnimatePresence>
          {leader && (
            <motion.span
              initial={{ y: 10, scale: 0, rotate: -30 }}
              animate={{ y: 0, scale: 1, rotate: -18 }}
              exit={{ y: 10, scale: 0 }}
              transition={bouncy}
              style={{ position: 'absolute', top: -16, left: -8, fontSize: 24 }}
            >
              👑
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: big ? 'flex-start' : 'center', gap: 8, width: '100%' }}>
        <span className="name" style={{ fontSize: big ? 22 : 16, maxWidth: '100%' }}>{side.label}</span>
        <LetterTiles count={n} size={big ? 40 : 28} />
      </div>
      <AnimatePresence>
        {lastLife && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="badge"
            style={{ position: 'absolute', top: -10, right: -6, background: LETTER.deep, color: '#fff', boxShadow: '0 3px 0 rgba(0,0,0,.15)' }}
          >
            ❤️ {t('gris.lastLife')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function LetterSheet({ side, match, onGive, onClose }: { side?: SideView; match: Match; onGive: () => void; onClose: () => void }) {
  const t = useT();
  const n = side ? letters(match, side.id) : 0;
  const out = n + 1 >= match.target;
  const letter = WORD[Math.min(n, WORD.length - 1)];
  return (
    <Sheet open={!!side} onClose={onClose}>
      {side && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <Avatar player={side.players[0]} size={52} />
            <div style={{ minWidth: 0 }}>
              <h2>{t('gris.dropQuestion', { name: side.label })}</h2>
              <p className="muted" style={{ fontWeight: 700, fontSize: 14 }}>
                {out ? t('gris.lastLetterWarning') : t('gris.nextLetter', { letter })}
              </p>
            </div>
          </div>
          <div style={{ margin: '4px 0 24px' }}>
            <LetterTiles count={n} size={56} highlightNext />
          </div>
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...bouncy, delay: 0.08 }}
            className={`btn block ${out ? 'danger' : ''}`}
            style={out ? { minHeight: 76, fontSize: 22 } : { minHeight: 76, fontSize: 22, ['--c' as string]: LETTER.base, ['--d' as string]: LETTER.deep }}
            onClick={onGive}
          >
            {out ? `💀 ${letter} · ${t('gris.out')}` : t('gris.give', { letter })}
          </motion.button>
        </>
      )}
    </Sheet>
  );
}

function KnockoutOverlay({ side }: { side?: SideView }) {
  const t = useT();
  return (
    <AnimatePresence>
      {side && (
        <motion.div
          key={side.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(23,58,40,.55) 0%, rgba(23,58,40,.25) 70%)',
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: -6 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
          >
            <span style={{ filter: 'grayscale(1)' }}>
              <Avatar player={side.players[0]} size={96} ring />
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: '#fff',
                background: LETTER.base,
                padding: '0 26px',
                borderRadius: 24,
                boxShadow: `0 8px 0 ${LETTER.deep}`,
                letterSpacing: '0.04em',
              }}
            >
              💀 {t('gris.out')}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.25)' }}>{side.label}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
