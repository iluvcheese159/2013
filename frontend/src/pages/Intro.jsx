import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

export const markIntroSeen = () => {
  try {
    localStorage.setItem("pf_intro_seen", "1");
  } catch (_e) {
    // Ignore storage failures in restricted browser contexts.
  }
};

const CARD_STARS = [
  { x: 8, y: 12, s: 2.2, o: 0.65 },
  { x: 18, y: 26, s: 1.8, o: 0.45 },
  { x: 27, y: 8, s: 1.6, o: 0.5 },
  { x: 34, y: 22, s: 2.4, o: 0.55 },
  { x: 45, y: 14, s: 1.7, o: 0.6 },
  { x: 57, y: 28, s: 1.5, o: 0.5 },
  { x: 66, y: 10, s: 2.1, o: 0.58 },
  { x: 76, y: 24, s: 1.9, o: 0.48 },
  { x: 86, y: 12, s: 2.5, o: 0.62 },
  { x: 93, y: 26, s: 1.4, o: 0.5 },
  { x: 12, y: 42, s: 1.6, o: 0.44 },
  { x: 21, y: 54, s: 2.0, o: 0.52 },
  { x: 33, y: 46, s: 1.4, o: 0.56 },
  { x: 47, y: 58, s: 2.2, o: 0.5 },
  { x: 58, y: 44, s: 1.7, o: 0.45 },
  { x: 71, y: 56, s: 2.3, o: 0.57 },
  { x: 83, y: 48, s: 1.6, o: 0.54 },
  { x: 91, y: 62, s: 1.8, o: 0.46 },
  { x: 14, y: 74, s: 2.3, o: 0.5 },
  { x: 28, y: 86, s: 1.5, o: 0.48 },
  { x: 39, y: 78, s: 2.0, o: 0.6 },
  { x: 51, y: 90, s: 1.6, o: 0.5 },
  { x: 67, y: 82, s: 1.9, o: 0.58 },
  { x: 78, y: 94, s: 1.5, o: 0.42 },
  { x: 89, y: 80, s: 2.1, o: 0.55 },
];

const SLIDES = [
  {
    id: "welcome",
    eyebrow: "Print Cosmos",
    title: "Your complete 3D printing universe",
    text: "From your first idea to your first sale, Print Cosmos gives creators and buyers one shared ecosystem. Scroll through this launch deck to see what you can do here.",
    statLabel: "Platform Scope",
    statValue: "Design + Market + Community",
    visual: "cosmos",
    highlights: [
      "Discover creator-made prints and customizable models",
      "Move from concept to publish without leaving your browser",
      "Use one account across marketplace, workshop, forums, and messaging",
      "Built for beginners and advanced makers with practical tools",
    ],
  },
  {
    id: "design",
    eyebrow: "Design Workshop",
    title: "Build and prepare models directly online",
    text: "Open your project, iterate quickly, and validate print readiness with integrated tools. No heavy setup, no slow handoffs between disconnected apps.",
    statLabel: "Design Workflow",
    statValue: "Fast Iteration",
    visual: "design",
    highlights: [
      "Import and edit STL, OBJ, and 3MF assets",
      "Tune supports, orientation, and geometry before publishing",
      "Use material and print planning tools in one flow",
      "Collaborate with feedback loops from real makers",
    ],
  },
  {
    id: "sell",
    eyebrow: "Seller Tools",
    title: "Launch your storefront and grow steadily",
    text: "List products or digital designs, set your pricing strategy, and track performance. Print Cosmos helps your work get discovered by buyers who already value 3D prints.",
    statLabel: "Monetization",
    statValue: "Creator Friendly Fees",
    visual: "sell",
    highlights: [
      "Publish listings with clean product pages and rich details",
      "Adjust prices and run promotions without friction",
      "Manage orders and buyer communication from one hub",
      "Use analytics to understand what converts and why",
    ],
  },
  {
    id: "community",
    eyebrow: "Community + Learning",
    title: "Improve faster with maker knowledge",
    text: "Ask for help, share lessons, and join focused clubs. Whether you are debugging print failures or exploring new materials, you can learn directly from active builders.",
    statLabel: "Knowledge Layer",
    statValue: "Forums, Clubs, Messaging",
    visual: "community",
    highlights: [
      "Troubleshoot common failures with community-tested fixes",
      "Join clubs centered on niche workflows and interests",
      "Share process tips, presets, and project breakdowns",
      "Build reputation through helpful contributions",
    ],
  },
  {
    id: "start",
    eyebrow: "Start Now",
    title: "Choose your path and enter the platform",
    text: "Browse as a guest right away, or sign in to unlock publishing, seller tools, and persistent design management.",
    statLabel: "Onboarding",
    statValue: "Live in Seconds",
    visual: "start",
    highlights: [
      "Guest mode for instant exploration",
      "Account mode for full creator capabilities",
      "Seamless transition from browsing to selling",
      "Everything connected from day one",
    ],
  },
];

