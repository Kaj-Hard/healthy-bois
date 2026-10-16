import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Match, Round } from '../games/types';
import { useT, type TKey } from '../i18n';
import { pop } from '../lib/confetti';
import { fx } from '../lib/feedback';
import { useApp, type Player } from '../store/app';
import { Avatar, AvatarStack, Icon, Sheet, bouncy, spring, useOverlay } from './ui';

export interface SideView {
  id: string;
  label: string;
  players: (Player | undefined)[];
  color: { base: string; deep: string; soft: string };
}

/* ---------- scoring actions ---------- */

export interface ScoreOptions {
  /** Screen point for the particle burst. */
  origin?: { x: number; y: number };
  /** Toast text (defaults to "+N name"). */
  message?: string;
  /** Sound + haptic to play (defaults to the score arpeggio). */
  sound?: () => void;
  /** ms to wait before leaving for the photo step when the game ends. */
  finishDelay?: number;
}

export function useRoundActions() {
  const t = useT();
  const scoreRound = useApp((s) => s.scoreRound);
  const undoRound = useApp((s) => s.undoRound);
  const replace = useApp((s) => s.replace);

  const undo = () => {
    const before = useApp.getState().matches.find((m) => m.id === useApp.getState().activeMatchId);
    if (!before?.rounds.length) {
      fx.error();
      useOverlay.getState().show(t('play.nothingToUndo'));
      return;
    }
    undoRound();
    fx.undo();
    useOverlay.getState().hide();
  };

  const score = (side: SideView, points: number, opts: ScoreOptions = {}) => {
    const next = scoreRound(side.id, points);
    if (!next) return undefined;
    (opts.sound ?? (() => fx.score(points)))();
    if (opts.origin) pop(opts.origin.x, opts.origin.y, [side.color.base, side.color.deep, '#ffffff'], 16 + points * 8);
    if (next.status === 'finished') {
      // Winner photo first, then the celebration (see screens/Photo.tsx).
      setTimeout(() => replace({ name: 'photo', matchId: next.id }), opts.finishDelay ?? 650);
    } else {
      const message = opts.message ?? t('play.scored', { n: points, name: side.label });
      useOverlay.getState().show(message, { label: t('common.undo'), run: undo });
    }
    return next;
  };

  return { score, undo };
}

/* ---------- points picker ---------- */

export function PointsSheet({
  side,
  max,
  onPick,
  onClose,
  dot,
}: {
  side?: SideView;
  max: number;
  onPick: (points: number) => void;
  onClose: () => void;
  /** Token drawn once per point under the number (skins swap in boules, cards...). */
  dot?: ReactNode;
}) {
  const t = useT();
  const cols = max <= 3 ? 3 : 3;
  return (
    <Sheet open={!!side} onClose={onClose}>
      {side && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <AvatarStack players={side.players} size={44} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ color: side.color.deep }}>{t('play.howMany')}</h2>
              <p className="name" style={{ fontSize: 15, color: 'var(--ink-soft)' }}>{side.label}</p>
            </div>
          </div>
          <p className="muted" style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>{t('play.howManyBoules')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
            {Array.from({ length: max }, (_, i) => i + 1).map((n, i) => (
              <motion.button
                key={n}
                className="btn"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...bouncy, delay: i * 0.04 }}
                style={{
                  ['--c' as string]: side.color.base,
                  ['--d' as string]: side.color.deep,
                  minHeight: max > 3 ? 92 : 112,
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 44,
                  padding: 0,
                }}
                onClick={() => onPick(n)}
              >
                <span style={{ lineHeight: 1 }}>{n}</span>
                <span style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: n }, (_, k) =>
                    dot ? <span key={k} style={{ display: 'inline-flex' }}>{dot}</span> : <span key={k} style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,.85)' }} />,
                  )}
                </span>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ---------- who starts: coin (2 sides) or roulette (3+) ---------- */

