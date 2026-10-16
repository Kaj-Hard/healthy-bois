import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { HistoryStrip, PointsSheet, StarterPicker, TargetPips, useRoundActions, type SideView } from '../../components/play';
import { Avatar, AvatarStack, Icon, RollingNumber, Sheet, TopBar, bouncy, useOverlay } from '../../components/ui';
import { useT } from '../../i18n';
import { fx } from '../../lib/feedback';
import { nextStarter, sideScore } from '../../lib/match';
import { colorOf } from '../../lib/palette';
import { useApp, usePlayersById } from '../../store/app';
import type { PlayProps } from '../types';
import { OFFICIAL, formatKey, maxPointsPerRound } from './rules';
import { theme } from './theme';

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`;
}

export function PetanquePlay({ match }: PlayProps) {
  const t = useT();
  const playersById = usePlayersById();
  const back = useApp((s) => s.back);
  const resetTo = useApp((s) => s.resetTo);
  const setFirstSide = useApp((s) => s.setFirstSide);
  const abandonMatch = useApp((s) => s.abandonMatch);
  const { score, undo } = useRoundActions();

  const [picking, setPicking] = useState<SideView>();
  const [origin, setOrigin] = useState<{ x: number; y: number }>();
  const [starterOpen, setStarterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const official = match.modeId === OFFICIAL;
  const sides: SideView[] = match.sides.map((s, i) => {
    const players = s.playerIds.map((id) => playersById.get(id));
    if (official) {
      return { id: s.id, players, label: joinNames(players.map((p) => p?.name ?? '?')), color: theme.sideColors[i] };
    }
    const c = colorOf(players[0]?.color);
    return { id: s.id, players, label: players[0]?.name ?? '?', color: { base: c.base, deep: c.deep, soft: `${c.base}38` } };
  });
  const scores = new Map(sides.map((s) => [s.id, sideScore(match, s.id)]));
  const top = Math.max(...scores.values());
  const starter = nextStarter(match);
  const max = maxPointsPerRound(match);
  const needsStarter = match.rounds.length === 0 && !match.firstSideId;

  // One pick per opening: the sheet stays tappable while it animates away,
  // so a fast double-tap must not score the end twice.
  const pickLock = useRef(false);

  const openPicker = (side: SideView, e: MouseEvent<HTMLElement>) => {
    fx.tap();
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
    // Let the sheet start closing so the burst lands on the visible panel.
    setTimeout(() => score(side, points, { origin }), 120);
  };

  const abandon = async () => {
    setMenuOpen(false);
    const ok = await useOverlay.getState().ask(t('play.abandonConfirm'), t('play.abandon'), true);
    if (ok) {
      abandonMatch();
      resetTo({ name: 'home' });
    }
  };

  return (
    <>
      <TopBar
        onBack={back}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('petanque.name')}
            <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)' }}>
              {t(formatKey(match))}
            </span>
          </span>
        }
        right={
          <button className="icon-btn" aria-label={t('play.menu')} onClick={() => { fx.tap(); setMenuOpen(true); }}>
            {Icon.dots}
          </button>
        }
      />

      {official ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 16px 0' }}>
          <TeamPanel side={sides[0]} score={scores.get(sides[0].id)!} target={match.target} max={max} isStarter={starter === sides[0].id} onTap={(e) => openPicker(sides[0], e)} />
          <MidBar label={t('play.end', { n: match.rounds.length + 1 })} needsStarter={needsStarter} onStarter={() => setStarterOpen(true)} />
          <TeamPanel side={sides[1]} score={scores.get(sides[1].id)!} target={match.target} max={max} isStarter={starter === sides[1].id} onTap={(e) => openPicker(sides[1], e)} />
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
          <MidBar label={t('play.round', { n: match.rounds.length + 1 })} needsStarter={needsStarter} onStarter={() => setStarterOpen(true)} />
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 2px 8px' }}>
            {sides.map((s) => (
              <PlayerRow
                key={s.id}
                side={s}
                score={scores.get(s.id)!}
                target={match.target}
                leader={top > 0 && scores.get(s.id) === top}
                isStarter={starter === s.id}
                onTap={(e) => openPicker(s, e)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bottom-bar" style={{ paddingTop: 10 }}>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
          👆 {official ? t('play.tapWinner') : t('play.tapScorer')}
        </p>
        <HistoryStrip match={match} sides={sides} onUndo={undo} />
      </div>

      <PointsSheet side={picking} max={max} onPick={pick} onClose={() => setPicking(undefined)} />

      <StarterPicker
        open={starterOpen}
        sides={sides}
        onClose={() => setStarterOpen(false)}
        onDone={(id) => {
          setFirstSide(id);
          setStarterOpen(false);
        }}
      />

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <h2 style={{ marginBottom: 18 }}>{t('play.menu')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {match.rounds.length === 0 && (
            <button className="btn block accent" onClick={() => { setMenuOpen(false); setStarterOpen(true); }}>
              {sides.length === 2 ? `🪙 ${t('play.flip')}` : `🎰 ${t('play.spin')}`}
            </button>
          )}
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

function MidBar({ label, needsStarter, onStarter }: { label: string; needsStarter: boolean; onStarter: () => void }) {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 40 }}>
      <motion.span
        key={label}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={bouncy}
        className="badge"
        style={{ background: 'var(--ink)', color: '#fff', fontSize: 14, padding: '7px 16px' }}
      >
        {label}
      </motion.span>
      <AnimatePresence>
        {needsStarter && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={bouncy}
            className="btn small accent"
            onClick={() => { fx.tap(); onStarter(); }}
          >
            🎯 {t('play.whoStartsShort')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Pulses whenever the score goes up. */
function usePulse(score: number) {
  const [scope, animate] = useAnimate();
  const prev = useRef(score);
  useEffect(() => {
    if (score > prev.current && scope.current) {
      void animate(scope.current, { scale: [1, 1.06, 0.98, 1] }, { duration: 0.5, ease: 'easeOut' });
    }
    prev.current = score;
  }, [score, animate, scope]);
  return scope;
}

function JackBadge({ deep }: { deep: string }) {
  const t = useT();
  return (
    <motion.span
      layoutId="jack"
      transition={bouncy}
      className="badge"
      style={{ background: '#fff', color: deep, boxShadow: '0 3px 0 rgba(0,0,0,.12)' }}
    >
      🎯 {t('play.jack')}
    </motion.span>
  );
}

function TeamPanel({
  side,
  score,
  target,
  max,
  isStarter,
  onTap,
}: {
  side: SideView;
  score: number;
  target: number;
  max: number;
  isStarter: boolean;
  onTap: (e: MouseEvent<HTMLElement>) => void;
}) {
  const t = useT();
  const scope = usePulse(score);
  const toGo = target - score;
  const matchPoint = toGo <= 1 || (toGo <= max && toGo <= 3);
  return (
    <motion.button
      ref={scope}
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 30,
        padding: '16px 18px 18px',
        background: side.color.base,
        boxShadow: `0 7px 0 ${side.color.deep}`,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'left',
        marginBottom: 7,
      }}
    >
      {/* decorative boule silhouettes */}
      <span style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.13)' }} />
      <span style={{ position: 'absolute', left: -30, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AvatarStack players={side.players} size={38} />
          <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2, textShadow: `0 2px 0 ${side.color.deep}` }}>{side.label}</span>
        </div>
        {isStarter && <JackBadge deep={side.color.deep} />}
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
        <AnimatePresence>
          {score > 0 && matchPoint && (
            <motion.span
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: [1, 1.08, 1], rotate: -4 }}
              exit={{ scale: 0 }}
              transition={{ scale: { repeat: Infinity, duration: 1.2 }, rotate: bouncy }}
              className="badge"
              style={{ background: '#ffd45c', color: '#3a2618', fontSize: 13, marginBottom: 18 }}
            >
              🔥 {toGo <= 1 ? t('play.matchPoint') : t('play.toWin', { n: toGo })}
            </motion.span>
          )}
        </AnimatePresence>
        <RollingNumber
          value={score}
          style={{ marginLeft: 'auto', fontSize: 'clamp(76px, 24vw, 128px)', fontWeight: 900, lineHeight: 0.9, textShadow: `0 6px 0 ${side.color.deep}`, letterSpacing: '-0.04em' }}
        />
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <TargetPips score={score} target={target} color="#fff" onDark />
      </div>
    </motion.button>
  );
}

function PlayerRow({
  side,
  score,
  target,
  leader,
  isStarter,
  onTap,
}: {
  side: SideView;
  score: number;
  target: number;
  leader: boolean;
  isStarter: boolean;
  onTap: (e: MouseEvent<HTMLElement>) => void;
}) {
  const t = useT();
  const scope = usePulse(score);
  return (
    <motion.button
      ref={scope}
      layout
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      className="card"
      style={{
        flex: '1 0 auto',
        minHeight: 70,
        maxHeight: 112,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px 10px 12px',
        textAlign: 'left',
        background: leader ? side.color.soft : 'var(--surface)',
        borderColor: leader ? side.color.base : 'var(--line)',
        boxShadow: `0 5px 0 ${leader ? side.color.base : 'var(--line)'}`,
        marginBottom: 5,
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar player={side.players[0]} size={50} />
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
        {isStarter && (
          <motion.span layoutId="jack" transition={bouncy} style={{ position: 'absolute', bottom: -4, right: -6, fontSize: 20 }} title={t('play.jack')}>
            🎯
          </motion.span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span className="name">{side.label}</span>
          {score > 0 && target - score <= 3 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="badge"
              style={{ background: '#ffd45c', color: '#3a2618', padding: '2px 8px' }}
            >
              🔥 {target - score <= 1 ? t('play.matchPoint') : t('play.toWin', { n: target - score })}
            </motion.span>
          )}
        </span>
        <TargetPips score={score} target={target} color={side.color.base} />
      </div>
      <RollingNumber value={score} style={{ fontSize: 44, fontWeight: 900, color: side.color.deep, minWidth: 56, justifyContent: 'flex-end' }} />
    </motion.button>
  );
}
