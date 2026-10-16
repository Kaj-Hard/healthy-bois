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
import { sfx } from './sfx';
import { BOARD, RED, YELLOW, cardColor } from './theme';

/*
 * GRIS play screen, street-pitch skin (see skin.css and DESIGN.md §12).
 * Players are kit cards with a jersey number, letters are referee cards
 * (yellow for G-R-I, red for the final S), the top bar is the stadium scoreboard.
 */

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
  const [sentOff, setSentOff] = useState<SideView>();
  // One card per opening: the sheet is still tappable while it animates away.
  const pickLock = useRef(false);

  const sides: SideView[] = match.sides.map((s) => {
    const p = playersById.get(s.playerIds[0]);
    const c = colorOf(p?.color);
    return { id: s.id, players: [p], label: p?.name ?? '?', color: { base: c.base, deep: c.deep, soft: `${c.base}38` } };
  });
  const seat = new Map(match.sides.map((s, i) => [s.id, i + 1]));
  const byId = new Map(sides.map((s) => [s.id, s]));
  const alive = aliveSides(match);
  const aliveViews = sides.filter((s) => alive.includes(s.id));
  const outViews = eliminationOrder(match).map((id) => byId.get(id)!);
  const fewest = Math.min(...alive.map((id) => letters(match, id)));
  const leaders = alive.filter((id) => letters(match, id) === fewest);
  const finalDuel = alive.length === 2 && match.sides.length > 2;

  const openSheet = (side: SideView, e: MouseEvent<HTMLElement>) => {
    if (match.status !== 'active') return;
    sfx.thump();
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
        sound: out ? sfx.redCard : sfx.whistle,
        message: out ? t('gris.knockedOut', { name: side.label }) : t('gris.gotLetter', { name: side.label, letter }),
        finishDelay: 1800,
      });
      if (next && out) {
        setSentOff(side);
        setTimeout(() => setSentOff(undefined), 1600);
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {t('gris.name')}
            <span className="gr-led" style={{ fontSize: 17 }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 38, marginBottom: 8 }}>
          <motion.span key={match.rounds.length} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={bouncy} className="gr-led" style={{ fontSize: 18 }}>
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
                style={{ background: RED.base, color: '#fff', fontSize: 18, padding: '6px 14px 4px', boxShadow: `0 3px 0 ${RED.deep}` }}
              >
                ⚔️ {t('gris.finalDuel')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <LayoutGroup>
          <div style={{ display: 'grid', gridTemplateColumns: aliveViews.length <= 2 ? '1fr' : '1fr 1fr', gap: 14 }}>
            <AnimatePresence mode="popLayout">
              {aliveViews.map((s) => (
                <KitCard
                  key={s.id}
                  side={s}
                  number={seat.get(s.id)!}
                  match={match}
                  big={aliveViews.length <= 2}
                  captain={match.rounds.length > 0 && leaders.length === 1 && leaders[0] === s.id}
                  onTap={(e) => openSheet(s, e)}
                />
              ))}
            </AnimatePresence>
          </div>

          {outViews.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefCard color={RED} width={14} /> {t('gris.outTitle')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {outViews.map((s, i) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...bouncy, delay: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 10, background: 'rgba(255,255,255,.85)', border: `2px solid ${RED.base}` }}
                  >
                    <span style={{ filter: 'grayscale(1)', opacity: 0.6 }}>
                      <Avatar player={s.players[0]} size={28} />
                    </span>
                    <span className="name" style={{ fontSize: 18, color: 'var(--ink-soft)', textDecoration: 'line-through' }}>{s.label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: RED.deep }}>#{match.sides.length - i}</span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </LayoutGroup>
      </div>

      <div className="bottom-bar" style={{ paddingTop: 10 }}>
        <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, marginBottom: 6, color: 'var(--ink-soft)' }}>
          👆 {t('gris.tapDropper')}
        </p>
        <HistoryStrip match={match} sides={sides} onUndo={undo} label={(_, i) => letterOf(i)} emptyLabel="gris.noDrops" />
      </div>

      <CardSheet side={picking} match={match} onGive={give} onClose={() => setPicking(undefined)} />

      <SentOffOverlay side={sentOff} />

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

/* ---------- skin pieces ---------- */

