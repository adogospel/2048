# 2048 Pro — v2.0

A professional, polished reimagining of the classic 2048 puzzle game.

## Getting Started

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Build for production

```bash
npm run build
npm run preview
```

---

## What's Fixed in v2.0

| Bug | Fix |
|-----|-----|
| Arrow Up moved tiles down (and vice-versa) | Transpose-based move logic corrected |
| Score doubles on each move | All state updates batched outside `setGrid` updater — fired exactly once per valid move |
| Move count doubles | Same fix — `setMoves` called once per valid move |
| Merge 2+2 added 8 instead of 4 | `slideRow` now correctly adds `val = a + b` once, not twice |
| Tiles snapped instantly to merged position | Position-based rendering: tiles sit at absolute CSS `top/left` computed from row/col. CSS transition on `top` and `left` creates smooth slide before the merge pop |
| Emojis used as icons | All replaced with inline SVG Lucide-compatible icon paths — no emoji anywhere |

---

## Features

### Gameplay
- **3×3 · 4×4 · 5×5** grid modes — best scores tracked independently per size
- **Smooth tile sliding** — CSS position transitions slide tiles before merging
- **Merge pop animation** — delayed by slide duration so it fires at the right moment
- **Undo** — 3 undos per game, icon button with count badge
- **Continue after 2048** — keep playing for higher tiles
- **Merge hints** — glowing highlight on tiles that can currently merge

### Stats
- Move counter (exactly 1 per keypress/swipe)
- Best tile tracker
- Points-per-move efficiency
- Merge streak meter (🔥 badge) with best-streak record
- Floating +score pop-up on every merge

### UI
- **Lucide icons** — Refresh, Undo, Sun/Moon, Settings, Trophy, Flame, Lightbulb, Skull, Sparkles
- **Dark / Light themes** — persisted to `localStorage`
- **Outfit font** — clean geometric professional typeface
- **Confetti** on win (60+ pieces, multi-color)
- Fully responsive — desktop, tablet, mobile swipe

### Architecture
```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # All UI + game loop
└── utils/
    └── gameLogic.js          # Pure functions: moves, checks, storage
```

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move Up | ↑ | Swipe up |
| Move Down | ↓ | Swipe down |
| Move Left | ← | Swipe left |
| Move Right | → | Swipe right |
