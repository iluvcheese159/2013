import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import IntroBob from "@/components/IntroBob";
import CampfireScene from "@/components/CampfireScene";

export const markIntroSeen = () => {
  try { localStorage.setItem("pf_intro_seen", "1"); } catch (_e) {}
};

// ====================================================================
// Canvas Star Field — renders directly to canvas for crisp pinpoints
// ====================================================================

function generateMilkyWayStars(count, seed) {
  const stars = [];
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const milkyWayAngle = Math.PI / 4;
  const milkyWayWidth = 0.28;

  for (let i = 0; i < count; i++) {
    let x, y;
    const inMilkyWay = r() < 0.4;
    if (inMilkyWay) {
      const bandPos = r();
      const bandOffset = (r() - 0.5) * milkyWayWidth;
      x = (bandPos + bandOffset * Math.cos(milkyWayAngle + Math.PI / 2)) * 100;
      y = (bandPos + bandOffset * Math.sin(milkyWayAngle + Math.PI / 2)) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
    } else {
      x = r() * 100;
      y = r() * 100;
    }
    const size = 0.4 + Math.pow(r(), 2.5) * 1.8;
    const opacity = 0.4 + r() * 0.6;
    const cr = r();
    // Rich stellar palette: O/B blue-white, A white, F yellow-white, G yellow, K orange, M red
    const color = cr < 0.28 ? [200, 220, 255]   // O/B: blue-white
                : cr < 0.50 ? [240, 245, 255]   // A: white-blue
                : cr < 0.65 ? [255, 255, 255]   // A: pure white
                : cr < 0.75 ? [255, 253, 220]   // F: yellow-white
                : cr < 0.83 ? [255, 244, 180]   // G: pale yellow
                : cr < 0.90 ? [255, 220, 140]   // K: orange
                : cr < 0.95 ? [255, 190, 100]   // K: deep orange
                : cr < 0.98 ? [255, 160, 80]    // M: red-orange
                :              [255, 130, 100];  // M: red
    stars.push({ x, y, size, opacity, color, inMilkyWay,
      twinkleSpeed: 1.5 + r() * 5, twinklePhase: r() * Math.PI * 2 });
  }
  return stars;
}