function SlideVisual({ type }) {
  if (type === "design") {
    return (
      <svg viewBox="0 0 360 220" className="h-44 w-full rounded-2xl border border-white/20 bg-slate-950/60 p-2">
        <rect x="14" y="20" width="220" height="138" rx="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.2" />
        <rect x="26" y="36" width="88" height="10" rx="5" fill="#334155" />
        <rect x="26" y="54" width="130" height="8" rx="4" fill="#1e293b" />
        <rect x="26" y="68" width="166" height="8" rx="4" fill="#1e293b" />
        <polygon points="78,132 108,92 144,128 175,78 214,132" fill="#0ea5e9" opacity="0.85" />
        <circle cx="254" cy="108" r="44" fill="#0b1222" stroke="#f59e0b" strokeWidth="1.4" />
        <circle cx="254" cy="108" r="25" fill="#f59e0b" opacity="0.85" />
        <rect x="214" y="170" width="126" height="32" rx="8" fill="#111827" stroke="#3b82f6" strokeWidth="1" />
        <rect x="226" y="182" width="66" height="8" rx="4" fill="#60a5fa" />
      </svg>
    );
  }

  if (type === "sell") {
    return (
      <svg viewBox="0 0 360 220" className="h-44 w-full rounded-2xl border border-white/20 bg-slate-950/60 p-2">
        <rect x="12" y="28" width="124" height="168" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
        <rect x="28" y="46" width="90" height="58" rx="8" fill="#1e293b" />
        <rect x="28" y="114" width="70" height="8" rx="4" fill="#60a5fa" />
        <rect x="28" y="128" width="90" height="8" rx="4" fill="#334155" />
        <rect x="28" y="142" width="80" height="8" rx="4" fill="#334155" />
        <rect x="170" y="44" width="178" height="152" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
        <rect x="184" y="62" width="146" height="16" rx="8" fill="#1e293b" />
        <rect x="184" y="88" width="94" height="12" rx="6" fill="#22c55e" opacity="0.9" />
        <rect x="184" y="108" width="118" height="10" rx="5" fill="#334155" />
        <rect x="184" y="124" width="104" height="10" rx="5" fill="#334155" />
        <polyline points="192,168 224,148 256,156 286,126 324,132" fill="none" stroke="#f59e0b" strokeWidth="3" />
      </svg>
    );
  }

  if (type === "community") {
    return (
      <svg viewBox="0 0 360 220" className="h-44 w-full rounded-2xl border border-white/20 bg-slate-950/60 p-2">
        <circle cx="82" cy="76" r="28" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.2" />
        <circle cx="170" cy="64" r="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
        <circle cx="252" cy="82" r="30" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
        <line x1="108" y1="80" x2="146" y2="66" stroke="#93c5fd" strokeWidth="2" />
        <line x1="192" y1="72" x2="224" y2="82" stroke="#7dd3fc" strokeWidth="2" />
        <line x1="84" y1="104" x2="254" y2="114" stroke="#fcd34d" strokeWidth="1.6" opacity="0.8" />
        <rect x="24" y="132" width="312" height="68" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="38" y="146" width="128" height="10" rx="5" fill="#60a5fa" />
        <rect x="38" y="164" width="282" height="8" rx="4" fill="#1e293b" />
        <rect x="38" y="178" width="236" height="8" rx="4" fill="#1e293b" />
      </svg>
    );
  }

  if (type === "start") {
    return (
      <svg viewBox="0 0 360 220" className="h-44 w-full rounded-2xl border border-white/20 bg-slate-950/60 p-2">
        <rect x="22" y="46" width="144" height="126" rx="12" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.2" />
        <rect x="194" y="46" width="144" height="126" rx="12" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
        <rect x="38" y="68" width="92" height="12" rx="6" fill="#93c5fd" />
        <rect x="38" y="90" width="110" height="8" rx="4" fill="#334155" />
        <rect x="38" y="104" width="100" height="8" rx="4" fill="#334155" />
        <rect x="38" y="132" width="90" height="22" rx="11" fill="#1d4ed8" />
        <rect x="210" y="68" width="92" height="12" rx="6" fill="#fcd34d" />
        <rect x="210" y="90" width="110" height="8" rx="4" fill="#334155" />
        <rect x="210" y="104" width="96" height="8" rx="4" fill="#334155" />
        <rect x="210" y="132" width="90" height="22" rx="11" fill="#f59e0b" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 220" className="h-44 w-full rounded-2xl border border-white/20 bg-slate-950/60 p-2">
      <defs>
        <linearGradient id="skyBlend" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d4ed8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="14" y="16" width="332" height="188" rx="16" fill="#0b1220" />
      <circle cx="86" cy="84" r="54" fill="#1e293b" />
      <circle cx="252" cy="118" r="70" fill="#1f2937" />
      <path d="M36 168 C94 110 146 186 206 142 C240 116 282 126 328 98" fill="none" stroke="url(#skyBlend)" strokeWidth="5" />
      <circle cx="102" cy="68" r="8" fill="#f8fafc" />
      <circle cx="152" cy="82" r="5" fill="#93c5fd" />
      <circle cx="198" cy="58" r="6" fill="#fcd34d" />
      <circle cx="286" cy="70" r="7" fill="#f8fafc" />
      <circle cx="304" cy="96" r="4" fill="#93c5fd" />
      <circle cx="262" cy="56" r="3.5" fill="#fde68a" />
    </svg>
  );
}

function SlideNav({ slides, current, onJump }) {
  return (
    <nav className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 md:flex md:flex-col md:gap-3">
      {slides.map((slide, index) => {
        const active = index === current;
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => onJump(index)}
            className="h-8 w-8 rounded-full border text-[10px] font-tech"
            style={{
              borderColor: active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
              background: active ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
            }}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index + 1}
          </button>
        );
      })}
    </nav>
  );
}

