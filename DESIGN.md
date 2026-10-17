# Healthy Bois Design Bible 💪

> **Less scribbling, more playing.**
> The phone is a scoreboard you glance at between throws, in the sun, with a beer in the other hand.
> Every screen should feel as effortless and rewarding as Duolingo.

This is the source of truth for how Healthy Bois looks, moves, sounds and behaves. Read it before
touching any UI, and keep it updated when a new pattern earns its place.

---

## 1. UX principles (non-negotiable)

1. **Ease of use beats everything.** If a choice is between "more powerful" and "fewer taps", pick fewer taps.
2. **One obvious next action per screen.** The primary action is a full-width 3D button at the bottom (thumb zone).
   Secondary actions are ghost buttons or small text links, never competing colours.
3. **Score in two taps, never type mid-game.** *Tap who → tap what* (points in pétanque, the letter in GRIS).
   The value sheet commits on tap: no extra "Save".
4. **Undo instead of "are you sure?".** Every score shows a toast with **Undo**, and the history strip has an undo button.
   Confirmations are only for destructive or irreversible actions (abandon game, delete player/game, restore backup).
5. **Glanceable state.** Readable at arm's length: giant rolling numbers, progress pips/letter tiles, 👑 leader,
   🎯 who throws next, 🔥 match point, ❤️ last life. You should know the state of the game in one second.
6. **Smart defaults, zero setup.** Pre-select last time's lineup, auto-shuffle teams, skip steps that have one option,
   reopen straight into a running game, follow the phone's language.
7. **Forgiving.** Nothing is lost by a mis-tap: undo everywhere, "Oops, undo last end" on the winner screen,
   the back button never discards data, the active game auto-saves on every tap.
8. **Celebrate everything.** Scores pop, letters stamp, knockouts get a full-screen moment, wins get photo → confetti → fanfare.
   Fun badges (FANNY, FLAWLESS) turn stats into stories.
9. **Few decisions.** Filters are one row of chips, max ~6 options per choice, no settings inside the game flow.
10. **Big targets.** Primary buttons ≥ 56 px tall, icon buttons ≥ 44 px, scoring panels as big as the screen allows.

## 2. The flow every game follows

```
Home (♥ favourites) / Games library
  → Setup: mode (skipped if only one) → players (pre-selected) → teams (only for team modes, auto-shuffled)
  → Play: tap side → value sheet → toast with Undo · history strip · ⋯ menu (abandon)
  → Photo: "Strike a pose!" (gated step, skippable with a guilt-trip confirm)
  → Winner: polaroid / trophy, confetti, fanfare, ranking, Rematch (primary), New game, Home, Oops-undo
  → Hall of Glory: podium, leaderboard per game & mode, recent games with photos
```

New games plug into this flow. They own only their **Play** screen, rules, theme and art (see §10).

## 3. Colour

Bold pastels in **complementary pairs**. Every theme is a set of CSS custom properties on `:root`;
`App.tsx` swaps them when a game is on screen so it is instantly obvious what we're playing.

| Token | Role |
| --- | --- |
| `--bg`, `--bg-2` | Very light tint of the theme. Screen background. |
| `--surface` | Cards and sheets (white). |
| `--ink`, `--ink-soft` | Text: tinted near-black and muted. Never pure black. |
| `--line` | 2 px borders, empty states, 3D edges of neutral cards. |
| `--primary`, `--primary-deep`, `--primary-soft` | Main colour, its 3D edge/text shade, and a selection background. |
| `--accent`, `--accent-deep`, `--accent-soft` | The complementary colour. Used for "special" moments (shutter, NEW, highlights). |
| `--danger`, `--danger-deep` | Destructive actions only. |

**Themes**

