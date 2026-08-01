/* eslint-disable */
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Sparkles, Hammer, Share2, Tag, Box, ArrowRight, MessageSquare } from "lucide-react";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import BrandLogo from "@/components/BrandLogo";
import SalePrice from "@/components/SalePrice";
import UserBadges from "@/components/UserBadges";
import SafeImage from "@/components/SafeImage";
import StarryBackground from "@/components/StarryBackground";
import ActivityFeed from "@/components/ActivityFeed";
import { RevealOnScroll, TiltCard, FloatingParticles, KenBurns } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

const CATEGORIES = [
  { name: "Decor", icon: "✦" },
  { name: "Tools", icon: "◈" },
  { name: "Toys", icon: "◉" },
  { name: "Art", icon: "❖" },
  { name: "Functional", icon: "◆" },
  { name: "Other", icon: "○" },
];

const HONEYCOMB_ROWS = 10;
const HONEYCOMB_COLS = 12;
const HONEYCOMB_CELLS = Array.from({ length: HONEYCOMB_ROWS * HONEYCOMB_COLS }, (_v, idx) => {
  const row = Math.floor(idx / HONEYCOMB_COLS);
  const col = idx % HONEYCOMB_COLS;
  return { row, col, offset: row % 2 };
});

const GREETINGS = [
  "Design. Print. Sell.",
  "Your 3D printing universe",
  "Create something real",
  "From idea to object",
  "Make it printable",
  "The maker's marketplace",
  "Print what you design",
  "Your workshop, online",
];

const TIME_BASED_GREETINGS = {
  morning: ["Good morning, maker", "Start creating today", "Fresh ideas await"],
  afternoon: ["Good afternoon, maker", "Keep designing", "Your next project"],
  evening: ["Good evening, maker", "Wind down with design", "Evening creativity"],
  night: ["Late night creating?", "The night is yours", "Design in the quiet"],
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(firstName) {
  const timeOfDay = getTimeOfDay();
  const timeGreetings = TIME_BASED_GREETINGS[timeOfDay];
  const randomTimeGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  
  if (firstName) {
    return `${randomTimeGreeting}, ${firstName}`;
  }
  return randomTimeGreeting;
}

function getRotatingQuote() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export default function Home() {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [listings, setListings] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState({ listings: 0, makers: 0, designs: 0 });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");
  const firstName = user?.name?.split(" ")?.[0];

  // Ambient click sparkles across the page
  const sparkles = useSparkleField();

  // Generate consistent background variation for this session
  const backgroundSeed = useMemo(() => Date.now(), []);
  const starCount = useMemo(() => 150 + Math.floor(Math.random() * 100), []); // 150-250 stars

  useEffect(() => {
    setGreeting(getGreeting(firstName));
    setQuote(getRotatingQuote());
  }, [firstName]);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(getRotatingQuote());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get("/listings"),
      api.get("/designs"),
      api.get("/stats"),
    ])
      .then(([l, d, s]) => {
        setListings(l.data);
        setDesigns(d.data);
        setStats(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byCategory = (cat) => listings.filter((l) => l.category === cat);
  const featured = listings[0];
  const trending = [...listings].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 8);

  return (
    <div data-testid="home-page" className="pt-14 min-h-screen">
      {/* Sparkle click layer — whole page feels alive */}
      {sparkles.layer}

      {/* Starry hero section */}
      <section className="relative min-h-[60vh] bg-black auto-glow-pulse">
        <StarryBackground 
          starCount={starCount} 
          variationSeed={backgroundSeed}
          className="absolute inset-0"
        />
        <FloatingParticles count={10} className="absolute inset-0" color="rgba(167,139,250,0.3)" />
        <div className="relative z-10 px-6 md:px-12 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-white/60 mb-4 rise-in rise-in-1">
            <span>●</span> {greeting}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter leading-[0.95] max-w-3xl text-white mb-6 rise-in rise-in-2">
            {quote}
          </h1>
          <p className="text-sm max-w-xl leading-relaxed text-white/70 mb-8 rise-in rise-in-3">
            Design what you imagine, print what you create, and share it with makers everywhere.
          </p>
          <div className="flex gap-3 flex-wrap justify-center rise-in rise-in-4">
            <button
              data-testid="hero-design-btn"
              onClick={() => navigate("/designer")}
              className="px-6 py-2.5 bg-white hover:bg-white/90 text-black rounded-xl font-tech text-xs uppercase tracking-wider inline-flex items-center gap-2 auto-glow-pulse"
            >
              <Hammer className="h-3.5 w-3.5" /> Start designing
            </button>
            <button
              data-testid="hero-browse-btn"
              onClick={() => navigate("/browse")}
              className="px-6 py-2.5 border border-white/30 text-white hover:bg-white/10 rounded-xl font-tech text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              Browse marketplace <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {!user && (
              <button
                data-testid="hero-signup-btn"
                onClick={() => openAuth("signup")}
                className="px-6 py-2.5 border border-white/30 text-white hover:bg-white/10 rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                Sign up free
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category ribbon */}
      <div className="border-b border-border bg-card/40 rise-in">
        <div className="px-6 md:px-12 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            data-testid="ribbon-all"
            onClick={() => navigate("/browse")}
            className="shrink-0 px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] text-foreground hover:text-primary"
          >
            All listings
          </button>
          <span className="text-muted-foreground">·</span>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              data-testid={`ribbon-${c.name.toLowerCase()}`}
              onClick={() => navigate(`/browse?cat=${c.name}`)}
              className="shrink-0 px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-primary mr-1.5">{c.icon}</span>{c.name}
            </button>
          ))}
          <span className="text-muted-foreground">·</span>
          <button
            data-testid="ribbon-community"
            onClick={() => navigate("/designs")}
            className="shrink-0 px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] text-accent hover:opacity-80"
          >
            Open designs
          </button>
          <button
            data-testid="ribbon-pro"
            onClick={() => navigate("/pro")}
            className="ml-auto shrink-0 px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] text-accent hover:opacity-80 flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" /> Hyperspace $4.99
          </button>
        </div>
      </div>

