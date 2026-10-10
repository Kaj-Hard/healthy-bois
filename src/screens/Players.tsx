import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { PlayerEditor } from '../components/PlayerEditor';
import { Avatar, Icon, bouncy } from '../components/ui';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { winsFor } from '../lib/stats';
import { useApp, type Player } from '../store/app';

export function Players() {
  const t = useT();
  const allPlayers = useApp((s) => s.players);
  const matches = useApp((s) => s.matches);
  const players = useMemo(
    () => allPlayers.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [allPlayers],
  );
  const [editing, setEditing] = useState<Player | undefined>();
  const [open, setOpen] = useState(false);

  const openEditor = (p?: Player) => {
    fx.tap();
    setEditing(p);
    setOpen(true);
  };

  return (
    <div className="scroll">
      <div style={{ padding: 'calc(var(--safe-top) + 22px) 4px 8px' }}>
        <h1 className="page-title">{t('players.title')} 👥</h1>
        <p className="muted" style={{ fontWeight: 800, marginTop: 4 }}>{t('players.subtitle', { n: players.length })}</p>
      </div>

      <button className="btn block accent" style={{ marginTop: 14 }} onClick={() => openEditor()}>
        <span style={{ width: 22, height: 22, display: 'inline-flex' }}>{Icon.plus}</span>
        {t('players.add')}
      </button>

      {players.length === 0 ? (
        <div className="empty">
          <motion.div className="big" animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
            🦗
          </motion.div>
          {t('players.empty')}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 22, overflow: 'hidden' }}>
          <AnimatePresence initial={false}>
            {players.map((p, i) => {
              const wins = winsFor(matches, p.id);
              return (
                <motion.button
                  key={p.id}
                  layout
                  className="list-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, padding: 0 }}
                  transition={{ ...bouncy, delay: Math.min(i, 10) * 0.02 }}
                  onClick={() => openEditor(p)}
                >
                  <Avatar player={p} size={48} />
                  <span className="name" style={{ flex: 1 }}>{p.name}</span>
                  {wins > 0 && (
                    <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-deep)' }}>
                      🏆 {wins === 1 ? t('players.win') : t('players.wins', { n: wins })}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <PlayerEditor open={open} player={editing} onClose={() => setOpen(false)} />
    </div>
  );
}