| Theme | Primary | Accent | Feeling |
| --- | --- | --- | --- |
| Home / app | Lilac `#9b7bff` | Butter `#ffd45c` | Friendly, neutral |
| Pétanque | Terracotta `#e2683c` | Provence-shutter blue `#3b8fc9` | Sun-baked gravel terrain (see §12) |
| GRIS | Kit green `#1f9d55` | Referee-card yellow `#ffd23f` (+ red `#ef4136`) | Street football pitch (see §12) |

**Rules**
- Every coloured surface has a **deep** shade for its 3D bottom edge and for text on top of it (`textShadow: 0 3px 0 deep`).
- White text sits on `base` colours; `deep` text sits on `soft` colours.
- Team sides use the theme's `sideColors`; free-for-all sides use the player's own colour (`lib/palette.ts`, 10 pastels).
- Bad news (letters, knockouts, FANNY) uses the pink/red family. Good news uses primary/butter.

## 4. Typography

- App chrome: **Nunito Variable** (bundled, works offline). Rounded and friendly, like Duolingo's Feather.
- Every game skin brings its **own display face** for titles, names, scores and buttons (`--font-display`,
  `--font-label`). Body text, helper copy and sheet descriptions stay Nunito so reading never gets harder.
- Weights: **900** titles, numbers, buttons, names · **800** labels and body · **700** muted helper text.
- Uppercase + `letter-spacing: .02–.06em` for buttons, badges, tab labels and section titles.
- Sizes: page title 30–34 · sheet title 24 · names 16–22 · body 14–17 · helper 12–14 · **scores 44–128**.
- Numbers are the hero. Scores use `RollingNumber` and `letter-spacing: -0.04em`.

## 5. Shape, depth and iconography

- **3D everything tappable:** `box-shadow: 0 4–7px 0 <deep>`. On press: `translateY(shadow)` and the shadow drops to 0.
- Radii: chips & badges pill · buttons 14–18 · cards 20 · hero cards / panels 26–30 · sheets 28 (top corners).
- Borders: 2 px `--line` on neutral cards. Selected state = primary border + primary-soft background + primary-deep edge.
- **Emoji are the icon set** (consistent, colourful, offline): 🎯 play/jack · 🎲 games · 👥 players · 🏆 glory · ♥ favourite ·
  📸 photo · 👑 leader · 🔥 match point · ❤️ last life · 💀 out · 💋 fanny · ✨ flawless. Line icons (`Icon.*`) only for
  system controls (back, close, undo, menu, plus, shuffle).
- Each game has a custom SVG `Art` illustration (shiny, soft shadow, slight highlight), animated gently on cards.

## 6. Motion

Motion is feedback, not decoration. It must never block input for more than ~700 ms.

| Constant (`components/ui.tsx`) | Use |
| --- | --- |
| `spring` (stiffness 520, damping 30) | Moving things: sheets, tabs, layout shifts, page slides |
| `bouncy` (stiffness 600, damping 14) | Things appearing: pop-ins, badges, numbers, buttons in sheets |

Patterns:
- **Enter:** scale 0.4–0.8 → 1 with `bouncy`; lists stagger 0.02–0.07 s per item.
- **Screens:** tabs cross-fade (0.18 s); pushed screens slide in from the right.
- **Score up:** the number rolls (`RollingNumber`), the panel pulses (`scale 1 → 1.06 → 1`), particles burst from the tap point (`pop`).
- **Hit / letter:** the card shakes, the letter tile stamps in (scale 2.4 → 1 with a slight rotation).
- **Knockout:** full-screen overlay (grey avatar + big "OUT" stamp) for ~1.5 s, then the card morphs into the "Out" row.
- **Danger states pulse:** 🔥 match point, ❤️ last life, ⚔️ final duel loop `scale [1, 1.1, 1]`.
- **Win:** confetti (`celebrate`) + fanfare + rotating sun rays + trophy/polaroid drop-in.
- **Favourite:** heart bounces (scale 1 → 1.5 → 0.9 → 1) with a pink particle pop.
- Idle loops (game art bobbing, crown wobble) are slow (2–3 s) and subtle.
- Confetti respects `prefers-reduced-motion`.

