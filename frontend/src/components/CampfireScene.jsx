import { useRef, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// HOW BOB IS DRAWN (matching the reference sheet exactly):
//
// The reference shows a chibi figure where:
//   1. Every body part is a FILLED WHITE SHAPE with ONE dark outline
//   2. Where parts overlap (arm over torso, head over body) the overlap is
//      CLIPPED so you never see a stroke line at the joint
//   3. The whole figure looks like a single clean silhouette
//
// Technique: draw each part as a filled+stroked shape, then use a white
// filled shape on top (no stroke) to cover the joint line where parts meet.
// This is the standard SVG "painter's algorithm" trick.
// ─────────────────────────────────────────────────────────────────────────────

export default function CampfireScene({ lookUp = false }) {
  const svgRef      = useRef(null);
  const frameRef    = useRef(null);
  const timeRef     = useRef(0);
  // lookUp tilts head back (negative = counter-clockwise = looking up-right toward sky)
  const tiltRef = useRef(15);
  const lookUpRef = useRef(lookUp);
  useEffect(() => { lookUpRef.current = lookUp; }, [lookUp]);

  const fireflies = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 180 + Math.random() * 160,
    y: 300 + Math.random() * 80,
    phase: Math.random() * Math.PI * 2,
    speed: 0.18 + Math.random() * 0.28,
  })), []);

  useEffect(() => {
    let last = 0;
    const tick = (ts) => {
      const dt = Math.min(last ? (ts - last) / 1000 : 0, 0.05);
      last = ts;
      timeRef.current += dt;
      const t = timeRef.current;
      const svg = svgRef.current;
      if (!svg) { frameRef.current = requestAnimationFrame(tick); return; }

      // Flame flicker
      const flame = svg.querySelector("#flame");
      if (flame) {
        const sx = 1 + Math.sin(t * 13) * 0.07;
        const sy = 1 + Math.sin(t * 9)  * 0.11;
        const tx = Math.sin(t * 7) * 2.5;
        flame.setAttribute("transform", `translate(${tx},0) scale(${sx},${sy})`);
      }
      // Glow pulse
      ["#glow1","#glow2"].forEach((id, i) => {
        const el = svg.querySelector(id);
        if (el) el.setAttribute("opacity", String(0.3 + Math.sin(t * (1.8 + i * 0.4)) * 0.15));
      });
      // Tent glow
      const tg = svg.querySelector("#tglow");
      if (tg) tg.setAttribute("opacity", String(0.6 + Math.sin(t * 1.2) * 0.22));

      // Head tilt — smooth lerp toward target
      const target = lookUpRef.current ? -42 : 15;
      tiltRef.current += (target - tiltRef.current) * Math.min(dt * 2.2, 1);
      const head = svg.querySelector("#bob-head");
      if (head) head.setAttribute("transform",
        `rotate(${tiltRef.current.toFixed(2)}, 148, 352)`);

      // Body breathe
      const body = svg.querySelector("#bob-all");
      if (body) {
        const b = Math.sin(t * 1.1) * 1.2;
        body.setAttribute("transform", `translate(0,${b.toFixed(2)})`);
      }

      // Fireflies
      const ffg = svg.querySelector("#fflies");
      if (ffg) {
        ffg.querySelectorAll("circle").forEach((c, i) => {
          const f = fireflies[i]; if (!f) return;
          c.setAttribute("cx", String((f.x + Math.cos(t * f.speed + f.phase) * 7).toFixed(1)));
          c.setAttribute("cy", String((f.y + Math.sin(t * f.speed * 0.8 + f.phase) * 9).toFixed(1)));
          c.setAttribute("opacity", String(Math.max(0, 0.2 + Math.sin(t * 1.5 + f.phase) * 0.45).toFixed(2)));
        });
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fireflies]);

  // SVG viewBox: 520 wide × 420 tall
  // Scene is anchored bottom-left of screen
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 520 460"
        preserveAspectRatio="xMidYMax meet"
        className="absolute bottom-0 left-0"
        style={{ width: "min(320px, 32vw)", height: "auto", overflow: "visible" }}
        overflow="visible"
        fill="none"
      >
        <defs>
          {/* Clip the head's stroke where it overlaps the body */}
          <clipPath id="head-clip">
            <circle cx="148" cy="220" r="58" />
          </clipPath>
        </defs>

        {/* ══ FOREST — drawn first so it's behind everything ══ */}
        <Forest />

        {/* ══ GROUND ══ */}
        <ellipse cx="200" cy="452" rx="210" ry="14" fill="#050a05" />

        {/* ══ TENT — yellow glowing A-frame ══ */}
        <g id="tent">
          {/* Glow halo */}
          <ellipse cx="370" cy="395" rx="105" ry="28" fill="#fbbf24" opacity="0.15" />
          {/* Main body */}
          <path d="M270 400 L370 235 L470 400 Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Right shading */}
          <path d="M370 235 L420 400 L470 400 Z" fill="#b45309" />
          {/* Left highlight */}
          <path d="M270 400 L320 400 L370 235 Z" fill="#f59e0b" opacity="0.5" />
          {/* Door */}
          <path d="M342 400 Q370 340 398 400 Z" fill="#78350f" />
          {/* Interior glow */}
          <path id="tglow" d="M346 400 Q370 345 394 400 Z" fill="#fef08a" opacity="0.6" />
          {/* Guy ropes */}
          <line x1="370" y1="238" x2="248" y2="308" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          <line x1="370" y1="238" x2="492" y2="308" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          <line x1="248" y1="308" x2="252" y2="325" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="492" y1="308" x2="488" y2="325" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ground glow spill */}
          <ellipse cx="370" cy="402" rx="60" ry="9" fill="#fbbf24" opacity="0.18" />
        </g>

        {/* ══ LOG — butt-end facing user, smaller ══ */}
        <g>
          <ellipse cx="148" cy="414" rx="18" ry="4" fill="#010201" opacity="0.5" />
          <ellipse cx="152" cy="406" rx="15" ry="6" fill="#2a1206" />
          <circle cx="148" cy="403" r="16" fill="#3d1f0a" stroke="#5c3010" strokeWidth="1.5" />
          <circle cx="148" cy="403" r="11" fill="none" stroke="#2a1206" strokeWidth="1" opacity="0.6" />
          <circle cx="148" cy="403" r="6"  fill="none" stroke="#2a1206" strokeWidth="1" opacity="0.5" />
          <circle cx="148" cy="403" r="2"  fill="#4e2810" opacity="0.7" />
          <path d="M133 397 Q148 391 163 397" fill="none" stroke="#5c3010" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* ══ BOB — side view, ONE leg (right/front only), sitting on log top y=387 ══ */}
        <g id="bob-all">
          {/* Single front leg hangs down from hip */}
          <line x1="148" y1="387" x2="158" y2="405" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          {/* Torso */}
          <line x1="148" y1="387" x2="148" y2="359" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          {/* Arm toward fire */}
          <line x1="148" y1="365" x2="162" y2="376" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          {/* Stick — tapered branch from hand toward fire */}
          <path
            d="M163 377 C172 373 182 369 192 366 C200 363 207 361 212 360 L214 358 C211 357 204 359 196 362 C186 365 176 369 166 373 Z"
            fill="#7a4a1e"
          />
          <path d="M166 373 C176 369 186 365 196 362 C204 359 211 357 214 358"
            fill="none" stroke="#a0622a" strokeWidth="0.7" opacity="0.5" strokeLinecap="round" />
          <ellipse cx="188" cy="366" rx="2" ry="1.2" fill="#4a2810" opacity="0.6" transform="rotate(-15,188,366)" />
          {/* Marshmallow just above fire edge */}
          <rect x="210" y="353" width="9" height="8" rx="2.5" fill="white" opacity="0.95" />
          <rect x="210" y="358" width="9" height="3" rx="1.5" fill="#f59e0b" opacity="0.7" />
          {/* Head */}
          <g id="bob-head" transform="rotate(15, 148, 359)">
            <circle cx="148" cy="348" r="10" fill="none" stroke="white" strokeWidth="2.5" />
          </g>
        </g>

        {/* ══ CAMPFIRE ══ */}
        <g transform="translate(230, 380)">
          <ellipse id="glow2" cx="0" cy="22" rx="88" ry="38" fill="#f97316" opacity="0.3" />
          <ellipse id="glow1" cx="0" cy="12" rx="52" ry="28" fill="#fbbf24" opacity="0.45" />
          <line x1="-42" y1="20" x2="42" y2="8"  stroke="#5a3010" strokeWidth="11" strokeLinecap="round" />
          <line x1="-36" y1="8"  x2="36" y2="20" stroke="#4a2808" strokeWidth="11" strokeLinecap="round" />
          <line x1="-22" y1="14" x2="22" y2="14" stroke="#3a1f08" strokeWidth="9"  strokeLinecap="round" />
          <ellipse cx="0" cy="16" rx="26" ry="10" fill="#f59e0b" opacity="0.65" />
          <g id="flame" style={{ transformOrigin: "0px 8px" }}>
            <path d="M0 10 C-22-8 -14-42 -5-58 C0-70 0-60 0-52 C0-60 5-70 8-58 C18-42 22-8 0 10Z" fill="#f97316" opacity="0.92" />
            <path d="M0 8 C-12-4 -8-30 -2-42 C0-50 0-42 0-36 C0-42 2-50 5-42 C10-30 12-4 0 8Z" fill="#fbbf24" opacity="0.96" />
            <path d="M0 6 C-5 0 -3-16 0-24 C3-16 5 0 0 6Z" fill="#fef9c3" />
            <circle cx="-12" cy="-55" r="2.2" fill="#fbbf24" opacity="0.8" />
            <circle cx="10"  cy="-50" r="1.8" fill="#fef08a" opacity="0.7" />
            <circle cx="-2"  cy="-66" r="1.4" fill="#fef9c3" opacity="0.6" />
            <circle cx="16"  cy="-44" r="1.2" fill="#fbbf24" opacity="0.5" />
          </g>
        </g>

        {/* ══ FIREFLIES ══ */}
        <g id="fflies">
          {fireflies.map(f => (
            <circle key={f.id} cx={f.x} cy={f.y} r="2.4" fill="#fef08a" opacity="0.25" />
          ))}
        </g>

        {/* ══ SMOKE ══ */}
        <g opacity="0.12">
          <path d="M227 335 Q220 308 229 290 Q235 276 227 260"
            fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M235 332 Q243 305 237 287 Q233 273 241 256"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* ══ FIRE LIGHT ON GROUND ══ */}
        <ellipse cx="230" cy="450" rx="140" ry="14" fill="#f97316" opacity="0.07" />
      </svg>
    </div>
  );
}

