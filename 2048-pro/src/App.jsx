import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  moveLeft, moveRight, moveUp, moveDown,
  addRandomTile, initGame, hasMovesLeft, hasWon,
  getBestTile, getMergeCells, storage
} from "./utils/gameLogic";

// ─── Lucide icons (inline SVG — no package needed) ───────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 2, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
    strokeLinejoin="round" className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

// Icon paths (Lucide-compatible)
const ICONS = {
  refresh:    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 3v5h5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 21v-5h-5",
  undo:       "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  sun:        ["M12 2v2","M12 20v2","m4.93 4.93 1.41 1.41","m17.66 17.66 1.41 1.41","M2 12h2","M20 12h2","m6.34 17.66-1.41 1.41","m19.07 4.93-1.41 1.41","M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  moon:       "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",
  settings:   "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  trophy:     "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z",
  flame:      "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  lightbulb:  "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4",
  sparkles:   ["M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z","M20 3v4","M22 5h-4","M4 17v2","M5 18H3"],
  grid3:      ["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"],
  arrowup:    "M12 19V5M5 12l7-7 7 7",
  arrowdown:  "M12 5v14M5 12l7 7 7-7",
  arrowleft:  "M19 12H5M12 5l-7 7 7 7",
  arrowright: "M5 12h14M12 5l7 7-7 7",
  skull:      "M12 4a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V19a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7zm-1 11v1H9v-1zm3 1h-1v-1h1z",
  check:      "M20 6 9 17l-5-5",
  chevright:  "M9 18l6-6-6-6",
};

// ─── Tile Color Palettes ──────────────────────────────────────────────────────
const PALETTE = {
  dark: {
    2:    { bg: "#22222e", text: "#9898b8", glow: "none" },
    4:    { bg: "#2a2540", text: "#b0a0d0", glow: "none" },
    8:    { bg: "#3d2010", text: "#ff9840", glow: "0 0 12px rgba(255,150,50,0.4)" },
    16:   { bg: "#4a1e08", text: "#ff6820", glow: "0 0 14px rgba(255,100,30,0.4)" },
    32:   { bg: "#4e1010", text: "#ff4040", glow: "0 0 14px rgba(255,60,50,0.45)" },
    64:   { bg: "#560a0a", text: "#ff2020", glow: "0 0 18px rgba(255,40,40,0.5)" },
    128:  { bg: "#3c2e00", text: "#ffd030", glow: "0 0 18px rgba(255,200,30,0.5)" },
    256:  { bg: "#402800", text: "#ffb010", glow: "0 0 20px rgba(255,170,10,0.55)" },
    512:  { bg: "#442200", text: "#ff9800", glow: "0 0 22px rgba(255,145,0,0.6)" },
    1024: { bg: "#481a00", text: "#ff8000", glow: "0 0 24px rgba(255,120,0,0.65)" },
    2048: { bg: "#4a1000", text: "#ff5500", glow: "0 0 28px rgba(255,80,0,0.7)" },
  },
  light: {
    2:    { bg: "#f0ece2", text: "#7a6a58", glow: "none" },
    4:    { bg: "#edddc0", text: "#6a5530", glow: "none" },
    8:    { bg: "#f5a030", text: "#fff", glow: "none" },
    16:   { bg: "#ef6f20", text: "#fff", glow: "none" },
    32:   { bg: "#e83c28", text: "#fff", glow: "none" },
    64:   { bg: "#d02010", text: "#fff", glow: "none" },
    128:  { bg: "#e4c020", text: "#fff", glow: "none" },
    256:  { bg: "#e0b010", text: "#fff", glow: "none" },
    512:  { bg: "#dca000", text: "#fff", glow: "none" },
    1024: { bg: "#d88c00", text: "#fff", glow: "none" },
    2048: { bg: "#d07000", text: "#fff", glow: "none" },
  }
};

function tileColors(value, theme) {
  const p = PALETTE[theme] || PALETTE.dark;
  return p[value] || (theme === "dark"
    ? { bg: "#380e00", text: "#ff3300", glow: "0 0 30px rgba(255,50,0,0.8)" }
    : { bg: "#b85000", text: "#fff", glow: "none" });
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const SLIDE_MS = 120; // tile slide duration in ms
const MERGE_MS = 160; // merge pop duration

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font: 'Outfit', sans-serif;
  --slide: ${SLIDE_MS}ms;
  --merge: ${MERGE_MS}ms;
}

