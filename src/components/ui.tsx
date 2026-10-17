import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { colorOf } from '../lib/palette';
import type { Player } from '../store/app';
import { fx } from '../lib/feedback';
import { useT } from '../i18n';

export const spring = { type: 'spring', stiffness: 520, damping: 30 } as const;
export const bouncy = { type: 'spring', stiffness: 600, damping: 14 } as const;

/* ---------- icons ---------- */

export const Icon = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  ),
  dots: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2.4" />
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="19" cy="12" r="2.4" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  shuffle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
};

/* ---------- avatar ---------- */

export function Avatar({ player, size = 44, ring }: { player?: Player; size?: number; ring?: boolean }) {
  const c = colorOf(player?.color);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: c.base,
        boxShadow: `inset 0 ${-size * 0.08}px 0 ${c.deep}${ring ? `, 0 0 0 3px #fff` : ''}`,
      }}
    >
      {player?.emoji ?? '❔'}
    </div>
  );
}

export function AvatarStack({ players, size = 36 }: { players: (Player | undefined)[]; size?: number }) {
  return (
    <div style={{ display: 'flex' }}>
      {players.map((p, i) => (
        <div key={p?.id ?? i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: players.length - i }}>
          <Avatar player={p} size={size} ring />
        </div>
      ))}
    </div>
  );
}

/* ---------- topbar ---------- */

export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="topbar">
      {onBack && (
        <button
          className="icon-btn"
          aria-label="back"
          onClick={() => {
            fx.tap();
            onBack();
          }}
        >
          {Icon.back}
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </div>
  );
}

/* ---------- bottom sheet ---------- */

/**
 * Bottom sheet. Only the grip area drags it closed, so long content scrolls normally.
 * `footer` stays pinned at the bottom (above the system navigation bar): put the sheet's
 * primary action there so it is reachable on short screens.
 */
export function Sheet({ open, onClose, children, footer }: { open: boolean; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const drag = useDragControls();
  // Rendered at the top level: inside a screen, the screen's transform would trap the sheet under the tab bar.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="sheet-handle" onPointerDown={(e) => drag.start(e)}>
              <div className="sheet-grip" />
            </div>
            <div className={`sheet-body ${footer ? 'has-footer' : ''}`}>{children}</div>
            {footer && <div className="sheet-footer">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.getElementById('overlay-root') ?? document.body,
  );
}

/* ---------- global toast + confirm ---------- */

interface ToastState {
  toast?: { id: number; message: string; action?: { label: string; run: () => void } };
  confirm?: { message: string; confirmLabel: string; danger?: boolean; resolve: (ok: boolean) => void };
  show(message: string, action?: { label: string; run: () => void }): void;
  hide(): void;
  ask(message: string, confirmLabel: string, danger?: boolean): Promise<boolean>;
}

export const useOverlay = create<ToastState>((set) => ({
  show: (message, action) => set({ toast: { id: Date.now(), message, action } }),
  hide: () => set({ toast: undefined }),
  ask: (message, confirmLabel, danger) =>
    new Promise<boolean>((resolve) => set({ confirm: { message, confirmLabel, danger, resolve } })),
}));

export function Overlays() {
  const { toast, hide, confirm } = useOverlay();
  const t = useT();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, toast.action ? 4500 : 2200);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  const answer = (ok: boolean) => {
    confirm?.resolve(ok);
    useOverlay.setState({ confirm: undefined });
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
          >
            <span className="toast-msg">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.run();
                  hide();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Sheet open={!!confirm} onClose={() => answer(false)}>
        <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.35, margin: '4px 0 22px' }}>{confirm?.message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className={`btn block ${confirm?.danger ? 'danger' : ''}`} onClick={() => answer(true)}>
            {confirm?.confirmLabel}
          </button>
          <button className="btn block ghost" onClick={() => answer(false)}>
            {t('common.cancel')}
          </button>
        </div>
      </Sheet>
    </>
  );
}

/* ---------- rolling number ---------- */

/** A number that rolls up/down like a scoreboard when it changes. */
export function RollingNumber({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={{ position: 'relative', display: 'inline-flex', overflow: 'hidden', ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '70%', opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '-70%', opacity: 0, scale: 0.6 }}
          transition={bouncy}
          style={{ display: 'inline-block' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ---------- toggle ---------- */

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      onClick={() => {
        fx.tap();
        onChange(!on);
      }}
    />
  );
}
