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

const SLIDES = [
  {
    id: "welcome",
    eyebrow: "Print Cosmos",
    title: "Your 3D printing universe, in one place",
    text: "Scroll down to explore what you can design, buy, and sell across the platform.",
    statLabel: "Global Marketplace",
    statValue: "Makers + Buyers",
  },
  {
    id: "design",
    eyebrow: "Design Workshop",
    title: "Build printable ideas directly in your browser",
    text: "Model, tune, and prepare files without a heavy desktop setup. Fast iteration from concept to print-ready output.",
    statLabel: "File Support",
    statValue: "STL, OBJ, 3MF",
  },
  {
    id: "sell",
    eyebrow: "Seller Tools",
    title: "Launch a storefront and start earning",
    text: "Publish listings, set pricing, and track performance while Print Cosmos helps with discovery and transactions.",
    statLabel: "Low Fees",
    statValue: "Creator Friendly",
  },
  {
    id: "community",
    eyebrow: "Community",
    title: "Learn from creators and share your workflow",
    text: "Join clubs, discuss print failures, compare materials, and level up through practical maker feedback.",
    statLabel: "Built For",
    statValue: "Collaboration",
  },
  {
    id: "start",
    eyebrow: "Ready",
    title: "Choose how you want to enter",
    text: "Continue as a guest to browse now, or sign in to publish, sell, and manage your designs.",
    statLabel: "Get Started",
    statValue: "In Seconds",
  },
];

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
                <article className="rounded-3xl border border-white/15 bg-black/28 p-7 backdrop-blur-sm md:p-10">
                  <p className="mb-4 text-[10px] font-tech uppercase tracking-[0.32em] text-white/65">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mb-4 font-display text-3xl font-medium leading-tight md:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                    {slide.text}
                  </p>

                  {!isLast && (
                    <button
                      type="button"
                      onClick={() => jumpToSlide(index + 1)}
                      className="mt-8 rounded-full border border-white/35 px-5 py-2 text-xs font-tech uppercase tracking-[0.2em] text-white hover:bg-white/10"
                    >
                      Next Benefit
                    </button>
                  )}
                </article>

                <aside className="rounded-3xl border border-white/15 bg-black/28 p-6 backdrop-blur-sm md:p-8">
                  <p className="text-[10px] font-tech uppercase tracking-[0.24em] text-sky-200/85">At a glance</p>
                  <div className="mt-3 rounded-2xl border border-sky-200/35 bg-sky-200/10 p-5">
                    <p className="text-xs font-tech uppercase tracking-[0.22em] text-sky-100/75">{slide.statLabel}</p>
                    <p className="mt-2 font-display text-2xl text-white md:text-3xl">{slide.statValue}</p>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-white/70 md:text-sm">
                    Tip: use scroll, the side dots, or the Next Benefit button to move through this intro.
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