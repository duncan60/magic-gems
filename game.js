const SIZE = 8;
const TYPES = 6;
const SAVE_KEY = "magic_gems_save";
const BEST_KEY = "magic_gems_best";

const GEM_COLORS = [
  "#ff6b6b", // ruby
  "#4dd0e1", // aqua
  "#ffd166", // amber
  "#8aff80", // emerald
  "#c38bff", // amethyst
  "#6ea8ff"  // sapphire
];

const ANIM_SWAP = 220;
const ANIM_CLEAR = 320;
const ANIM_DROP = 260;
const PARTICLE_BASE = 6;
const PARTICLE_CHAIN_BOOST = 4;
const ROUND_SECONDS = 90;
const MAX_MISTAKES = 3;

const boardEl      = document.getElementById("board");
const scoreEl      = document.getElementById("score");
const bestEl       = document.getElementById("best");
const movesEl      = document.getElementById("moves");
const timerEl      = document.getElementById("timer");
const mistakesEl   = document.getElementById("mistakes");
const messageEl    = document.getElementById("message");
const comboEl      = document.getElementById("combo");
const gameOverEl   = document.getElementById("gameOver");
const overReasonEl = document.getElementById("overReason");
const overScoreEl  = document.getElementById("overScore");
const overBestEl   = document.getElementById("overBest");
const overMovesEl  = document.getElementById("overMoves");
const overTimeEl   = document.getElementById("overTime");
const overMistakesEl = document.getElementById("overMistakes");
const newGameBtn   = document.getElementById("newGame");
const restartBtn   = document.getElementById("restart");
const startScreenEl = document.getElementById("startScreen");
const startBestEl  = document.getElementById("startBest");

let grid = [];
let tiles = new Map();
let selected = null;
let score = 0;
let moves = 0;
let locked = false;
let tileIdCounter = 1;
let timeLeft = ROUND_SECONDS;
let mistakes = 0;
let timerId = null;
let gameOver = false;
let gameStarted = false;
let lastPlayerSwap = null; // { a: {row,col}, b: {row,col} }
let touchStartX = 0;
let touchStartY = 0;
let touchStartTileEl = null;

function randomGem() {
  return Math.floor(Math.random() * TYPES);
}

function createTile(type, row, col) {
  const id = tileIdCounter++;
  const el = document.createElement("div");
  el.className = "tile";
  const core = document.createElement("div");
  core.className = "core";
  core.style.background = GEM_COLORS[type];
  el.appendChild(core);
  el.dataset.id = String(id);
  boardEl.appendChild(el);
  const tile = { id, type, row, col, cellRow: row, cellCol: col, el, core, specialType: null };
  tiles.set(id, tile);
  return tile;
}

function applySpecialClass(tile) {
  tile.el.classList.remove("sp-row", "sp-col", "sp-color");
  if (tile.specialType) {
    tile.el.classList.add(`sp-${tile.specialType}`);
    if (tile.specialType === "color") {
      tile.core.style.background = "#ddd8ff";
    }
  }
}

function placeTile(tile, row, col) {
  tile.cellRow = row;
  tile.cellCol = col;
  grid[row][col] = tile.id;
  tile.el.dataset.row = String(row);
  tile.el.dataset.col = String(col);
}

function generateBoard() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  tiles.clear();
  tileIdCounter = 1;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let type = randomGem();
      while (
        (c >= 2 &&
          tiles.get(grid[r][c - 1]).type === type &&
          tiles.get(grid[r][c - 2]).type === type) ||
        (r >= 2 &&
          tiles.get(grid[r - 1][c]).type === type &&
          tiles.get(grid[r - 2][c]).type === type)
      ) {
        type = randomGem();
      }
      const tile = createTile(type, r, c);
      placeTile(tile, r, c);
    }
  }

  layoutTiles(true);
}

function tileAt(row, col) {
  const id = grid[row][col];
  return id ? tiles.get(id) : null;
}