## 7. Sound and haptics

All sounds are synthesised (`lib/feedback.ts`, no audio files). Each `fx.*` pairs a sound with a haptic,
and both can be switched off in Settings.

| Call | When |
| --- | --- |
| `fx.tap()` | Any ordinary tap: open sheet, toggle, navigate |
| `fx.select()` | Positive choice: select player, pick mode, favourite on |
| `fx.score(n)` | Points scored: arpeggio with *n* notes, heavy haptic |
| `fx.stamp()` | Took a hit (GRIS letter): low "bonk" |
| `fx.knockout()` | Eliminated: sad slide whistle, error haptic |
| `fx.undo()` | Undo / retake |
| `fx.coin()` | Coin flip, roulette, shuffle |
| `fx.shutter()` | Photo taken |
| `fx.win()` | Winner screen fanfare, success haptic |
| `fx.error()` | Invalid action (too many players, nothing to undo) |

## 8. Voice and copy

- Short, playful, a bit of locker-room banter: "Every boi for himself", "Mads must kiss Fanny 💋", "Strike a pose!".
- Talk to the group in second person. Verbs on buttons: "Let's play!", "Give the R", "Keep it!", "Rematch".
- An emoji at the start of a label is fine; one per label, max.
- **Always ship English and Danish** (`src/i18n/en.ts` + `da.ts`, same keys; TypeScript enforces it).
  Write the Danish naturally rather than translating word for word ("Kom så!", "Kaster grisen").
- Numbers over words ("3 to win", "2–12 players").

## 9. Layout

- Phone portrait only (locked in the Android manifest). Max content width 560 px.
- 16 px side gutter. Content scrolls inside `.scroll`. The primary CTA lives in `.bottom-bar` (fades into the background).
- Respect safe areas: `var(--safe-top)` / `var(--safe-bottom)` (Capacitor injects the insets).
- The tab bar floats above content (Play · Games · Bois · Glory). It shows only on the four root tabs, never inside a game.
- Bottom sheets (`Sheet`) for every in-context choice: drag the grip down or tap the backdrop to dismiss. Sheet content scrolls;
  if a sheet has a primary action and can grow tall (forms, pickers), pass it as `footer` so it stays pinned above the
  system navigation bar. Test sheets on a short screen (412×700): phones with 3-button navigation lose a lot of height.
- During play the scoring targets fill the screen; chrome is limited to a top bar, a status pill and the history strip.

## 10. Adding a game (theme recipe and checklist)

0. **Use the `new-game` skill** (`.claude/skills/new-game/`). It runs this whole recipe including the drilldown.
1. **Pick a visual world, not just colours** (§12). Then a complementary pastel pair that says the game's vibe in one glance (park, bar, beach, table…).
   Derive `--bg` as a very light tint of the primary, `--ink` as a dark shade of it, and `deep`/`soft` variants for both colours.
2. **Draw the `Art`** as an SVG at viewBox 100: object + soft ground shadow + highlight. It must read at 24 px and at 120 px.
3. **Define modes** (`playerCounts`, `teams`, `target`) and **tags** for the library (`outdoor`, `ball`, `teams`, `ffa`, `elimination`;
   add a new tag only if it helps people filter).
4. **Implement the rules** as pure functions with unit tests (`winnerOf`, `ranking`, `scoreText`, optional `fannySides`/`flawless`).
5. **Build the Play screen** with the shared blocks: `useRoundActions` (score + undo toast + photo hand-off), `HistoryStrip`,
   `PointsSheet`/custom value sheet, `StarterPicker`, `TargetPips`, `TopBar`, `Sheet` menu with abandon.
   Keep the **tap who → tap what** rhythm.
6. **Copy** in both languages: name, tagline, blurb, duration, mode name/tagline/rules.
7. **Build the skin** (§12): `skin.css`, display font, signature components and `sfx.ts`.
8. Register in `src/games/registry.ts`. Setup, library, favourites, photo, winner, stats and theming then work automatically.

