# Changelog

Release notes for each version. `npm run release` publishes the section matching the version in `package.json`.
Versions: `0.3.0` is a release, `0.3.0a`, `0.3.0b`, … are hotfixes for it.

## 0.3.0a

Fixes from the first round of testing.

- **Save is always reachable** when adding a player. On some phones (OnePlus Nord 4, Pixel) the button hid below the
  screen. Sheets now scroll, and the main button is pinned at the bottom.
- **Several games in progress at once.** Starting a pétanque game no longer throws away a GRIS game you were in the
  middle of. Home shows every unfinished game, and game cards show an "In progress" badge. Only starting a new game of
  the same type asks before replacing it.
- **Smoother confetti.** It no longer freezes and piles up on some phones.
- A quick double tap during a screen change can no longer start a game twice.

## 0.3.0

- Pétanque and GRIS each get their own world: a Provençal gravel terrain with steel boules and a wooden jack, and a
  street-football pitch with kit cards and referee cards. New sounds for both.

## 0.2.0

- New game: **GRIS**. Juggle a football in a circle; every drop gives you a letter of G-R-I-S. Last one standing wins.
- **Games** tab with search and filters, and ♥ favourites pinned to the home screen.
- **Winner photo** after every game, saved with the game in the Hall of Glory.

## 0.1.0

- First version: **Pétanque** (official teams and every-boi-for-himself house rules), players, Hall of Glory,
  English and Danish.