function layoutTiles(noAnim = false) {
  const root = getComputedStyle(document.documentElement);
  const tileSize = parseFloat(root.getPropertyValue("--tile"));
  const gap = parseFloat(root.getPropertyValue("--gap"));

  tiles.forEach((tile) => {
    if (noAnim) tile.el.classList.add("no-anim");
    const effectiveCol = Number.isFinite(tile.col) ? tile.col : tile.cellCol;
    const effectiveRow = Number.isFinite(tile.row) ? tile.row : tile.cellRow;
    const x = effectiveCol * (tileSize + gap);
    const y = effectiveRow * (tileSize + gap);
    tile.el.style.transform = `translate(${x}px, ${y}px)`;
    if (noAnim) {
      tile.el.offsetHeight;
      tile.el.classList.remove("no-anim");
    }
  });
}

function spawnBurst(tile, chain) {
  const root = getComputedStyle(document.documentElement);
  const tileSize = parseFloat(root.getPropertyValue("--tile"));
  const gap = parseFloat(root.getPropertyValue("--gap"));
  const pad = parseFloat(root.getPropertyValue("--pad"));

  const centerX = pad + tile.col * (tileSize + gap) + tileSize / 2;
  const centerY = pad + tile.row * (tileSize + gap) + tileSize / 2;
  const count = PARTICLE_BASE + chain * PARTICLE_CHAIN_BOOST;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * (18 + chain * 6);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.left = `${centerX - 3}px`;
    p.style.top = `${centerY - 3}px`;
    p.style.setProperty("--dx", `${dx}px`);
    p.style.setProperty("--dy", `${dy}px`);
    p.style.background = tile.specialType === "color" ? "#ffffff" : GEM_COLORS[tile.type];
    boardEl.appendChild(p);
    setTimeout(() => p.remove(), 520);
  }
}

function updateHUD() {
  scoreEl.textContent = String(score);
  movesEl.textContent = String(moves);
  timerEl.textContent = String(timeLeft);
  mistakesEl.textContent = `${mistakes}/${MAX_MISTAKES}`;
  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = String(best);
}

function showGameOver(reason) {
  const best = Math.max(score, Number(localStorage.getItem(BEST_KEY) || 0));
  overReasonEl.textContent = reason || "回合結束";
  overScoreEl.textContent = String(score);
  overBestEl.textContent = String(best);
  overMovesEl.textContent = String(moves);
  overTimeEl.textContent = String(timeLeft);
  overMistakesEl.textContent = `${mistakes}/${MAX_MISTAKES}`;
  gameOverEl.classList.remove("hidden");
  newGameBtn.textContent = "Game Over";
  newGameBtn.classList.add("gameover");
}

function showStartScreen() {
  startBestEl.textContent = String(Number(localStorage.getItem(BEST_KEY) || 0));
  startScreenEl.classList.remove("hidden");
}

function hideStartScreen() {
  startScreenEl.classList.add("hidden");
}

function hideGameOver() {
  gameOverEl.classList.add("hidden");
  newGameBtn.textContent = "新遊戲";
  newGameBtn.classList.remove("gameover");
}

function setMessage(text) {
  messageEl.textContent = text;
  if (text) {
    setTimeout(() => {
      if (messageEl.textContent === text) messageEl.textContent = "";
    }, 1200);
  }
}

function showCombo(n) {
  comboEl.textContent = `COMBO ×${n}`;
  comboEl.classList.remove("hidden");
  comboEl.style.animation = "none";
  comboEl.offsetHeight; // force reflow to restart animation
  comboEl.style.animation = "";
  setTimeout(() => comboEl.classList.add("hidden"), 850);
}

function areAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr + dc) === 1;
}

