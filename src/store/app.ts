import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Match, Side } from '../games/types';
import { getGame } from '../games/registry';
import { uid } from '../lib/id';
import { deletePhoto } from '../lib/photos';
import { deviceStorage } from '../lib/storage';
import { detectLang, type Lang } from '../i18n';

export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: number;
  /** Hidden from pickers but kept so history still resolves names. */
  archived?: boolean;
}

export interface Settings {
  lang: Lang;
  sound: boolean;
  haptics: boolean;
}

export type Route =
  | { name: 'home' }
  | { name: 'players' }
  | { name: 'stats' }
  | { name: 'library' }
  | { name: 'settings' }
  | { name: 'setup'; gameId: string }
  | { name: 'play' }
  | { name: 'photo'; matchId: string }
  | { name: 'winner'; matchId: string };

export const TAB_ROUTES = ['home', 'library', 'players', 'stats'] as const;

interface PersistedState {
  players: Player[];
  matches: Match[];
  activeMatchId?: string;
  /** Game ids pinned to the home screen, in the order they were added. */
  favorites: string[];
  settings: Settings;
}

interface AppState extends PersistedState {
  hydrated: boolean;
  stack: Route[];

  navigate(route: Route): void;
  replace(route: Route): void;
  back(): boolean;
  resetTo(route: Route): void;

  addPlayer(p: Pick<Player, 'name' | 'emoji' | 'color'>): string;
  updatePlayer(id: string, patch: Partial<Pick<Player, 'name' | 'emoji' | 'color'>>): void;
  removePlayer(id: string): void;

  startMatch(input: { gameId: string; modeId: string; sides: Side[] }): Match;
  setFirstSide(sideId: string): void;
  scoreRound(sideId: string, points: number): Match | undefined;
  undoRound(): Match | undefined;
  /** Re-open a finished match by removing its last round (winner screen "oops"). */
  reopenMatch(matchId: string): void;
  abandonMatch(): void;
  deleteMatch(matchId: string): void;
  setMatchPhoto(matchId: string, path: string | undefined): void;
  toggleFavorite(gameId: string): boolean;

  updateSettings(patch: Partial<Settings>): void;
  exportData(): string;
  importData(json: string): boolean;
}

const BACKUP_MAGIC = 'healthy-bois-backup';

