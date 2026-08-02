import { useRef, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CampfireScene
//
// Layout (all in a 900×500 SVG viewBox):
//   • Dense diverse forest fills the ENTIRE back layer (z-order: drawn first)
//   • Glowing yellow tent (middle-left, behind Bob)
//   • Log Bob sits on
//   • Campfire (bigger, to Bob's right)
//   • Chibi Bob sitting on log, facing fire, then tilts head up
//
// Bob style — exactly matching the reference sheet:
//   • Very large round head (no face lines, just two small dot eyes + tiny mouth)
//   • Short stubby body — NO separate neck line, head sits directly on body
//   • Limbs are THICK FILLED ROUNDED SHAPES, not lines
//   • No joints visible — smooth continuous silhouette
//   • Sitting pose: body upright, legs folded in front, arms resting on knees
// ─────────────────────────────────────────────────────────────────────────────

// Bob's head tilt angle is driven by the parent via a prop (0 = looking at fire, -30 = looking up)
export default function CampfireScene({ lookUp = false }) {
  const svgRef   = useRef(null);
  const frameRef = useRef(null);
  const timeRef  = useRef(0);
  const headTiltRef = useRef(0); // current animated tilt angle

  const fireflies = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 80 + Math.random() * 200,
    y: 60 + Math.random() * 120,
    phase: Math.random() * Math.PI * 2,
    speed: 0.2 + Math.random() * 0.3,
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

      // ── Flame flicker ──
      const flame = svg.querySelector("#flame-group");
      if (flame) {
        const sx = 1 + Math.sin(t * 11) * 0.06;
        const sy = 1 + Math.sin(t * 8)  * 0.09;
        const tx = Math.sin(t * 7) * 2;
        flame.setAttribute("transform", `translate(${tx},0) scale(${sx},${sy})`);
      }

      // ── Fire glow pulse ──
      const glow = svg.querySelector("#fire-glow");
      if (glow) {
        const op = 0.55 + Math.sin(t * 2.1) * 0.18;
        glow.setAttribute("opacity", String(op));
      }
      const glowBig = svg.querySelector("#fire-glow-big");
      if (glowBig) {
        const op = 0.22 + Math.sin(t * 1.7) * 0.08;
        glowBig.setAttribute("opacity", String(op));
      }

      // ── Tent glow pulse ──
      const tentGlow = svg.querySelector("#tent-glow");
      if (tentGlow) {
        const op = 0.55 + Math.sin(t * 1.3 + 1) * 0.2;
        tentGlow.setAttribute("opacity", String(op));
      }

      // ── Bob head tilt animation ──
      const targetTilt = lookUp ? -38 : 18; // 18 = looking slightly down at fire
      headTiltRef.current += (targetTilt - headTiltRef.current) * Math.min(dt * 1.8, 1);
      const bobHead = svg.querySelector("#bob-head-group");
      if (bobHead) {
        // Rotate head around neck attachment point (cx=310, cy=310)
        bobHead.setAttribute("transform", `rotate(${headTiltRef.current}, 310, 310)`);
      }

      // ── Bob body gentle breathe ──
      const bobBody = svg.querySelector("#bob-body-group");
      if (bobBody) {
        const breathe = Math.sin(t * 1.2) * 1.5;
        bobBody.setAttribute("transform", `translate(0, ${breathe})`);
      }

      // ── Fireflies ──
      const ffg = svg.querySelector("#fireflies");
      if (ffg) {
        const circles = ffg.querySelectorAll("circle");
        circles.forEach((c, i) => {
          const f = fireflies[i]; if (!f) return;
          c.setAttribute("cx", String(f.x + Math.cos(t * f.speed + f.phase) * 6));
          c.setAttribute("cy", String(f.y + Math.sin(t * f.speed * 0.7 + f.phase) * 8));
          c.setAttribute("opacity", String(Math.max(0, 0.25 + Math.sin(t * 1.6 + f.phase) * 0.4)));
        });
      }

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fireflies, lookUp]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 900 500"
        preserveAspectRatio="xMidYMax meet"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "75vh" }}
        fill="none"
      >
        {/* ══════════════════════════════════════════════════════════
            LAYER 1 — FOREST (drawn first = behind everything)
            Diverse trees: tall pines, short round pines, wide pines,
            dead trees, layered at different depths/sizes/shades.
        ══════════════════════════════════════════════════════════ */}
        <g id="forest">
          {/* ── Far background trees (darkest, smallest) ── */}
          {[
            [30,  320, 90,  3, "#040804"],
            [80,  290, 110, 4, "#050a05"],
            [140, 310, 95,  3, "#040804"],
            [195, 280, 120, 4, "#050a05"],
            [255, 300, 100, 3, "#040804"],
            [310, 270, 130, 5, "#060c06"],
            [370, 295, 105, 3, "#040804"],
            [430, 265, 140, 5, "#060c06"],
            [490, 285, 115, 4, "#050a05"],
            [550, 275, 125, 4, "#060c06"],
            [610, 290, 108, 3, "#040804"],
            [665, 260, 145, 5, "#060c06"],
            [720, 280, 120, 4, "#050a05"],
            [775, 295, 102, 3, "#040804"],
            [830, 270, 132, 5, "#060c06"],
            [880, 285, 115, 4, "#050a05"],
          ].map(([cx, base, h, layers, col], i) => (
            <PineTree key={"bg"+i} cx={cx} base={base} h={h} layers={layers} col={col} wFactor={0.5} />
          ))}

          {/* ── Mid trees (medium size, varied shapes) ── */}
          {[
            [15,  370, 130, 4, "#060e06"],
            [65,  355, 150, 5, "#081208"],
            [120, 365, 138, 4, "#060e06"],
            [175, 345, 165, 6, "#0a1a0a"],
            [235, 360, 142, 4, "#081208"],
            [290, 340, 175, 6, "#0a1a0a"],
            [350, 355, 148, 5, "#060e06"],
            [410, 335, 180, 6, "#0a1a0a"],
            [470, 350, 155, 5, "#081208"],
            [530, 342, 168, 5, "#0a1a0a"],
            [590, 358, 140, 4, "#060e06"],
            [645, 330, 185, 6, "#0a1a0a"],
            [700, 348, 158, 5, "#081208"],
            [755, 338, 172, 5, "#0a1a0a"],
            [810, 355, 145, 4, "#060e06"],
            [860, 332, 178, 6, "#0a1a0a"],
            [900, 350, 152, 5, "#081208"],
          ].map(([cx, base, h, layers, col], i) => (
            <PineTree key={"mid"+i} cx={cx} base={base} h={h} layers={layers} col={col} wFactor={0.58} />
          ))}

          {/* ── Round/bushy trees (variety) ── */}
          {[
            [50,  400, "#070f07"],
            [160, 390, "#090d09"],
            [320, 395, "#070f07"],
            [480, 388, "#090d09"],
            [640, 392, "#070f07"],
            [800, 385, "#090d09"],
          ].map(([cx, base, col], i) => (
            <RoundTree key={"round"+i} cx={cx} base={base} col={col} />
          ))}

          {/* ── Foreground trees (tallest, left & right flanks) ── */}
          {[
            [0,   430, 200, 7, "#0a1a0a"],
            [45,  420, 185, 6, "#081208"],
            [100, 435, 195, 7, "#0a1a0a"],
            // right flank — leave center-left open for campsite
            [560, 440, 190, 6, "#081208"],
            [615, 425, 205, 7, "#0a1a0a"],
            [670, 438, 188, 6, "#081208"],
            [725, 422, 210, 7, "#0a1a0a"],
            [780, 435, 195, 6, "#081208"],
            [835, 420, 208, 7, "#0a1a0a"],
            [885, 432, 192, 6, "#081208"],
          ].map(([cx, base, h, layers, col], i) => (
            <PineTree key={"fg"+i} cx={cx} base={base} h={h} layers={layers} col={col} wFactor={0.65} />
          ))}
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 2 — GROUND
        ══════════════════════════════════════════════════════════ */}
        <ellipse cx="450" cy="490" rx="450" ry="22" fill="#060c06" />
        <rect x="0" y="478" width="900" height="22" fill="#050a05" />

        {/* ══════════════════════════════════════════════════════════
            LAYER 3 — TENT (yellow, glowing, behind Bob)
            Big A-frame tent, warm yellow canvas, bright interior glow
        ══════════════════════════════════════════════════════════ */}
        <g id="tent" transform="translate(340, 290)">
          {/* Tent glow halo behind */}
          <ellipse cx="90" cy="185" rx="110" ry="30" fill="#fbbf24" opacity="0.18" />
          {/* Main tent body */}
          <path d="M0 190 L90 0 L180 190 Z" fill="#d97706" stroke="#92400e" strokeWidth="3" strokeLinejoin="round" />
          {/* Right panel shading */}
          <path d="M90 0 L135 190 L180 190 Z" fill="#b45309" />
          {/* Left panel highlight */}
          <path d="M90 0 L45 190 L0 190 Z" fill="#f59e0b" opacity="0.6" />
          {/* Door arch */}
          <path d="M62 190 Q90 130 118 190 Z" fill="#78350f" />
          {/* Interior glow through door */}
          <path id="tent-glow" d="M65 190 Q90 135 115 190 Z" fill="#fef08a" opacity="0.55" />
          {/* Tent ridge line */}
          <line x1="90" y1="0" x2="90" y2="190" stroke="#fbbf24" strokeWidth="1.5" opacity="0.4" />
          {/* Guy ropes */}
          <line x1="90" y1="5" x2="-20" y2="90" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          <line x1="90" y1="5" x2="200" y2="90" stroke="#d97706" strokeWidth="1.2" opacity="0.5" />
          {/* Stakes */}
          <line x1="-20" y1="90" x2="-16" y2="108" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="200" y1="90" x2="196" y2="108" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Warm glow spill on ground */}
          <ellipse cx="90" cy="192" rx="55" ry="10" fill="#fbbf24" opacity="0.2" />
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 4 — LOG Bob sits on
        ══════════════════════════════════════════════════════════ */}
        <g transform="translate(155, 400)">
          {/* Log shadow */}
          <ellipse cx="75" cy="52" rx="78" ry="12" fill="#020402" opacity="0.5" />
          {/* Log body */}
          <rect x="0" y="20" width="150" height="32" rx="16" fill="#3d1f0a" stroke="#5c3010" strokeWidth="2" />
          {/* Log top face */}
          <rect x="2" y="20" width="146" height="14" rx="14" fill="#4e2810" />
          {/* Bark grain lines */}
          <line x1="25"  y1="22" x2="25"  y2="50" stroke="#2a1206" strokeWidth="1" opacity="0.5" />
          <line x1="55"  y1="22" x2="55"  y2="50" stroke="#2a1206" strokeWidth="1" opacity="0.4" />
          <line x1="85"  y1="22" x2="85"  y2="50" stroke="#2a1206" strokeWidth="1" opacity="0.5" />
          <line x1="115" y1="22" x2="115" y2="50" stroke="#2a1206" strokeWidth="1" opacity="0.4" />
          {/* End grain circles */}
          <ellipse cx="8"   cy="36" rx="7" ry="14" fill="#3d1f0a" stroke="#5c3010" strokeWidth="1.5" />
          <ellipse cx="142" cy="36" rx="7" ry="14" fill="#3d1f0a" stroke="#5c3010" strokeWidth="1.5" />
          <ellipse cx="8"   cy="36" rx="4" ry="9"  fill="#2a1206" opacity="0.6" />
          <ellipse cx="142" cy="36" rx="4" ry="9"  fill="#2a1206" opacity="0.6" />
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 5 — CAMPFIRE (bigger)
        ══════════════════════════════════════════════════════════ */}
        <g transform="translate(370, 390)">
          {/* Big ground glow */}
          <ellipse id="fire-glow-big" cx="0" cy="20" rx="80" ry="35" fill="#f97316" opacity="0.22" />
          {/* Inner glow */}
          <ellipse id="fire-glow" cx="0" cy="10" rx="45" ry="25" fill="#fbbf24" opacity="0.55" />
          {/* Logs */}
          <line x1="-38" y1="18" x2="38"  y2="8"  stroke="#5a3010" strokeWidth="10" strokeLinecap="round" />
          <line x1="-32" y1="8"  x2="32"  y2="18" stroke="#4a2808" strokeWidth="10" strokeLinecap="round" />
          <line x1="-20" y1="13" x2="20"  y2="13" stroke="#3a1f08" strokeWidth="8"  strokeLinecap="round" />
          {/* Ember bed */}
          <ellipse cx="0" cy="14" rx="22" ry="9" fill="#f59e0b" opacity="0.6" />
          <ellipse cx="0" cy="14" rx="14" ry="5" fill="#fef08a" opacity="0.4" />
          {/* Flame */}
          <g id="flame-group" style={{ transformOrigin: "0px 10px" }}>
            {/* Outer flame — orange */}
            <path d="M0 12 C-18 -5 -12 -35 -4 -50 C0 -60 0 -52 0 -45 C0 -52 4 -60 8 -50 C16 -35 18 -5 0 12Z"
              fill="#f97316" opacity="0.9" />
            {/* Mid flame — amber */}
            <path d="M0 10 C-10 -2 -7 -25 -2 -36 C0 -42 0 -36 0 -30 C0 -36 2 -42 4 -36 C9 -25 10 -2 0 10Z"
              fill="#fbbf24" opacity="0.95" />
            {/* Inner core — yellow-white */}
            <path d="M0 8 C-4 0 -3 -14 0 -20 C3 -14 4 0 0 8Z"
              fill="#fef9c3" opacity="1" />
            {/* Sparks */}
            <circle cx="-10" cy="-48" r="2"   fill="#fbbf24" opacity="0.8" />
            <circle cx="8"   cy="-44" r="1.5" fill="#fef08a" opacity="0.7" />
            <circle cx="-2"  cy="-58" r="1.2" fill="#fef9c3" opacity="0.6" />
            <circle cx="14"  cy="-38" r="1"   fill="#fbbf24" opacity="0.5" />
            <circle cx="-14" cy="-40" r="1"   fill="#fbbf24" opacity="0.5" />
          </g>
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 6 — CHIBI BOB
            Sitting on log, facing right (toward fire).
            Style: reference sheet — big round head, NO visible joints,
            thick filled rounded limbs, tiny dot eyes, small mouth.
            Head tilts up when lookUp=true.
        ══════════════════════════════════════════════════════════ */}
        <g id="bob-body-group" transform="translate(0,0)">
          {/* ── Legs (sitting, folded forward) ── */}
          {/* Left leg — thick rounded pill shape */}
          <path d="M268 418 Q252 430 248 445 Q246 455 258 458 Q270 460 276 448 Q282 435 280 420 Z"
            fill="white" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Left foot */}
          <ellipse cx="254" cy="454" rx="14" ry="8" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* Right leg */}
          <path d="M318 418 Q334 430 338 445 Q340 455 328 458 Q316 460 310 448 Q304 435 306 420 Z"
            fill="white" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Right foot */}
          <ellipse cx="332" cy="454" rx="14" ry="8" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* ── Body — short wide rounded rectangle ── */}
          <rect x="252" y="355" width="82" height="68" rx="22" ry="22"
            fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* ── Left arm (resting on left knee, pointing down-left) ── */}
          <path d="M258 375 Q240 392 236 410 Q234 420 244 422 Q254 424 260 412 Q266 398 268 380 Z"
            fill="white" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Left hand — round blob */}
          <circle cx="240" cy="418" r="10" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* ── Right arm (resting on right knee) ── */}
          <path d="M328 375 Q346 392 350 410 Q352 420 342 422 Q332 424 326 412 Q320 398 318 380 Z"
            fill="white" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Right hand */}
          <circle cx="346" cy="418" r="10" fill="white" stroke="#1a1a1a" strokeWidth="2.5" />

          {/* ── Head group (rotates for look-up animation) ── */}
          <g id="bob-head-group" transform="rotate(18, 310, 310)">
            {/* Big round chibi head */}
            <circle cx="293" cy="310" r="52" fill="white" stroke="#1a1a1a" strokeWidth="2.8" />
            {/* Cheek blush — soft pink ovals */}
            <ellipse cx="258" cy="322" rx="11" ry="8" fill="#ffb3b3" opacity="0.5" />
            <ellipse cx="328" cy="322" rx="11" ry="8" fill="#ffb3b3" opacity="0.5" />
            {/* Eyes — two small filled dots, no lines */}
            <circle cx="278" cy="308" r="5" fill="#1a1a1a" />
            <circle cx="308" cy="308" r="5" fill="#1a1a1a" />
            {/* Eye shine — tiny white dot top-right of each eye */}
            <circle cx="281" cy="305" r="2" fill="white" />
            <circle cx="311" cy="305" r="2" fill="white" />
            {/* Mouth — tiny happy arc, no lines */}
            <path d="M281 324 Q293 333 305 324"
              fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
            {/* Hair — two small curved tufts on top, no straight lines */}
            <path d="M272 262 Q293 250 314 262"
              fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M283 257 Q293 248 303 257"
              fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 7 — FIREFLIES
        ══════════════════════════════════════════════════════════ */}
        <g id="fireflies">
          {fireflies.map((f) => (
            <circle key={f.id} cx={f.x} cy={f.y} r="2.2" fill="#fef08a" opacity="0.3" />
          ))}
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 8 — SMOKE WISPS above fire
        ══════════════════════════════════════════════════════════ */}
        <g opacity="0.15">
          <path d="M368 340 Q362 315 372 298 Q378 285 370 272"
            fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M374 338 Q382 312 376 295 Q372 282 380 268"
            fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M380 336 Q390 310 384 293 Q380 280 388 265"
            fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* ══════════════════════════════════════════════════════════
            LAYER 9 — CAMPFIRE LIGHT SPILL on ground
        ══════════════════════════════════════════════════════════ */}
        <ellipse cx="370" cy="488" rx="160" ry="18" fill="#f97316" opacity="0.08" />
      </svg>
    </div>
  );
}