function swapCells(a, b) {
  const aId = grid[a.row][a.col];
  const bId = grid[b.row][b.col];

  grid[a.row][a.col] = bId;
  grid[b.row][b.col] = aId;

  const aTile = tiles.get(aId);
  const bTile = tiles.get(bId);

  aTile.cellRow = b.row;
  aTile.cellCol = b.col;
  bTile.cellRow = a.row;
  bTile.cellCol = a.col;

  aTile.el.dataset.row = String(b.row);
  aTile.el.dataset.col = String(b.col);
  bTile.el.dataset.row = String(a.row);
  bTile.el.dataset.col = String(a.col);

  aTile.row = aTile.cellRow;
  aTile.col = aTile.cellCol;
  bTile.row = bTile.cellRow;
  bTile.col = bTile.cellCol;
}

// Returns structured run data: [{cells:[{r,c},...], dir:"h"|"v", type:number}, ...]
function findMatchRuns() {
  const runs = [];

  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const currentTile = c < SIZE ? tileAt(r, c) : null;
      const prevTile = tileAt(r, c - 1);
      if (!prevTile) { runStart = c; continue; }
      const current = currentTile?.type ?? null;
      const prev = prevTile.type;
      if (current !== prev) {
        const runLen = c - runStart;
        if (runLen >= 3) {
          runs.push({
            cells: Array.from({ length: runLen }, (_, i) => ({ r, c: runStart + i })),
            dir: "h",
            type: prev
          });
        }
        runStart = c;
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const currentTile = r < SIZE ? tileAt(r, c) : null;
      const prevTile = tileAt(r - 1, c);
      if (!prevTile) { runStart = r; continue; }
      const current = currentTile?.type ?? null;
      const prev = prevTile.type;
      if (current !== prev) {
        const runLen = r - runStart;
        if (runLen >= 3) {
          runs.push({
            cells: Array.from({ length: runLen }, (_, i) => ({ r: runStart + i, c })),
            dir: "v",
            type: prev
          });
        }
        runStart = r;
      }
    }
  }

  return runs;
}

function findMatches() {
  const matches = new Set();
  findMatchRuns().forEach(run => {
    run.cells.forEach(({ r, c }) => {
      const tile = tileAt(r, c);
      if (tile) matches.add(tile.id);
    });
  });
  return matches;
}

// Expand a special gem's effect into the matches Set
function expandSpecial(tile, matches) {
  if (tile.specialType === "row") {
    for (let c = 0; c < SIZE; c++) {
      const t = tileAt(tile.cellRow, c);
      if (t) matches.add(t.id);
    }
  } else if (tile.specialType === "col") {
    for (let r = 0; r < SIZE; r++) {
      const t = tileAt(r, tile.cellCol);
      if (t) matches.add(t.id);
    }
  } else if (tile.specialType === "color") {
    const targetType = tile.type;
    tiles.forEach(t => {
      if (t.type === targetType) matches.add(t.id);
    });
  }
}

// Check if any adjacent swap would produce a match (only modifies grid array)
function hasValidMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) {
        [grid[r][c], grid[r][c + 1]] = [grid[r][c + 1], grid[r][c]];
        const ok = findMatchRuns().length > 0;
        [grid[r][c], grid[r][c + 1]] = [grid[r][c + 1], grid[r][c]];
        if (ok) return true;
      }
      if (r + 1 < SIZE) {
        [grid[r][c], grid[r + 1][c]] = [grid[r + 1][c], grid[r][c]];
        const ok = findMatchRuns().length > 0;
        [grid[r][c], grid[r + 1][c]] = [grid[r + 1][c], grid[r][c]];
        if (ok) return true;
      }
    }
  }
  return false;
}

// Shuffle gem types in place (positions unchanged) until a valid move exists
function shuffleBoard() {
  setMessage("無法移動，重排棋盤！");
  const allTypes = [];
  tiles.forEach(t => allTypes.push(t.type));
  for (let i = allTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTypes[i], allTypes[j]] = [allTypes[j], allTypes[i]];
  }
  let idx = 0;
  tiles.forEach(t => {
    t.type = allTypes[idx++];
    t.core.style.background = GEM_COLORS[t.type];
    t.specialType = null;
    applySpecialClass(t);
  });
  if (!hasValidMove()) shuffleBoard();
}