{/* Featured listing + community stat */}
      <RevealOnScroll>
        <section className="px-6 md:px-12 py-10 auto-glow-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {featured ? (
              <TiltCard maxTilt={4} glare={false}>
                <Link to={`/listing/${featured.listing_id}`} data-testid="featured-listing-card" className="block rounded-2xl bg-card overflow-hidden group shadow-sm hover:shadow-lg transition-shadow auto-float">
                  <div className="aspect-square bg-secondary border-b border-border overflow-hidden">
                    {featured.image_paths?.[0] ? (
                      <SafeImage src={fileUrl(featured.image_paths[0])} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Box className="h-12 w-12" strokeWidth={1.2} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-accent mb-1">Featured</div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-base font-medium truncate">{featured.title}</span>
                      <SalePrice
                        isOnSale={featured.is_on_sale}
                        baseOriginalPrice={featured.base_original_price ?? featured.price}
                        activeSalePrice={featured.active_sale_price}
                        saleClassName="text-sm"
                        baseClassName="text-xs"
                      />
                    </div>
                    <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-1">
                      by {featured.seller_name} <UserBadges isPro={featured.seller_is_pro} isPlatformOwner={featured.seller_is_platform_owner} milestoneBadges={featured.seller_milestone_badges} className="inline-flex align-middle ml-1" />
                    </div>
                  </div>
                </Link>
              </TiltCard>
            ) : (
              <Tile
                kicker="Why Print Cosmos"
                title="3 ways to be here"
                body="Browse prints, share open designs, or sell what you ship."
                cta="See the intro"
                onClick={() => navigate("/intro")}
                icon={<Sparkles className="h-6 w-6 text-accent" strokeWidth={1.5} />}
                testid="why-tile"
              />
            )}
            <TiltCard maxTilt={4} glare={false}>
              <Link
                to="/designs"
                data-testid="designs-stat-card"
                className="block rounded-2xl bg-card p-5 shadow-sm hover:shadow-lg transition-shadow group auto-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Share2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="font-display text-2xl font-medium tracking-tight">{stats.designs}</div>
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Open community designs — remix-ready STLs from makers like you
                </div>
              </Link>
            </TiltCard>
          </div>
        </section>
      </RevealOnScroll>

      {/* Trending row */}
      {trending.length > 0 && (
        <Section title="Trending now" onSeeAll={() => navigate("/browse")} testid="section-trending">
          <ProductRow items={trending} />
        </Section>
      )}

      <section className="px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="discovery-grid">
          <Tile
            kicker="For your lab"
            title="Launch your storefront"
            body="Deploy your next listing with category-aware templates and filament metadata."
            cta="Open seller panel"
            onClick={() => navigate("/create")}
            icon={<Tag className="h-5 w-5 text-primary" strokeWidth={1.5} />}
            accent="bg-primary/10"
            testid="discovery-sell-tile"
          />
          <Tile
            kicker="For your pipeline"
            title="Draft in design studio"
            body="Push ideas into printable geometry with scene controls and remix-ready exports."
            cta="Open studio"
            onClick={() => navigate("/designer")}
            icon={<Hammer className="h-5 w-5 text-blue-400" strokeWidth={1.5} />}
            accent="bg-blue-400/10"
            testid="discovery-designer-tile"
          />
          <Tile
            kicker="For your messages"
            title="Talk to makers"
            body="Coordinate custom requests, revisions, and delivery terms in direct threads."
            cta="Open inbox"
            onClick={() => navigate(user ? "/messages" : "/browse")}
            icon={<MessageSquare className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />}
            accent="bg-emerald-400/10"
            testid="discovery-messages-tile"
          />
          <Tile
            kicker="For your growth"
            title="Upgrade to Hyperspace"
            body="Drop selling fees and highlight your identity in search, listings, and buyer DMs."
            cta="See Hyperspace"
            onClick={() => navigate("/pro")}
            icon={<Sparkles className="h-5 w-5 text-accent" strokeWidth={1.5} />}
            accent="bg-accent/10"
            testid="discovery-pro-tile"
          />
        </div>
      </section>

      {/* Category rows */}
      {CATEGORIES.map((c, idx) => {
        const items = byCategory(c.name);
        if (!items.length) return null;
        return (
          <Section
            key={c.name}
            title={c.name === "Decor" ? "Top in Decor" : c.name === "Tools" ? "Useful tools, 3D-printed" : `In ${c.name}`}
            onSeeAll={() => navigate(`/browse?cat=${c.name}`)}
            testid={`section-${c.name.toLowerCase()}`}
            idx={idx}
          >
            <ProductRow items={items} />
          </Section>
        );
      })}

      {/* Empty state when no listings at all */}
      {!loading && listings.length === 0 && (
        <section className="px-6 md:px-12 py-12">
          <div className="border border-dashed border-border rounded-2xl py-16 px-8 text-center max-w-2xl mx-auto rise-in">
            <Box className="h-10 w-10 mx-auto mb-4 text-muted-foreground strokeWidth={1.2} auto-float" />
            <h2 className="font-display text-2xl font-medium tracking-tight mb-3">The market opens with you</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              No one's posted a print yet. List your first item and you'll be the storefront on this page.
            </p>
            <button
              onClick={() => user ? navigate("/create") : openAuth("signup")}
              data-testid="home-empty-cta"
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-tech text-xs uppercase tracking-wider auto-glow-pulse"
            >
              {user ? "List your first print" : "Sign up to sell"}
            </button>
          </div>
        </section>
      )}

      {user && (
        <section className="px-6 md:px-12 py-8">
          <div className="max-w-2xl">
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">Your feed</div>
            <ActivityFeed />
          </div>
        </section>
      )}

      <footer className="border-t border-border px-6 md:px-12 py-10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
        <div className="flex items-center gap-3">
          <BrandLogo alt={BRAND_NAME} className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <Link to="/terms" data-testid="footer-terms-link" className="hover:text-primary">Terms & Conditions</Link>
          <span>·</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary">{SUPPORT_EMAIL}</a>
          <span>·</span>
          <Link to="/docs" className="hover:text-accent">Documentation</Link>
          <span>·</span>
          <span>3.5% standard · 2% with Hyperspace · Stripe-secured</span>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, onSeeAll, children, testid, idx = 0 }) {
  const delayClass = `rise-in-${Math.min((idx % 4) + 1, 4)}`;
  return (
    <section data-testid={testid} className="px-6 md:px-12 py-8">
      <div className={`flex items-end justify-between mb-4 rise-in ${delayClass}`}>
        <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight">{title}</h2>
        <button onClick={onSeeAll} className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          See all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {children}
    </section>
  );
}

