import { useRef, useEffect, useMemo } from "react";

// ─── Chibi Bob SVG paths ────────────────────────────────────────────
// Large round head (≈40% of body height), tiny stubby body, thick
// stroked outlines — exactly matching the reference sheet style.
// Drawn in a 120×160 local coordinate space, origin at top-left.
// Bob is sitting on a log: legs folded forward, leaning slightly
// toward the fire, one arm extended holding a s'more stick.

function ChibiBob({ x, y, scale = 1, fireGlow = true }) {
  // All coords are in the parent SVG's space after transform
  const s = scale;
  const glow = fireGlow
    ? "drop-shadow(0 0 6px rgba(249,115,22,0.55)) drop-shadow(0 0 14px rgba(249,115,22,0.25))"
    : "drop-shadow(0 0 4px rgba(255,255,255,0.3))";

  return (
    <g transform={`translate(${x},${y}) scale(${s})`} style={{ filter: glow }}>
      {/* ── Log Bob sits on ── */}
      <ellipse cx="60" cy="148" rx="52" ry="11" fill="#3a1f08" stroke="#5a3010" strokeWidth="1.5" />
      <ellipse cx="60" cy="144" rx="50" ry="9" fill="#4a2810" />
      {/* bark lines */}
      <line x1="20" y1="143" x2="100" y2="143" stroke="#3a1f08" strokeWidth="0.8" opacity="0.6" />
      <line x1="25" y1="147" x2="95" y2="147" stroke="#3a1f08" strokeWidth="0.8" opacity="0.4" />

      {/* ── Body (sitting, leaning right toward fire) ── */}
      {/* Torso — short rounded rectangle */}
      <rect x="38" y="88" width="34" height="38" rx="10" ry="10"
        fill="white" stroke="#222" strokeWidth="2.5" />

      {/* ── Left leg (folded, foot sticking forward-left) ── */}
      <path d="M42 122 Q36 132 30 138 Q26 142 28 145 Q30 148 36 145 Q42 140 46 132 Z"
        fill="white" stroke="#222" strokeWidth="2.2" strokeLinejoin="round" />
      {/* left foot */}
      <ellipse cx="30" cy="144" rx="8" ry="5" fill="white" stroke="#222" strokeWidth="2" />

      {/* ── Right leg (folded, foot sticking forward-right) ── */}
      <path d="M68 122 Q74 132 80 138 Q84 142 82 145 Q80 148 74 145 Q68 140 64 132 Z"
        fill="white" stroke="#222" strokeWidth="2.2" strokeLinejoin="round" />
      {/* right foot */}
      <ellipse cx="80" cy="144" rx="8" ry="5" fill="white" stroke="#222" strokeWidth="2" />

      {/* ── Left arm (resting on knee) ── */}
      <path d="M42 96 Q32 108 28 118 Q26 122 30 124 Q34 126 38 120 Q42 112 46 102 Z"
        fill="white" stroke="#222" strokeWidth="2.2" strokeLinejoin="round" />
      {/* left hand */}
      <circle cx="29" cy="122" r="5" fill="white" stroke="#222" strokeWidth="2" />

      {/* ── Right arm (extended, holding s'more stick toward fire) ── */}
      <path d="M68 96 Q80 100 92 106 Q98 109 97 113 Q96 117 90 116 Q82 112 72 106 Z"
        fill="white" stroke="#222" strokeWidth="2.2" strokeLinejoin="round" />
      {/* right hand */}
      <circle cx="96" cy="114" r="5" fill="white" stroke="#222" strokeWidth="2" />
      {/* s'more stick */}
      <line x1="100" y1="112" x2="130" y2="100" stroke="#8B5E3C" strokeWidth="2.5" strokeLinecap="round" />
      {/* marshmallow on stick */}
      <rect x="126" y="92" width="12" height="12" rx="3" fill="#fff9f0" stroke="#e8c88a" strokeWidth="1.5" />
      {/* toasted top */}
      <rect x="126" y="92" width="12" height="4" rx="2" fill="#f59e0b" opacity="0.7" />

      {/* ── Neck ── */}
      <rect x="50" y="78" width="10" height="12" rx="4"
        fill="white" stroke="#222" strokeWidth="2" />

      {/* ── Head — big round chibi head ── */}
      {/* Head base */}
      <circle cx="55" cy="52" r="34" fill="white" stroke="#222" strokeWidth="2.8" />
      {/* Cheek blush left */}
      <ellipse cx="30" cy="60" rx="7" ry="5" fill="#ffb3b3" opacity="0.45" />
      {/* Cheek blush right */}
      <ellipse cx="80" cy="60" rx="7" ry="5" fill="#ffb3b3" opacity="0.45" />
      {/* Eyes — simple dots */}
      <circle cx="43" cy="50" r="3.5" fill="#222" />
      <circle cx="67" cy="50" r="3.5" fill="#222" />
      {/* Eye shine */}
      <circle cx="44.5" cy="48.5" r="1.2" fill="white" />
      <circle cx="68.5" cy="48.5" r="1.2" fill="white" />
      {/* Mouth — small happy curve */}
      <path d="M47 62 Q55 68 63 62" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
      {/* Hair tuft on top */}
      <path d="M40 22 Q55 10 70 22" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 18 Q55 8 60 18" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

// ─── Chibi Tent ─────────────────────────────────────────────────────
function ChibiTent({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* tent body */}
      <path d="M0 120 L60 0 L120 120 Z" fill="#2d4a3e" stroke="#1a2e26" strokeWidth="3" strokeLinejoin="round" />
      {/* tent shading panel */}
      <path d="M60 0 L90 120 L120 120 Z" fill="#1e3329" />
      {/* door opening */}
      <path d="M45 120 Q60 80 75 120 Z" fill="#0d1f18" />
      {/* door flap */}
      <path d="M45 120 Q55 85 60 80 Q58 90 55 120 Z" fill="#3a5c4e" opacity="0.7" />
      {/* tent pole line */}
      <line x1="60" y1="0" x2="60" y2="120" stroke="#4a7060" strokeWidth="1.5" opacity="0.5" />
      {/* guy ropes */}
      <line x1="60" y1="0" x2="-15" y2="60" stroke="#6b8c7a" strokeWidth="1" opacity="0.6" />
      <line x1="60" y1="0" x2="135" y2="60" stroke="#6b8c7a" strokeWidth="1" opacity="0.6" />
      {/* stake left */}
      <line x1="-15" y1="60" x2="-12" y2="75" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />
      {/* stake right */}
      <line x1="135" y1="60" x2="132" y2="75" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />
      {/* warm glow inside tent */}
      <ellipse cx="60" cy="110" rx="20" ry="8" fill="#fbbf24" opacity="0.12" />
    </g>
  );
}

// ─── Campfire ────────────────────────────────────────────────────────
function Campfire({ x, y, scale = 1, svgRef: _svgRef }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* ground glow */}
      <ellipse id="cf-glow-outer" cx="0" cy="8" rx="38" ry="18" fill="#f97316" opacity="0.18" />
      <ellipse id="cf-glow" cx="0" cy="4" rx="24" ry="14" fill="#f97316" opacity="0.28" />
      {/* logs */}
      <line x1="-22" y1="8" x2="22" y2="2" stroke="#5a3010" strokeWidth="6" strokeLinecap="round" />
      <line x1="-18" y1="2" x2="18" y2="8" stroke="#4a2808" strokeWidth="6" strokeLinecap="round" />
      <line x1="-10" y1="5" x2="10" y2="5" stroke="#3a1f08" strokeWidth="5" strokeLinecap="round" />
      {/* ember glow */}
      <ellipse cx="0" cy="6" rx="14" ry="6" fill="#f59e0b" opacity="0.5" />
      {/* flame group — animated via JS */}
      <g id="cf-flame">
        {/* outer flame */}
        <path d="M0 6 Q-10 -8 -5 -22 Q0 -34 0 -28 Q3 -34 7 -22 Q10 -8 0 6 Z"
          fill="#f97316" opacity="0.85" />
        {/* mid flame */}
        <path d="M0 6 Q-5 -4 -2 -14 Q0 -20 0 -16 Q2 -20 4 -14 Q5 -4 0 6 Z"
          fill="#fbbf24" opacity="0.9" />
        {/* inner core */}
        <path d="M0 5 Q-2 0 0 -7 Q2 0 0 5 Z" fill="#fef08a" opacity="0.95" />
        {/* spark particles */}
        <circle cx="-6" cy="-26" r="1.2" fill="#fbbf24" opacity="0.7" />
        <circle cx="5" cy="-24" r="1" fill="#fef08a" opacity="0.6" />
        <circle cx="0" cy="-32" r="0.8" fill="#fef08a" opacity="0.5" />
        <circle cx="-3" cy="-30" r="0.7" fill="#fbbf24" opacity="0.4" />
      </g>
    </g>
  );
}

