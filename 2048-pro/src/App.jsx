import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import {
  moveLeft, moveRight, moveUp, moveDown,
  addRandomTile, initGame, hasMovesLeft, hasWon,
  getBestTile, getMergeCells, storage
} from "./utils/gameLogic";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);
const IC = {
  refresh:  "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 3v5h5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 21v-5h-5",
  undo:     "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  sun:      ["M12 2v2","M12 20v2","m4.93 4.93 1.41 1.41","m17.66 17.66 1.41 1.41","M2 12h2","M20 12h2","m6.34 17.66-1.41 1.41","m19.07 4.93-1.41 1.41","M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
  moon:     "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z",
  settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  trophy:   "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z",
  flame:    "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  bulb:     "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4",
  sparkles: ["M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z","M20 3v4","M22 5h-4","M4 17v2","M5 18H3"],
  skull:    ["M12 4a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V19a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z","M9 18h1","M14 18h1","M9 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0","M13 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0"],
  chevr:    "M9 18l6-6-6-6",
  arl:      "M19 12H5M12 5l-7 7 7 7",
  arr:      "M5 12h14M12 5l7 7-7 7",
  aru:      "M12 19V5M5 12l7-7 7 7",
  ard:      "M12 5v14M5 12l7 7 7-7",
};

// ─── Tile colors ──────────────────────────────────────────────────────────────
const PAL = {
  dark: {
    2:    { bg: "#22222e", text: "#9898b8" },
    4:    { bg: "#2a2540", text: "#b0a0d0" },
    8:    { bg: "#3d2010", text: "#ff9840" },
    16:   { bg: "#4a1e08", text: "#ff6820" },
    32:   { bg: "#4e1010", text: "#ff4040" },
    64:   { bg: "#560a0a", text: "#ff2020" },
    128:  { bg: "#3c2e00", text: "#ffd030" },
    256:  { bg: "#402800", text: "#ffb010" },
    512:  { bg: "#442200", text: "#ff9800" },
    1024: { bg: "#481a00", text: "#ff8000" },
    2048: { bg: "#4a1000", text: "#ff5500" },
  },
  light: {
    2:    { bg: "#f0ece2", text: "#7a6a58" },
    4:    { bg: "#edddc0", text: "#6a5530" },
    8:    { bg: "#f5a030", text: "#fff" },
    16:   { bg: "#ef6f20", text: "#fff" },
    32:   { bg: "#e83c28", text: "#fff" },
    64:   { bg: "#d02010", text: "#fff" },
    128:  { bg: "#e4c020", text: "#fff" },
    256:  { bg: "#e0b010", text: "#fff" },
    512:  { bg: "#dca000", text: "#fff" },
    1024: { bg: "#d88c00", text: "#fff" },
    2048: { bg: "#d07000", text: "#fff" },
  }
};
function tileColor(v, theme) {
  return PAL[theme]?.[v] || (theme === "dark"
    ? { bg: "#380e00", text: "#ff3300" }
    : { bg: "#b85000", text: "#fff" });
}

// ─── Timing ───────────────────────────────────────────────────────────────────
// SLIDE: how long tiles glide to their new position
// MERGE_DELAY: merge pop fires after slide finishes
// MERGE_DUR: duration of the elastic bounce
const SLIDE_MS      = 160;
const MERGE_DELAY   = SLIDE_MS;
const MERGE_DUR     = 240;
const SPAWN_DUR     = 180;

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.t-dark{
  --bg:#0c0c14;--sur:#181824;--sur2:#20202e;--bdr:#28283c;--bdr2:#343450;
  --tx:#e4e4f0;--tx2:#8888a8;--tx3:#505068;
  --ac:#7c6fff;--ac2:#a09aff;--acg:rgba(124,111,255,.35);
  --gd:#ffca40;--gdg:rgba(255,202,64,.35);--rd:#ff5a5a;
  --board:#0e0e18;--cell:#181826;--cellb:#20202e;
}
.t-light{
  --bg:#f2eee6;--sur:#fff;--sur2:#f7f3ec;--bdr:#ddd6c8;--bdr2:#c8c0b0;
  --tx:#18140e;--tx2:#685848;--tx3:#9c8c78;
  --ac:#4c42e0;--ac2:#7068ff;--acg:rgba(76,66,224,.2);
  --gd:#c07800;--gdg:rgba(192,120,0,.25);--rd:#cc2828;
  --board:#ccc4b4;--cell:#bbb4a4;--cellb:#aaa498;
}