/* ── Themes ── */
.t-dark {
  --bg:        #0c0c14;
  --surface:   #181824;
  --surface2:  #20202e;
  --surface3:  #28283a;
  --border:    #28283c;
  --border2:   #343450;
  --text:      #e4e4f0;
  --text2:     #8888a8;
  --text3:     #505068;
  --accent:    #7c6fff;
  --accent2:   #a09aff;
  --acglow:    rgba(124,111,255,0.35);
  --gold:      #ffca40;
  --goldglow:  rgba(255,202,64,0.35);
  --red:       #ff5a5a;
  --green:     #4ade80;
  --board:     #0e0e18;
  --cell:      #181826;
  --cellb:     #20202e;
}
.t-light {
  --bg:        #f2eee6;
  --surface:   #ffffff;
  --surface2:  #f7f3ec;
  --surface3:  #ede8de;
  --border:    #ddd6c8;
  --border2:   #c8c0b0;
  --text:      #18140e;
  --text2:     #685848;
  --text3:     #9c8c78;
  --accent:    #4c42e0;
  --accent2:   #7068ff;
  --acglow:    rgba(76,66,224,0.2);
  --gold:      #c07800;
  --goldglow:  rgba(192,120,0,0.25);
  --red:       #cc2828;
  --green:     #1a8038;
  --board:     #ccc4b4;
  --cell:      #bbb4a4;
  --cellb:     #aaa498;
}

/* ── Base ── */
body {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.25s, color 0.25s;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 16px 36px;
  position: relative;
}

/* subtle bg glow */
.app::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
}
.t-dark .app::before {
  background:
    radial-gradient(ellipse 70% 50% at 15% 5%,  rgba(124,111,255,.07) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 85%, rgba(255,100,40,.05)  0%, transparent 55%);
}
.t-light .app::before {
  background:
    radial-gradient(ellipse 70% 50% at 15% 5%,  rgba(76,66,224,.05)  0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 85% 85%, rgba(192,120,0,.05)  0%, transparent 55%);
}
.app > * { position: relative; z-index: 1; }

/* ── Header ── */
.header {
  width: 100%; max-width: 520px;
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px;
}
.logo-wrap { flex: 0 0 auto; }
.logo {
  font-size: 42px; font-weight: 900;
  letter-spacing: -3px; line-height: 1;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 45%, var(--gold) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 18px var(--acglow));
}
.logo-sub {
  font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--text3); margin-top: 2px;
}
.score-row { flex: 1; display: flex; gap: 7px; justify-content: flex-end; }
.score-box {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 6px 12px; min-width: 76px; text-align: center;
  position: relative; overflow: hidden;
}
.score-box::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.04) 0%, transparent 55%);
  pointer-events: none;
}
.score-lbl { font-size: 8.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-bottom: 1px; }
.score-val { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; }

/* ── Toolbar ── */
.toolbar {
  width: 100%; max-width: 520px;
  display: flex; gap: 7px; margin-bottom: 11px;
}
.btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 8px 13px; border: 1px solid var(--border);
  border-radius: 8px; font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; background: var(--surface); color: var(--text);
  white-space: nowrap; line-height: 1;
}
.btn:hover:not(:disabled) { background: var(--surface2); border-color: var(--border2); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,.15); }
.btn:active:not(:disabled) { transform: scale(.97); box-shadow: none; }
.btn:disabled { opacity: .3; cursor: not-allowed; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent2); border-color: var(--accent2); box-shadow: 0 4px 14px var(--acglow); }
.btn-sq { width: 34px; height: 34px; padding: 0; }
.btn-active { background: var(--accent) !important; border-color: var(--accent) !important; color: #fff !important; }
.undo-count {
  background: rgba(0,0,0,.18); border-radius: 10px;
  padding: 1px 5px; font-size: 10px; font-weight: 700;
}

/* ── Grid selector ── */
.grid-sel {
  width: 100%; max-width: 520px;
  display: flex; gap: 5px; margin-bottom: 11px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 4px;
}
.grid-btn {
  flex: 1; padding: 7px; border: none; border-radius: 7px;
  font-family: var(--font); font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.15s;
  background: transparent; color: var(--text2);
}
.grid-btn:hover { background: var(--surface2); color: var(--text); }
.grid-btn.on { background: var(--accent); color: #fff; box-shadow: 0 2px 8px var(--acglow); }

/* ── Stats bar ── */
.stats {
  width: 100%; max-width: 520px;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 7px; margin-bottom: 11px;
}
.stat {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 9px 10px; text-align: center;
}
.stat-v { font-size: 17px; font-weight: 800; letter-spacing: -.5px; }
.stat-l { font-size: 8.5px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); margin-top: 2px; }
.c-ac   { color: var(--accent); }
.c-gold { color: var(--gold); }
.c-red  { color: var(--red); }

/* ── Streak badge ── */
.streak-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, var(--gold) 0%, #ff8800 100%);
  color: #1a0e00; font-size: 11px; font-weight: 800;
  padding: 2px 9px; border-radius: 20px;
  box-shadow: 0 2px 8px var(--goldglow);
}

