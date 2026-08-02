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
  const tiltRef     = useRef(15); // current head tilt (degrees)

  const fireflies = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 60 + Math.random() * 220,
    y: 40 + Math.random() * 130,
    phase: Math.random() * Math.PI * 2,
    speed: 0.18 + Math.random() * 0.28,
  })), []);

  useEffect(() => {
    let last = 0;
    const tick = (ts) => {
      const dt = last ? (ts - last) / 1000 : 0;
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
      const target = lookUp ? -42 : 15;
      tiltRef.current += (target - tiltRef.current) * Math.min(dt * 2.2, 1);
      const head = svg.querySelector("#bob-head");
      if (head) head.setAttribute("transform",
        `rotate(${tiltRef.current.toFixed(2)}, 148, 268)`);

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
  }, [fireflies, lookUp]);

  // SVG viewBox: 520 wide × 420 tall
  // Scene is anchored bottom-left of screen
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 520 420"
        preserveAspectRatio="xMinYMax meet"
        className="absolute bottom-0 left-0"
        style={{ width: "min(580px, 58vw)", height: "auto" }}
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
        <ellipse cx="200" cy="412" rx="210" ry="14" fill="#050a05" />

        {/* ══ TENT — yellow glowing A-frame ══ */}
        <g id="tent">
          {/* Glow halo */}
          <ellipse cx="370" cy="355" rx="105" ry="28" fill="#fbbf24" opacity="0.15" />
          {/* Main body */}
          <path d="M270 360 L370 195 L470 360 Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Right shading */}
          <path d="M370 195 L420 360 L470 360 Z" fill="#b45309" />
          {/* Left highlight */}
          <path d="M270 360 L320 360 L370 195 Z" fill="#f59e0b" opacity="0.5" />
          {/* Door */}
          <path d="M342 360 Q370 300 398 360 Z" fill="#78350f" />
          {/* Interior glow */}
          <path id="tglow" d="M346 360 Q370 305 394 360 Z" fill="#fef08a" opacity="0.6" />
          {/* Guy ropes */}
          <line x1="370" y1="198" x2="248" y2="268" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          <line x1="370" y1="198" x2="492" y2="268" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          <line x1="248" y1="268" x2="252" y2="285" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="492" y1="268" x2="488" y2="285" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ground glow spill */}
          <ellipse cx="370" cy="362" rx="60" ry="9" fill="#fbbf24" opacity="0.18" />
        </g>

        {/* ══ LOG ══ */}
        <g transform="translate(52, 340)">
          <ellipse cx="96" cy="58" rx="98" ry="13" fill="#020402" opacity="0.4" />
          <rect x="0" y="22" width="192" height="36" rx="18" fill="#3d1f0a" stroke="#5c3010" strokeWidth="2" />
          <rect x="2" y="22" width="188" height="16" rx="16" fill="#4e2810" />
          {[30,65,100,135,165].map(x => (
            <line key={x} x1={x} y1="24" x2={x} y2="56" stroke="#2a1206" strokeWidth="1" opacity="0.45" />
          ))}
          <ellipse cx="10"  cy="40" rx="9" ry="17" fill="#3d1f0a" stroke="#5c3010" strokeWidth="1.5" />
          <ellipse cx="182" cy="40" rx="9" ry="17" fill="#3d1f0a" stroke="#5c3010" strokeWidth="1.5" />
        </g>

        {/* ══ CAMPFIRE ══ */}
        <g transform="translate(295, 340)">
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

        {/* ══ BOB ══
            Drawing order (painter's algorithm — later = on top):
            1. Legs (behind body)
            2. Body (covers leg tops)
            3. Arms (behind body overlap covered by body redraw)
            4. Body redraw (white fill no stroke) to erase arm-body joint lines
            5. Head (on top of body, joint covered by white fill)

            Key: wherever two stroked shapes meet, we paint a white
            filled (no-stroke) version of the TOP shape to erase the
            underlying stroke line. Result = zero visible joint lines.
        ══ */}
        <g id="bob-all">

          {/* ── 1. LEFT LEG ── */}
          {/* Thigh going down-left */}
          <ellipse cx="122" cy="348" rx="22" ry="14" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(-30,122,348)" />
          {/* Shin */}
          <ellipse cx="100" cy="372" rx="18" ry="12" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(-15,100,372)" />
          {/* Foot */}
          <ellipse cx="88" cy="390" rx="20" ry="10" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
          {/* Cover thigh-shin joint */}
          <ellipse cx="110" cy="362" rx="16" ry="11" fill="white" stroke="none"
            transform="rotate(-22,110,362)" />
          {/* Cover shin-foot joint */}
          <ellipse cx="94" cy="382" rx="15" ry="10" fill="white" stroke="none" />

          {/* ── 2. RIGHT LEG ── */}
          <ellipse cx="174" cy="348" rx="22" ry="14" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(30,174,348)" />
          <ellipse cx="196" cy="372" rx="18" ry="12" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(15,196,372)" />
          <ellipse cx="208" cy="390" rx="20" ry="10" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
          {/* Cover joints */}
          <ellipse cx="186" cy="362" rx="16" ry="11" fill="white" stroke="none"
            transform="rotate(22,186,362)" />
          <ellipse cx="202" cy="382" rx="15" ry="10" fill="white" stroke="none" />

          {/* ── 3. LEFT ARM ── */}
          <ellipse cx="108" cy="290" rx="14" ry="22" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(25,108,290)" />
          {/* Forearm */}
          <ellipse cx="96" cy="318" rx="12" ry="18" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(10,96,318)" />
          {/* Hand */}
          <circle cx="90" cy="338" r="13" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
          {/* Cover arm joints */}
          <ellipse cx="102" cy="306" rx="11" ry="16" fill="white" stroke="none"
            transform="rotate(18,102,306)" />
          <ellipse cx="93" cy="328" rx="11" ry="14" fill="white" stroke="none" />

          {/* ── 4. RIGHT ARM ── */}
          <ellipse cx="188" cy="290" rx="14" ry="22" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(-25,188,290)" />
          <ellipse cx="200" cy="318" rx="12" ry="18" fill="white" stroke="#1a1a1a" strokeWidth="2.8"
            transform="rotate(-10,200,318)" />
          <circle cx="206" cy="338" r="13" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
          {/* Cover joints */}
          <ellipse cx="194" cy="306" rx="11" ry="16" fill="white" stroke="none"
            transform="rotate(-18,194,306)" />
          <ellipse cx="203" cy="328" rx="11" ry="14" fill="white" stroke="none" />

          {/* ── 5. BODY ── short wide rounded rect */}
          <rect x="108" y="268" width="80" height="72" rx="26" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
          {/* White fill over arm-body joints (no stroke = erases lines) */}
          <rect x="110" y="270" width="76" height="68" rx="24" fill="white" stroke="none" />

          {/* ── 6. HEAD (rotates for look-up) ── */}
          <g id="bob-head" transform="rotate(15, 148, 268)">
            {/* Head circle */}
            <circle cx="148" cy="220" r="58" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
            {/* White fill over head-body joint */}
            <circle cx="148" cy="220" r="56" fill="white" stroke="none" />
            {/* Cheeks */}
            <ellipse cx="108" cy="232" rx="13" ry="9" fill="#ffb3b3" opacity="0.55" />
            <ellipse cx="188" cy="232" rx="13" ry="9" fill="#ffb3b3" opacity="0.55" />
            {/* Eyes — ONLY filled dots, zero lines */}
            <circle cx="132" cy="218" r="5.5" fill="#1a1a1a" />
            <circle cx="164" cy="218" r="5.5" fill="#1a1a1a" />
            {/* Eye shine */}
            <circle cx="135" cy="215" r="2.2" fill="white" />
            <circle cx="167" cy="215" r="2.2" fill="white" />
            {/* Mouth — single arc, no lines */}
            <path d="M136 236 Q148 246 160 236"
              fill="none" stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
            {/* Hair tufts — curved arcs only, no straight lines */}
            <path d="M118 168 Q148 154 178 168"
              fill="none" stroke="#1a1a1a" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M133 162 Q148 152 163 162"
              fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* White cover strip at head-body junction to erase overlap stroke */}
          <rect x="110" y="268" width="76" height="18" fill="white" stroke="none" />
        </g>

        {/* ══ FIREFLIES ══ */}
        <g id="fflies">
          {fireflies.map(f => (
            <circle key={f.id} cx={f.x} cy={f.y} r="2.4" fill="#fef08a" opacity="0.25" />
          ))}
        </g>

        {/* ══ SMOKE ══ */}
        <g opacity="0.12">
          <path d="M292 295 Q285 268 294 250 Q300 236 292 220"
            fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M300 292 Q308 265 302 247 Q298 233 306 216"
            fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* ══ FIRE LIGHT ON GROUND ══ */}
        <ellipse cx="295" cy="410" rx="140" ry="14" fill="#f97316" opacity="0.07" />
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