body{background:var(--bg);font-family:'Outfit',sans-serif;color:var(--tx);min-height:100vh;transition:background .25s,color .25s;overflow-x:hidden;}

.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:18px 16px 36px;position:relative;}
.app::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;}
.t-dark .app::before{background:
  radial-gradient(ellipse 70% 50% at 15% 5%,rgba(124,111,255,.07) 0%,transparent 60%),
  radial-gradient(ellipse 50% 40% at 85% 85%,rgba(255,100,40,.05) 0%,transparent 55%);}
.t-light .app::before{background:
  radial-gradient(ellipse 70% 50% at 15% 5%,rgba(76,66,224,.05) 0%,transparent 60%),
  radial-gradient(ellipse 50% 40% at 85% 85%,rgba(192,120,0,.05) 0%,transparent 55%);}
.app>*{position:relative;z-index:1;}

/* header */
.header{width:100%;max-width:520px;display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.logo-wrap{flex:0 0 auto;}
.logo{font-size:42px;font-weight:900;letter-spacing:-3px;line-height:1;background:linear-gradient(135deg,var(--ac) 0%,var(--ac2) 45%,var(--gd) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 18px var(--acg));}
.logo-sub{font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--tx3);margin-top:2px;}
.score-row{flex:1;display:flex;gap:7px;justify-content:flex-end;}
.score-box{background:var(--sur);border:1px solid var(--bdr);border-radius:10px;padding:6px 12px;min-width:76px;text-align:center;position:relative;overflow:hidden;}
.score-box::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 55%);pointer-events:none;}
.score-lbl{font-size:8.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tx3);margin-bottom:1px;}
.score-val{font-size:20px;font-weight:800;letter-spacing:-.5px;line-height:1.1;}