function ProductRow({ items }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      {items.map((it) => (
        <ProductCard key={it.listing_id} item={it} />
      ))}
    </div>
  );
}

function ProductCard({ item }) {
  return (
    <Link
      to={`/listing/${item.listing_id}`}
      data-testid={`home-card-${item.listing_id}`}
      className="snap-start shrink-0 w-44 group block rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow auto-float"
    >
      <div className="aspect-square bg-secondary overflow-hidden relative rounded-t-2xl">
        {item.image_paths?.[0] ? (
          <SafeImage src={fileUrl(item.image_paths[0])} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Box className="h-8 w-8" strokeWidth={1.2} />
          </div>
        )}
        {item.share_design && (
          <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-tech uppercase tracking-wider rounded-full">
            <Share2 className="h-2.5 w-2.5" /> Open
          </div>
        )}
        {item.rating_count > 0 && (
          <div className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-background/90 backdrop-blur-sm text-[9px] font-tech rounded-full">
            ★ {item.rating_avg?.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-medium leading-tight truncate">{item.title}</h3>
          <div className="whitespace-nowrap">
            {item.negotiable ? (
              <span className="font-tech text-sm text-primary">neg.</span>
            ) : (
              <SalePrice
                isOnSale={item.is_on_sale}
                baseOriginalPrice={item.base_original_price ?? item.price}
                activeSalePrice={item.active_sale_price}
                saleClassName="text-sm"
                baseClassName="text-xs"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground">by</span>
          {item.seller_picture ? (
            <img src={item.seller_picture} alt="" className="h-4 w-4 rounded-full border border-border object-cover" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-border bg-secondary flex items-center justify-center text-[8px] font-tech">
              {item.seller_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground truncate">{item.seller_name}</span>
          <UserBadges isPro={item.seller_is_pro} isPlatformOwner={item.seller_is_platform_owner} milestoneBadges={item.seller_milestone_badges} className="inline-flex" />
        </div>
      </div>
    </Link>
  );
}

function Tile({ kicker, title, body, cta, onClick, icon, accent = "bg-primary/10", testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="text-left rounded-2xl bg-card p-5 shadow-sm hover:shadow-lg transition-shadow group auto-float"
    >
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3 ${accent}`}>{icon}</div>
      <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-1">{kicker}</div>
      <div className="font-display font-medium mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-3 leading-relaxed">{body}</div>
      <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-primary inline-flex items-center gap-1 group-hover:underline">
        {cta} <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  );
}
