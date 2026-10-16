# Healthy Bois 💪

Offline score keeping for games with the bois. Design language and UX rules live in [DESIGN.md](DESIGN.md). Register players once, reuse them in every
game, and build up a local Hall of Glory of who wins the most.

Everything lives on the phone: no account, no server, no internet needed.

## Games

| Game | Modes |
| --- | --- |
| **Pétanque** | **Official**: singles 1v1, doubles 2v2, triples 3v3, first team to 13. Points per end are capped at 3 in singles and 6 in doubles/triples. **Every boi for himself**: house rules for 3–8 players; each round the closest player scores 1–3, first to 13. |
| **GRIS** | Keep a football in the air in a circle (2–12 players). Drop it and you get the next letter of G-R-I-S. Four letters and you're out; the last one standing wins. |

Favourite games pin to the home screen, and the **Games** tab has search plus player-count and tag filters.
Every win ends with a **winner photo** step (skippable), and the photo is saved with the game in the Hall of Glory.

## Stack

- **React + TypeScript + Vite** for the UI, **Motion** for animations, **canvas-confetti** for celebrations
- **Zustand** state persisted to native storage (Android SharedPreferences via `@capacitor/preferences`)
- **Capacitor 8** wraps the web bundle into a native Android app (haptics and the back button are native)
- Sounds are synthesised with WebAudio, so there are no audio assets

## Develop

```bash
npm install
npm run dev        # browser at http://localhost:5173 (use phone-size devtools)
npm test           # rules + leaderboard unit tests
```

## Build and install on Android

Needs the Android SDK and JDK 21. `scripts/build-apk.mjs` finds them in
`%LOCALAPPDATA%\Android\Sdk` and `%LOCALAPPDATA%\Android\jdk-21*`, or you can set `ANDROID_HOME` / `JAVA_HOME`.

```bash
npm run android:apk   # -> release/healthy-bois.apk
npm run serve:apk     # serves a download page on your LAN, port 8080
```

Open the printed URL on the phone, download, and install. New builds install over the old app and keep
all data, as long as they're built on the same machine (same debug signing key).

## Adding a new game

Follow the recipe in [DESIGN.md §10](DESIGN.md#10-adding-a-game-theme-recipe-and-checklist). In short:

1. Create `src/games/<game>/` exporting a `GameDefinition` (see `src/games/types.ts`):
   a theme (CSS variables + side colours), modes (player counts, teams or not, target), library tags,
   `winnerOf`, `ranking`, `scoreText`, an `Art` illustration and a `Play` screen.
2. Reuse the building blocks in `src/components/play.tsx`: `PointsSheet`, `StarterPicker`,
   `HistoryStrip`, `TargetPips` and `useRoundActions`.
3. Add translations to `src/i18n/en.ts` and `src/i18n/da.ts`.
4. Register it in `src/games/registry.ts`.

Players, history, the leaderboard, the winner screen and theming work automatically.

## Data

Settings → Backup copies all data as JSON to the clipboard. Restore pastes it back,
which is handy when moving to a new phone. Winner photos are JPEG files in the app's private storage and are not part of the backup.
