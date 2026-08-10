import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import NovaMascot from "@/components/NovaMascot";

export const markIntroSeen = () => {
  try {
    localStorage.setItem("pf_intro_seen", "1");
  } catch (_e) {
    // Ignore storage failures in restricted browser contexts.
  }
};

const PLATFORM_PILLARS = [
  {
    title: "Design in Browser",
    text: "Sketch, tweak, and validate printable models without leaving your tab.",
  },
  {
    title: "Buy From Makers",
    text: "Discover prints crafted by independent creators across every category.",
  },
  {
    title: "Launch Your Store",
    text: "List creations, manage orders, and grow with transparent low platform fees.",
  },
  {
    title: "Build Community",
    text: "Share techniques, join clubs, and collaborate with other print enthusiasts.",
  },
];

const QUICK_STEPS = [
  "Pick a model or start from scratch",
  "Tune material and print settings",
  "Publish, sell, and ship worldwide",
];

export default function Intro() {
  const navigate = useNavigate();
  const { openAuth } = useAuth();

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
      className="fixed inset-0 overflow-y-auto bg-black text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at 18% 18%, rgba(250, 204, 21, 0.22), transparent 40%), radial-gradient(circle at 84% 12%, rgba(56, 189, 248, 0.22), transparent 44%), radial-gradient(circle at 50% 78%, rgba(99, 102, 241, 0.2), transparent 48%), linear-gradient(165deg, #04070f 0%, #090f1d 50%, #12111f 100%)",
      }}
    >
      <div className="min-h-screen px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <header className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/25 px-5 py-4 backdrop-blur-sm">
            <BrandLogo alt="Print Cosmos" className="h-10 w-auto object-contain" />
            <p className="text-[10px] font-tech uppercase tracking-[0.28em] text-white/70">
              Welcome to Print Cosmos
            </p>
          </header>

          <section className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-white/15 bg-black/30 p-6 md:p-8">
              <p className="mb-4 text-[10px] font-tech uppercase tracking-[0.34em] text-amber-200/80">
                New Intro Experience
              </p>
              <h1 className="mb-4 font-display text-3xl font-medium leading-tight text-white md:text-5xl">
                Design, print, and sell in one focused workspace.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                This is the new launchpad: clear, fast, and static. No cinematic sequence, just the essentials you need to start creating and earning with confidence.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {PLATFORM_PILLARS.map((pillar) => (
                  <article
                    key={pillar.title}
                    className="rounded-2xl border border-white/12 bg-black/35 p-4"
                  >
                    <h2 className="mb-1 font-display text-base text-white">{pillar.title}</h2>
                    <p className="text-xs leading-relaxed text-white/72 md:text-sm">{pillar.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-5 rounded-3xl border border-white/15 bg-black/30 p-6 md:p-8">
              <div className="rounded-2xl border border-cyan-200/35 bg-cyan-100/10 p-4">
                <p className="text-[10px] font-tech uppercase tracking-[0.28em] text-cyan-100/90">
                  Meet The Mascot
                </p>
                <h2 className="mt-2 font-display text-xl text-white">Nova</h2>
                <p className="mt-2 text-sm leading-relaxed text-cyan-50/85">
                  Nova is our studio fox: sharp, curious, and practical. You will see Nova across onboarding and guidance moments throughout the platform.
                </p>
                <div className="mt-4 rounded-xl border border-cyan-100/25 bg-black/25 p-4">
                  <NovaMascot />
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-black/30 p-4">
                <h3 className="font-display text-base text-white">Start in 3 steps</h3>
                <ol className="mt-3 space-y-2 text-sm text-white/78">
                  {QUICK_STEPS.map((step, index) => (
                    <li key={step}>
                      <span className="mr-2 text-white/95">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </section>

          <section className="rounded-3xl border border-white/15 bg-black/35 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-2xl text-white">Choose how you want to enter</h2>
                <p className="mt-2 text-sm text-white/72 md:text-base">
                  Continue as a guest to browse immediately, or sign in to publish listings and manage your store.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleGuest}
                  variant="outline"
                  size="lg"
                  className="border-white/40 bg-white/10 px-8 font-tech text-xs uppercase tracking-wider text-white hover:bg-white/20"
                  data-testid="continue-guest-btn"
                >
                  Continue as Guest
                </Button>
                <Button
                  onClick={handleSignUp}
                  size="lg"
                  className="bg-white px-8 font-tech text-xs uppercase tracking-wider text-black hover:bg-white/90"
                  data-testid="signup-btn"
                >
                  Sign Up / Sign In
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}