export default function Intro() {
  const navigate = useNavigate();
  const { openAuth } = useAuth();
  const containerRef = useRef(null);
  const slideRefs = useRef([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = useMemo(() => SLIDES.length, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const index = Number(visible[0].target.getAttribute("data-slide-index"));
          if (!Number.isNaN(index)) setCurrentSlide(index);
        }
      },
      {
        root: containerRef.current,
        threshold: [0.35, 0.6, 0.85],
      }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const jumpToSlide = (index) => {
    const target = slideRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSkip = () => {
    jumpToSlide(slideCount - 1);
  };

  const handleGuest = () => {
    markIntroSeen();
    navigate("/");
  };

  const handleSignUp = () => {
    markIntroSeen();
    openAuth("signup");
  };

  return (
    <div
      data-testid="intro-page"
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto text-white"
      style={{
        scrollSnapType: "y mandatory",
        backgroundImage:
          "radial-gradient(circle at 10% 18%, rgba(59, 130, 246, 0.25), transparent 44%), radial-gradient(circle at 88% 14%, rgba(249, 115, 22, 0.23), transparent 42%), radial-gradient(circle at 40% 82%, rgba(234, 179, 8, 0.18), transparent 46%), linear-gradient(180deg, #030712 0%, #0a1020 50%, #111827 100%)",
      }}
    >
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-white/15 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <BrandLogo alt="Print Cosmos" className="h-9 w-auto object-contain" />
          <div className="flex items-center gap-3">
            <p className="hidden text-[10px] font-tech uppercase tracking-[0.28em] text-white/65 sm:block">
              Slide {currentSlide + 1} / {slideCount}
            </p>
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-full border border-white/30 px-4 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] text-white/75 hover:bg-white/10"
              data-testid="skip-intro-btn"
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      <SlideNav slides={SLIDES} current={currentSlide} onJump={jumpToSlide} />

      <main className="pt-16">
        {SLIDES.map((slide, index) => {
          const isLast = index === SLIDES.length - 1;
          return (
            <section
              key={slide.id}
              data-slide-index={index}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              className="flex min-h-screen items-center px-5 py-12 md:px-8"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <article className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/28 p-7 backdrop-blur-sm md:p-10">
                  <div className="absolute inset-0 pointer-events-none">
                    {CARD_STARS.map((star, i) => (
                      <span
                        key={`${slide.id}-star-${i}`}
                        className="absolute rounded-full bg-white"
                        style={{
                          left: `${star.x}%`,
                          top: `${star.y}%`,
                          width: `${star.s}px`,
                          height: `${star.s}px`,
                          opacity: star.o,
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/40 to-black/65" />
                  </div>

                  <div className="relative z-10">
                    <p className="mb-4 text-[10px] font-tech uppercase tracking-[0.32em] text-white/70">
                      {slide.eyebrow}
                    </p>
                    <h1 className="mb-4 font-display text-3xl font-medium leading-tight md:text-5xl">
                      {slide.title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-white/82 md:text-base">
                      {slide.text}
                    </p>

                    <ul className="mt-6 grid gap-2 text-sm text-white/78 md:grid-cols-2">
                      {slide.highlights.map((item) => (
                        <li key={item} className="rounded-xl border border-white/12 bg-black/25 px-3 py-2 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>

                    {!isLast && (
                      <button
                        type="button"
                        onClick={() => jumpToSlide(index + 1)}
                        className="mt-8 rounded-full border border-white/35 px-5 py-2 text-xs font-tech uppercase tracking-[0.2em] text-white hover:bg-white/10"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                </article>

                <aside className="rounded-3xl border border-white/15 bg-black/30 p-6 backdrop-blur-sm md:p-8">
                  <p className="text-[10px] font-tech uppercase tracking-[0.24em] text-sky-200/85">At a glance</p>
                  <div className="mt-3 rounded-2xl border border-sky-200/35 bg-sky-200/10 p-5">
                    <p className="text-xs font-tech uppercase tracking-[0.22em] text-sky-100/75">{slide.statLabel}</p>
                    <p className="mt-2 font-display text-2xl text-white md:text-3xl">{slide.statValue}</p>
                  </div>

                  <div className="mt-4">
                    <SlideVisual type={slide.visual} />
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-white/70 md:text-sm">
                    Use scroll, side dots, or Continue to move through the intro.
                  </p>

                  {isLast && (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={handleGuest}
                        variant="outline"
                        size="lg"
                        className="border-white/40 bg-white/10 font-tech text-xs uppercase tracking-wider text-white hover:bg-white/20"
                        data-testid="continue-guest-btn"
                      >
                        Continue as Guest
                      </Button>
                      <Button
                        onClick={handleSignUp}
                        size="lg"
                        className="bg-white font-tech text-xs uppercase tracking-wider text-black hover:bg-white/90"
                        data-testid="signup-btn"
                      >
                        Sign Up / Sign In
                      </Button>
                    </div>
                  )}
                </aside>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}