type CardColor = { base: string; deep: string; ink: string };

/** A referee card. Portrait, rounded, with an optional letter printed on it. */
function RefCard({ color, width, letter, empty }: { color: CardColor; width: number; letter?: string; empty?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        flex: 'none',
        width,
        height: width * 1.36,
        borderRadius: Math.max(3, width * 0.14),
        background: empty ? 'rgba(255,255,255,.5)' : color.base,
        border: empty ? '2px dashed rgba(15,59,34,.3)' : 'none',
        boxShadow: empty ? 'none' : `0 ${Math.max(2, width * 0.08)}px 0 ${color.deep}`,
        color: empty ? 'rgba(15,59,34,.35)' : color.ink,
        fontFamily: 'var(--font-display)',
        fontSize: width * 0.72,
        lineHeight: 1,
        paddingTop: width * 0.06,
      }}
    >
      {letter}
    </span>
  );
}

/** The four card slots: earned cards are shown like a ref showing them, the rest wait as outlines. */
function CardRow({ count, width = 26, highlightNext }: { count: number; width?: number; highlightNext?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: width * 0.24, justifyContent: 'center' }}>
      {WORD.split('').map((ch, i) => {
        const earned = i < count;
        const next = highlightNext && i === count;
        return (
          <motion.span
            key={`${i}-${earned}`}
            initial={earned ? { y: -40, rotate: -35, scale: 1.7, opacity: 0 } : false}
            animate={next ? { scale: [1, 1.12, 1], y: 0, rotate: 0, opacity: 1 } : { scale: 1, y: 0, rotate: earned ? (i % 2 ? 6 : -6) : 0, opacity: 1 }}
            transition={next ? { repeat: Infinity, duration: 1 } : { type: 'spring', stiffness: 650, damping: 17 }}
            style={{ display: 'inline-flex', outline: next ? `3px solid ${cardColor(i, WORD.length).base}` : 'none', outlineOffset: 2, borderRadius: 6 }}
          >
            <RefCard color={cardColor(i, WORD.length)} width={width} letter={ch} empty={!earned} />
          </motion.span>
        );
      })}
    </div>
  );
}