// ─── Full-width forest silhouette ────────────────────────────────────
// Renders a dense row of pine trees across the entire bottom edge.
// Trees vary in height and spacing for a natural look.
const FOREST_TREES = [
  // [cx, treeH, trunkH, layers] — all in a 1000×220 viewBox
  [0,   160, 55, 5], [28,  130, 45, 4], [52,  175, 60, 5], [78,  145, 50, 4],
  [102, 190, 65, 6], [130, 155, 52, 5], [155, 170, 58, 5], [178, 135, 46, 4],
  [200, 185, 63, 6], [225, 150, 51, 5], [248, 165, 56, 5], [270, 140, 48, 4],
  [292, 180, 62, 6], [318, 155, 53, 5], [342, 170, 58, 5], [365, 145, 50, 4],
  [388, 188, 64, 6], [412, 158, 54, 5], [435, 172, 59, 5], [458, 148, 51, 4],
  [480, 182, 62, 6], [505, 152, 52, 5], [528, 168, 57, 5], [550, 138, 47, 4],
  [572, 185, 63, 6], [598, 155, 53, 5], [622, 172, 59, 5], [645, 148, 51, 4],
  [668, 180, 61, 6], [692, 150, 51, 5], [715, 165, 56, 5], [738, 140, 48, 4],
  [760, 185, 63, 6], [785, 155, 53, 5], [808, 170, 58, 5], [830, 145, 50, 4],
  [852, 188, 64, 6], [876, 158, 54, 5], [900, 172, 59, 5], [922, 148, 51, 4],
  [944, 182, 62, 6], [968, 152, 52, 5], [990, 168, 57, 5], [1010,138, 47, 4],
];