/* toolbar */
.toolbar{width:100%;max-width:520px;display:flex;gap:7px;margin-bottom:11px;}
.btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 13px;border:1px solid var(--bdr);border-radius:8px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;background:var(--sur);color:var(--tx);white-space:nowrap;line-height:1;}
.btn:hover:not(:disabled){background:var(--sur2);border-color:var(--bdr2);transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.15);}
.btn:active:not(:disabled){transform:scale(.97);}
.btn:disabled{opacity:.3;cursor:not-allowed;}
.btn-p{background:var(--ac);border-color:var(--ac);color:#fff;}
.btn-p:hover:not(:disabled){background:var(--ac2);border-color:var(--ac2);box-shadow:0 4px 14px var(--acg);}
.btn-sq{width:34px;height:34px;padding:0;}
.btn-on{background:var(--ac)!important;border-color:var(--ac)!important;color:#fff!important;}
.uc{background:rgba(0,0,0,.18);border-radius:10px;padding:1px 5px;font-size:10px;font-weight:700;}

/* grid selector */
.gselector{width:100%;max-width:520px;display:flex;gap:5px;margin-bottom:11px;background:var(--sur);border:1px solid var(--bdr);border-radius:10px;padding:4px;}
.gbtn{flex:1;padding:7px;border:none;border-radius:7px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;background:transparent;color:var(--tx2);}
.gbtn:hover{background:var(--sur2);color:var(--tx);}
.gbtn.on{background:var(--ac);color:#fff;box-shadow:0 2px 8px var(--acg);}

/* stats */
.stats{width:100%;max-width:520px;display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:11px;}
.stat{background:var(--sur);border:1px solid var(--bdr);border-radius:10px;padding:9px 10px;text-align:center;}
.sv{font-size:17px;font-weight:800;letter-spacing:-.5px;}
.sl{font-size:8.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--tx3);margin-top:2px;}
.c-ac{color:var(--ac);}.c-gd{color:var(--gd);}
.sbadge{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,var(--gd) 0%,#ff8800 100%);color:#1a0e00;font-size:11px;font-weight:800;padding:2px 9px;border-radius:20px;box-shadow:0 2px 8px var(--gdg);}

/* settings */
.spanel{width:100%;max-width:520px;background:var(--sur);border:1px solid var(--bdr);border-radius:14px;padding:14px 16px;margin-bottom:11px;display:grid;grid-template-columns:1fr 1fr;gap:10px;animation:fsl .18s ease;}
@keyframes fsl{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.srow{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.slbl{font-size:11.5px;font-weight:600;color:var(--tx2);display:flex;align-items:center;gap:5px;}
.tog{width:38px;height:21px;background:var(--bdr2);border-radius:11px;position:relative;cursor:pointer;border:none;transition:background .15s;flex-shrink:0;}
.tog.on{background:var(--ac);}
.tog::after{content:'';position:absolute;width:15px;height:15px;background:#fff;border-radius:50%;top:3px;left:3px;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.3);}
.tog.on::after{transform:translateX(17px);}
.sbg{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--sur2);border:1px solid var(--bdr);color:var(--tx2);}

/* ─── BOARD ────────────────────────────────────────────────────────────
   The board is a fixed-size square. We measure its pixel width once with
   ResizeObserver, then compute exact pixel positions for every tile in JS.
   This is 100% reliable on every browser, every screen, every orientation,
   and every grid-size switch — no CSS calc() ambiguity, no stale values.
   ───────────────────────────────────────────────────────────────────── */
.board-wrap{width:100%;max-width:520px;position:relative;margin-bottom:12px;}

.board{
  background:var(--board);border-radius:16px;border:1px solid var(--bdr);
  box-shadow:0 16px 48px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.035) inset;
  touch-action:none;user-select:none;
  /* Square: padding-bottom = 100% of width, height = 0 */
  position:relative;width:100%;padding-bottom:100%;height:0;
}
.t-light .board{box-shadow:0 8px 32px rgba(0,0,0,.14),0 0 0 1px rgba(255,255,255,.5) inset;}

/* inner fills the board (padding excluded) */
.board-inner{position:absolute;inset:0;}

/* static background cells — we draw them via absolute divs too (so they
   also use JS pixel positions and stay perfectly in sync) */
.bg-cell{
  position:absolute;
  background:var(--cell);border:1px solid var(--cellb);border-radius:7px;
}

/* ─── TILE ───────────────────────────────────────────────────────────
   left/top/width/height are always set as inline px styles from JS.
   CSS transition animates left+top changes → smooth glide every move.
   ─────────────────────────────────────────────────────────────────── */
.tile{
  position:absolute;
  display:flex;align-items:center;justify-content:center;
  font-family:'Outfit',sans-serif;font-weight:800;
  border-radius:7px;
  border:1px solid rgba(255,255,255,.08);
  overflow:hidden;
  z-index:2;

  /* 
   * SMOOTH SLIDE: transition left + top.
   * When JS updates left/top inline style, the browser animates between
   * old and new value. This is the slide effect.
   */
  transition:
    left  ${SLIDE_MS}ms cubic-bezier(.22,.68,0,1.2),
    top   ${SLIDE_MS}ms cubic-bezier(.22,.68,0,1.2),
    background 120ms ease,
    color 120ms ease;
  will-change: left, top;
}

/* glossy sheen */
.tile::before{
  content:'';position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(145deg,rgba(255,255,255,.14) 0%,transparent 55%);
  pointer-events:none;z-index:1;
}

/* ── SPAWN animation: new tile pops in ── */
.tile.spawn{
  animation: tSpawn ${SPAWN_DUR}ms cubic-bezier(.18,1.6,.38,1) both;
  z-index:4;
}
@keyframes tSpawn{
  0%  { transform:scale(0) rotate(-10deg); opacity:0; }
  70% { transform:scale(1.12) rotate(2deg); opacity:1; }
  100%{ transform:scale(1) rotate(0deg); opacity:1; }
}

/* ── MERGE animation: elastic bounce AFTER slide arrives ──
   animation-delay = SLIDE_MS so the bounce only plays once tiles
   have already glided to their final position.
   4-stop spring: rest → big overshoot → undershoot → small overshoot → rest
   This creates a satisfying physical "thud" feel on merge.
*/
.tile.merge{
  animation: tMerge ${MERGE_DUR}ms cubic-bezier(.18,1.4,.4,1) both;
  animation-delay: ${MERGE_DELAY}ms;
  z-index:5;
}
@keyframes tMerge{
  0%   { transform: scale(1); }
  28%  { transform: scale(1.32); }   /* BIG elastic overshoot */
  55%  { transform: scale(0.91); }   /* undershoot */
  78%  { transform: scale(1.07); }   /* small bounce back */
  100% { transform: scale(1); }      /* settle */
}

/* ── HINT pulse ── */
.tile.hint{ animation: hintP 1.4s ease-in-out infinite; }
@keyframes hintP{
  0%,100%{ box-shadow: 0 0 0 2.5px var(--ac); }
  50%    { box-shadow: 0 0 0 2.5px var(--ac), 0 0 16px 5px var(--acg); }
}

/* score floats */
.sfloat{position:fixed;pointer-events:none;z-index:999;font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;color:var(--gd);text-shadow:0 2px 8px rgba(0,0,0,.5);animation:sfu .85s ease-out forwards;}
@keyframes sfu{0%{opacity:1;transform:translateY(0) scale(.85);}20%{opacity:1;transform:translateY(-20px) scale(1.15);}100%{opacity:0;transform:translateY(-58px) scale(.95);}}

/* overlays */
.overlay{position:absolute;inset:0;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:50;gap:10px;padding:20px;text-align:center;animation:ovIn .28s ease both;backdrop-filter:blur(8px);}
@keyframes ovIn{from{opacity:0;}to{opacity:1;}}
.t-dark  .ov-l{background:rgba(12,12,20,.92);}
.t-light .ov-l{background:rgba(242,238,230,.92);}
.t-dark  .ov-w{background:rgba(20,14,0,.92);}
.t-light .ov-w{background:rgba(255,246,220,.92);}
.ov-icon{display:flex;justify-content:center;margin-bottom:2px;}
.ov-title{font-size:28px;font-weight:900;letter-spacing:-1px;line-height:1.1;}
.ov-l .ov-title{color:var(--rd);}
.ov-w .ov-title{color:var(--gd);}
.ov-sub{font-size:12.5px;color:var(--tx2);font-weight:500;}
.ov-btns{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:4px;}
.ov-btns .btn{font-size:12px;padding:7px 14px;}

/* confetti */
.cf{position:fixed;top:-12px;border-radius:2px;pointer-events:none;z-index:999;animation:cff linear forwards;}
@keyframes cff{0%{transform:translateY(0) rotate(0) scale(1);opacity:1;}85%{opacity:1;}100%{transform:translateY(108vh) rotate(700deg) scale(.4);opacity:0;}}

/* hint bar */
.hint-bar{width:100%;max-width:520px;text-align:center;font-size:11px;font-weight:500;color:var(--tx3);letter-spacing:.5px;display:flex;align-items:center;justify-content:center;gap:6px;}

@media(max-width:460px){
  .logo{font-size:34px;}.score-val{font-size:17px;}
  .spanel{grid-template-columns:1fr;}
  .score-box{min-width:66px;padding:5px 9px;}.header{gap:9px;}
}
`;

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CF_COLS = ["#7c6fff","#ffca40","#ff6030","#4ade80","#f472b6","#38bdf8","#fb923c"];
function Confetti() {
  const ps = useMemo(() => Array.from({length:65},(_,i)=>({
    id:i,left:Math.random()*100,color:CF_COLS[i%CF_COLS.length],
    w:5+Math.random()*9,h:4+Math.random()*6,
    dur:2+Math.random()*2.2,delay:Math.random()*1.4,
  })),[]);
  return <>{ps.map(p=>(
    <div key={p.id} className="cf" style={{left:`${p.left}%`,width:p.w,height:p.h,background:p.color,animationDuration:`${p.dur}s`,animationDelay:`${p.delay}s`}}/>
  ))}</>;
}

// ─── Board ────────────────────────────────────────────────────────────────────
/**
 * POSITIONING STRATEGY — pixel-perfect, works on every device:
 *
 * 1. We observe the .board-inner div with ResizeObserver.
 * 2. On every size change (including grid-size switch), we recompute
 *    cellSize and gap in pixels.
 * 3. Every tile's left/top/width/height is set as an inline px style.
 * 4. CSS transitions on left+top create the smooth slide.
 * 5. No CSS calc(), no percentage ambiguity, no stale measurements.
 *
 * Key: the `size` prop is included in the ResizeObserver callback closure
 * via a ref, so switching from 4×4 to 3×3 and back immediately triggers
 * a fresh measurement with the correct size value.
 */
function Board({ grid, size, hintsOn, animOn, theme }) {
  const innerRef  = useRef(null);
  const sizeRef   = useRef(size);
  const [geo, setGeo] = useState({ cellPx: 0, gapPx: 0 });

  // Keep sizeRef in sync so the ResizeObserver closure always sees latest size
  useLayoutEffect(() => {
    sizeRef.current = size;
  });

  // Measure inner div — re-runs whenever size prop changes via key trick below
  useLayoutEffect(() => {
    if (!innerRef.current) return;

    const measure = () => {
      const rect = innerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const n   = sizeRef.current;
      const w   = rect.width;
      const GAP = n === 5 ? 7 : 8;
      const PAD = n === 5 ? 8 : 10;
      // The inner div is `inset: 0` inside .board-inner which already has no padding;
      // the padding is applied to .board itself via the key-controlled wrapper.
      // We measure the full inner width and compute:
      //   cellPx = (w - PAD*2 - GAP*(n-1)) / n
      // But since inner is inset:0 of board (which has padding), we need:
      const totalPad = PAD * 2;
      const cellPx  = (w - totalPad - GAP * (n - 1)) / n;
      setGeo({ cellPx, gapPx: GAP, padPx: PAD });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [size]); // re-attach and re-measure every time size changes

  const { cellPx, gapPx, padPx = 10 } = geo;
  const ready = cellPx > 0;

  const hintCells = hintsOn ? getMergeCells(grid, size) : new Set();

  // Pixel position of cell at (row, col)
  const px = (row, col) => ({
    top:    padPx + row * (cellPx + gapPx),
    left:   padPx + col * (cellPx + gapPx),
    width:  cellPx,
    height: cellPx,
  });

  // Font size: percentage of cellPx, clamped
  const fs = (value) => {
    const d = String(value).length;
    const pct = d >= 5 ? 0.28 : d === 4 ? 0.34 : d === 3 ? 0.40 : 0.48;
    return Math.max(11, Math.round(cellPx * pct));
  };

  // Collect tiles
  const tiles = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]) {
        const t = grid[r][c];
        tiles.push({ t, r, c, col: tileColor(t.value, theme), hint: hintCells.has(`${r}-${c}`) });
      }

  // Background cells
  const bgCells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      bgCells.push({ r, c });

  return (
    /* key=size forces React to remount board-inner on size change,
       which triggers the ResizeObserver useLayoutEffect fresh.
       This guarantees measurement always uses the correct size. */
    <div className="board" key={size}>
      <div className="board-inner" ref={innerRef}>
        {/* Background cells — pixel-positioned to match tiles exactly */}
        {ready && bgCells.map(({ r, c }) => {
          const p = px(r, c);
          return (
            <div key={`bg-${r}-${c}`} className="bg-cell" style={{
              top: p.top, left: p.left, width: p.width, height: p.height,
            }}/>
          );
        })}

        {/* Tiles — pixel left/top drives the CSS transition slide */}
        {ready && tiles.map(({ t, r, c, col, hint }) => {
          const p = px(r, c);
          const cls = [
            "tile",
            animOn && t.isNew    ? "spawn" : "",
            animOn && t.isMerged ? "merge" : "",
            hint ? "hint" : "",
          ].filter(Boolean).join(" ");

          return (
            <div
              key={t.id}
              className={cls}
              style={{
                top:        p.top,
                left:       p.left,
                width:      p.width,
                height:     p.height,
                background: col.bg,
                color:      col.text,
                fontSize:   `${ready ? fs(t.value) : 16}px`,
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
  const [size,     setSize]     = useState(4);
  const [grid,     setGrid]     = useState(() => initGame(4));
  const [score,    setScore]    = useState(0);
  const [best,     setBest]     = useState(() => storage.getBest(4));
  const [over,     setOver]     = useState(false);
  const [won,      setWon]      = useState(false);
  const [keepGo,   setKeepGo]   = useState(false);
  const [history,  setHistory]  = useState([]);
  const [undos,    setUndos]    = useState(3);
  const [theme,    setTheme]    = useState(() => storage.getTheme());
  const [showSet,  setShowSet]  = useState(false);
  const [hints,    setHints]    = useState(false);
  const [animOn,   setAnimOn]   = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [pops,     setPops]     = useState([]);
  const [moves,    setMoves]    = useState(0);
  const [bestTile, setBestTile] = useState(0);
  const [streak,   setStreak]   = useState(0);
  const [maxSt,    setMaxSt]    = useState(0);

  const boardWrapRef = useRef(null);
  const stTimer      = useRef(null);
  const moveLock     = useRef(false);

  // Stable refs to avoid stale closures inside setGrid updater
  const sizeRef  = useRef(4);    sizeRef.current  = size;
  const scoreRef = useRef(0);    scoreRef.current = score;
  const keepRef  = useRef(false); keepRef.current  = keepGo;
  const overRef  = useRef(false); overRef.current  = over;
  const wonRef   = useRef(false); wonRef.current   = won;

  useEffect(() => {
    document.body.className = theme === "dark" ? "t-dark" : "t-light";
    storage.setTheme(theme);
  }, [theme]);

  const addPop = useCallback((value) => {
    const b = boardWrapRef.current?.getBoundingClientRect();
    const x = b ? b.left + b.width  * (.2 + Math.random() * .6) : 200;
    const y = b ? b.top  + b.height * (.2 + Math.random() * .5) : 250;
    const id = Date.now() + Math.random();
    setPops(p => [...p, { id, value, x, y }]);
    setTimeout(() => setPops(p => p.filter(s => s.id !== id)), 950);
  }, []);

  const bumpStreak = useCallback(() => {
    if (stTimer.current) clearTimeout(stTimer.current);
    setStreak(s => { const ns = s + 1; setMaxSt(m => Math.max(m, ns)); return ns; });
    stTimer.current = setTimeout(() => setStreak(0), 1600);
  }, []);

  const applyMove = useCallback((moveFn) => {
    if (overRef.current || (wonRef.current && !keepRef.current)) return;
    if (moveLock.current) return;

    setGrid(prev => {
      const sz = sizeRef.current;
      const { grid: moved, score: gained, changed } = moveFn(prev, sz);
      if (!changed) return prev;

      // Lock during slide + merge animation
      moveLock.current = true;
      setTimeout(() => { moveLock.current = false; }, SLIDE_MS + MERGE_DUR + 50);

      setHistory(h => [...h.slice(-2), { grid: prev, score: scoreRef.current }]);
      setMoves(m => m + 1);

      if (gained > 0) {
        setScore(s => {
          const ns = s + gained;
          if (ns > storage.getBest(sz)) { storage.setBest(sz, ns); setBest(ns); }
          return ns;
        });
        addPop(gained);
        bumpStreak();
      }

      const next = addRandomTile(moved, sz);
      setBestTile(b => Math.max(b, getBestTile(next, sz)));

      if (!keepRef.current && hasWon(next, sz)) {
        setWon(true); setConfetti(true);
        setTimeout(() => setConfetti(false), 3600);
      } else if (!hasMovesLeft(next, sz)) {
        setOver(true);
      }
      return next;
    });
  }, [addPop, bumpStreak]);

  const handleKey = useCallback(e => {
    const m = { ArrowLeft:moveLeft, ArrowRight:moveRight, ArrowUp:moveUp, ArrowDown:moveDown };
    if (m[e.key]) { e.preventDefault(); applyMove(m[e.key]); }
  }, [applyMove]);
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

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

  const resetState = useCallback((sz) => {
    setGrid(initGame(sz)); setScore(0); setBest(storage.getBest(sz));
    setOver(false); setWon(false); setKeepGo(false);
    setHistory([]); setUndos(3); setMoves(0);
    setBestTile(0); setStreak(0); setMaxSt(0); setConfetti(false);
    moveLock.current = false;
  }, []);

  const restart    = useCallback(() => resetState(sizeRef.current), [resetState]);
  const changeSize = useCallback(s => { setSize(s); sizeRef.current = s; resetState(s); }, [resetState]);

  const undo = useCallback(() => {
    if (!history.length || undos === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setGrid(last.grid); setScore(last.score);
    setUndos(u => u - 1); setOver(false);
    moveLock.current = false;
  }, [history, undos]);

  const fmt = v => v >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();

  return (
    <div className={theme === "dark" ? "t-dark" : "t-light"}>
      <style>{CSS}</style>
      {confetti && <Confetti />}
      {pops.map(p => (
        <div key={p.id} className="sfloat" style={{ top: p.y, left: p.x }}>+{p.value}</div>
      ))}

      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="logo-wrap">
            <div className="logo">2048</div>
            <div className="logo-sub">Pro Edition</div>
          </div>
          <div className="score-row">
            <div className="score-box"><div className="score-lbl">Score</div><div className="score-val">{fmt(score)}</div></div>
            <div className="score-box"><div className="score-lbl">Best</div><div className="score-val">{fmt(best)}</div></div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <button className="btn btn-p" onClick={restart}><Icon d={IC.refresh} size={14}/> New Game</button>
          <button className="btn" onClick={undo} disabled={!history.length || undos === 0}>
            <Icon d={IC.undo} size={14}/> Undo <span className="uc">{undos}</span>
          </button>
          <button className="btn btn-sq" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            <Icon d={theme === "dark" ? IC.sun : IC.moon} size={15}/>
          </button>
          <button className={`btn btn-sq${showSet ? " btn-on" : ""}`} onClick={() => setShowSet(s => !s)}>
            <Icon d={IC.settings} size={15}/>
          </button>
        </div>

        {/* Grid size selector */}
        <div className="gselector">
          {[3, 4, 5].map(s => (
            <button key={s} className={`gbtn${size === s ? " on" : ""}`} onClick={() => changeSize(s)}>
              {s}×{s}
            </button>
          ))}
        </div>

        {/* Settings panel */}
        {showSet && (
          <div className="spanel">
            <div className="srow"><span className="slbl"><Icon d={IC.bulb} size={13}/> Merge Hints</span><button className={`tog${hints?" on":""}`} onClick={()=>setHints(h=>!h)}/></div>
            <div className="srow"><span className="slbl"><Icon d={IC.sparkles} size={13}/> Animations</span><button className={`tog${animOn?" on":""}`} onClick={()=>setAnimOn(a=>!a)}/></div>
            <div className="srow"><span className="slbl"><Icon d={IC.trophy} size={13}/> Best Tile</span><span className="sbg">{bestTile||"—"}</span></div>
            <div className="srow"><span className="slbl"><Icon d={IC.flame} size={13}/> Best Streak</span><span className="sbg">{maxSt||"—"}</span></div>
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          <div className="stat"><div className="sv c-ac">{moves}</div><div className="sl">Moves</div></div>
          <div className="stat"><div className="sv c-gd">{bestTile||"—"}</div><div className="sl">Best Tile</div></div>
          <div className="stat">
            {streak > 1
              ? <div className="sbadge"><Icon d={IC.flame} size={12}/> ×{streak}</div>
              : <div className="sv">{moves > 0 && score > 0 ? Math.round(score/moves) : "—"}</div>}
            <div className="sl">{streak > 1 ? "Streak!" : "Pts/Move"}</div>
          </div>
        </div>

        {/* Board */}
        <div className="board-wrap" ref={boardWrapRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Board grid={grid} size={size} hintsOn={hints} animOn={animOn} theme={theme}/>

          {over && (
            <div className="overlay ov-l">
              <div className="ov-icon"><Icon d={IC.skull} size={38} sw={1.5}/></div>
              <div className="ov-title">Game Over</div>
              <div className="ov-sub">Score: {score.toLocaleString()} · {moves} moves</div>
              <div className="ov-btns"><button className="btn btn-p" onClick={restart}><Icon d={IC.refresh} size={13}/> Try Again</button></div>
            </div>
          )}

          {won && !keepGo && (
            <div className="overlay ov-w">
              <div className="ov-icon"><Icon d={IC.trophy} size={38} sw={1.5}/></div>
              <div className="ov-title">You Won!</div>
              <div className="ov-sub">Reached 2048 in {moves} moves</div>
              <div className="ov-btns">
                <button className="btn" onClick={restart}><Icon d={IC.refresh} size={13}/> New Game</button>
                <button className="btn btn-p" onClick={() => setKeepGo(true)}>Keep Going <Icon d={IC.chevr} size={13}/></button>
              </div>
            </div>
          )}
        </div>

        {/* Hint bar */}
        <div className="hint-bar">
          <Icon d={IC.arl} size={12}/><Icon d={IC.arr} size={12}/>
          <Icon d={IC.aru} size={12}/><Icon d={IC.ard} size={12}/>
          Arrow keys · Swipe on mobile
        </div>

      </div>
    </div>
  );
}