function markClearing(matches) {
  matches.forEach((id) => {
    const tile = tiles.get(id);
    if (tile) tile.el.classList.add("clearing");
  });
}

function clearMatches(matches) {
  matches.forEach((id) => {
    const tile = tiles.get(id);
    if (!tile) return;
    grid[tile.cellRow][tile.cellCol] = null;
    tile.el.remove();
    tiles.delete(id);
  });
}

function collapse() {
  const newTiles = [];

  for (let c = 0; c < SIZE; c++) {
    const columnTiles = [];
    let spawnCount = 0;
    for (let r = SIZE - 1; r >= 0; r--) {
      const id = grid[r][c];
      if (id !== null) columnTiles.push(tiles.get(id));
    }

    for (let r = SIZE - 1; r >= 0; r--) {
      if (columnTiles.length > 0) {
        const tile = columnTiles.shift();
        grid[r][c] = tile.id;
        tile.cellRow = r;
        tile.cellCol = c;
        tile.el.dataset.row = String(r);
        tile.el.dataset.col = String(c);
        tile.row = tile.cellRow;
        tile.col = tile.cellCol;
      } else {
        const type = randomGem();
        const spawnRow = -1 - spawnCount;
        const tile = createTile(type, spawnRow, c);
        placeTile(tile, r, c);
        tile.row = spawnRow;
        tile.col = c;
        newTiles.push(tile);
        spawnCount += 1;
      }
    }
  }

  layoutTiles();

  if (newTiles.length > 0) {
    requestAnimationFrame(() => {
      newTiles.forEach((tile) => {
        tile.row = tile.cellRow;
        tile.col = tile.cellCol;
      });
      layoutTiles();
    });
  }
}

function resolveMatches(chain = 0) {
  const runs = findMatchRuns();

  if (runs.length === 0) {
    if (!hasValidMove()) shuffleBoard();
    return Promise.resolve(false);
  }

  // Build flat matches Set from all runs
  const matches = new Set();
  runs.forEach(run => {
    run.cells.forEach(({ r, c }) => {
      const tile = tileAt(r, c);
      if (tile) matches.add(tile.id);
    });
  });

  // Expand any special gems being consumed (single pass, no chaining)
  const initialMatches = new Set(matches);
  initialMatches.forEach(id => {
    const tile = tiles.get(id);
    if (tile?.specialType) expandSpecial(tile, matches);
  });

  // Determine special gem spawns — only on player-initiated move (chain === 0)
  const specialSpawns = [];
  if (chain === 0 && lastPlayerSwap) {
    const swap = lastPlayerSwap;
    lastPlayerSwap = null;
    runs.forEach(run => {
      const len = run.cells.length;
      if (len < 4) return;
      // Prefer to spawn at the player's swap position if it's in this run
      const spawnCell =
        run.cells.find(({ r, c }) =>
          (r === swap.a.row && c === swap.a.col) ||
          (r === swap.b.row && c === swap.b.col)
        ) || run.cells[Math.floor(len / 2)];
      const existingTile = tileAt(spawnCell.r, spawnCell.c);
      if (existingTile?.specialType) return; // don't overwrite an existing special
      specialSpawns.push({
        row: spawnCell.r,
        col: spawnCell.c,
        specialType: len >= 5 ? "color" : (run.dir === "h" ? "row" : "col"),
        gemType: existingTile?.type ?? 0
      });
    });
  } else if (chain === 0) {
    lastPlayerSwap = null;
  }

  markClearing(matches);
  if (chain >= 1) showCombo(chain + 1);

  return new Promise((resolve) => {
    setTimeout(() => {
      matches.forEach(id => {
        const tile = tiles.get(id);
        if (tile) spawnBurst(tile, chain);
      });
      clearMatches(matches);
      score += matches.size * 10;

      // Place special gems into cleared cells before collapse fills them
      specialSpawns.forEach(spawn => {
        if (grid[spawn.row][spawn.col] === null) {
          const tile = createTile(spawn.gemType, spawn.row, spawn.col);
          tile.specialType = spawn.specialType;
          applySpecialClass(tile);
          placeTile(tile, spawn.row, spawn.col);
          tile.row = spawn.row;
          tile.col = spawn.col;
        }
      });

      collapse();
      updateHUD();
      saveState();

      setTimeout(() => {
        resolveMatches(chain + 1).then(() => resolve(true));
      }, ANIM_DROP);
    }, ANIM_CLEAR);
  });
}