function ForestSilhouette() {
  const VW = 1000; const VH = 220;
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "22vh", zIndex: 8 }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        {/* ground fill */}
        <rect x="0" y={VH - 30} width={VW} height="30" fill="#050a05" />
        {FOREST_TREES.map(([cx, treeH, trunkH, layers], i) => {
          const base = VH - 28;
          const trunkTop = base - trunkH;
          const treeTop = base - treeH;
          const treeWidth = treeH * 0.55;
          const dark = i % 3 === 0 ? "#060e06" : i % 3 === 1 ? "#081408" : "#0a1a0a";
          const mid  = i % 2 === 0 ? "#0d1e0d" : "#0a1608";
          return (
            <g key={i}>
              {/* trunk */}
              <rect
                x={cx - 3} y={trunkTop} width={6} height={trunkH}
                fill={dark}
              />
              {/* layered pine tiers from bottom to top */}
              {Array.from({ length: layers }).map((_, li) => {
                const t = li / (layers - 1);
                const tierY = treeTop + t * (trunkTop - treeTop) * 0.85;
                const tierW = treeWidth * (1 - t * 0.55);
                const tierH = (treeH / layers) * 1.3;
                return (
                  <polygon
                    key={li}
                    points={`${cx},${tierY} ${cx - tierW / 2},${tierY + tierH} ${cx + tierW / 2},${tierY + tierH}`}
                    fill={li % 2 === 0 ? dark : mid}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main CampfireScene ──────────────────────────────────────────────
export default function CampfireScene() {
  const svgRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  const fireflies = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 15 + Math.random() * 35,
    y: 30 + Math.random() * 40,
    phase: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.35,
  })), []);

  useEffect(() => {
    let last = 0;
    const tick = (time) => {
      const dt = (time - last) / 1000; last = time;
      timeRef.current += dt;
      const t = timeRef.current;
      const svg = svgRef.current;
      if (!svg) { frameRef.current = requestAnimationFrame(tick); return; }

      // Flame flicker
      const flame = svg.querySelector("#cf-flame");
      if (flame) {
        const fx = Math.sin(t * 7) * 1.8 + Math.sin(t * 13) * 0.9;
        const fy = Math.sin(t * 9) * 1.2;
        const fs = 0.92 + Math.sin(t * 11) * 0.08;
        flame.setAttribute("transform", `translate(${fx},${fy}) scale(1,${fs})`);
      }

      // Glow pulse
      const glow = svg.querySelector("#cf-glow");
      if (glow) glow.setAttribute("opacity", String(0.22 + Math.sin(t * 2.2) * 0.1));
      const glowO = svg.querySelector("#cf-glow-outer");
      if (glowO) glowO.setAttribute("opacity", String(0.12 + Math.sin(t * 1.8) * 0.06));

      // Bob gentle sway (head tilt looking at fire)
      const bob = svg.querySelector("#cf-bob-group");
      if (bob) {
        const sway = Math.sin(t * 0.9) * 1.2;
        const breathe = Math.sin(t * 1.4) * 0.5;
        bob.setAttribute("transform", `translate(0,${breathe}) rotate(${sway}, 115, 200)`);
      }

      // Fireflies
      const ffGroup = svg.querySelector("#cf-fireflies");
      if (ffGroup) {
        const circles = ffGroup.querySelectorAll("circle");
        circles.forEach((c, i) => {
          const f = fireflies[i];
          if (!f) return;
          c.setAttribute("cx", String(f.x + Math.cos(t * f.speed + f.phase) * 4));
          c.setAttribute("cy", String(f.y + Math.sin(t * f.speed * 0.8 + f.phase) * 5));
          c.setAttribute("opacity", String(Math.max(0, 0.3 + Math.sin(t * 1.8 + f.phase) * 0.35)));
        });
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fireflies]);

  // The campsite SVG sits in the bottom-left quadrant.
  // viewBox is 500×300, scene elements placed in left ~60%.
  return (
    <>
      {/* Full-width forest across entire bottom */}
      <ForestSilhouette />

      {/* Campsite scene — bottom-left */}
      <div
        className="absolute pointer-events-none"
        style={{ bottom: "18vh", left: "2vw", width: "min(480px, 48vw)", zIndex: 10 }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 480 320"
          fill="none"
          className="w-full h-auto"
        >
          {/* ── Ground patch ── */}
          <ellipse cx="200" cy="305" rx="195" ry="18" fill="#0a1208" opacity="0.8" />

          {/* ── Tent (behind Bob, larger) ── */}
          <g transform="translate(220, 148) scale(1.05)">
            <ChibiTent x={0} y={0} scale={1} />
          </g>

          {/* ── Campfire ── */}
          <Campfire x={175} y={258} scale={1.1} />

          {/* ── Bob (chibi, sitting on log, left of fire) ── */}
          <g id="cf-bob-group">
            <ChibiBob x={18} y={148} scale={1.0} fireGlow={true} />
          </g>

          {/* ── Fireflies ── */}
          <g id="cf-fireflies">
            {fireflies.map((f) => (
              <circle key={f.id} cx={f.x} cy={f.y} r="1.8" fill="#fef08a" opacity="0.4" />
            ))}
          </g>

          {/* ── Smoke wisps ── */}
          <g opacity="0.18">
            <path d="M175 220 Q170 200 178 185 Q182 175 176 165" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M178 218 Q185 198 180 183 Q177 173 183 162" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </>
  );
}