export function StarterPicker({ open, sides, onDone, onClose }: { open: boolean; sides: SideView[]; onDone: (sideId: string) => void; onClose: () => void }) {
  const t = useT();
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [flips, setFlips] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (open) {
      setResult(null);
      setSpinning(false);
      setFlips(0);
    }
    return () => timers.current.forEach(clearTimeout);
  }, [open]);

  const finish = (idx: number) => {
    setResult(idx);
    setSpinning(false);
    fx.select();
    timers.current.push(window.setTimeout(() => onDone(sides[idx].id), 1500));
  };

  const go = () => {
    if (spinning) return;
    const winner = Math.floor(Math.random() * sides.length);
    setResult(null);
    setSpinning(true);
    fx.coin();
    if (sides.length === 2) {
      // 6–7 full turns, landing on the winner's face.
      setFlips((f) => f + 1);
      timers.current.push(window.setTimeout(() => finish(winner), 1600));
      setHighlight(winner);
      return;
    }
    // Roulette: highlight hops round the circle, slowing down until it lands.
    const hops = sides.length * 3 + ((winner - highlight + sides.length) % sides.length);
    let delay = 40;
    let elapsed = 0;
    for (let i = 1; i <= hops; i++) {
      elapsed += delay;
      delay *= 1.11;
      const idx = (highlight + i) % sides.length;
      timers.current.push(
        window.setTimeout(() => {
          setHighlight(idx);
          fx.tap();
          if (i === hops) finish(idx);
        }, elapsed),
      );
    }
  };

  const coinSide = (i: number) => sides[i];
  const won = result !== null ? sides[result] : undefined;

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>{t('play.whoStarts')}</h2>

      {sides.length === 2 ? (
        <div style={{ display: 'grid', placeItems: 'center', height: 190, perspective: 800 }}>
          <motion.div
            animate={{ rotateY: flips === 0 ? 0 : flips * 2520 + (highlight === 1 ? 180 : 0), y: spinning ? [0, -110, 0] : 0 }}
            transition={{ rotateY: { duration: 1.6, ease: [0.2, 0.7, 0.3, 1] }, y: { duration: 1.6, ease: 'easeInOut' } }}
            style={{ width: 150, height: 150, position: 'relative', transformStyle: 'preserve-3d' }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: coinSide(i).color.base,
                  boxShadow: `inset 0 -10px 0 ${coinSide(i).color.deep}, 0 0 0 6px #fff`,
                  display: 'grid',
                  placeItems: 'center',
                  backfaceVisibility: 'hidden',
                  transform: i === 1 ? 'rotateY(180deg)' : undefined,
                }}
              >
                <AvatarStack players={coinSide(i).players} size={48} />
              </div>
            ))}
          </motion.div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, padding: '10px 0 20px' }}>
          {sides.map((s, i) => (
            <motion.div
              key={s.id}
              animate={{ scale: highlight === i && (spinning || result === i) ? 1.25 : 0.9, opacity: highlight === i || result === null ? 1 : 0.35 }}
              transition={spring}
            >
              <Avatar player={s.players[0]} size={60} ring={highlight === i} />
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ minHeight: 64, display: 'grid', placeItems: 'center' }}>
        <AnimatePresence mode="wait">
          {won ? (
            <motion.p
              key="won"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={bouncy}
              style={{ fontSize: 24, fontWeight: 900, color: won.color.deep, textAlign: 'center' }}
            >
              🎯 {won.label}
            </motion.p>
          ) : (
            <motion.div key="btn" exit={{ opacity: 0 }} style={{ width: '100%' }}>
              <button className="btn block accent" onClick={go} disabled={spinning}>
                {sides.length === 2 ? `🪙 ${t('play.flip')}` : `🎰 ${t('play.spin')}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

/* ---------- history strip ---------- */

export function HistoryStrip({
  match,
  sides,
  onUndo,
  label = (r) => `+${r.points}`,
  emptyLabel = 'play.noRounds',
}: {
  match: Match;
  sides: SideView[];
  onUndo: () => void;
  /** Text for each history chip; defaults to "+points". */
  label?: (round: Round, index: number) => string;
  emptyLabel?: TKey;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const byId = new Map(sides.map((s) => [s.id, s]));

  useEffect(() => {
    ref.current?.scrollTo({ left: ref.current.scrollWidth, behavior: 'smooth' });
  }, [match.rounds.length]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div ref={ref} style={{ flex: 1, display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 2px 8px', scrollbarWidth: 'none' }}>
        {match.rounds.length === 0 && <span className="muted" style={{ fontWeight: 800, fontSize: 14, padding: '8px 4px' }}>{t(emptyLabel)}</span>}
        <AnimatePresence initial={false}>
          {match.rounds.map((r, i) => {
            const s = byId.get(r.sideId);
            return (
              <motion.div
                key={i}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={bouncy}
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px 6px 6px',
                  borderRadius: 14,
                  background: s?.color.soft,
                  border: `2px solid ${s?.color.base}`,
                  fontWeight: 900,
                  fontSize: 14,
                  color: s?.color.deep,
                }}
              >
                {s && s.players.length === 1 ? <Avatar player={s.players[0]} size={22} /> : <span style={{ width: 10, height: 10, borderRadius: '50%', background: s?.color.base, margin: '0 4px' }} />}
                {label(r, i)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <button className="icon-btn" aria-label={t('common.undo')} onClick={onUndo} disabled={!match.rounds.length} style={{ opacity: match.rounds.length ? 1 : 0.4 }}>
        {Icon.undo}
      </button>
    </div>
  );
}

/** 13 little pips that fill up as a side approaches the target. */
export function TargetPips({ score, target, color, onDark }: { score: number; target: number; color: string; onDark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 3, width: '100%' }}>
      {Array.from({ length: target }, (_, i) => {
        const filled = i < score;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{ scaleY: filled ? 1 : 0.6, opacity: filled ? 1 : onDark ? 0.35 : 0.5 }}
            transition={{ ...bouncy, delay: filled ? (i % 6) * 0.03 : 0 }}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 5,
              background: filled ? color : onDark ? 'rgba(255,255,255,.55)' : 'var(--line)',
            }}
          />
        );
      })}
    </div>
  );
}
