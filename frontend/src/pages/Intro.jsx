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
  const milkyWayWidth = 0.25;

  for (let i = 0; i < count; i++) {
    let x, y;
    const inMilkyWay = r() < 0.35;
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
    // Size: power-3 so most are 0.5–1.2px, rare ones up to 2px
    const size = 0.4 + Math.pow(r(), 3) * 1.6;
    const opacity = 0.35 + r() * 0.65;
    const cr = r();
    // Realistic palette: blue-white dominant
    const color = cr < 0.5  ? [245, 248, 255]
                : cr < 0.72 ? [255, 255, 255]
                : cr < 0.87 ? [255, 252, 235]
                : cr < 0.95 ? [255, 240, 200]
                :              [210, 225, 255];
    stars.push({ x, y, size, opacity, color, inMilkyWay,
      twinkleSpeed: 2 + r() * 5, twinklePhase: r() * Math.PI * 2 });
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

      // ── Milky Way: diagonal arc from bottom-left to upper-right ──
      // Outer haze — blue-purple
      const mw1 = ctx.createLinearGradient(0, H, W * 0.85, 0);
      mw1.addColorStop(0,    "rgba(0,0,0,0)");
      mw1.addColorStop(0.25, "rgba(40,35,90,0.08)");
      mw1.addColorStop(0.42, "rgba(100,85,180,0.14)");
      mw1.addColorStop(0.55, "rgba(160,140,230,0.18)");
      mw1.addColorStop(0.65, "rgba(190,170,255,0.14)");
      mw1.addColorStop(0.78, "rgba(80,70,140,0.08)");
      mw1.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = mw1;
      ctx.fillRect(0, 0, W, H);

      // Warm galactic core glow — orange-gold, upper-center
      const coreX = W * 0.52;
      const coreY = H * 0.28;
      const core = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, W * 0.28);
      core.addColorStop(0,    "rgba(255,200,100,0.18)");
      core.addColorStop(0.25, "rgba(220,160,80,0.12)");
      core.addColorStop(0.5,  "rgba(180,120,60,0.07)");
      core.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, W, H);

      // Dense star cluster along band
      const band = ctx.createLinearGradient(0, H, W * 0.85, 0);
      band.addColorStop(0,    "rgba(0,0,0,0)");
      band.addColorStop(0.45, "rgba(255,255,255,0.04)");
      band.addColorStop(0.55, "rgba(255,255,255,0.07)");
      band.addColorStop(0.65, "rgba(255,255,255,0.04)");
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

