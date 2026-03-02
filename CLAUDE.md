# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step required. Open `index.html` directly in a browser:

```sh
open index.html        # macOS
# or serve locally:
python3 -m http.server 8080
```

## Project Structure

Three-file vanilla web app — no dependencies, no bundler:

- **`index.html`** — DOM structure and UI text (Traditional Chinese / Taiwan locale)
- **`game.js`** — All game logic and state (~565 lines)
- **`styles.css`** — Layout, gem colors, and animations (~302 lines)

## Architecture

### Game State (`game.js`)

Key globals:
- `grid[][]` — 2D array of tile IDs on the 8×8 board
- `tiles` — Map from tile ID → tile object `{ id, type, row, col, cellRow, cellCol, el, core }`
- `selected` — Currently selected tile awaiting a swap partner
- `score`, `moves`, `mistakes`, `timeLeft` — Runtime state

### Game Constants

```js
SIZE = 8          // board is 8×8
TYPES = 6         // 6 gem colors
ROUND_SECONDS = 90
MAX_MISTAKES = 3
// Animation durations (ms):
ANIM_SWAP = 220, ANIM_CLEAR = 320, ANIM_DROP = 260
```

### Core Game Loop

1. `generateBoard()` — Fills grid avoiding pre-existing 3-in-a-row
2. `handleTileClick()` — Select gem → swap adjacent → validate
3. `findMatches()` → `resolveMatches()` — Chain reaction: clear, collapse, repeat
4. `collapse()` — Gravity: drop existing gems down, spawn new ones from top
5. `saveState()` / `loadState()` — Persist game to `localStorage` after every move

### Gem Types

CSS classes `type-0` through `type-5` map to: ruby, aqua, amber, emerald, amethyst, sapphire (defined via CSS variables in `styles.css`).

### Animations

Three sequential phases are coordinated with `setTimeout` chains using the constants above. Particle burst effects are DOM elements appended and removed after `ANIM_CLEAR`.

### Scoring

10 points per cleared gem; chain combos multiply the base within `resolveMatches()`.
