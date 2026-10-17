import { App as CapApp } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Overlays, spring } from './components/ui';
import { getGame } from './games/registry';
import { useT } from './i18n';
import { fx } from './lib/feedback';
import { Home } from './screens/Home';
import { Library } from './screens/Library';
import { Photo } from './screens/Photo';
import { Players } from './screens/Players';
import { Settings } from './screens/Settings';
import { Setup } from './screens/Setup';
import { Stats } from './screens/Stats';
import { Winner } from './screens/Winner';
import { TAB_ROUTES, useActiveMatch, useApp, type Route } from './store/app';

const BASE_THEME: Record<string, string> = {};

/** Which game's theme should be painted for the current route (undefined = app theme). */
function useThemeGameId(route: Route): string | undefined {
  const active = useActiveMatch();
  const matchGame = useApp((s) =>
    route.name === 'winner' || route.name === 'photo' ? s.matches.find((m) => m.id === route.matchId)?.gameId : undefined,
  );
  if (route.name === 'setup') return route.gameId;
  if (route.name === 'play') return active?.gameId;
  if (route.name === 'winner' || route.name === 'photo') return matchGame;
  return undefined;
}

function applyTheme(gameId: string | undefined) {
  const root = document.documentElement;
  const vars = gameId ? getGame(gameId).theme.vars : {};
  // Remember the stylesheet defaults the first time so we can restore them.
  for (const key of Object.keys(vars)) if (!(key in BASE_THEME)) BASE_THEME[key] = '';
  for (const key of Object.keys(BASE_THEME)) root.style.setProperty(key, vars[key] ?? BASE_THEME[key]);
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

function PlayRoute() {
  // Remember which match this screen shows so the final score stays visible
  // while the winner screen slides in (the match stops being 'active' at that point).
  const activeId = useApp((s) => s.activeMatchId);
  const shownId = useRef(activeId);
  if (activeId) shownId.current = activeId;
  const match = useApp((s) => s.matches.find((m) => m.id === shownId.current));
  const resetTo = useApp((s) => s.resetTo);
  useEffect(() => {
    if (!match || match.status === 'abandoned') resetTo({ name: 'home' });
  }, [match, resetTo]);
  if (!match) return null;
  const { Play } = getGame(match.gameId);
  return <Play match={match} />;
}

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'players':
      return <Players />;
    case 'stats':
      return <Stats />;
    case 'library':
      return <Library />;
    case 'settings':
      return <Settings />;
    case 'setup':
      return <Setup gameId={route.gameId} />;
    case 'play':
      return <PlayRoute />;
    case 'photo':
      return <Photo matchId={route.matchId} />;
    case 'winner':
      return <Winner matchId={route.matchId} />;
  }
}

function TabBar({ current }: { current: Route['name'] }) {
  const t = useT();
  const resetTo = useApp((s) => s.resetTo);
  const tabs = [
    { name: 'home', icon: '🎯', label: t('nav.play') },
    { name: 'library', icon: '🎲', label: t('nav.library') },
    { name: 'players', icon: '👥', label: t('nav.players') },
    { name: 'stats', icon: '🏆', label: t('nav.stats') },
  ] as const;
  return (
    <motion.nav className="tabbar" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={spring}>
      {tabs.map((tab) => {
        const active = current === tab.name;
        return (
          <button
            key={tab.name}
            className={`tab ${active ? 'active' : ''}`}
            onClick={() => {
              if (!active) fx.tap();
              resetTo({ name: tab.name });
            }}
          >
            {active && <motion.span layoutId="tab-pill" className="tab-pill" transition={spring} />}
            <motion.span className="tab-icon" animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }} transition={spring}>
              {tab.icon}
            </motion.span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </motion.nav>
  );
}

export default function App() {
  const hydrated = useApp((s) => s.hydrated);
  const stack = useApp((s) => s.stack);
  const route = stack[stack.length - 1];
  const themeGameId = useThemeGameId(route);
  const isTab = (TAB_ROUTES as readonly string[]).includes(route.name) && stack.length === 1;

  useLayoutEffect(() => applyTheme(themeGameId), [themeGameId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {});
    const sub = CapApp.addListener('backButton', () => {
      if (!useApp.getState().back()) void CapApp.minimizeApp();
    });
    return () => {
      void sub.then((s) => s.remove());
    };
  }, []);

  if (!hydrated) return null;

  // Tabs cross-fade; pushed screens slide in from the right.
  const key = isTab ? `tab-${route.name}` : `${stack.length}-${route.name}`;
  const variants = isTab
    ? { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '30%', opacity: 0 } };

  return (
    <div className="shell">
      <AnimatePresence initial={false}>
        <motion.div
          key={key}
          className={`screen ${isTab ? 'with-tabs' : ''}`}
          // Bespoke skin: games/<id>/skin.css targets [data-skin='<id>']. It lives on the screen (not the root)
          // so a screen keeps its own look while it animates out.
          data-skin={themeGameId}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={isTab ? { duration: 0.18 } : { type: 'spring', stiffness: 380, damping: 38 }}
        >
          {renderRoute(route)}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{isTab && <TabBar key="tabs" current={route.name} />}</AnimatePresence>
      {/* Sheets portal in here so they sit above the tab bar; data-skin keeps game sheets in their skin. */}
      <div id="overlay-root" data-skin={themeGameId}>
        <Overlays />
      </div>
    </div>
  );
}
