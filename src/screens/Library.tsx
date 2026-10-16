import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { GameRow, usePlayCounts } from '../components/GameCards';
import { Icon, bouncy } from '../components/ui';
import { GAMES } from '../games/registry';
import type { GameTag } from '../games/types';
import { translate, useT, type TKey } from '../i18n';
import { fx } from '../lib/feedback';
import { useApp } from '../store/app';

type Filter = GameTag | 'favorites';

const FILTERS: { id: Filter; emoji: string; label: TKey }[] = [
  { id: 'favorites', emoji: '♥', label: 'tag.favorites' },
  { id: 'outdoor', emoji: '🌳', label: 'tag.outdoor' },
  { id: 'ball', emoji: '⚽', label: 'tag.ball' },
  { id: 'teams', emoji: '🤝', label: 'tag.teams' },
  { id: 'ffa', emoji: '🙋', label: 'tag.ffa' },
  { id: 'elimination', emoji: '💀', label: 'tag.elimination' },
];

/** Player-count chips. "9+" means "a big group". */
const COUNTS = [2, 3, 4, 5, 6, 7, 8, 9];

/** Lowercase, accent-free text so "petanque" finds "Pétanque". */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function Library() {
  const t = useT();
  const favorites = useApp((s) => s.favorites);
  const playersCount = useApp((s) => s.players.filter((p) => !p.archived).length);
  const plays = usePlayCounts();
  const [query, setQuery] = useState('');
  const [count, setCount] = useState<number | undefined>();
  const [filters, setFilters] = useState<Filter[]>([]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return GAMES.filter((g) => {
      if (q) {
        // Search both languages so a Danish name still finds the game in English mode.
        const haystack = normalize(
          (['en', 'da'] as const).flatMap((l) => [translate(l, g.name), translate(l, g.tagline), translate(l, g.blurb)]).join(' '),
        );
        if (!haystack.includes(q)) return false;
      }
      if (count !== undefined) {
        const counts = g.modes.flatMap((m) => m.playerCounts);
        const ok = count >= 9 ? Math.max(...counts) >= 9 : counts.includes(count);
        if (!ok) return false;
      }
      return filters.every((f) => (f === 'favorites' ? favorites.includes(g.id) : g.tags.includes(f)));
    }).sort(
      (a, b) =>
        Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)) ||
        (plays.get(b.id) ?? 0) - (plays.get(a.id) ?? 0) ||
        t(a.name).localeCompare(t(b.name)),
    );
  }, [query, count, filters, favorites, plays, t]);

  const toggleFilter = (f: Filter) => {
    fx.tap();
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  };

  const pickCount = (n: number | undefined) => {
    fx.tap();
    setCount((cur) => (cur === n ? undefined : n));
  };

  const hasFilters = !!query || count !== undefined || filters.length > 0;
  const clear = () => {
    fx.undo();
    setQuery('');
    setCount(undefined);
    setFilters([]);
  };

  return (
    <div className="scroll">
      <div style={{ padding: 'calc(var(--safe-top) + 22px) 4px 14px' }}>
        <h1 className="page-title">{t('library.title')} 🎲</h1>
        <p className="muted" style={{ fontWeight: 800, marginTop: 4 }}>{t('library.subtitle', { n: GAMES.length })}</p>
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20, pointerEvents: 'none' }}>🔍</span>
        <input
          className="text-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.search')}
          enterKeyHint="search"
          style={{ paddingLeft: 48, paddingRight: 48, fontSize: 18 }}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => { fx.tap(); setQuery(''); }}
              aria-label={t('common.close')}
              style={{ position: 'absolute', right: 10, top: 10, width: 38, height: 38, borderRadius: 12, background: 'var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)' }}
            >
              <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{Icon.close}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="section-title" style={{ marginTop: 18 }}>👥 {t('library.players')}</p>
      <div className="chip-row" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', margin: '0 -16px', padding: '0 16px 4px' }}>
        <button className={`chip ${count === undefined ? 'on' : ''}`} onClick={() => pickCount(undefined)}>
          {t('library.any')}
        </button>
        {COUNTS.map((n) => (
          <motion.button
            key={n}
            whileTap={{ scale: 0.88 }}
            className={`chip ${count === n ? 'on' : ''}`}
            onClick={() => pickCount(n)}
            style={{ minWidth: 48, position: 'relative' }}
          >
            {n === 9 ? '9+' : n}
            {/* A tiny dot marks how many bois are registered: the usual crowd. */}
            {n === Math.min(playersCount, 9) && count !== n && (
              <span style={{ position: 'absolute', top: 4, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
            )}
          </motion.button>
        ))}
      </div>

      <div className="chip-row" style={{ marginTop: 12 }}>
        {FILTERS.map((f) => (
          <motion.button key={f.id} whileTap={{ scale: 0.9 }} className={`chip ${filters.includes(f.id) ? 'on' : ''}`} onClick={() => toggleFilter(f.id)}>
            {f.emoji} {t(f.label)}
          </motion.button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 4px 10px', minHeight: 34 }}>
        <span className="section-title" style={{ margin: 0 }}>
          {results.length} / {GAMES.length}
        </span>
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="btn small ghost"
              onClick={clear}
            >
              ↺ {t('library.clear')}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AnimatePresence mode="popLayout">
          {results.map((g, i) => (
            <GameRow key={g.id} game={g} plays={plays.get(g.id) ?? 0} index={i} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {results.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={bouncy} className="empty">
            <motion.div className="big" animate={{ rotate: [0, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              🤷
            </motion.div>
            <p style={{ marginBottom: 16 }}>{t('library.empty')}</p>
            <button className="btn small" onClick={clear}>↺ {t('library.clear')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
