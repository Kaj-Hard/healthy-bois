import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { PlayerEditor } from '../components/PlayerEditor';
import { Avatar, Icon, TopBar, bouncy, spring, useOverlay } from '../components/ui';
import { getGame } from '../games/registry';
import type { GameMode, Side } from '../games/types';
import { useT, type T } from '../i18n';
import { fx } from '../lib/feedback';
import { shuffle, uid } from '../lib/id';
import { useApp, type Player } from '../store/app';

type Step = 'mode' | 'players' | 'teams';

function countsLabel(mode: GameMode, t: T): string {
  const c = mode.playerCounts;
  const contiguous = c.every((n, i) => i === 0 || n === c[i - 1] + 1);
  if (contiguous && c.length > 2) return `${c[0]}–${c.at(-1)}`;
  return `${c.slice(0, -1).join(', ')} ${t('common.or')} ${c.at(-1)}`;
}

function splitTeams(ids: string[]): [string[], string[]] {
  const s = shuffle(ids);
  return [s.slice(0, s.length / 2), s.slice(s.length / 2)];
}

export function Setup({ gameId }: { gameId: string }) {
  const t = useT();
  const game = getGame(gameId);
  const allPlayers = useApp((s) => s.players);
  const matches = useApp((s) => s.matches);
  const activeMatchId = useApp((s) => s.activeMatchId);
  const back = useApp((s) => s.back);
  const startMatch = useApp((s) => s.startMatch);
  const resetTo = useApp((s) => s.resetTo);

  const players = useMemo(() => allPlayers.filter((p) => !p.archived), [allPlayers]);
  const [step, setStep] = useState<Step>(game.modes.length === 1 ? 'players' : 'mode');
  const [modeId, setModeId] = useState(game.modes[0].id);
  const mode = game.modes.find((m) => m.id === modeId)!;
  const [selected, setSelected] = useState<string[]>([]);
  const [teams, setTeams] = useState<[string[], string[]]>([[], []]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shake, setShake] = useState(0);

  const maxCount = Math.max(...mode.playerCounts);
  const validCount = mode.playerCounts.includes(selected.length);

  const lastLineup = (mId: string) =>
    [...matches].reverse().find((m) => m.gameId === gameId && m.modeId === mId && m.status !== 'abandoned');

  const chooseMode = (m: GameMode) => {
    fx.select();
    setModeId(m.id);
    // Pre-select whoever played this mode last time: usually the same bois.
    const last = lastLineup(m.id);
    const ids = last?.sides.flatMap((s) => s.playerIds).filter((id) => players.some((p) => p.id === id)) ?? [];
    setSelected(m.playerCounts.includes(ids.length) ? ids : []);
    setStep('players');
  };

  const toggle = (p: Player) => {
    if (selected.includes(p.id)) {
      fx.tap();
      setSelected(selected.filter((id) => id !== p.id));
    } else if (selected.length >= maxCount) {
      fx.error();
      setShake((n) => n + 1);
    } else {
      fx.select();
      setSelected([...selected, p.id]);
    }
  };

  const goNext = () => {
    if (!validCount) {
      fx.error();
      setShake((n) => n + 1);
      return;
    }
    if (mode.teams && selected.length > 2) {
      fx.select();
      // Keep last game's teams if it's the exact same group, otherwise shuffle.
      const last = lastLineup(mode.id);
      const sameGroup =
        last && last.sides.flatMap((s) => s.playerIds).sort().join() === [...selected].sort().join();
      setTeams(sameGroup ? [last.sides[0].playerIds, last.sides[1].playerIds] : splitTeams(selected));
      setStep('teams');
      return;
    }
    start(mode.teams ? [[selected[0]], [selected[1]]] : selected.map((id) => [id]));
  };

  const start = async (groups: string[][]) => {
    if (activeMatchId) {
      const ok = await useOverlay.getState().ask(t('play.alreadyActive'), t('setup.start'), true);
      if (!ok) return;
    }
    fx.score(3);
    const sides: Side[] = groups.map((playerIds) => ({ id: uid(), playerIds }));
    startMatch({ gameId, modeId, sides });
    resetTo({ name: 'home' });
    useApp.getState().navigate({ name: 'play' });
  };

  const onBack = () => {
    if (step === 'teams') setStep('players');
    else if (step === 'players' && game.modes.length > 1) setStep('mode');
    else back();
  };

  const byId = new Map(allPlayers.map((p) => [p.id, p]));
  const teamsValid = teams[0].length === teams[1].length && teams[0].length > 0;

  return (
    <>
      <TopBar
        onBack={onBack}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <game.Art size={36} />
            {t(game.name)}
          </span>
        }
      />
      <StepDots step={step} hasTeams={mode.teams && step !== 'mode'} />

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            className="scroll"
            style={{ position: 'absolute', inset: 0, paddingBottom: 120 }}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={spring}
          >
            {step === 'mode' && (
              <>
                <h2 className="page-title" style={{ margin: '8px 4px 18px', fontSize: 26 }}>{t('setup.chooseMode')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {game.modes.map((m, i) => (
                    <motion.button
                      key={m.id}
                      className="card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...bouncy, delay: i * 0.07 }}
                      whileTap={{ scale: 0.97, y: 4 }}
                      onClick={() => chooseMode(m)}
                      style={{ padding: 20, textAlign: 'left', borderColor: i === 0 ? 'var(--primary)' : 'var(--accent)', boxShadow: `0 5px 0 ${i === 0 ? 'var(--primary-deep)' : 'var(--accent-deep)'}` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span
                          style={{
                            fontSize: 34,
                            width: 62,
                            height: 62,
                            borderRadius: 20,
                            display: 'grid',
                            placeItems: 'center',
                            background: i === 0 ? 'var(--primary-soft)' : 'var(--accent-soft)',
                          }}
                        >
                          {m.emoji}
                        </span>
                        <span style={{ flex: 1 }}>
                          <span style={{ display: 'block', fontSize: 21, fontWeight: 900 }}>{t(m.name)}</span>
                          <span style={{ display: 'block', fontWeight: 800, color: i === 0 ? 'var(--primary-deep)' : 'var(--accent-deep)' }}>{t(m.tagline)}</span>
                        </span>
                      </div>
                      <p className="muted" style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.45, marginTop: 12 }}>{t(m.rules)}</p>
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {step === 'players' && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '8px 4px 4px' }}>
                  <h2 className="page-title" style={{ fontSize: 26 }}>{t('setup.whoPlays')}</h2>
                  <span className="muted" style={{ fontWeight: 900 }}>{t(mode.name)}</span>
                </div>
                <motion.p
                  key={shake}
                  animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  style={{ fontWeight: 800, margin: '0 4px 16px', color: validCount ? 'var(--accent-deep)' : 'var(--ink-soft)' }}
                >
                  {validCount ? `✓ ${t('setup.selected', { n: selected.length })}` : t('setup.needPlayers', { counts: countsLabel(mode, t) })}
                </motion.p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {players.map((p, i) => {
                    const order = selected.indexOf(p.id);
                    const on = order >= 0;
                    return (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...bouncy, delay: Math.min(i, 12) * 0.025 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggle(p)}
                        className="card"
                        style={{
                          position: 'relative',
                          padding: '14px 6px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          background: on ? 'var(--primary-soft)' : 'var(--surface)',
                          borderColor: on ? 'var(--primary)' : 'var(--line)',
                          boxShadow: `0 4px 0 ${on ? 'var(--primary-deep)' : 'var(--line)'}`,
                        }}
                      >
                        <Avatar player={p} size={52} />
                        <span className="name" style={{ fontSize: 14, maxWidth: '100%' }}>{p.name}</span>
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={bouncy}
                              style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: 14,
                                display: 'grid',
                                placeItems: 'center',
                                boxShadow: '0 2px 0 var(--primary-deep)',
                              }}
                            >
                              {order + 1}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { fx.tap(); setEditorOpen(true); }}
                    style={{
                      border: '3px dashed var(--line)',
                      borderRadius: 'var(--radius)',
                      padding: '14px 6px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      color: 'var(--primary-deep)',
                      fontWeight: 900,
                      minHeight: 110,
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-soft)', display: 'grid', placeItems: 'center' }}>
                      <span style={{ width: 26, height: 26, display: 'inline-flex' }}>{Icon.plus}</span>
                    </span>
                    {t('setup.newPlayer')}
                  </motion.button>
                </div>
              </>
            )}

            {step === 'teams' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 4px 4px' }}>
                  <h2 className="page-title" style={{ fontSize: 26 }}>{t('setup.teams')}</h2>
                  <button
                    className="btn small accent"
                    onClick={() => {
                      fx.coin();
                      setTeams(splitTeams(selected));
                    }}
                  >
                    <span style={{ width: 18, height: 18, display: 'inline-flex' }}>{Icon.shuffle}</span>
                    {t('setup.shuffle')}
                  </button>
                </div>
                <p className="muted" style={{ fontWeight: 800, margin: '0 4px 16px' }}>
                  {teamsValid ? t('setup.tapToMove') : t('setup.unevenTeams')}
                </p>
                <LayoutGroup>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'start' }}>
                    {[0, 1].map((ti) => {
                      const c = game.theme.sideColors[ti];
                      return (
                        <div
                          key={ti}
                          style={{
                            gridColumn: ti === 0 ? 1 : 3,
                            background: c.soft,
                            border: `3px solid ${c.base}`,
                            borderRadius: 24,
                            padding: 10,
                            minHeight: 220,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <span className="badge" style={{ background: c.base, color: '#fff', alignSelf: 'center', marginBottom: 4 }}>
                            {t('setup.team', { n: ti + 1 })}
                          </span>
                          {teams[ti].map((id) => (
                            <motion.button
                              key={id}
                              layoutId={`team-${id}`}
                              transition={spring}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                fx.tap();
                                const from = teams[ti].filter((x) => x !== id);
                                const to = [...teams[1 - ti], id];
                                setTeams(ti === 0 ? [from, to] : [to, from]);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: 8,
                                borderRadius: 16,
                                background: '#fff',
                                boxShadow: `0 3px 0 ${c.base}`,
                              }}
                            >
                              <Avatar player={byId.get(id)} size={36} />
                              <span className="name" style={{ fontSize: 15 }}>{byId.get(id)?.name}</span>
                            </motion.button>
                          ))}
                        </div>
                      );
                    })}
                    <span style={{ gridColumn: 2, gridRow: 1, alignSelf: 'center', fontWeight: 900, fontSize: 18, color: 'var(--ink-soft)' }}>
                      {t('common.vs')}
                    </span>
                  </div>
                </LayoutGroup>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step !== 'mode' && (
        <div className="bottom-bar" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {step === 'players' ? (
            <button className="btn block" disabled={!validCount} onClick={goNext}>
              {mode.teams && selected.length > 2 ? t('common.next') : `${t('setup.start')} 🎉`}
            </button>
          ) : (
            <button className="btn block" disabled={!teamsValid} onClick={() => start(teams)}>
              {t('setup.start')} 🎉
            </button>
          )}
        </div>
      )}

      <PlayerEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(id) => setSelected((sel) => (sel.length < maxCount ? [...sel, id] : sel))}
      />
    </>
  );
}

function StepDots({ step, hasTeams }: { step: Step; hasTeams: boolean }) {
  const steps: Step[] = hasTeams ? ['mode', 'players', 'teams'] : ['mode', 'players'];
  const idx = steps.indexOf(step);
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
          <motion.div
            initial={false}
            animate={{ width: i <= idx ? '100%' : '0%' }}
            transition={spring}
            style={{ height: '100%', background: 'var(--primary)', borderRadius: 5 }}
          />
        </div>
      ))}
    </div>
  );
}