// ─── Pine tree helper ────────────────────────────────────────────────────────
function PineTree({ cx, base, h, layers, col, wFactor = 0.6 }) {
  const trunkH = h * 0.28;
  const trunkTop = base - trunkH;
  const treeTop  = base - h;
  const maxW = h * wFactor;
  const alt = col === "#0a1a0a" ? "#0d220d" : col === "#081208" ? "#0a1a0a" : "#081208";

  return (
    <g>
      <rect x={cx - 3} y={trunkTop} width={6} height={trunkH} fill={col} />
      {Array.from({ length: layers }).map((_, li) => {
        const t   = li / (layers - 1);
        const y   = treeTop + t * (trunkTop - treeTop) * 0.88;
        const w   = maxW * (1 - t * 0.52);
        const th  = (h / layers) * 1.35;
        return (
          <polygon
            key={li}
            points={`${cx},${y} ${cx - w/2},${y + th} ${cx + w/2},${y + th}`}
            fill={li % 2 === 0 ? col : alt}
          />
        );
      })}
    </g>
  );
}

// ─── Round/bushy tree helper ─────────────────────────────────────────────────
function RoundTree({ cx, base, col }) {
  return (
    <g>
      <rect x={cx - 4} y={base - 55} width={8} height={55} fill={col} />
      <circle cx={cx}      cy={base - 75} r={38} fill={col} />
      <circle cx={cx - 18} cy={base - 65} r={28} fill={col} />
      <circle cx={cx + 18} cy={base - 65} r={28} fill={col} />
      <circle cx={cx}      cy={base - 95} r={25} fill={col} />
    </g>
  );
}
