/* eslint-disable */
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

export const markIntroSeen = () => {
  try { localStorage.setItem("pf_intro_seen", "1"); } catch (_e) {}
};

const FEATURED_STARS = [
  { id: 1, x: 30, y: 25, size: 3,   text: "Design your own 3D-printable creations right in your browser" },
  { id: 2, x: 70, y: 45, size: 2.5, text: "Buy prints made by real makers" },
  { id: 3, x: 45, y: 70, size: 3.5, text: "Sell what you create" },
];

// Three converging star positions (relative to logo center, in px)
const CONVERGE_STARS = [
  { dx: -220, dy: -140 },
  { dx:  180, dy: -100 },
  { dx:  -60, dy:  160 },
];

function generateStars(count, seed) {
  const stars = [];
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: r() * 100,
      y: r() * 100,
      size: r() * 2 + 0.5,
      opacity: r() * 0.5 + 0.3,
      speed: r() * 2 + 1,
    });
  }
  return stars;
}

// Phases:
// 0 — black silence
// 1 — stars fade in + drift begins
// 2 — logo assembles (converging stars → logo)
// 3 — explanatory stars sequence
// 4 — buttons visible

export default function Intro() {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [phase, setPhase] = useState(0);
  const [explainIdx, setExplainIdx] = useState(0);
  const seed = useMemo(() => 42, []);
  const stars = useMemo(() => generateStars(200, seed), [seed]);
  const autoRef = useRef(null);

  // Phase timeline
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);   // stars fade in + drift
    const t2 = setTimeout(() => setPhase(2), 3800);  // logo assembles
    const t3 = setTimeout(() => setPhase(3), 5400);  // explanatory stars
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Auto-advance explanatory stars
  useEffect(() => {
    if (phase !== 3) return;
    autoRef.current = setInterval(() => {
      setExplainIdx((i) => {
        if (i < FEATURED_STARS.length - 1) return i + 1;
        clearInterval(autoRef.current);
        setPhase(4);
        return i;
      });
    }, 4500);
    return () => clearInterval(autoRef.current);
  }, [phase]);

  const skip = () => {
    clearInterval(autoRef.current);
    setPhase(4);
  };

  const continueAsGuest = () => { markIntroSeen(); navigate("/"); };
  const openSignUp = () => { markIntroSeen(); openAuth("signup"); };

  const currentStar = FEATURED_STARS[explainIdx];

  return (
    <div
      data-testid="intro-page"
      className="fixed inset-0 bg-black overflow-hidden"
      onClick={phase === 3 ? () => {
        if (explainIdx < FEATURED_STARS.length - 1) setExplainIdx(i => i + 1);
        else { clearInterval(autoRef.current); setPhase(4); }
      } : undefined}
    >
      {/* ── Starfield ── */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 1.8s ease-in",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            transformOrigin: "60% 55%",
            animation: phase >= 1 && phase < 2 ? "star-drift 3.2s cubic-bezier(0.25,0.1,0.25,1) forwards" : undefined,
            // hold the drifted position once logo appears
            transform: phase >= 2 ? "scale(1.1) translate(-30px, -16px)" : undefined,
            transition: phase >= 2 ? "none" : undefined,
          }}
        >
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `twinkle ${star.speed}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Logo assembly (phase 2+) ── */}
      {phase >= 2 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          {/* Converging star dots */}
          {CONVERGE_STARS.map((cs, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 4, height: 4,
                "--cx": `${cs.dx}px`,
                "--cy": `${cs.dy}px`,
                animation: `converge 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms forwards`,
              }}
            />
          ))}
          {/* Logo fades in slightly after convergence */}
          <BrandLogo
            alt="Print Cosmos"
            className="h-14 w-auto object-contain"
            style={{
              opacity: 0,
              animation: "fadeIn 0.8s ease-out 0.5s forwards",
            }}
          />
        </div>
      )}

      {/* ── Explanatory stars (phase 3) ── */}
      {phase === 3 && (
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute transition-all duration-1000 ease-in-out"
            style={{
              left: `${currentStar.x}%`,
              top: `${currentStar.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="absolute rounded-full bg-white/20 blur-xl"
              style={{
                width: `${currentStar.size * 20}px`,
                height: `${currentStar.size * 20}px`,
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full bg-white"
              style={{ width: `${currentStar.size}px`, height: `${currentStar.size}px` }}
            />
            <div
              key={currentStar.id}
              className="absolute left-8 top-1/2 -translate-y-1/2 max-w-xs"
              style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
            >
              <p className="text-white/90 text-sm md:text-base font-light leading-relaxed">
                {currentStar.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Logo persists above explanatory stars ── */}
      {phase >= 3 && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ opacity: phase === 3 ? 0.15 : 0, transition: "opacity 1s ease" }}>
          <BrandLogo alt="" className="h-14 w-auto object-contain" />
        </div>
      )}

      {/* ── Buttons (phase 4) ── */}
      {phase === 4 && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-4 items-center justify-center pointer-events-auto"
          style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          <Button
            onClick={continueAsGuest}
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-tech text-xs uppercase tracking-wider backdrop-blur-sm"
            data-testid="continue-guest-btn"
          >
            Continue as Guest
          </Button>
          <Button
            onClick={openSignUp}
            size="lg"
            className="bg-white text-black hover:bg-white/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            data-testid="signup-btn"
          >
            Sign Up / Sign In
          </Button>
        </div>
      )}

      {/* ── Skip ── */}
      {phase < 4 && (
        <button
          onClick={skip}
          className="fixed top-6 right-6 z-50 text-white/40 hover:text-white/80 transition-colors text-[10px] font-tech uppercase tracking-wider"
          data-testid="skip-intro-btn"
          style={{ opacity: phase >= 1 ? 1 : 0, transition: "opacity 1s ease 2s" }}
        >
          Skip
        </button>
      )}
    </div>
  );
}