function replaceMatch(matches: Match[], next: Match): Match[] {
  return matches.map((m) => (m.id === next.id ? next : m));
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      stack: [{ name: 'home' }],
      players: [],
      matches: [],
      activeMatchId: undefined,
      favorites: [],
      settings: { lang: detectLang(), sound: true, haptics: true },

      navigate: (route) => set((s) => ({ stack: [...s.stack, route] })),
      replace: (route) => set((s) => ({ stack: [...s.stack.slice(0, -1), route] })),
      back: () => {
        const { stack } = get();
        const top = stack[stack.length - 1];
        if (top?.name === 'photo') {
          set({ stack: [...stack.slice(0, -1), { name: 'winner', matchId: top.matchId }] });
          return true;
        }
        if (stack.length <= 1) {
          if (stack[0]?.name !== 'home') {
            set({ stack: [{ name: 'home' }] });
            return true;
          }
          return false;
        }
        set({ stack: stack.slice(0, -1) });
        return true;
      },
      resetTo: (route) => set({ stack: [route] }),

      addPlayer: (p) => {
        const id = uid();
        set((s) => ({ players: [...s.players, { ...p, name: p.name.trim(), id, createdAt: Date.now() }] }));
        return id;
      },
      updatePlayer: (id, patch) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() } : p)),
        })),
      removePlayer: (id) =>
        set((s) => {
          const used = s.matches.some((m) => m.sides.some((side) => side.playerIds.includes(id)));
          return {
            players: used
              ? s.players.map((p) => (p.id === id ? { ...p, archived: true } : p))
              : s.players.filter((p) => p.id !== id),
          };
        }),

      startMatch: ({ gameId, modeId, sides }) => {
        const game = getGame(gameId);
        const mode = game.modes.find((m) => m.id === modeId)!;
        const match: Match = {
          id: uid(),
          gameId,
          modeId,
          sides,
          rounds: [],
          target: mode.target,
          status: 'active',
          startedAt: Date.now(),
        };
        set((s) => ({
          // Only one game can run at a time; a still-active one is abandoned.
          matches: [
            ...s.matches.map((m) => (m.status === 'active' ? { ...m, status: 'abandoned' as const } : m)),
            match,
          ],
          activeMatchId: match.id,
        }));
        return match;
      },

      setFirstSide: (sideId) => {
        const match = get().matches.find((m) => m.id === get().activeMatchId);
        if (!match) return;
        set((s) => ({ matches: replaceMatch(s.matches, { ...match, firstSideId: sideId }) }));
      },

      scoreRound: (sideId, points) => {
        const match = get().matches.find((m) => m.id === get().activeMatchId);
        if (!match || match.status !== 'active') return undefined;
        let next: Match = {
          ...match,
          firstSideId: match.firstSideId ?? sideId,
          rounds: [...match.rounds, { sideId, points, at: Date.now() }],
        };
        const winner = getGame(match.gameId).winnerOf(next);
        if (winner) next = { ...next, status: 'finished', winnerSideId: winner, finishedAt: Date.now() };
        set((s) => ({
          matches: replaceMatch(s.matches, next),
          activeMatchId: next.status === 'active' ? next.id : undefined,
        }));
        return next;
      },

      undoRound: () => {
        const match = get().matches.find((m) => m.id === get().activeMatchId);
        if (!match || match.rounds.length === 0) return undefined;
        const next: Match = { ...match, rounds: match.rounds.slice(0, -1) };
        set((s) => ({ matches: replaceMatch(s.matches, next) }));
        return next;
      },

      reopenMatch: (matchId) => {
        const match = get().matches.find((m) => m.id === matchId);
        if (!match || match.status !== 'finished') return;
        void deletePhoto(match.photo);
        const next: Match = {
          ...match,
          status: 'active',
          winnerSideId: undefined,
          finishedAt: undefined,
          photo: undefined,
          rounds: match.rounds.slice(0, -1),
        };
        set((s) => ({
          matches: replaceMatch(
            s.matches.map((m) => (m.status === 'active' ? { ...m, status: 'abandoned' as const } : m)),
            next,
          ),
          activeMatchId: next.id,
        }));
      },

      abandonMatch: () =>
        set((s) => ({
          // Abandoned games with no rounds are just noise; drop them entirely.
          matches: s.matches
            .map((m) => (m.id === s.activeMatchId ? { ...m, status: 'abandoned' as const } : m))
            .filter((m) => !(m.id === s.activeMatchId && m.rounds.length === 0)),
          activeMatchId: undefined,
        })),

      deleteMatch: (matchId) => {
        void deletePhoto(get().matches.find((m) => m.id === matchId)?.photo);
        set((s) => ({ matches: s.matches.filter((m) => m.id !== matchId) }));
      },

      setMatchPhoto: (matchId, path) => {
        const match = get().matches.find((m) => m.id === matchId);
        if (!match) return;
        if (match.photo && match.photo !== path) void deletePhoto(match.photo);
        set((s) => ({ matches: replaceMatch(s.matches, { ...match, photo: path }) }));
      },

      toggleFavorite: (gameId) => {
        const on = !get().favorites.includes(gameId);
        set((s) => ({ favorites: on ? [...s.favorites, gameId] : s.favorites.filter((id) => id !== gameId) }));
        return on;
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      exportData: () => {
        // Photos are files on the phone and are not part of the backup text.
        const { players, matches, activeMatchId, favorites, settings } = get();
        return JSON.stringify({ kind: BACKUP_MAGIC, version: 1, exportedAt: new Date().toISOString(), players, matches, activeMatchId, favorites, settings });
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (data?.kind !== BACKUP_MAGIC || !Array.isArray(data.players) || !Array.isArray(data.matches)) return false;
          set({
            players: data.players,
            matches: data.matches,
            activeMatchId: data.activeMatchId,
            favorites: Array.isArray(data.favorites) ? data.favorites : get().favorites,
            settings: { ...get().settings, ...data.settings },
            stack: [{ name: 'home' }],
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'healthy-bois',
      version: 1,
      storage: createJSONStorage(() => deviceStorage),
      partialize: (s): PersistedState => ({
        players: s.players,
        matches: s.matches,
        activeMatchId: s.activeMatchId,
        favorites: s.favorites,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        // Reopen straight into a running game: the phone may have killed the app mid-match.
        const active = state?.activeMatchId;
        useApp.setState({ hydrated: true, stack: active ? [{ name: 'home' }, { name: 'play' }] : [{ name: 'home' }] });
      },
    },
  ),
);

/* ---------- selectors ---------- */

export function useActiveMatch(): Match | undefined {
  return useApp((s) => s.matches.find((m) => m.id === s.activeMatchId));
}

export function usePlayersById(): Map<string, Player> {
  const players = useApp((s) => s.players);
  return useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
}