/* ── Settings panel ── */
.settings {
  width: 100%; max-width: 520px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 14px 16px;
  margin-bottom: 11px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  animation: fadeSlide .18s ease;
}
@keyframes fadeSlide { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
.set-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.set-lbl { font-size: 11.5px; font-weight: 600; color: var(--text2); display: flex; align-items: center; gap: 5px; }
.toggle {
  width: 38px; height: 21px; background: var(--border2); border-radius: 11px;
  position: relative; cursor: pointer; border: none; transition: background .15s; flex-shrink: 0;
}
.toggle.on { background: var(--accent); }
.toggle::after {
  content: ''; position: absolute;
  width: 15px; height: 15px; background: #fff; border-radius: 50%;
  top: 3px; left: 3px; transition: transform .15s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.toggle.on::after { transform: translateX(17px); }
.set-badge {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  border-radius: 20px; background: var(--surface2);
  border: 1px solid var(--border); color: var(--text2);
}

/* ── Board ── */
.board-wrap { width: 100%; max-width: 520px; position: relative; margin-bottom: 12px; }
.board {
  background: var(--board); border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 16px 48px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.035) inset;
  touch-action: none; user-select: none;
  position: relative;
}
.t-light .board {
  box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 0 0 1px rgba(255,255,255,.5) inset;
}
/* grid of cells */
.cells-layer { display: grid; }
.cell {
  background: var(--cell); border: 1px solid var(--cellb);
  border-radius: 7px; aspect-ratio: 1;
}
/* tile layer — positioned absolutely on top */
.tiles-layer {
  position: absolute; inset: 0;
  pointer-events: none;
}

/* ── Individual tile ── */
.tile {
  position: absolute;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font); font-weight: 800;
  border: 1px solid rgba(255,255,255,.08);
  /* slide transition — position changes animate smoothly */
  transition: top var(--slide) cubic-bezier(.25,.46,.45,.94),
              left var(--slide) cubic-bezier(.25,.46,.45,.94),
              width var(--slide) ease, height var(--slide) ease,
              background .12s ease, color .12s ease;
  will-change: top, left;
  z-index: 2;
}
.tile::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(145deg, rgba(255,255,255,.12) 0%, transparent 55%);
  pointer-events: none; z-index: 3;
}
/* new tile pop-in */
.tile.is-new {
  animation: tileIn var(--slide) cubic-bezier(.18,1.5,.4,1) both;
  z-index: 4;
}
/* merge pop — fires AFTER slide is done */
.tile.is-merged {
  animation: tileMerge var(--merge) cubic-bezier(.18,1.5,.4,1) both;
  animation-delay: var(--slide);
  z-index: 5;
}
@keyframes tileIn {
  0%   { transform: scale(0) rotate(-6deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg);  opacity: 1; }
}
@keyframes tileMerge {
  0%   { transform: scale(1);    }
  45%  { transform: scale(1.18); }
  100% { transform: scale(1);    }
}

/* hint pulse */
.tile.hint { animation: hintPulse 1.4s ease-in-out infinite; }
@keyframes hintPulse {
  0%,100% { box-shadow: var(--ts), 0 0 0 2px var(--accent); }
  50%     { box-shadow: var(--ts), 0 0 0 2px var(--accent), 0 0 16px 4px var(--acglow); }
}

