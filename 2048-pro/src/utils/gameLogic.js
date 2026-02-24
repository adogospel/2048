// ─── ID counter ──────────────────────────────────────────────────────────────
let _id = 0;
export const freshId = () => ++_id;

// ─── Grid helpers ─────────────────────────────────────────────────────────────
export function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function addRandomTile(grid, size) {
  const empties = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) empties.push([r, c]);
  if (!empties.length) return grid;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = grid.map(row => [...row]);
  next[r][c] = { id: freshId(), value: Math.random() < 0.9 ? 2 : 4, isNew: true, isMerged: false };
  return next;
}

export function initGame(size) {
  let g = emptyGrid(size);
  g = addRandomTile(g, size);
  g = addRandomTile(g, size);
  return g;
}

// ─── Row slide (returns new row + points earned) ──────────────────────────────
function slideRow(row, size) {
  const tiles = row.filter(Boolean);
  const out = Array(size).fill(null);
  let score = 0, pos = 0, i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      const val = tiles[i].value * 2;
      score += val;
      // keep the LEFT tile's id so we track the survivor, mark merged
      out[pos++] = { id: tiles[i].id, value: val, isNew: false, isMerged: true };
      i += 2;
    } else {
      out[pos++] = { ...tiles[i], isNew: false, isMerged: false };
      i++;
    }
  }
  return { row: out, score };
}

function rowMoved(before, after) {
  return after.some((t, c) => {
    const o = before[c];
    return (!t !== !o) || (t && o && (t.value !== o.value || t.id !== o.id));
  });
}

// ─── Directional moves ────────────────────────────────────────────────────────
export function moveLeft(grid, size) {
  let score = 0, changed = false;
  const next = grid.map(row => {
    const { row: nr, score: s } = slideRow(row, size);
    score += s;
    if (rowMoved(row, nr)) changed = true;
    return nr;
  });
  return { grid: next, score, changed };
}

export function moveRight(grid, size) {
  const rev = grid.map(r => [...r].reverse());
  const { grid: m, score, changed } = moveLeft(rev, size);
  return { grid: m.map(r => [...r].reverse()), score, changed };
}

function transpose(grid, size) {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (__, c) => grid[c][r])
  );
}

export function moveUp(grid, size) {
  const t = transpose(grid, size);
  const { grid: m, score, changed } = moveLeft(t, size);
  return { grid: transpose(m, size), score, changed };
}

export function moveDown(grid, size) {
  const t = transpose(grid, size);
  const { grid: m, score, changed } = moveRight(t, size);
  return { grid: transpose(m, size), score, changed };
}

// ─── State checks ─────────────────────────────────────────────────────────────
export function hasMovesLeft(grid, size) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) return true;
      const v = grid[r][c].value;
      if (r + 1 < size && grid[r + 1][c]?.value === v) return true;
      if (c + 1 < size && grid[r][c + 1]?.value === v) return true;
    }
  return false;
}

export function hasWon(grid, size) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]?.value >= 2048) return true;
  return false;
}

export function getBestTile(grid, size) {
  let max = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]?.value > max) max = grid[r][c].value;
  return max;
}

// ─── Hint: find cells that can merge ──────────────────────────────────────────
export function getMergeCells(grid, size) {
  const set = new Set();
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) continue;
      const v = grid[r][c].value;
      if (r + 1 < size && grid[r + 1][c]?.value === v) { set.add(`${r}-${c}`); set.add(`${r+1}-${c}`); }
      if (c + 1 < size && grid[r][c + 1]?.value === v) { set.add(`${r}-${c}`); set.add(`${r}-${c+1}`); }
    }
  return set;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
export const storage = {
  getBest: size => { try { return parseInt(localStorage.getItem(`2048pro_best_${size}`) || "0"); } catch { return 0; } },
  setBest: (size, v) => { try { localStorage.setItem(`2048pro_best_${size}`, String(v)); } catch {} },
  getTheme: () => { try { return localStorage.getItem("2048pro_theme") || "dark"; } catch { return "dark"; } },
  setTheme: v => { try { localStorage.setItem("2048pro_theme", v); } catch {} },
};