function StarCanvas({ stars }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      // Render the backing store at up to 1.5× DPR so the field stays crisp
      // when CSS-zoomed, without paying a full 2× fill cost every frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (timestamp) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = timestamp;
      timeRef.current += dt;
      const t = timeRef.current;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Milky Way band: diagonal bottom-left → upper-right ──
      const mw1 = ctx.createLinearGradient(0, H, W * 0.9, 0);
      mw1.addColorStop(0,    "rgba(0,0,0,0)");
      mw1.addColorStop(0.18, "rgba(30,25,70,0.10)");
      mw1.addColorStop(0.35, "rgba(80,65,160,0.20)");
      mw1.addColorStop(0.50, "rgba(140,120,220,0.28)");
      mw1.addColorStop(0.62, "rgba(170,150,255,0.22)");
      mw1.addColorStop(0.75, "rgba(90,75,150,0.14)");
      mw1.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = mw1;
      ctx.fillRect(0, 0, W, H);

      // Galactic core — warm amber/gold bulge
      const coreX = W * 0.54;
      const coreY = H * 0.30;
      const core = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, W * 0.32);
      core.addColorStop(0,    "rgba(255,210,120,0.22)");
      core.addColorStop(0.20, "rgba(240,170,80,0.16)");
      core.addColorStop(0.45, "rgba(200,130,60,0.09)");
      core.addColorStop(0.70, "rgba(120,80,40,0.04)");
      core.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);

      // Nebula tint — faint reddish emission nebula patch upper-left
      const neb = ctx.createRadialGradient(W*0.22, H*0.18, 0, W*0.22, H*0.18, W*0.18);
      neb.addColorStop(0,   "rgba(180,60,60,0.07)");
      neb.addColorStop(0.5, "rgba(140,40,80,0.04)");
      neb.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, W, H);

      // Blue reflection nebula patch upper-right
      const neb2 = ctx.createRadialGradient(W*0.78, H*0.12, 0, W*0.78, H*0.12, W*0.14);
      neb2.addColorStop(0,   "rgba(60,100,200,0.08)");
      neb2.addColorStop(0.5, "rgba(40,70,160,0.04)");
      neb2.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, W, H);

      // Dense dust lane — slightly brighter star density along core
      const band = ctx.createLinearGradient(0, H, W * 0.9, 0);
      band.addColorStop(0,    "rgba(0,0,0,0)");
      band.addColorStop(0.42, "rgba(255,255,255,0.03)");
      band.addColorStop(0.52, "rgba(255,255,255,0.08)");
      band.addColorStop(0.60, "rgba(255,255,255,0.03)");
      band.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = 0.6 + 0.4 * Math.sin(t / s.twinkleSpeed + s.twinklePhase);
        const alpha = s.opacity * twinkle;
        const px = (s.x / 100) * W;
        const py = (s.y / 100) * H;
        const [r, g, b] = s.color;

        ctx.beginPath();
        ctx.arc(px, py, s.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Soft glow for brighter stars only
        if (s.size > 1.2) {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, s.size * 2.5);
          grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.4})`);
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(px, py, s.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

// ====================================================================
// Benefits / Facets Configuration
// ====================================================================

// warm-white for most, faint red tint for a couple
const FACETS = [
  { id: "browse",     label: "Browse",            color: "#ffffff", title: "Discover Unique Prints",      text: "Explore a curated marketplace of thousands of 3D-printed creations from independent makers worldwide. Filter by category, material, print time, and more. Every print tells a story — find yours.",                                                                                                                                          starColor: { r: 255, g: 255, b: 255 } },
  { id: "design",     label: "Design Workshop",    color: "#fff5f5", title: "Create in Your Browser",      text: "Design, edit, and prepare 3D models for printing directly in your browser — no software installation needed. Supports STL, OBJ, 3MF, and more. From concept to print in minutes.",                                                                                                                                                       starColor: { r: 255, g: 235, b: 225 } },
  { id: "sell",       label: "Sell Marketplace",   color: "#ffffff", title: "Launch Your Storefront",      text: "Become a maker-entrepreneur with just 3.5% fees. List your prints, set your prices, and ship worldwide. Our platform handles discovery, payments, and customer communication.",                                                                                                                                                          starColor: { r: 255, g: 255, b: 255 } },
  { id: "hyperspace", label: "Hyperspace",          color: "#ffe8e8", title: "Premium Subscription",        text: "Upgrade to Hyperspace for exclusive benefits: reduced 2% seller fees, priority customer support, advanced analytics dashboard, early access to new features, and a special Hyperspace badge on your profile.",                                                                                                                          starColor: { r: 255, g: 210, b: 200 } },
  { id: "community",  label: "Community",           color: "#ffffff", title: "Mission Control & Clubs",     text: "Join Mission Control forums to connect with fellow makers, share tips, and showcase your work. Create and join clubs, participate in design challenges, and collaborate on projects.",                                                                                                                                                  starColor: { r: 255, g: 255, b: 255 } },
  { id: "tools",      label: "Tools",               color: "#fff0ee", title: "Filament Calculator & More",  text: "Access powerful tools: calculate filament usage and costs, browse the print failure database for troubleshooting tips, compare materials and printers, and use our design validation tools.",                                                                                                                                          starColor: { r: 255, g: 225, b: 215 } },
];

// ====================================================================
// Sub-Components
// ====================================================================

/**
 * Star field background — canvas-rendered for crisp pinpoints at any DPR.
 */
function StarBackground({ stars }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#02040e" }}>
      <StarCanvas stars={stars} />
    </div>
  );
}

/**
 * Tree silhouettes at the bottom of the screen.
 */
function TreeSilhouettes({ opacity = 0.5 }) {
  // Dense pine forest spanning the full width of the screen — the arrays
  // intentionally overshoot past both edges (negative x and >100) so the
  // strip always covers edge-to-edge, with no gaps at any viewport size.
  // Each entry is [x, height] in a 0..100 × 0..60 viewBox.
  const back = [
    [-6,12],[-3,15],[1,13],[4,16],[7,12],[10,15],[13,17],[16,13],[19,15],[22,12],
    [25,16],[28,14],[31,17],[34,13],[37,15],[40,12],[43,16],[46,14],[49,17],[52,13],
    [55,15],[58,12],[61,16],[64,14],[67,17],[70,13],[73,15],[76,12],[79,16],[82,14],
    [85,17],[88,13],[91,15],[94,12],[97,16],[100,14],[103,17],[106,13],
  ];
  const mid = [
    [-7,18],[-3,20],[1,17],[4,21],[7,18],[10,20],[13,17],[16,21],[19,18],[22,20],
    [25,17],[28,21],[31,18],[34,20],[37,17],[40,21],[43,18],[46,20],[49,17],[52,21],
    [55,18],[58,20],[61,17],[64,21],[67,18],[70,20],[73,17],[76,21],[79,18],[82,20],
    [85,17],[88,21],[91,18],[94,20],[97,17],[100,21],[103,18],[106,20],
  ];
  const front = [
    [-8,26],[-4,28],[0,25],[3,29],[6,26],[9,28],[12,25],[15,29],[18,26],[21,28],
    [24,25],[27,29],[30,26],[33,28],[36,25],[39,29],[42,26],[45,28],[48,25],[51,29],
    [54,26],[57,28],[60,25],[63,29],[66,26],[69,28],[72,25],[75,29],[78,26],[81,28],
    [84,25],[87,29],[90,26],[93,28],[96,25],[99,29],[102,26],[105,28],
  ];
  const Pine = ({ x, h, col, w = 0.44 }) => (
    <polygon points={`${x},${60 - h} ${x - h * w},60 ${x + h * w},60`} fill={col} />
  );
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-10" style={{ height: "45vh", opacity }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", verticalAlign: "bottom" }}>
        {back.map(([x, h], i)  => <Pine key={"b"+i} x={x} h={h} col="#020602" />)}
        {mid.map(([x, h], i)   => <Pine key={"m"+i} x={x} h={h} col="#030803" />)}
        {front.map(([x, h], i) => <Pine key={"f"+i} x={x} h={h} col="#040a04" />)}
        {/* Grass edge */}
        <rect x="-15" y="50" width="130" height="4" fill="#1a2e0e" />
        {/* Brown earth ground */}
        <rect x="-15" y="52" width="130" height="8" fill="#2a1a0a" />
        {/* Solid ground fill to screen edge */}
        <rect x="-15" y="57" width="130" height="3" fill="#2a1a0a" />
      </svg>
    </div>
  );
}

function LayeredPine({ cx, base, h, layers, col, w = 0.5, trunkWidth = 1.8, trunkColor = "#241408" }) {
  const alt = col === "#040a04" ? "#061006" : "#040a04";
  const trunkH = h * 0.2;
  return (
    <g>
      <rect x={cx - trunkWidth / 2} y={base - trunkH} width={trunkWidth} height={trunkH} fill={trunkColor} />
      {Array.from({ length: layers }).map((_, index) => {
        const t = layers === 1 ? 0 : index / (layers - 1);
        const y = base - h + t * h * 0.74;
        const width = h * w * (1 - t * 0.42);
        const height = Math.max(h / layers, 6) * 1.28;
        return (
          <polygon
            key={index}
            points={`${cx},${y} ${cx - width / 2},${y + height} ${cx + width / 2},${y + height}`}
            fill={index % 2 === 0 ? col : alt}
          />
        );
      })}
    </g>
  );
}

function CoverForestPass() {
  const farPines = [
    [8, 64, 24, 3, "#020602", 0.54],
    [20, 61, 28, 4, "#030803", 0.56],
    [33, 63, 25, 3, "#020602", 0.54],
    [46, 60, 29, 4, "#030803", 0.58],
    [59, 62, 24, 3, "#020602", 0.54],
    [72, 59, 28, 4, "#030803", 0.58],
    [84, 63, 25, 3, "#020602", 0.54],
    [96, 61, 27, 4, "#030803", 0.58],
  ];
  const midPines = [
    [5, 82, 38, 4, "#030803", 0.66],
    [22, 80, 44, 5, "#040a04", 0.7],
    [39, 83, 40, 4, "#030803", 0.66],
    [77, 82, 42, 5, "#040a04", 0.7],
    [94, 81, 39, 4, "#030803", 0.66],
  ];

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="0" y="0" width="100" height="100" fill="#02040a" opacity="0.18" />
      {farPines.map(([cx, base, h, layers, col, w], index) => (
        <LayeredPine key={`far-${index}`} cx={cx} base={base} h={h} layers={layers} col={col} w={w} trunkWidth={0.9} />
      ))}
      {midPines.map(([cx, base, h, layers, col, w], index) => (
        <LayeredPine key={`mid-${index}`} cx={cx} base={base} h={h} layers={layers} col={col} w={w} trunkWidth={1.15} />
      ))}

      <LayeredPine cx={57} base={96} h={62} layers={5} col="#071007" w={0.82} trunkWidth={2.4} trunkColor="#2a1a0a" />

      <g opacity="0.96">
        <polygon points="-6,18 18,10 8,42 28,40 14,72 -6,68" fill="#061006" />
        <polygon points="-3,28 16,22 10,50 23,48 12,78 -3,74" fill="#081208" opacity="0.92" />
        <polygon points="82,14 104,8 94,38 106,34 100,72 80,62" fill="#061006" />
        <polygon points="86,24 102,20 95,46 104,44 98,80 84,70" fill="#081208" opacity="0.92" />
      </g>

      <rect x="0" y="90" width="100" height="3" fill="#1a2e0e" />
      <rect x="0" y="93" width="100" height="7" fill="#2a1a0a" />
    </svg>
  );
}

/**
 * A single interactive star — colored per facet's starColor.
 */
function ZoomStar({ facet, index, active, onClick, position }) {
  const { r, g, b } = facet.starColor;
  const isWarm = r > 250 && b < 240;
  return (
    <button
      className="absolute pointer-events-auto cursor-pointer z-20"
      style={{
        left: position.x + "%",
        top: position.y + "%",
        transform: "translate(-50%, -50%)",
        opacity: active ? 0.4 : 1,
        background: "none",
        border: "none",
        padding: "12px",
      }}
      onClick={onClick}
      title={facet.label}
    >
      <div
        className="rounded-full"
        style={{
          width: "4px",
          height: "4px",
          backgroundColor: isWarm ? `rgb(${r},${g},${b})` : "#ffffff",
          boxShadow: isWarm
            ? `0 0 6px 2px rgba(${r},${g},${b},0.9), 0 0 14px 5px rgba(${r},${g},${b},0.4)`
            : `0 0 6px 2px rgba(255,255,255,0.9), 0 0 14px 5px rgba(255,255,255,0.3)`,
          animation: "twinkle " + (2.5 + index * 0.4) + "s ease-in-out infinite",
          animationDelay: index * 0.3 + "s",
        }}
      />
    </button>
  );
}

/**
 * Benefit detail card — text centered inside the star halo.
 */
function BenefitCard({ facet, visible, zoomingOut }) {
  if (!facet) return null;
  const { r, g, b } = facet.starColor;
  const isWarm = b < 240;
  const show = visible && !zoomingOut;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
      style={{ opacity: show ? 1 : 0, transition: "opacity 0.5s ease" }}
    >
      {/* Dark vignette — makes text readable over the star field */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.88) 55%, rgba(0,0,0,0.97) 100%)",
      }} />
      {/* Halo glow — expands from pinpoint */}
      <div className="absolute" style={{
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: "580px", height: "580px",
        borderRadius: "50%",
        background: isWarm
          ? `radial-gradient(circle, rgba(${r},${g},${b},0.60) 0%, rgba(${r},${g},${b},0.28) 18%, rgba(${r},${g},${b},0.10) 45%, transparent 70%)`
          : `radial-gradient(circle, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.28) 18%, rgba(255,255,255,0.10) 45%, transparent 70%)`,
        animation: show ? "star-zoom-in 0.9s cubic-bezier(0.16,1,0.3,1) both" : "none",
        pointerEvents: "none",
      }} />
      {/* Bright core */}
      <div className="absolute rounded-full" style={{
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: "12px", height: "12px",
        backgroundColor: isWarm ? `rgb(${r},${g},${b})` : "#ffffff",
        boxShadow: isWarm
          ? `0 0 28px 12px rgba(${r},${g},${b},0.9), 0 0 90px 35px rgba(${r},${g},${b},0.35)`
          : `0 0 28px 12px rgba(255,255,255,0.9), 0 0 90px 35px rgba(255,255,255,0.3)`,
      }} />
      {/* Text */}
      <div key={facet.id} className="relative max-w-2xl mx-auto px-8 text-center"
        style={{ animation: show ? "text-crossfade-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both" : "none" }}
      >
        <div className="inline-block px-4 py-1.5 rounded-full mb-6 text-[10px] font-tech uppercase tracking-[0.3em]"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          {"✦ " + facet.label}
        </div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter leading-tight mb-6 text-white"
          style={{ textShadow: "0 0 40px rgba(255,255,255,0.35), 0 0 80px rgba(255,255,255,0.12)" }}
        >
          {facet.title}
        </h2>
        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-lg mx-auto">
          {facet.text}
        </p>
      </div>
    </div>
  );
}

/**
 * Final scene: UI emerges with logo and auth buttons.
 */
function FinalScene({ onGuest, onSignUp, visible }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-40"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 1.5s ease",
      }}
    >
      {/* Sidebar slide in */}
      <div
        className="fixed left-0 top-0 bottom-0 w-16 md:w-20 bg-background/90 backdrop-blur-xl border-r border-border z-50 flex flex-col items-center py-4"
        style={{
          animation: visible ? "slide-in-left 0.8s ease-out" : "none",
        }}
      >
        <div className="mb-6">
          <BrandLogo alt="Print Cosmos" className="h-[40px] w-auto max-w-[140px] object-contain" />
        </div>
        <div className="flex flex-col items-center gap-3 mt-4">
          {["Home", "Browse", "Design", "Community"].map((label, i) => (
            <div
              key={label}
              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center"
              style={{
                animation: visible ? `fade-in-up 0.5s ease-out ${0.3 + i * 0.1}s both` : "none",
              }}
            >
              <div className="w-4 h-4 rounded-sm bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Top bar slide in */}
      <div
        className="fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-xl border-b border-border z-40 flex items-center px-6"
        style={{
          animation: visible ? "slide-in-top 0.6s ease-out" : "none",
        }}
      >
        <div className="ml-auto flex items-center gap-3">
          <div
            className="w-20 h-8 rounded-xl border border-white/10"
            style={{ animation: visible ? "fade-in-up 0.5s ease-out 0.4s both" : "none" }}
          />
          <div
            className="w-24 h-8 rounded-xl bg-white/10"
            style={{ animation: visible ? "fade-in-up 0.5s ease-out 0.5s both" : "none" }}
          />
        </div>
      </div>

      {/* Center content */}
      <div
        className="flex flex-col items-center"
        style={{ animation: visible ? "fade-in-up 0.8s ease-out 0.3s both" : "none" }}
      >
        <div className="mb-6">
          <BrandLogo alt="Print Cosmos" className="h-20 md:h-24 w-auto object-contain" />
        </div>
        <p className="text-white/50 text-xs font-tech uppercase tracking-[0.4em] mb-10">
          Design. Print. Sell.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            onClick={onGuest}
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-tech text-xs uppercase tracking-wider backdrop-blur-sm px-8"
            data-testid="continue-guest-btn"
          >
            Continue as Guest
          </Button>
          <Button
            onClick={onSignUp}
            size="lg"
            className="bg-white text-black hover:bg-white/90 rounded-xl font-tech text-xs uppercase tracking-wider px-8"
            data-testid="signup-btn"
          >
            Sign Up / Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Bob introduction overlay - appears after sign up/sign in.
 */
function BobIntroOverlay({ visible, onDismiss }) {
  const [speechIndex, setSpeechIndex] = useState(0);
  const speeches = [
    "Welcome to Print Cosmos! I'm Bob, your guide.",
    "Explore thousands of 3D prints from makers worldwide.",
    "Design your own models right in your browser.",
    "Sell your creations with just 3.5% fees.",
    "Ready to start your journey?",
  ];

  useEffect(() => {
    if (!visible) {
      setSpeechIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setSpeechIndex((prev) => {
        if (prev >= speeches.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
      style={{ animation: "fadeIn 0.5s ease-out" }}
    >
      <div
        className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-black/80 border border-white/10 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fade-in-up 0.6s ease-out" }}
      >
        <div style={{ animation: "float 3s ease-in-out infinite" }}>
          <IntroBob state="introducing" />
        </div>

        <div className="max-w-sm text-center">
          <p
            key={speechIndex}
            className="text-white/90 text-sm font-tech leading-relaxed"
            style={{ animation: "text-crossfade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            {speeches[speechIndex]}
          </p>
          <div className="flex justify-center gap-1.5 mt-4">
            {speeches.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === speechIndex ? "#60a5fa" : "rgba(255,255,255,0.2)",
                  width: i === speechIndex ? "12px" : "6px",
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-tech uppercase tracking-wider transition-colors"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
}

// ====================================================================
// Star positions for the zoom-in phase
// ====================================================================

const STAR_POSITIONS = [
  { x: 20, y: 25 },
  { x: 75, y: 20 },
  { x: 30, y: 60 },
  { x: 70, y: 55 },
  { x: 50, y: 35 },
  { x: 25, y: 45 },
];

// ====================================================================
// Main Intro Component
// ====================================================================

export default function Intro() {
  const navigate = useNavigate();
  const { openAuth, user } = useAuth();
  const [phase, setPhase] = useState(0); // 0=campsite, 1=camera-up, 2=star-zoom, 3=benefit, 4=final
  const [facetIndex, setFacetIndex] = useState(0);
  const [displayFacetIndex, setDisplayFacetIndex] = useState(0);
  const [showBobIntro, setShowBobIntro] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomTarget, setZoomTarget] = useState(null);
  const [showBenefit, setShowBenefit] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);
  const [zoomingOut, setZoomingOut] = useState(false);

  const stars = useMemo(() => generateMilkyWayStars(2000, 42), []);
  const timers = useRef([]);
  const containerRef = useRef(null);
  const scrollLocked = useRef(false);
  const [bobLookUp, setBobLookUp] = useState(false);

  // ---- Auto-advance through scenes 0-1 ----
  useEffect(() => {
    // Phase 0: campsite 7s. At 5s Bob tilts head up.
    // Phase 1: camera pans right (head turn) 8s — Bob recedes, a tree covers
    // the screen, then the camera looks diagonally up to reveal the stars.
    const tLook = setTimeout(() => { setBobLookUp(true); }, 5000);
    const t0 = setTimeout(() => { setPhase(1); }, 7000);
    const t1 = setTimeout(() => { setPhase(2); }, 15000);
    timers.current = [tLook, t0, t1];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // ---- Check if user just signed up/signed in ----
  useEffect(() => {
    if (user) {
      const hasSeenBobIntro = localStorage.getItem("pf_bob_intro_seen");
      if (!hasSeenBobIntro) {
        const t = setTimeout(() => {
          setShowBobIntro(true);
          localStorage.setItem("pf_bob_intro_seen", "1");
        }, 1000);
        timers.current.push(t);
      }
    }
  }, [user]);

  const advanceToNextRef = useRef(null);
  const startAutoAdvanceRef = useRef(null);

  // ---- Advance to next benefit or final scene ----
  const advanceToNext = useCallback(() => {
    if (facetIndex >= FACETS.length - 1) {
      setPhase(4);
      return;
    }
    const nextIndex = facetIndex + 1;
    // 1. Zoom out current star
    setZoomingOut(true);
    setShowBenefit(false);
    // 2. After zoom-out completes, swap to next star and zoom in
    setTimeout(() => {
      setFacetIndex(nextIndex);
      setDisplayFacetIndex(nextIndex);
      setZoomTarget(STAR_POSITIONS[nextIndex]);
      setZoomingOut(false);
      setTimeout(() => {
        setShowBenefit(true);
        if (startAutoAdvanceRef.current) startAutoAdvanceRef.current();
      }, 50);
    }, 1500);
  }, [facetIndex]);

  advanceToNextRef.current = advanceToNext;

  // ---- Start auto-advance for benefits ----
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    const t = setTimeout(() => {
      if (advanceToNextRef.current) advanceToNextRef.current();
    }, 8000);
    setAutoAdvanceTimer(t);
  }, [autoAdvanceTimer]);

  startAutoAdvanceRef.current = startAutoAdvance;

  // ---- Cleanup auto-advance timer ----
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    };
  }, [autoAdvanceTimer]);

  // ---- Handle scroll interaction ----
  const handleScroll = useCallback((e) => {
    if (scrollLocked.current) return;
    scrollLocked.current = true;
    setTimeout(() => { scrollLocked.current = false; }, 1400);

    if (phase === 2 && !isZooming) {
      // First scroll from star field: zoom into first star
      setIsZooming(true);
      setShowBenefit(false);
      setTimeout(() => {
        setFacetIndex(0);
        setDisplayFacetIndex(0);
        setZoomTarget(STAR_POSITIONS[0]);
        setIsZooming(false);
        setPhase(3);
        setTimeout(() => {
          setShowBenefit(true);
        }, 50);
      }, 500);
    } else if (phase === 3 && !zoomingOut) {
      // Scroll while zoomed in: zoom back out to star field
      setShowBenefit(false);
      setZoomingOut(true);
      setTimeout(() => {
        setZoomingOut(false);
        setPhase(2);
      }, 1500);
    }
  }, [phase, isZooming, zoomingOut]);

  useEffect(() => {
    const handler = (e) => {
      if (e.deltaY > 0) handleScroll(e);
    };
    window.addEventListener("wheel", handler, { passive: true });
    return () => window.removeEventListener("wheel", handler);
  }, [handleScroll]);

  // ---- Click on a specific star ----
  const handleStarClick = useCallback((index) => {
    if (isZooming || zoomingOut || phase < 2) return;
    setShowBenefit(false);
    setZoomingOut(true);
    setTimeout(() => {
      setFacetIndex(index);
      setDisplayFacetIndex(index);
      setZoomTarget(STAR_POSITIONS[index]);
      setZoomingOut(false);
      setPhase(3);
      setTimeout(() => {
        setShowBenefit(true);
        startAutoAdvance();
      }, 50);
    }, 1500);
  }, [isZooming, zoomingOut, phase, startAutoAdvance]);

  // ---- Navigation handlers ----
  const handleGuest = () => { markIntroSeen(); navigate("/"); };
  const handleSignUp = () => { markIntroSeen(); openAuth("signup"); };
  const handleBobDismiss = () => setShowBobIntro(false);

  // ---- Skip to end ----
  const handleSkip = () => {
    timers.current.forEach(clearTimeout);
    setPhase(4);
    setIsZooming(false);
    setShowBenefit(false);
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div
      data-testid="intro-page"
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
    >
      {/* ===== BACKGROUND: Canvas Star Field — zooms toward target star in phase 3 ===== */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          transformOrigin: zoomTarget ? `${zoomTarget.x}% ${zoomTarget.y}%` : "50% 50%",
          transform: (phase === 3 && !zoomingOut) ? "scale(3)" : "scale(1)",
          transition: zoomingOut
            ? "transform 1s cubic-bezier(0.4, 0, 0.2, 1)"
            : (phase === 3 ? "transform 1.8s cubic-bezier(0.0, 0.0, 0.2, 1)" : "none"),
          willChange: "transform",
        }}
      >
        <StarBackground stars={stars} />
      </div>

      {/* ===== FROSTED BLUR — phase 3 only, deferred until zoom-in settles ===== */}
      {phase === 3 && !zoomingOut && showBenefit && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15,
          backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
          transition: "opacity 0.8s ease",
        }} />
      )}

      {/* ===== SCENE 0: Campsite — 7 seconds, Bob sits by fire ===== */}
      {phase === 0 && (
        <div
          className="absolute inset-0 z-20"
          style={{ animation: "fadeIn 1.5s ease" }}
        >
          {/* Full-width forest + brown ground so the campsite sits inside a real forest */}
          <TreeSilhouettes opacity={0.95} />
          <CampfireScene lookUp={bobLookUp} />
          <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-center">
            <p
              className="text-white/30 text-[10px] font-tech uppercase tracking-[0.4em]"
              style={{ animation: "text-crossfade-in 1.2s ease 1s both" }}
            >
              A quiet night in the cosmos...
            </p>
          </div>
        </div>
      )}

      {/* ===== SCENE 1: Head turn — camera pans right, Bob recedes, a tree covers the screen, then the camera looks diagonally up to the stars ===== */}
      {phase === 1 && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* 1) Camera turns head right — scene pans left, Bob recedes into the distance */}
          <div
            className="absolute inset-0"
            style={{ animation: "camera-pan-right 4s cubic-bezier(0.45, 0, 0.25, 1) forwards" }}
          >
            <CampfireScene lookUp={true} />
          </div>

          {/* 2) A pine tree grows to fill the whole screen */}
          <div
            className="absolute inset-0 flex items-end justify-center"
            style={{ animation: "tree-cover 2.2s cubic-bezier(0.16, 1, 0.3, 1) 3.4s both" }}
          >
            <div
              className="absolute inset-0"
              style={{ animation: "camera-look-up 2.25s cubic-bezier(0.32, 0.04, 0.18, 1) 5.75s both" }}
            >
              <CoverForestPass />
            </div>
          </div>

          {/* 3) Camera looks diagonally up — tree clears away, revealing the stars */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="text-white/40 text-sm font-tech uppercase tracking-[0.5em]"
              style={{ animation: "text-crossfade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) 6.6s both" }}
            >
              Look up at the stars...
            </p>
          </div>
        </div>
      )}

      {/* ===== SCENE 2: Star Zoom Phase ===== */}
      {phase === 2 && (
        <div
          className="absolute inset-0 z-20"
          style={{ animation: "text-crossfade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          {/* Tree silhouettes at bottom */}
          <TreeSilhouettes opacity={0.4} />

          {/* Clickable stars — only enabled once intro phases are past */}
          {FACETS.map((facet, i) => (
            <ZoomStar
              key={facet.id}
              facet={facet}
              index={i}
              active={false}
              position={STAR_POSITIONS[i]}
              onClick={() => handleStarClick(i)}
            />
          ))}

          {/* Hint text */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-center z-30">
            <p
              className="text-white/30 text-[10px] font-tech uppercase tracking-[0.3em]"
              style={{ animation: "text-crossfade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both" }}
            >
              Scroll or click a star to explore
            </p>
          </div>
        </div>
      )}

      {/* ===== SCENE 3: Benefit Display (Zoomed into a star) ===== */}
      {phase === 3 && (
        <div className="absolute inset-0 z-20">
          <TreeSilhouettes opacity={0.2} />
          <BenefitCard
            facet={FACETS[displayFacetIndex]}
            visible={showBenefit}
            zoomingOut={zoomingOut}
          />
          {/* Navigation dots */}
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {FACETS.map((f, i) => (
              <button
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === facetIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                  width: i === facetIndex ? "16px" : "6px",
                  height: "6px",
                  boxShadow: i === facetIndex ? "0 0 8px rgba(255,255,255,0.6)" : "none",
                }}
                onClick={() => handleStarClick(i)}
              />
            ))}
          </div>
          {showBenefit && !zoomingOut && (
            <div
              className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-30"
              style={{ animation: "text-crossfade-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.6s both" }}
            >
              <p className="text-white/20 text-[9px] font-tech uppercase tracking-[0.3em]">
                Scroll to zoom out
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== SCENE 4: Final - UI Emergence ===== */}
      {phase === 4 && (
        <FinalScene
          onGuest={handleGuest}
          onSignUp={handleSignUp}
          visible={phase === 4}
        />
      )}

      {/* ===== SKIP BUTTON ===== */}
      {phase >= 0 && phase < 4 && (
        <button
          onClick={handleSkip}
          className="fixed top-6 right-6 z-50 text-white/40 hover:text-white/80 transition-colors text-[10px] font-tech uppercase tracking-wider"
          data-testid="skip-intro-btn"
          style={{ animation: "fadeIn 1s ease 1s both" }}
        >
          Skip
        </button>
      )}

      {/* ===== BOB INTRO OVERLAY ===== */}
      <BobIntroOverlay visible={showBobIntro} onDismiss={handleBobDismiss} />
    </div>
  );
}
