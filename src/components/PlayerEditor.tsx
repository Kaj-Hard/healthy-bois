import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { fx } from '../lib/feedback';
import { PLAYER_COLORS, PLAYER_EMOJIS } from '../lib/palette';
import { useApp, type Player } from '../store/app';
import { Avatar, Sheet, bouncy, useOverlay } from './ui';

interface Props {
  open: boolean;
  player?: Player;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

function suggestColor(players: Player[]): string {
  const used = new Set(players.filter((p) => !p.archived).map((p) => p.color));
  return (PLAYER_COLORS.find((c) => !used.has(c.id)) ?? PLAYER_COLORS[players.length % PLAYER_COLORS.length]).id;
}

function suggestEmoji(players: Player[]): string {
  const used = new Set(players.map((p) => p.emoji));
  const free = PLAYER_EMOJIS.filter((e) => !used.has(e));
  const pool = free.length ? free : PLAYER_EMOJIS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function PlayerEditor({ open, player, onClose, onSaved }: Props) {
  const t = useT();
  const players = useApp((s) => s.players);
  const addPlayer = useApp((s) => s.addPlayer);
  const updatePlayer = useApp((s) => s.updatePlayer);
  const removePlayer = useApp((s) => s.removePlayer);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('😎');
  const [color, setColor] = useState<string>('coral');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(player?.name ?? '');
    setEmoji(player?.emoji ?? suggestEmoji(players));
    setColor(player?.color ?? suggestColor(players));
    // Focus after the sheet has slid in so the keyboard doesn't fight the animation.
    if (!player) setTimeout(() => inputRef.current?.focus(), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, player]);

  const trimmed = name.trim();
  const taken = players.some(
    (p) => !p.archived && p.id !== player?.id && p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const valid = trimmed.length > 0 && !taken;

  const save = () => {
    if (!valid) {
      fx.error();
      return;
    }
    fx.select();
    if (player) {
      updatePlayer(player.id, { name: trimmed, emoji, color });
      onSaved?.(player.id);
    } else {
      const id = addPlayer({ name: trimmed, emoji, color });
      onSaved?.(id);
    }
    onClose();
  };

  const remove = async () => {
    if (!player) return;
    const ok = await useOverlay.getState().ask(t('players.deleteConfirm', { name: player.name }), t('common.delete'), true);
    if (ok) {
      removePlayer(player.id);
      onClose();
    }
  };

  const preview: Player = { id: 'preview', name: trimmed, emoji, color, createdAt: 0 };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      footer={
        // Pinned so Save is always reachable, even when the face grid doesn't fit the screen.
        <div style={{ display: 'flex', gap: 12 }}>
          {player && (
            <button className="btn ghost" style={{ ['--t' as string]: 'var(--danger-deep)' }} onClick={remove}>
              {t('common.delete')}
            </button>
          )}
          <button className="btn block" disabled={!valid} onClick={save} style={{ flex: 1 }}>
            {t('common.save')}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <motion.div key={emoji + color} initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={bouncy}>
          <Avatar player={preview} size={72} />
        </motion.div>
        <h2>{player ? t('players.edit') : t('players.new')}</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          ref={inputRef}
          className="text-input"
          value={name}
          maxLength={18}
          placeholder={t('players.namePlaceholder')}
          onChange={(e) => setName(e.target.value)}
          enterKeyHint="done"
          autoCapitalize="words"
          style={taken ? { borderColor: 'var(--danger)' } : undefined}
        />
      </form>
      {taken && <p style={{ color: 'var(--danger-deep)', fontWeight: 800, marginTop: 6 }}>{t('players.nameTaken')}</p>}

      <p className="section-title" style={{ marginTop: 18 }}>{t('players.color')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {PLAYER_COLORS.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              fx.tap();
              setColor(c.id);
            }}
            style={{
              aspectRatio: '1',
              borderRadius: 16,
              background: c.base,
              boxShadow: `inset 0 -5px 0 ${c.deep}`,
              outline: color === c.id ? `4px solid ${c.deep}` : 'none',
              outlineOffset: 3,
            }}
            aria-label={c.id}
          />
        ))}
      </div>

      <p className="section-title">{t('players.emoji')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {PLAYER_EMOJIS.map((e) => (
          <motion.button
            key={e}
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              fx.tap();
              setEmoji(e);
            }}
            style={{
              aspectRatio: '1',
              fontSize: 28,
              borderRadius: 14,
              background: emoji === e ? 'var(--primary-soft)' : 'var(--bg)',
              border: `2px solid ${emoji === e ? 'var(--primary)' : 'transparent'}`,
            }}
          >
            {e}
          </motion.button>
        ))}
      </div>

    </Sheet>
  );
}
