---
name: new-game
description: Create a new bespoke game for Healthy Bois (rules, scoring screen, unique visual skin, sounds, translations) that plugs into the shared setup → play → photo → winner flow. Use when the user wants to add a game, sport or drinking game to the app, or asks to "make a game like GRIS/Pétanque", or wants to redo a game's look.
---

# New bespoke game for Healthy Bois

You are adding a game to an offline Android scorekeeping app (React + Capacitor). Every game shares one UX
skeleton (Duolingo-grade ease, two-tap scoring, undo over confirm) but lives in its **own visual world**, so
nobody could mistake it for another game. The result must feel as polished as the existing games.

**Read first:** `DESIGN.md` (especially §1 UX principles, §2 flow, §10 recipe, §12 skins) and `CLAUDE.md`.
**Canonical examples:** `src/games/petanque/` (points race, teams + free-for-all, Provençal skin) and
`src/games/gris/` (elimination with lives, referee-card skin). Copy their structure, not their look.
**File skeletons:** [templates.md](templates.md).

## Workflow

### 1. Drilldown: one round of questions, then run with it

Ask everything that's genuinely the user's call in **one** `AskUserQuestion` round (up to 4 questions), then make the
remaining decisions yourself and state them in the final summary. Typical questions:

1. **Rules / scoring unit.** What does one "tap" record? (points for a side, a hit/letter/life lost, a round won)
   and how does someone win? Offer the 2–3 most common house variants you know of for that game.
2. **Players and modes.** Player range, teams vs. every-player-for-themselves, an official mode vs. a house-rules mode.
3. **Visual world.** Pitch **three distinct art directions** with an ASCII mockup in each option's `preview`.
   Each pitch names: the setting, the colour pair, the display font, the signature component (what a side looks like),
   the progress token, and the signature sound. Recommend the one that is most unlike the existing games.
4. Anything else that changes what you build (e.g. a special end-of-game rule).

Never ask about things you can decide from DESIGN.md (button styles, flow, library tags, translations: always EN + DA).

### 2. Write the skin brief

Before coding, fill in the row for the new game in the skin table in DESIGN.md §12: setting, top bar, display font,
what a side looks like, score/progress, who's next/leader, danger state, value sheet, big moment, sounds.
Run the **distinctness check** in your head against every row already in the table. Change anything that repeats.

### 3. Rules first, with tests

`src/games/<id>/rules.ts` holds pure functions only: `modes`, `winnerOf`, `ranking`, `scoreText`, plus
`fannySides`/`flawless` if they make sense for the game. Write `rules.test.ts` covering normal play, the winning
condition, edge cases (heads-up, overshoot, ties if possible) and ranking order. Run `npm test`.

Model everything as `Match.rounds` (one `Round` per tap: `{ sideId, points }`). Derive all state from the rounds
so undo, resume and history work for free. If a game truly needs more state, extend `Match` carefully and keep it
JSON-serialisable.

### 4. Theme, font, skin and sounds

- `theme.ts`: `GameTheme.vars` (all 12 tokens: `--bg`, `--bg-2`, `--surface`, `--ink`, `--ink-soft`, `--line`,
  `--primary(-deep/-soft)`, `--accent(-deep/-soft)`) + `sideColors` + any skin constants (e.g. card colours).
  Bold pastels, complementary pair. Body text on `--bg` must stay readable.
- Font: `npm install @fontsource/<font>` (or `@fontsource-variable/<font>`), check the family name in its `index.css`,
  and import it at the top of the game's `index.tsx` together with `./skin.css`.
- `skin.css`: everything scoped to `.screen[data-skin='<id>']` / `[data-skin='<id>'] …`. Set `--font-display` and
  `--font-label`, the background texture (CSS gradients or an inline SVG data URI only), the top-bar treatment, and
  button/badge/name/section-title typography. Keep the 3D press-down shapes; change the material.