/** A player as a football kit card: shirt-colour header with V-neck, jersey number, name, cards. */
function KitCard({
  side,
  number,
  match,
  big,
  captain,
  onTap,
}: {
  side: SideView;
  number: number;
  match: Match;
  big: boolean;
  captain: boolean;
  onTap: (e: MouseEvent<HTMLElement>) => void;
}) {
  const t = useT();
  const n = letters(match, side.id);
  const lastLife = n === match.target - 1;
  const [scope, animate] = useAnimate();
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current && scope.current) {
      // Booked! A quick shake so the whole circle sees who got the card.
      void animate(scope.current, { x: [0, -10, 9, -6, 4, 0], rotate: [0, -3, 3, -2, 0] }, { duration: 0.45 });
    }
    prev.current = n;
  }, [n, animate, scope]);

  const head = big ? 74 : 54;
  const avatar = big ? 60 : 46;
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
      style={{
        position: 'relative',
        borderRadius: 14,
        background: '#fff',
        border: `3px solid ${lastLife ? RED.base : '#fff'}`,
        boxShadow: `0 6px 0 ${lastLife ? RED.deep : 'rgba(15,59,34,.28)'}`,
        textAlign: 'center',
        marginBottom: 6,
      }}
    >
      {/* shirt: kit colour with vertical stripes and a V-neck */}
      <div
        style={{
          position: 'relative',
          height: head,
          borderRadius: '11px 11px 0 0',
          background: `repeating-linear-gradient(90deg, transparent 0 16px, rgba(255,255,255,.2) 16px 24px), ${side.color.base}`,
          overflow: 'hidden',
        }}
      >
        <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: big ? 44 : 34, height: big ? 18 : 14, background: '#fff', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
        <span
          style={{
            position: 'absolute',
            right: 10,
            bottom: big ? 0 : -2,
            fontFamily: 'var(--font-display)',
            fontSize: big ? 62 : 44,
            lineHeight: 1,
            color: '#fff',
            textShadow: `0 3px 0 ${side.color.deep}`,
          }}
        >
          {number}
        </span>
      </div>
      <span style={{ position: 'absolute', left: 10, top: head - avatar / 2 - 4 }}>
        <Avatar player={side.players[0]} size={avatar} ring />
        <AnimatePresence>
          {captain && (
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: -12 }}
              exit={{ scale: 0 }}
              transition={bouncy}
              title="Captain"
              style={{
                position: 'absolute',
                top: -8,
                right: -14,
                padding: '1px 6px 0',
                borderRadius: 5,
                background: YELLOW.base,
                color: YELLOW.ink,
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                boxShadow: `0 2px 0 ${YELLOW.deep}`,
              }}
            >
              C
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <div style={{ padding: big ? '14px 14px 16px' : '26px 10px 12px', display: 'flex', flexDirection: 'column', alignItems: big ? 'flex-end' : 'center', gap: 8 }}>
        <span className="name" style={{ fontSize: big ? 32 : 24, maxWidth: '100%', color: 'var(--ink)' }}>
          {side.label}
        </span>
        <CardRow count={n} width={big ? 36 : 25} />
      </div>
      <AnimatePresence>
        {lastLife && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="badge"
            style={{ position: 'absolute', top: -12, right: -6, background: RED.base, color: '#fff', fontSize: 15, padding: '4px 10px 2px', boxShadow: `0 3px 0 ${RED.deep}` }}
          >
            ❤️ {t('gris.lastLife')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function CardSheet({ side, match, onGive, onClose }: { side?: SideView; match: Match; onGive: () => void; onClose: () => void }) {
  const t = useT();
  const n = side ? letters(match, side.id) : 0;
  const out = n + 1 >= match.target;
  const letter = WORD[Math.min(n, WORD.length - 1)];
  const color = cardColor(Math.min(n, WORD.length - 1), WORD.length);
  return (
    <Sheet open={!!side} onClose={onClose}>
      {side && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Avatar player={side.players[0]} size={52} />
            <div style={{ minWidth: 0 }}>
              <h2>{t('gris.dropQuestion', { name: side.label.toUpperCase() })}</h2>
              <p className="muted" style={{ fontWeight: 700, fontSize: 14 }}>{out ? t('gris.lastLetterWarning') : t('gris.nextLetter', { letter })}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '6px 0 22px' }}>
            {/* the ref holds the card up */}
            <motion.span
              initial={{ y: 40, rotate: -30, scale: 0.5 }}
              animate={{ y: 0, rotate: [-7, 5, -7], scale: 1 }}
              transition={{ y: bouncy, scale: bouncy, rotate: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } }}
              style={{ display: 'inline-flex' }}
            >
              <RefCard color={color} width={78} letter={letter} />
            </motion.span>
            <CardRow count={n} width={28} highlightNext />
          </div>
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...bouncy, delay: 0.08 }}
            className="btn block"
            style={{
              minHeight: 76,
              fontSize: 30,
              ['--c' as string]: color.base,
              ['--d' as string]: color.deep,
              ['--t' as string]: color.ink,
            }}
            onClick={onGive}
          >
            {out ? `🟥 ${t('gris.red')}` : `🟨 ${t('gris.yellow', { letter })}`}
          </motion.button>
        </>
      )}
    </Sheet>
  );
}

function SentOffOverlay({ side }: { side?: SideView }) {
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
            background: `radial-gradient(circle, ${BOARD}cc 0%, ${BOARD}66 75%)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {/* the red card flies up out of the ref's pocket */}
            <motion.div
              initial={{ y: 420, rotate: 50, scale: 0.6 }}
              animate={{ y: 0, rotate: -8, scale: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 15 }}
              style={{
                width: 150,
                height: 204,
                borderRadius: 18,
                background: RED.base,
                boxShadow: `0 10px 0 ${RED.deep}, 0 20px 40px rgba(0,0,0,.35)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ filter: 'grayscale(1)' }}>
                <Avatar player={side.players[0]} size={64} ring />
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 64, lineHeight: 1, color: '#fff', letterSpacing: '0.04em' }}>{t('gris.out')}</span>
            </motion.div>
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...bouncy, delay: 0.25 }}
              className="gr-led"
              style={{ fontSize: 30 }}
            >
              {side.label.toUpperCase()}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