/* ── Score float ── */
.sfloat {
  position: fixed; pointer-events: none; z-index: 999;
  font-family: var(--font); font-size: 18px; font-weight: 800;
  color: var(--gold); text-shadow: 0 2px 8px rgba(0,0,0,.5);
  animation: sfloatUp .85s ease-out forwards;
}
@keyframes sfloatUp {
  0%   { opacity: 1; transform: translateY(0) scale(.85); }
  20%  { opacity: 1; transform: translateY(-20px) scale(1.15); }
  100% { opacity: 0; transform: translateY(-58px) scale(.95); }
}

/* ── Overlays ── */
.overlay {
  position: absolute; inset: 0; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 50; gap: 10px; padding: 20px; text-align: center;
  animation: ovIn .28s ease both;
  backdrop-filter: blur(8px);
}
@keyframes ovIn { from { opacity: 0; } to { opacity: 1; } }
.t-dark  .ov-lose { background: rgba(12,12,20,.9);  }
.t-light .ov-lose { background: rgba(242,238,230,.9); }
.t-dark  .ov-win  { background: rgba(20,14,0,.9);  }
.t-light .ov-win  { background: rgba(255,246,220,.9); }
.ov-icon { display: flex; justify-content: center; margin-bottom: 2px; }
.ov-title { font-size: 28px; font-weight: 900; letter-spacing: -1px; line-height: 1.1; }
.ov-lose .ov-title { color: var(--red); }
.ov-win  .ov-title { color: var(--gold); }
.ov-sub { font-size: 12.5px; color: var(--text2); font-weight: 500; }
.ov-btns { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.ov-btns .btn { font-size: 12px; padding: 7px 14px; }

/* ── Confetti ── */
.cf { position: fixed; top: -12px; border-radius: 2px; pointer-events: none; z-index: 999; animation: cfFall linear forwards; }
@keyframes cfFall {
  0%   { transform: translateY(0)     rotate(0deg)   scale(1);   opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateY(108vh) rotate(700deg) scale(.4);  opacity: 0; }
}

/* ── Hint bar ── */
.hint-bar {
  width: 100%; max-width: 520px; text-align: center;
  font-size: 11px; font-weight: 500; color: var(--text3); letter-spacing: .5px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}

/* ── Mobile ── */
@media (max-width: 460px) {
  .logo { font-size: 34px; }
  .score-val { font-size: 17px; }
  .settings { grid-template-columns: 1fr; }
  .score-box { min-width: 66px; padding: 5px 9px; }
  .header { gap: 9px; }
}
`;

// ─── Confetti component ───────────────────────────────────────────────────────
const CF_COLS = ["#7c6fff","#ffca40","#ff6030","#4ade80","#f472b6","#38bdf8","#fb923c"];
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 65 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: CF_COLS[i % CF_COLS.length],
    w: 5 + Math.random() * 9, h: 4 + Math.random() * 6,
    dur: 2.0 + Math.random() * 2.2, delay: Math.random() * 1.4,
  })), []);
  return <>{pieces.map(p => (
    <div key={p.id} className="cf" style={{
      left: `${p.left}%`, width: p.w, height: p.h, background: p.color,
      animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
    }} />
  ))}</>;
}

// ─── Score floats ─────────────────────────────────────────────────────────────
function ScoreFloats({ pops }) {
  return <>{pops.map(p => (
    <div key={p.id} className="sfloat" style={{ top: p.y, left: p.x }}>+{p.value}</div>
  ))}</>;
}

// ─── Board component with smooth position-based tile animation ────────────────
/**
 * Tiles are rendered with absolute positions computed from (row, col).
 * When the grid changes, each tile's top/left CSS changes → CSS transition animates the slide.
 * A new tile spawns AFTER the slide completes (setTimeout = SLIDE_MS).
 * Merged tiles get the merge animation delayed by SLIDE_MS.
 */
function Board({ grid, size, hintsOn, animOn, theme }) {
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState(0);
  const PAD = size === 5 ? 8 : 10;
  const GAP = size === 5 ? 7 : 8;

  // Measure board
  useEffect(() => {
    const measure = () => {
      if (boardRef.current) setBoardSize(boardRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const cellSize = boardSize > 0
    ? (boardSize - PAD * 2 - GAP * (size - 1)) / size
    : 0;

  function tilePos(row, col) {
    return {
      top:  PAD + row * (cellSize + GAP),
      left: PAD + col * (cellSize + GAP),
      width:  cellSize,
      height: cellSize,
    };
  }

  const hintCells = hintsOn ? getMergeCells(grid, size) : new Set();

  // Build flat tile list with positions
  const tiles = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]) {
        const t = grid[r][c];
        const col = tileColors(t.value, theme);
        const digits = String(t.value).length;
        const base = size === 3 ? 30 : size === 5 ? 18 : 24;
        const fs = digits >= 5 ? base * .58 : digits === 4 ? base * .72 : digits === 3 ? base * .86 : base;
        const isHint = hintCells.has(`${r}-${c}`);
        tiles.push({ t, r, c, col, fs, isHint });
      }

  return (
    <div
      className="board"
      ref={boardRef}
      style={{ padding: PAD }}
    >
      {/* Static cell grid */}
      <div className="cells-layer" style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: GAP,
      }}>
        {Array.from({ length: size * size }).map((_, i) => (
          <div key={i} className="cell" />
        ))}
      </div>

      {/* Animated tile layer */}
      <div className="tiles-layer">
        {cellSize > 0 && tiles.map(({ t, r, c, col, fs, isHint }) => {
          const pos = tilePos(r, c);
          const cls = [
            "tile",
            animOn && t.isNew    ? "is-new"    : "",
            animOn && t.isMerged ? "is-merged" : "",
            isHint ? "hint" : "",
          ].filter(Boolean).join(" ");
          return (
            <div
              key={t.id}
              className={cls}
              style={{
                top:    pos.top,
                left:   pos.left,
                width:  pos.width,
                height: pos.height,
                background: col.bg,
                color:      col.text,
                fontSize:   `${fs}px`,
                boxShadow:  col.glow !== "none" ? col.glow : undefined,
                "--ts":     col.glow !== "none" ? col.glow : "none",
              }}
            >
              {t.value >= 1000 ? t.value.toLocaleString() : t.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Game state
  const [size,    setSize]    = useState(4);
  const [grid,    setGrid]    = useState(() => initGame(4));
  const [score,   setScore]   = useState(0);
  const [best,    setBest]    = useState(() => storage.getBest(4));
  const [over,    setOver]    = useState(false);
  const [won,     setWon]     = useState(false);
  const [keepGo,  setKeepGo]  = useState(false);
  const [history, setHistory] = useState([]);
  const [undos,   setUndos]   = useState(3);

  // UI / settings
  const [theme,    setTheme]    = useState(() => storage.getTheme());
  const [showSet,  setShowSet]  = useState(false);
  const [hints,    setHints]    = useState(false);
  const [animOn,   setAnimOn]   = useState(true);
  const [confetti, setConfetti] = useState(false);

  // Stats
  const [moves,     setMoves]     = useState(0);
  const [bestTile,  setBestTile]  = useState(0);
  const [streak,    setStreak]    = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [scorePops, setScorePops] = useState([]);

  const boardRef  = useRef(null);
  const stTimerRef = useRef(null);
  const moveLock  = useRef(false); // prevent move during slide animation

  // Persist theme
  useEffect(() => {
    document.body.className = theme === "dark" ? "t-dark" : "t-light";
    storage.setTheme(theme);
  }, [theme]);

  // ── Score pop helper ─────────────────────────────────────────────────────
  const addPop = useCallback((value) => {
    const bRect = boardRef.current?.getBoundingClientRect();
    const x = bRect ? bRect.left + bRect.width  * (.2 + Math.random() * .6) : 200;
    const y = bRect ? bRect.top  + bRect.height * (.2 + Math.random() * .5) : 250;
    const id = Date.now() + Math.random();
    setScorePops(p => [...p, { id, value, x, y }]);
    setTimeout(() => setScorePops(p => p.filter(s => s.id !== id)), 950);
  }, []);

  // ── Streak helper ────────────────────────────────────────────────────────
  const bumpStreak = useCallback(() => {
    if (stTimerRef.current) clearTimeout(stTimerRef.current);
    setStreak(s => { const ns = s + 1; setMaxStreak(m => Math.max(m, ns)); return ns; });
    stTimerRef.current = setTimeout(() => setStreak(0), 1600);
  }, []);

  // ── Core move handler ────────────────────────────────────────────────────
  // FIXED: all state updates happen synchronously outside setGrid updater
  // so React batches them into ONE render, preventing double-counting.
  const applyMove = useCallback((moveFn) => {
    if (over || (won && !keepGo)) return;
    if (moveLock.current) return;

    // Compute result from current grid ONCE using a ref snapshot
    setGrid(prev => {
      const { grid: moved, score: gained, changed } = moveFn(prev, size);
      if (!changed) return prev; // no-op — no state updates

      // Lock moves during slide animation
      moveLock.current = true;
      setTimeout(() => { moveLock.current = false; }, SLIDE_MS + 10);

      // Save to undo history
      setHistory(h => [...h.slice(-2), { grid: prev, score, undos }]);

      // Update move count — exactly once per valid move
      setMoves(m => m + 1);

      // Update score — exactly once
      if (gained > 0) {
        setScore(s => {
          const ns = s + gained;
          if (ns > storage.getBest(size)) { storage.setBest(size, ns); setBest(ns); }
          return ns;
        });
        addPop(gained);
        bumpStreak();
      }

      // Spawn new tile after slide completes
      const nextGrid = addRandomTile(moved, size);

      // Update best tile
      const bt = getBestTile(nextGrid, size);
      setBestTile(b => Math.max(b, bt));

      // Check win / lose
      if (!keepGo && hasWon(nextGrid, size)) {
        setWon(true);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3600);
      } else if (!hasMovesLeft(nextGrid, size)) {
        setOver(true);
      }

      return nextGrid;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, won, keepGo, size, score, undos, addPop, bumpStreak]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const handleKey = useCallback((e) => {
    const map = { ArrowLeft: moveLeft, ArrowRight: moveRight, ArrowUp: moveUp, ArrowDown: moveDown };
    if (map[e.key]) { e.preventDefault(); applyMove(map[e.key]); }
  }, [applyMove]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Touch / swipe ─────────────────────────────────────────────────────────
  const touchStart = useRef(null);
  const onTouchStart = useCallback(e => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(e => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) applyMove(dx > 0 ? moveRight : moveLeft);
    else                             applyMove(dy > 0 ? moveDown  : moveUp);
  }, [applyMove]);

  // ── Restart ───────────────────────────────────────────────────────────────
  const restart = useCallback((s) => {
    const sz = s || size;
    setGrid(initGame(sz));
    setScore(0); setBest(storage.getBest(sz));
    setOver(false); setWon(false); setKeepGo(false);
    setHistory([]); setUndos(3);
    setMoves(0); setBestTile(0); setStreak(0); setMaxStreak(0);
    setConfetti(false); moveLock.current = false;
  }, [size]);

  // ── Change grid size ──────────────────────────────────────────────────────
  const changeSize = useCallback((s) => {
    setSize(s);
    setGrid(initGame(s));
    setScore(0); setBest(storage.getBest(s));
    setOver(false); setWon(false); setKeepGo(false);
    setHistory([]); setUndos(3);
    setMoves(0); setBestTile(0); setStreak(0); setMaxStreak(0);
    moveLock.current = false;
  }, []);

  // ── Undo ──────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (!history.length || undos === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(last.grid);
    setScore(last.score);
    setUndos(u => u - 1);
    setOver(false);
    moveLock.current = false;
  }, [history, undos]);

  const fmtScore = v => v >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();

  return (
    <div className={theme === "dark" ? "t-dark" : "t-light"}>
      <style>{CSS}</style>
      {confetti && <Confetti />}
      <ScoreFloats pops={scorePops} />

      <div className="app">

        {/* ── Header ── */}
        <div className="header">
          <div className="logo-wrap">
            <div className="logo">2048</div>
            <div className="logo-sub">Pro Edition</div>
          </div>
          <div className="score-row">
            <div className="score-box">
              <div className="score-lbl">Score</div>
              <div className="score-val">{fmtScore(score)}</div>
            </div>
            <div className="score-box">
              <div className="score-lbl">Best</div>
              <div className="score-val">{fmtScore(best)}</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => restart()}>
            <Icon d={ICONS.refresh} size={14} /> New Game
          </button>
          <button className="btn" onClick={undo} disabled={!history.length || undos === 0}>
            <Icon d={ICONS.undo} size={14} />
            Undo <span className="undo-count">{undos}</span>
          </button>
          <button className="btn btn-sq" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme">
            <Icon d={theme === "dark" ? ICONS.sun : ICONS.moon} size={15} />
          </button>
          <button className={`btn btn-sq${showSet ? " btn-active" : ""}`} onClick={() => setShowSet(s => !s)} title="Settings">
            <Icon d={ICONS.settings} size={15} />
          </button>
        </div>

        {/* ── Grid selector ── */}
        <div className="grid-sel">
          {[3, 4, 5].map(s => (
            <button key={s} className={`grid-btn${size === s ? " on" : ""}`} onClick={() => changeSize(s)}>
              {s}×{s}
            </button>
          ))}
        </div>

        {/* ── Settings panel ── */}
        {showSet && (
          <div className="settings">
            <div className="set-row">
              <span className="set-lbl"><Icon d={ICONS.lightbulb} size={13}/> Merge Hints</span>
              <button className={`toggle${hints ? " on" : ""}`} onClick={() => setHints(h => !h)} />
            </div>
            <div className="set-row">
              <span className="set-lbl"><Icon d={ICONS.sparkles} size={13}/> Animations</span>
              <button className={`toggle${animOn ? " on" : ""}`} onClick={() => setAnimOn(a => !a)} />
            </div>
            <div className="set-row">
              <span className="set-lbl"><Icon d={ICONS.trophy} size={13}/> Best Tile</span>
              <span className="set-badge">{bestTile || "—"}</span>
            </div>
            <div className="set-row">
              <span className="set-lbl"><Icon d={ICONS.flame} size={13}/> Best Streak</span>
              <span className="set-badge">{maxStreak || "—"}</span>
            </div>
          </div>
        )}

        {/* ── Stats bar ── */}
        <div className="stats">
          <div className="stat">
            <div className="stat-v c-ac">{moves}</div>
            <div className="stat-l">Moves</div>
          </div>
          <div className="stat">
            <div className="stat-v c-gold">{bestTile || "—"}</div>
            <div className="stat-l">Best Tile</div>
          </div>
          <div className="stat">
            {streak > 1
              ? <div className="streak-badge"><Icon d={ICONS.flame} size={12}/> ×{streak}</div>
              : <div className="stat-v">{moves > 0 && score > 0 ? Math.round(score / moves) : "—"}</div>
            }
            <div className="stat-l">{streak > 1 ? "Streak!" : "Pts/Move"}</div>
          </div>
        </div>

        {/* ── Board ── */}
        <div
          className="board-wrap"
          ref={boardRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Board
            grid={grid}
            size={size}
            hintsOn={hints}
            animOn={animOn}
            theme={theme}
          />

          {/* Game Over overlay */}
          {over && (
            <div className="overlay ov-lose">
              <div className="ov-icon"><Icon d={ICONS.skull} size={38} strokeWidth={1.5}/></div>
              <div className="ov-title">Game Over</div>
              <div className="ov-sub">Score: {score.toLocaleString()} · {moves} moves</div>
              <div className="ov-btns">
                <button className="btn btn-primary" onClick={() => restart()}>
                  <Icon d={ICONS.refresh} size={13}/> Try Again
                </button>
              </div>
            </div>
          )}

          {/* Win overlay */}
          {won && !keepGo && (
            <div className="overlay ov-win">
              <div className="ov-icon"><Icon d={ICONS.trophy} size={38} strokeWidth={1.5}/></div>
              <div className="ov-title">You Won!</div>
              <div className="ov-sub">Reached 2048 in {moves} moves</div>
              <div className="ov-btns">
                <button className="btn" onClick={() => restart()}>
                  <Icon d={ICONS.refresh} size={13}/> New Game
                </button>
                <button className="btn btn-primary" onClick={() => setKeepGo(true)}>
                  Keep Going <Icon d={ICONS.chevright} size={13}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Hint bar ── */}
        <div className="hint-bar">
          <Icon d={ICONS.arrowleft}  size={12} />
          <Icon d={ICONS.arrowright} size={12} />
          <Icon d={ICONS.arrowup}    size={12} />
          <Icon d={ICONS.arrowdown}  size={12} />
          Arrow keys &nbsp;·&nbsp; Swipe on mobile
        </div>

      </div>
    </div>
  );
}