- `sfx.ts`: 2–4 signature sounds built from `tone`, `noise`, `trill` (`src/lib/feedback.ts`), each paired with `haptic(...)`.
  Typical set: tap/open, score or hit, big moment (knockout / match point), optional settle/undo flavour.

### 5. The Play screen

`Play.tsx` receives `{ match }`. It follows the shared rhythm and uses the shared building blocks:

- `TopBar` (back + title + game badge + ⋯ menu), a status pill row, the sides filling the screen,
  `.bottom-bar` with a one-line hint and `HistoryStrip`, a menu `Sheet` with **Abandon** (confirm via `useOverlay().ask`).
- **Tap who → tap what:** tapping a side opens a value sheet (`PointsSheet` with a skin `dot` token, or a custom sheet
  like GRIS's `CardSheet`). Picking commits immediately.
- Scoring goes through `useRoundActions().score(side, points, { origin, sound, message, finishDelay })`. It plays
  the sound, bursts particles, shows the undo toast and hands off to the photo step when the game ends.
- Guard the sheet with a `pickLock` ref (see both games) so a double-tap never scores twice.
- Glanceable state on screen at all times: score/progress, who's next, leader, danger badges.
- Signature components live at the bottom of `Play.tsx` under `/* ---------- skin pieces ---------- */`.

### 6. Definition, copy, registration

- `index.tsx`: font + skin imports, the `Art` SVG (viewBox 100, readable at 24 px and 120 px), and the
  `GameDefinition` (`blurb`, `duration`, `tags`, optional `roundsLabel`).
- Translations in **both** `src/i18n/en.ts` and `da.ts` under `<id>.*` (name, tagline, blurb, duration, mode
  name/tagline/rules, every play-screen string). TypeScript fails if Danish is missing a key.
- Register in `src/games/registry.ts`. Library, favourites, setup, photo, winner and stats then work automatically.
  Check the library tags make the game findable (`GameTag` in `types.ts`; add a tag only if it helps filtering).

### 7. Verify like a player

1. `npx tsc -b` and `npm test` are clean.
2. Browser pane at 375×812 (`preview_start` with `web`, `resize_window` mobile). Walk the real flow: Games tab → the game →
   setup → play several rounds (UI taps) → value sheet → undo → big moment → winner photo (camera is blocked in the pane;
   the file-input fallback appears) → winner → Glory tab.
   - To fast-forward, import the store **at the URL the page actually loaded**:
     `performance.getEntriesByType('resource').map(e => e.name).find(n => n.includes('store/app.ts'))`.
   - Screenshots in the pane can lag behind animations. Confirm state with `get_page_text` or JS before chasing ghosts.
3. Screenshot the play screen and compare it with every other game's play screen (**distinctness check**).
4. Reset the viewport (`resize_window` desktop) when done.

### 8. Ship

1. Update DESIGN.md (§3 theme table, §12 skin table) and the README game table.
2. Bump the version as described in CLAUDE.md → Versions (a new game is a minor release, e.g. 0.4.0; fixes get a letter, e.g. 0.4.0a).
3. `npm run android:apk`, then `npm run serve:apk` in the background and give the user the LAN URL
   (http://<pc-ip>:8080; the server prints it).
4. Commit with a descriptive message. Don't push unless asked.

## Quality bar (check before you call it done)

- [ ] One-handed, two taps per scoring event, no typing during play
- [ ] Every scoring tap has a sound, a haptic, a visual reaction and an undo toast
- [ ] Danger and leader states are visible without tapping anything
- [ ] The skin changes the setting, typography, side component, progress token and sounds, not just the colours
- [ ] Readable at arm's length in sunlight (contrast, big numerals)
- [ ] English and Danish copy that sounds natural, with the same playful voice as the rest of the app
- [ ] Rules covered by unit tests; resume, undo and "Oops, undo last end" work because state is derived from rounds
- [ ] No network access anywhere; fonts and textures are bundled