function handleTileClick(e) {
  const tileEl = e.target.closest(".tile");
  if (!tileEl || locked || gameOver || !gameStarted) return;

  const row = Number(tileEl.dataset.row);
  const col = Number(tileEl.dataset.col);

  if (selected === null) {
    selected = { row, col };
    tileEl.classList.add("selected");
    return;
  }

  if (selected.row === row && selected.col === col) {
    tileEl.classList.remove("selected");
    selected = null;
    return;
  }

  const previous = boardEl.querySelector(".tile.selected");
  if (previous) previous.classList.remove("selected");

  if (!areAdjacent(selected, { row, col })) {
    selected = { row, col };
    tileEl.classList.add("selected");
    setMessage("只能交換相鄰的寶石");
    return;
  }

  const swapA = { row: selected.row, col: selected.col };
  const swapB = { row, col };

  locked = true;
  swapCells(swapA, swapB);
  layoutTiles();

  const hasMatch = findMatches().size > 0;
  if (hasMatch) {
    moves += 1;
    lastPlayerSwap = { a: swapA, b: swapB };
    updateHUD();
    saveState();

    setTimeout(() => {
      resolveMatches(0).then(() => {
        locked = false;
      });
    }, ANIM_SWAP);
  } else {
    setTimeout(() => {
      if (gameOver) return;
      const tileA = tileAt(swapA.row, swapA.col);
      const tileB = tileAt(swapB.row, swapB.col);
      swapCells(swapA, swapB);
      layoutTiles();
      locked = false;
      setMessage("沒有形成消除");

      if (tileA) tileA.el.classList.add("shake");
      if (tileB) tileB.el.classList.add("shake");
      setTimeout(() => {
        if (tileA) tileA.el.classList.remove("shake");
        if (tileB) tileB.el.classList.remove("shake");
      }, 200);
    }, ANIM_SWAP);

    mistakes += 1;
    updateHUD();
    if (mistakes >= MAX_MISTAKES) {
      endGame("失誤達上限，回合結束");
    }
  }

  selected = null;
}

function saveState() {
  const best = Math.max(score, Number(localStorage.getItem(BEST_KEY) || 0));
  localStorage.setItem(BEST_KEY, String(best));

  const data = {
    grid: grid.map(row => row.map(id => {
      const t = tiles.get(id);
      if (!t) return null;
      return t.specialType ? [t.type, t.specialType] : t.type;
    })),
    score,
    moves,
    timeLeft,
    mistakes,
    gameOver,
    updatedAt: Date.now()
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.grid) || data.grid.length !== SIZE) {
      return false;
    }

    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    tiles.clear();
    boardEl.innerHTML = "";
    tileIdCounter = 1;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = data.grid[r][c];
        let type, specialType = null;
        if (Array.isArray(cell)) {
          [type, specialType] = cell;
        } else {
          type = cell;
        }
        if (typeof type !== "number") return false;
        const tile = createTile(type, r, c);
        if (specialType) {
          tile.specialType = specialType;
          applySpecialClass(tile);
        }
        placeTile(tile, r, c);
      }
    }

    score = Number(data.score || 0);
    moves = Number(data.moves || 0);
    timeLeft = Number.isFinite(data.timeLeft) ? data.timeLeft : ROUND_SECONDS;
    mistakes = Number.isFinite(data.mistakes) ? data.mistakes : 0;
    gameOver = Boolean(data.gameOver);
    layoutTiles(true);
    updateHUD();
    if (gameOver) {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      showGameOver("回合結束");
    } else {
      startTimer();
    }
    return true;
  } catch {
    return false;
  }
}

