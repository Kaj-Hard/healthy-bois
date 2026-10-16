# Healthy Bois

Offline Android app for scoring local games with friends (React + TypeScript + Vite + Motion, wrapped with Capacitor 8).

**Before any UI or UX work, read [DESIGN.md](DESIGN.md).** It is the design bible: Duolingo-grade ease of use,
tap-who → tap-what scoring, undo over confirm, juicy springs, per-game complementary pastel themes. New screens
and games must follow it. Update it when you introduce a new reusable pattern.

**To add or reskin a game, use the `new-game` skill** (`.claude/skills/new-game/`). Every game has a bespoke visual world
(`skin.css`, display font, signature components, `sfx.ts`) on top of the shared flow; see DESIGN.md §12.

## Map

- `src/games/<game>/`: one folder per game (`rules.ts` + tests, `theme.ts`, `skin.css`, `sfx.ts`, `index.tsx` definition + SVG art, `Play.tsx`).
  Registered in `src/games/registry.ts`. Contract: `GameDefinition` in `src/games/types.ts`.
- `src/components/play.tsx`: shared in-game building blocks (`useRoundActions`, `PointsSheet`, `StarterPicker`, `HistoryStrip`, `TargetPips`).
- `src/components/ui.tsx`: buttons, sheets, toast/confirm (`useOverlay`), avatars, `RollingNumber`, spring constants.
- `src/store/app.ts`: zustand store persisted to native storage (players, matches, favourites, settings, nav stack).
- `src/screens/`: Home (favourites), Library (search/filter), Players, Setup, Photo (winner photo step), Winner, Stats, Settings.
- `src/i18n/en.ts` + `da.ts`: every string in both languages (same keys).
- `src/lib/photos.ts`: winner photos as files in app storage (`@capacitor/filesystem`); matches store only the path.

## Commands

```bash
npm run dev          # browser dev server (use phone-size viewport)
npm test             # vitest: game rules + leaderboard
npx tsc -b           # type-check
npm run android:apk  # build release/healthy-bois.apk (SDK + JDK 21 under %LOCALAPPDATA%\Android)
npm run serve:apk    # LAN download page on :8080 for installing on the phone
```

## Gotchas

- Write files that contain non-ASCII (Danish text, emoji) with the Write/Edit tools, not bash heredocs. Heredocs have truncated them.
- In the dev browser, after hot reloads the app may load `src/store/app.ts?t=…`. Import that exact URL when poking the store
  from the console, or reload the page first; otherwise you get a second, disconnected store.
- The browser pane blocks the camera. The photo step then shows its file-input fallback. Test real capture on the phone.