## 11. Don'ts

- ❌ Text inputs during a game. ❌ Confirmation dialogs for reversible actions.
- ❌ More than one primary button on screen. ❌ Grey, flat, borderless buttons.
- ❌ Pure black or pure grey UI. Everything is tinted by the theme.
- ❌ Animations that delay the next tap, or loops that are fast and distracting.
- ❌ Hiding game state behind taps (scores, who's next and who's in danger are always visible).
- ❌ Network calls. The app is fully offline; data lives on the phone.

## 12. Game skins: same flow, different world

Two games must never be mistakable for each other. **The UX skeleton is shared; the world is bespoke.**

| Shared (never change per game) | Bespoke (every game owns it) |
| --- | --- |
| Screen flow (§2), tap-who → tap-what, sheets, undo toast, history strip, bottom CTA, tab bar | The setting: background texture, top-bar treatment, decorations |
| Button and card **shapes and depth** (3D edge, press-down), target sizes | Display typeface and its casing/spacing (`--font-display`, `--font-label`) |
| Motion constants (`spring`, `bouncy`) and when things animate | The **signature components**: what a side, a score, progress and danger look like |
| Accessibility: contrast, readable body text in Nunito | Signature motion moments and **sounds** (`games/<id>/sfx.ts`) |

**How it works.** `App.tsx` sets `data-skin="<game id>"` on every screen of that game (setup, play, photo, winner) and on
the overlays. `games/<id>/skin.css` styles `.screen[data-skin='<id>']` and its descendants. The screen carries the
attribute, not the page root, so the outgoing screen keeps its own look while the next slides in. Theme colours swap via
CSS variables (`GameTheme.vars`).

**Skin brief** (fill this in for every new game before writing code):

| | Pétanque · Provençal terrain | GRIS · Street pitch |
| --- | --- | --- |
| Setting | Sun-baked gravel with a warm sun glow | Mowed pastel-mint stripes, chalk halfway line and centre circle |
| Top bar | Striped café awning with a scalloped valance | Near-black scoreboard band, white chalk underline, LED pills |
| Display font | Fraunces (soft serif), sentence-case buttons | Bebas Neue (condensed caps), wide letter-spacing, `font-synthesis: none` |
| A side looks like | Hand-painted sign: team colour, dashed cream inner border, faint boule silhouette | Football kit card: striped shirt header, V-neck, big jersey number |
| Score / progress | Big serif numerals; 13 steel boules roll into dents in the gravel | Referee cards: yellow G-R-I, red S; empty slots are dashed outlines |
| Who's next / leader | Wooden jack (cochonnet) badge · 👑 | Captain's armband "C" on the fewest-letters player |
| Danger state | ☀️ ochre "3 to win" / "Match point!" | Red-framed card + "Last life", ⚔️ "Final duel" |
| Value sheet | Cream paper, serif 1–6 buttons with steel-boule tokens | The ref holds up the next card; yellow or red button |
| Big moment | Panel pulse + steel-coloured particle burst | Red card flies out of the ref's pocket: "OUT" |
| Sounds | Metallic clacks (one per point) + gravel settle; crunch on tap | Referee whistle (two blasts); long whistle + crowd "ohhh" on red |

**Rules for skins**
- Textures are CSS gradients or inline SVG data URIs (offline, tiny). No photos and no network images.
- Fonts come from `@fontsource` packages imported in the game's `index.tsx` (bundled, offline). One display face per game.
- If the display face has one weight, set `font-synthesis: none` so it is never faux-bolded.
- Keep tappable things recognisable: same 3D edge and press-down behaviour, only the material changes.
- Sounds are built from `tone`, `noise` and `trill` in `lib/feedback.ts`, and always paired with a haptic.
- **Distinctness check:** put a screenshot of the new play screen next to every existing game's play screen.
  If someone could mistake one for another at a glance, the skin isn't done.