const FACETS = [
  {
    id: "browse",
    label: "Browse",
    color: "#60a5fa",
    title: "Discover Unique Prints",
    text: "Explore a curated marketplace of thousands of 3D-printed creations from independent makers worldwide. Filter by category, material, print time, and more. Every print tells a story — find yours.",
    systemBg: "radial-gradient(ellipse at center, #0a1628 0%, #060d1a 50%, #000 100%)",
    starColor: { r: 96, g: 165, b: 250 },
  },
  {
    id: "design",
    label: "Design Workshop",
    color: "#fbbf24",
    title: "Create in Your Browser",
    text: "Design, edit, and prepare 3D models for printing directly in your browser — no software installation needed. Supports STL, OBJ, 3MF, and more. From concept to print in minutes.",
    systemBg: "radial-gradient(ellipse at center, #1a0a28 0%, #0d061a 50%, #000 100%)",
    starColor: { r: 251, g: 191, b: 36 },
  },
  {
    id: "sell",
    label: "Sell Marketplace",
    color: "#f472b6",
    title: "Launch Your Storefront",
    text: "Become a maker-entrepreneur with just 3.5% fees. List your prints, set your prices, and ship worldwide. Our platform handles discovery, payments, and customer communication.",
    systemBg: "radial-gradient(ellipse at center, #280a1a 0%, #1a060d 50%, #000 100%)",
    starColor: { r: 244, g: 114, b: 182 },
  },
  {
    id: "hyperspace",
    label: "Hyperspace",
    color: "#a78bfa",
    title: "Premium Subscription",
    text: "Upgrade to Hyperspace for exclusive benefits: reduced 2% seller fees, priority customer support, advanced analytics dashboard, early access to new features, and a special Hyperspace badge on your profile.",
    systemBg: "radial-gradient(ellipse at center, #1a0a3a 0%, #0d0620 50%, #000 100%)",
    starColor: { r: 167, g: 139, b: 250 },
  },
  {
    id: "community",
    label: "Community",
    color: "#34d399",
    title: "Mission Control & Clubs",
    text: "Join Mission Control forums to connect with fellow makers, share tips, and showcase your work. Create and join clubs, participate in design challenges, and collaborate on projects.",
    systemBg: "radial-gradient(ellipse at center, #0a2818 0%, #061a0d 50%, #000 100%)",
    starColor: { r: 52, g: 211, b: 153 },
  },
  {
    id: "tools",
    label: "Tools",
    color: "#fb923c",
    title: "Filament Calculator & More",
    text: "Access powerful tools: calculate filament usage and costs, browse the print failure database for troubleshooting tips, compare materials and printers, and use our design validation tools.",
    systemBg: "radial-gradient(ellipse at center, #28180a 0%, #1a0d06 50%, #000 100%)",
    starColor: { r: 251, g: 146, b: 60 },
  },
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
  const trees = [
    { x: 2, scale: 1.4 }, { x: 10, scale: 1.1 }, { x: 18, scale: 1.6 },
    { x: 28, scale: 1.0 }, { x: 36, scale: 1.5 }, { x: 46, scale: 1.2 },
    { x: 54, scale: 1.7 }, { x: 64, scale: 1.1 }, { x: 72, scale: 1.4 },
    { x: 82, scale: 1.0 }, { x: 90, scale: 1.3 }, { x: 96, scale: 1.2 },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none z-10"
      style={{ height: "140px", opacity }}
    >
      <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMax meet" className="w-full h-full">
        {trees.map((tree, i) => (
          <g key={i} transform={`translate(${tree.x}, 0) scale(${tree.scale})`}>
            <rect x="-1" y="20" width="2" height="80" fill="#050a05" />
            <polygon points="0,0 -8,20 8,20" fill="#050a05" />
            <polygon points="0,5 -7,22 7,22" fill="#071007" />
            <polygon points="0,10 -6,24 6,24" fill="#050a05" />
            <polygon points="0,15 -5,26 5,26" fill="#071007" />
            <polygon points="0,18 -4,28 4,28" fill="#050a05" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * A single interactive star — looks like a real star (tiny white dot
 * with a faint glow), not a colored blob. Clicking zooms into it.
 */
function ZoomStar({ facet, index, active, onClick, position }) {
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
        padding: "12px", // large hit area, tiny visual
      }}
      onClick={onClick}
      title={facet.label}
    >
      {/* Tiny star dot — 3px white circle with subtle glow */}
      <div
        className="rounded-full"
        style={{
          width: "4px",
          height: "4px",
          backgroundColor: "#ffffff",
          boxShadow: `0 0 6px 2px rgba(255,255,255,0.7), 0 0 12px 4px rgba(255,255,255,0.25)`,
          animation: "twinkle " + (2.5 + index * 0.4) + "s ease-in-out infinite",
          animationDelay: index * 0.3 + "s",
        }}
      />
    </button>
  );
}

/**
 * Benefit detail card shown when zooming into a star.
 */
function BenefitCard({ facet, visible }) {
  if (!facet) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease, transform 0.8s ease",
        transform: visible ? "scale(1)" : "scale(0.8)",
      }}
    >
      {/* Text content — crossfades smoothly when the facet changes */}
      <div
        key={facet.id}
        className="relative max-w-2xl mx-auto px-8 text-center"
        style={{
          animation: visible ? "text-crossfade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" : "none",
        }}
      >
        <div
          className="inline-block px-4 py-1.5 rounded-full mb-6 text-[10px] font-tech uppercase tracking-[0.3em]"
          style={{
            backgroundColor: facet.color + "22",
            color: facet.color,
            border: `1px solid ${facet.color}44`,
          }}
        >
          {"✦ " + facet.label}
        </div>

        <h2
          className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tighter leading-tight mb-6 text-white"
          style={{
            textShadow: `0 0 40px ${facet.color}44, 0 0 80px ${facet.color}22`,
          }}
        >
          {facet.title}
        </h2>

        <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-lg mx-auto backdrop-blur-sm px-4 py-2 rounded-2xl">
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
  const [showBobIntro, setShowBobIntro] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomTarget, setZoomTarget] = useState(null);
  const [showBenefit, setShowBenefit] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);

  const stars = useMemo(() => generateMilkyWayStars(1200, 42), []);
  const timers = useRef([]);
  const containerRef = useRef(null);
  const scrollLocked = useRef(false);
  const [bobLookUp, setBobLookUp] = useState(false);

  // ---- Auto-advance through scenes 0-1 ----
  useEffect(() => {
    // Phase 0: campsite 7s. At 5s Bob tilts head up. Phase 1: camera pan 4.5s.
    const tLook = setTimeout(() => { setBobLookUp(true); }, 5000);
    const t0 = setTimeout(() => { setPhase(1); }, 7000);
    const t1 = setTimeout(() => { setPhase(2); }, 11500);
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
    setFacetIndex((prevIndex) => {
      if (prevIndex < FACETS.length - 1) {
        const nextIndex = prevIndex + 1;
        setIsZooming(true);
        setShowBenefit(false);
        setTimeout(() => {
          setFacetIndex(nextIndex);
          setZoomTarget(STAR_POSITIONS[nextIndex]);
          setTimeout(() => {
            setIsZooming(false);
            setShowBenefit(true);
            if (startAutoAdvanceRef.current) startAutoAdvanceRef.current();
          }, 800);
        }, 600);
        return nextIndex;
      } else {
        setPhase(4);
        return prevIndex;
      }
    });
  }, []);

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
    setTimeout(() => { scrollLocked.current = false; }, 1200);

    if (phase === 2 && !isZooming) {
      // First scroll: zoom into first star
      setZoomTarget(STAR_POSITIONS[0]);
      setIsZooming(true);
      setTimeout(() => {
        setIsZooming(false);
        setShowBenefit(true);
        setPhase(3);
        if (startAutoAdvanceRef.current) startAutoAdvanceRef.current();
      }, 1200);
    } else if (phase === 3 && showBenefit) {
      // Next scroll: advance to next benefit
      if (advanceToNextRef.current) advanceToNextRef.current();
    }
  }, [phase, isZooming, showBenefit]);

  useEffect(() => {
    const handler = (e) => {
      if (e.deltaY > 0) handleScroll(e);
    };
    window.addEventListener("wheel", handler, { passive: true });
    return () => window.removeEventListener("wheel", handler);
  }, [handleScroll]);

  // ---- Click on a specific star ----
  const handleStarClick = useCallback((index) => {
    if (isZooming || phase < 2) return; // disabled during intro phases
    setZoomTarget(STAR_POSITIONS[index]);
    setFacetIndex(index);
    setIsZooming(true);
    setShowBenefit(false);
    setTimeout(() => {
      setIsZooming(false);
      setShowBenefit(true);
      setPhase(3);
      startAutoAdvance();
    }, 1200);
  }, [isZooming, phase, startAutoAdvance]);

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
      {/* ===== BACKGROUND: Canvas Star Field + Milky Way ===== */}
      <StarBackground stars={stars} />

      {/* ===== FROSTED BLUR — only behind text panels (phase 3+), not over the sky ===== */}
      {phase >= 3 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 15,
            background: "rgba(2, 4, 14, 0.45)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            transition: "opacity 0.8s ease",
          }}
        />
      )}

      {/* ===== SCENE 0: Campsite — 7 seconds, Bob sits by fire ===== */}
      {phase === 0 && (
        <div
          className="absolute inset-0 z-20"
          style={{ animation: "fadeIn 1.5s ease" }}
        >
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

      {/* ===== SCENE 1: Camera pans up from campsite to star-filled sky ===== */}
      {phase === 1 && (
        <>
          {/* Campsite stays fixed at bottom — NOT inside the animated div */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <CampfireScene lookUp={true} />
          </div>
          {/* Only the text pans up with camera-drift */}
          <div
            className="absolute inset-0 z-21"
            style={{ animation: "camera-drift 4s cubic-bezier(0.45, 0, 0.25, 1) forwards" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className="text-white/40 text-sm font-tech uppercase tracking-[0.5em]"
                style={{ animation: "text-crossfade-in 1.2s ease 0.8s both" }}
              >
                Look up at the stars...
              </p>
            </div>
          </div>
        </>
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
          {/* Zoom effect container */}
          <div
            className="absolute inset-0"
            style={{
              animation: isZooming
                ? "fadeOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Background stars visible behind */}
            <TreeSilhouettes opacity={0.2} />

            {/* The zoom target — tiny star that expands into a soft white halo */}
            {zoomTarget && (
              <div
                className="absolute z-10"
                style={{
                  left: zoomTarget.x + "%",
                  top: zoomTarget.y + "%",
                  transform: "translate(-50%, -50%)",
                  animation: isZooming
                    ? "star-zoom-out 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    : "star-zoom-in 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: "60px",
                    height: "60px",
                    background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)",
                    opacity: isZooming ? 0 : 1,
                  }}
                />
              </div>
            )}

            {/* Benefit card */}
            <BenefitCard facet={FACETS[facetIndex]} visible={showBenefit && !isZooming} />

            {/* Navigation dots */}
            <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {FACETS.map((_, i) => (
                <button
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === facetIndex ? FACETS[facetIndex]?.color : "rgba(255,255,255,0.15)",
                    width: i === facetIndex ? "16px" : "6px",
                    boxShadow: i === facetIndex ? `0 0 8px ${FACETS[facetIndex]?.color}` : "none",
                  }}
                  onClick={() => handleStarClick(i)}
                />
              ))}
            </div>

            {/* Scroll hint */}
            {showBenefit && (
              <div
                className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-30"
                style={{ animation: "text-crossfade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both" }}
              >
                <p className="text-white/20 text-[9px] font-tech uppercase tracking-[0.3em]">
                  Scroll to discover more
                </p>
              </div>
            )}
          </div>
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