function newGame() {
  gameStarted = true;
  lastPlayerSwap = null;
  score = 0;
  moves = 0;
  mistakes = 0;
  timeLeft = ROUND_SECONDS;
  gameOver = false;
  startTimer();
  boardEl.innerHTML = "";
  generateBoard();
  updateHUD();
  saveState();
  setMessage("新遊戲開始");
  hideGameOver();
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(BEST_KEY);
  setMessage("已清除存檔");
  updateHUD();
}

function startTimer() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    if (gameOver) return;
    timeLeft -= 1;
    updateHUD();
    if (timeLeft <= 0) {
      endGame("時間到，回合結束");
    }
  }, 1000);
}

function endGame(text) {
  gameOver = true;
  locked = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  setMessage(text);
  showGameOver(text);
  saveState();
}

boardEl.addEventListener("touchstart", (e) => {
  if (locked || gameOver || !gameStarted) return;
  const tileEl = e.target.closest(".tile");
  if (!tileEl) return;
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  touchStartTileEl = tileEl;
}, { passive: true });

boardEl.addEventListener("touchend", (e) => {
  const startTileEl = touchStartTileEl;
  touchStartTileEl = null; // Unconditionally clear to prevent stale state
  
  if (!startTileEl || locked || gameOver || !gameStarted) return;
  
  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  // If the swipe is very short, treat it as a tap.
  // The browser will synthesize a click event which our click handler will process.
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
    return;
  }
  
  const startRow = Number(startTileEl.dataset.row);
  const startCol = Number(startTileEl.dataset.col);
  let targetRow = startRow;
  let targetCol = startCol;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) targetCol++; else targetCol--;
  } else {
    if (dy > 0) targetRow++; else targetRow--;
  }
  
  if (targetRow < 0 || targetRow >= SIZE || targetCol < 0 || targetCol >= SIZE) return;
  
  const targetTileObj = tileAt(targetRow, targetCol);
  if (!targetTileObj) return;

  if (!selected || selected.row !== startRow || selected.col !== startCol) {
    const previous = boardEl.querySelector(".tile.selected");
    if (previous) previous.classList.remove("selected");
    selected = { row: startRow, col: startCol };
    startTileEl.classList.add("selected");
  }
  
  handleTileClick({ target: targetTileObj.el });
});

boardEl.addEventListener("click", handleTileClick);

newGameBtn.addEventListener("click", () => {
  newGame();
});

restartBtn.addEventListener("click", () => {
  newGame();
});

document.getElementById("startBtn").addEventListener("click", () => {
  hideStartScreen();
  newGame();
});

document.getElementById("startLoadBtn").addEventListener("click", () => {
  const loaded = loadState();
  if (loaded) {
    gameStarted = true;
    hideStartScreen();
  } else {
    startBestEl.textContent = "沒有可用存檔";
  }
});

document.getElementById("loadGame").addEventListener("click", () => {
  const loaded = loadState();
  if (loaded) {
    gameStarted = true;
    hideStartScreen();
    setMessage("已載入存檔");
  } else {
    setMessage("沒有可用存檔");
  }
});

document.getElementById("clearSave").addEventListener("click", () => {
  clearSave();
});

document.getElementById("rulesBtn").addEventListener("click", () => {
  document.getElementById("rulesModal").classList.remove("hidden");
});

document.getElementById("rulesClose").addEventListener("click", () => {
  document.getElementById("rulesModal").classList.add("hidden");
});

document.getElementById("rulesModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.add("hidden");
  }
});

(function init() {
  updateHUD();
  showStartScreen();
})();