// ─── Forest: diverse trees filling the full background ───────────────────────
function Forest() {
  // Pine trees: [cx, baseY, height, layers, colorIndex]
  // Round/bushy trees: [cx, baseY, colorIndex]
  // Dead/bare trees: [cx, baseY, height]
  // Three depth layers drawn back-to-front

  const C = ["#030703","#040904","#050b05","#060e06","#071007","#081208","#0a1508","#0a1a0a","#0c1e0c"];

  const bgPines = [
    [10,260,105,3,0],[45,245,120,4,1],[88,255,110,3,0],[130,240,130,4,2],
    [172,250,115,3,1],[215,235,138,5,2],[258,248,118,3,0],[300,232,145,5,1],
    [342,244,122,3,2],[385,228,150,5,0],[428,240,128,4,1],[470,232,142,5,2],
    [510,245,112,3,0],[520,238,125,4,1],
  ];
  const midPines = [
    [0,310,155,5,3],[38,298,170,6,4],[80,308,158,5,3],[122,292,178,6,5],
    [165,305,162,5,4],[208,288,185,6,5],[250,300,168,5,3],[292,285,190,6,4],
    [335,298,172,5,5],[378,282,195,6,3],[420,295,175,5,4],[462,288,182,6,5],
    [505,300,160,5,3],[520,292,172,5,4],
  ];
  const fgPines = [
    // left flank (behind campsite)
    [0,370,210,7,6],[35,358,195,6,7],[75,368,205,7,6],
    // right side
    [310,375,215,7,8],[348,362,198,6,7],[388,372,208,7,8],
    [428,360,200,6,7],[468,370,212,7,8],[508,358,196,6,7],
  ];
  const roundTrees = [
    [55,340,6],[170,332,7],[340,338,6],[455,330,7],
  ];

  return (
    <g id="forest">
      {bgPines.map(([cx,base,h,layers,ci],i) =>
        <Pine key={"b"+i} cx={cx} base={base} h={h} layers={layers} col={C[ci]} w={0.48} />)}
      {midPines.map(([cx,base,h,layers,ci],i) =>
        <Pine key={"m"+i} cx={cx} base={base} h={h} layers={layers} col={C[ci]} w={0.56} />)}
      {roundTrees.map(([cx,base,ci],i) =>
        <Round key={"r"+i} cx={cx} base={base} col={C[ci]} />)}
      {fgPines.map(([cx,base,h,layers,ci],i) =>
        <Pine key={"f"+i} cx={cx} base={base} h={h} layers={layers} col={C[ci]} w={0.64} />)}
    </g>
  );
}

function Pine({ cx, base, h, layers, col, w }) {
  const trunkH = h * 0.26;
  const alt = col === "#0a1a0a" ? "#0d220d" : "#0a1a0a";
  return (
    <g>
      <rect x={cx-3} y={base-trunkH} width={6} height={trunkH} fill={col} />
      {Array.from({length:layers}).map((_,li) => {
        const t  = li / (layers - 1);
        const y  = (base - h) + t * (base - trunkH - (base - h)) * 0.86;
        const pw = h * w * (1 - t * 0.5);
        const ph = (h / layers) * 1.4;
        return <polygon key={li}
          points={`${cx},${y} ${cx-pw/2},${y+ph} ${cx+pw/2},${y+ph}`}
          fill={li%2===0 ? col : alt} />;
      })}
    </g>
  );
}

function Round({ cx, base, col }) {
  return (
    <g>
      <rect x={cx-4} y={base-52} width={8} height={52} fill={col} />
      <circle cx={cx}    cy={base-72} r={36} fill={col} />
      <circle cx={cx-16} cy={base-62} r={26} fill={col} />
      <circle cx={cx+16} cy={base-62} r={26} fill={col} />
      <circle cx={cx}    cy={base-90} r={22} fill={col} />
    </g>
  );
}
