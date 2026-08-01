import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Share2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import WireframeCube from "@/components/WireframeCube";
import SafeImage from "@/components/SafeImage";
import SalePrice from "@/components/SalePrice";
import UserBadges from "@/components/UserBadges";
import StarfieldRenderer from "@/components/StarfieldRenderer";
import DaytimeScene, { getSeason } from "@/components/DaytimeScene";
import ListingStar from "@/components/ListingStar";
import Bob, { BobPro } from "@/components/Bob";
import TentScene from "@/components/TentScene";
import MoonViewer from "@/components/MoonViewer";
import { useSparkleField } from "@/hooks/useAmbientLife";

// ====================================================================
// SECTION 1: Constants & Configuration
// ====================================================================

const CATEGORIES = ["All", "Decor", "Tools", "Toys", "Art", "Functional", "Other"];

const PRINT_TIME_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "under_1_hour", label: "Under 1 hour" },
  { value: "1-4_hours", label: "1-4 hours" },
  { value: "4-12_hours", label: "4-12 hours" },
  { value: "12-24_hours", label: "12-24 hours" },
  { value: "weekend", label: "Weekend project" },
];

const SKY_MODE_OPTIONS = [
  { mode: "night", icon: "\u263E", title: "Night (always)" },
  { mode: "day", icon: "\u2600\uFE0F", title: "Day (always)" },
  { mode: "time", icon: "\uD83D\uDD52", title: "Time (follows your local time)" },
];

const SELLER_TYPE_COLORS = {
  service:    { r: 180, g: 140, b: 255 },
  designer:   { r: 100, g: 180, b: 255 },
  traditional:{ r: 240, g: 245, b: 255 },
  finished:   { r: 240, g: 245, b: 230 },
};

const PRO_COLOR = { r: 255, g: 215, b: 0 };

const TREE_SILHOUETTES = [
  { x: 5, scale: 1.4 },
  { x: 14, scale: 1.1 },
  { x: 22, scale: 1.6 },
  { x: 32, scale: 1.0 },
  { x: 40, scale: 1.5 },
  { x: 50, scale: 1.2 },
  { x: 58, scale: 1.7 },
  { x: 68, scale: 1.1 },
  { x: 76, scale: 1.4 },
  { x: 85, scale: 1.0 },
  { x: 92, scale: 1.3 },
];

// ====================================================================
// SECTION 2: Pure Utility Functions (no React hooks)
// ====================================================================

/**
 * Get the color for a listing star based on seller type and pro status.
 */
function getListingColor(item) {
  const isPro = item.seller_is_pro === true;
  if (isPro) return PRO_COLOR;
  if (item.listing_type === "service") return SELLER_TYPE_COLORS.service;
  if (item.share_design) return SELLER_TYPE_COLORS.designer;
  if (item.listing_type === "product") return SELLER_TYPE_COLORS.traditional;
  return SELLER_TYPE_COLORS.traditional;
}

/**
 * Calculate how many days ago a listing was created.
 */
function getListingAgeDays(item) {
  if (!item.created_at) return 365;
  return Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get brightness/glow parameters based on listing age (newer = brighter).
 */
function getListingAgeBrightness(ageDays) {
  if (ageDays < 1)  return { baseOpacity: 1.0, glowSpread: 18, twinkleDuration: 0.8 };
  if (ageDays < 7)  return { baseOpacity: 0.85, glowSpread: 14, twinkleDuration: 1.5 };
  if (ageDays < 30) return { baseOpacity: 0.7, glowSpread: 10, twinkleDuration: 2.5 };
  return { baseOpacity: 0.55, glowSpread: 7, twinkleDuration: 4.0 };
}

/**
 * Generate deterministic pseudo-random positions for listing stars.
 */
function generateListingPositions(count, seed) {
  const positions = [];
  let seedValue = seed;
  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };
  for (let i = 0; i < count; i++) {
    positions.push({ x: random() * 100, y: random() * 100 });
  }
  return positions;
}

/**
 * Sort listings: local sellers first, then by creation date (newest first).
 */
function sortListings(listings, userCountry) {
  return [...listings].sort((a, b) => {
    const aIsLocal = userCountry && a.seller_country === userCountry ? 0 : 1;
    const bIsLocal = userCountry && b.seller_country === userCountry ? 0 : 1;
    if (aIsLocal !== bIsLocal) return aIsLocal - bIsLocal;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

/**
 * Compute content title based on loading/empty/category state.
 */
function getContentTitle(loading, items, cat) {
  if (loading) return "Loading the cosmos...";
  if (items.length === 0) return "No listings in " + cat;
  return cat === "All" ? "Explore the marketplace" : "Browse " + cat + " prints";
}

/**
 * Compute content description based on loading/empty/category state.
 */
function getContentDescription(loading, items, cat) {
  if (loading) {
    return "Scanning for " + (cat !== "All" ? cat.toLowerCase() : "all") + " listings in the marketplace.";
  }
  if (items.length === 0) {
    return "There are no listings matching this category yet. Try a different category or come back later — makers are adding new prints every day.";
  }
  return "Found " + items.length + " listing" + (items.length !== 1 ? "s" : "") + (cat !== "All" ? " in " + cat.toLowerCase() : "") + ". Zoom in with the scroll wheel to reveal cards, then click a star to view details.";
}

/**
 * Get item count string for metadata.
 */
function getItemCountStr(loading, items) {
  return (!loading && items.length > 0) ? (" \u00B7 " + items.length + " item" + (items.length !== 1 ? "s" : "")) : "";
}

/**
 * Build the solar computation from latitude/longitude.
 */
function computeSolarPhase(skyMode, userCoords) {
  if (skyMode === "day") return { isDay: true, solarPhase: 0.5 };
  if (skyMode === "night") return { isDay: false, solarPhase: 0.5 };
  if (!userCoords) return { isDay: false, solarPhase: 0.5 };

  const { lat, lon } = userCoords;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const decl = 0.006918 - 0.399912 * Math.cos(2 * Math.PI * dayOfYear / 365) + 0.070257 * Math.sin(2 * Math.PI * dayOfYear / 365) - 0.006758 * Math.cos(4 * Math.PI * dayOfYear / 365) + 0.000907 * Math.sin(4 * Math.PI * dayOfYear / 365);
  const latRad = lat * Math.PI / 180;
  const cosH = -Math.tan(latRad) * Math.tan(decl);

  if (cosH < -1) return { isDay: true, solarPhase: 0.5 };
  if (cosH > 1) return { isDay: false, solarPhase: 0.5 };

  const H = Math.acos(cosH) * 180 / Math.PI;
  const B = 2 * Math.PI * (dayOfYear - 1) / 365;
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B) - 0.014615 * Math.cos(2 * B) - 0.04089 * Math.sin(2 * B));

  const solarNoonUTC = 720 - 4 * lon - eot;
  const sunriseUTC = solarNoonUTC - H * 4;
  const sunsetUTC = solarNoonUTC + H * 4;
  const nowUTC = now.getUTCHours() * 60 + now.getUTCMinutes();
  const dayLength = sunsetUTC - sunriseUTC;
  const solarPhase = dayLength > 0 ? Math.max(0, Math.min(1, (nowUTC - sunriseUTC) / dayLength)) : 0.5;

  return {
    isDay: nowUTC >= sunriseUTC && nowUTC <= sunsetUTC,
    solarPhase,
  };
}

// ====================================================================
// SECTION 3: Visual Sub-components
// ====================================================================

/**
 * Ambient meteor shower — periodic shooting stars crossing the night sky.
 * Renders a few meteors at staggered delays for a natural, alive feel.
 */
function MeteorShower() {
  const meteors = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      top: 5 + Math.random() * 60,
      left: 5 + Math.random() * 30,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 4,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" aria-hidden="true">
      {meteors.map((m) => (
        <div
          key={m.id}
          className="absolute ambient-meteor"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        >
          <div className="ambient-meteor-tail h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" style={{ transform: "rotate(35deg)" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Scroll hint overlay shown at the bottom center — tells users to scroll to zoom.
 */
function ScrollHint({ visible }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center"
      style={{ animation: "fadeInUp 0.6s ease-out" }}
    >
      <div className="flex flex-col items-center gap-1 bg-black/40 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-white/80 ambient-scroll-hint">
          Scroll to zoom in
        </div>
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" className="ambient-scroll-hint">
          <rect x="1" y="1" width="16" height="24" rx="8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
          <circle cx="9" cy="8" r="2.4" fill="rgba(255,255,255,0.7)" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Tree silhouettes at the bottom of the night sky (matching intro aesthetic).
 */
  function TreeSilhouettes() {
    return (
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-10 ambient-drift" style={{ height: "120px" }}>
      <svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" className="w-full h-full" opacity="0.5">
        {TREE_SILHOUETTES.map((tree, i) => (
          <g key={i} transform={`translate(${tree.x}, 0) scale(${tree.scale})`}>
            {/* Trunk */}
            <rect x="-1" y="20" width="2" height="80" fill="#000" />
            {/* Pine layers */}
            <polygon points="0,0 -8,20 8,20" fill="#000" />
            <polygon points="0,5 -7,22 7,22" fill="#000" />
            <polygon points="0,10 -6,24 6,24" fill="#000" />
            <polygon points="0,15 -5,26 5,26" fill="#000" />
            <polygon points="0,18 -4,28 4,28" fill="#000" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Earth view SVG for space mode (day sky zoomed out).
 */
function EarthView() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
      <svg width="520" height="220" viewBox="0 0 520 220">
        <defs>
          <radialGradient id="earthGrad" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="35%" stopColor="#2563eb" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </radialGradient>
          <clipPath id="earthClip"><rect x="0" y="0" width="520" height="220" /></clipPath>
        </defs>
        <circle cx="260" cy="320" r="280" fill="url(#earthGrad)" clipPath="url(#earthClip)" />
        <circle cx="260" cy="320" r="292" fill="none" stroke="#60a5fa" strokeWidth="8" opacity="0.25" clipPath="url(#earthClip)" />
        <ellipse cx="180" cy="160" rx="38" ry="28" fill="#16a34a" opacity="0.7" clipPath="url(#earthClip)" />
        <ellipse cx="310" cy="140" rx="50" ry="22" fill="#15803d" opacity="0.65" clipPath="url(#earthClip)" />
        <ellipse cx="370" cy="175" rx="28" ry="18" fill="#166534" opacity="0.6" clipPath="url(#earthClip)" />
        <ellipse cx="140" cy="195" rx="22" ry="14" fill="#16a34a" opacity="0.55" clipPath="url(#earthClip)" />
        <ellipse cx="230" cy="130" rx="45" ry="10" fill="white" opacity="0.18" clipPath="url(#earthClip)" />
        <ellipse cx="340" cy="155" rx="35" ry="8" fill="white" opacity="0.15" clipPath="url(#earthClip)" />
      </svg>
    </div>
  );
}

/**
 * Sun icon in space view.
 */
function SunIcon() {
  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
      <div style={{
        width: "70px",
        height: "70px",
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff9c4 0%, #fde047 40%, #f59e0b 100%)",
        boxShadow: "0 0 60px 30px rgba(253,224,71,0.4), 0 0 120px 60px rgba(245,158,11,0.15)",
      }} />
    </div>
  );
}

/**
 * AuroraLayer — a slowly-pulsing nebula/aurora backdrop that drifts behind the
 * night sky starfield. Gives the sky depth and makes it feel alive.
 */
function AuroraLayer() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {/* Nebula blobs */}
      <div
        className="aurora-layer absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          left: "-10vw",
          top: "-12vh",
          background:
            "radial-gradient(circle, rgba(100,60,180,0.16) 0%, rgba(0,229,255,0.05) 40%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="aurora-layer absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          right: "-8vw",
          top: "30vh",
          background:
            "radial-gradient(circle, rgba(40,120,220,0.14) 0%, rgba(255,87,34,0.04) 45%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="aurora-layer absolute rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          left: "30vw",
          bottom: "-15vh",
          background:
            "radial-gradient(circle, rgba(120,80,220,0.12) 0%, rgba(0,229,255,0.04) 50%, transparent 70%)",
          filter: "blur(36px)",
          animationDelay: "-16s",
        }}
      />
    </div>
  );
}

/**
 * Sponsored ad banner displayed on the starfield.
 */
function SponsoredAd({ ad, loading }) {
  if (!ad || loading) return null;
  return (
    <Link
      to={ad.target_type === "listing" ? "/listing/" + ad.target_id : "/designs"}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
      data-testid="sponsored-ad"
    >
      <div className="max-w-sm w-full rounded-xl border border-accent/40 bg-black/80 backdrop-blur-md p-3 shadow-lg">
        <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-accent mb-1">Sponsored</div>
        <div className="text-xs font-tech text-white/90 mb-1">{ad.blurb}</div>
        <div className="text-[10px] font-tech text-white/60">by {ad.seller_name} · {ad.target_name || ad.target_type}</div>
      </div>
    </Link>
  );
}

/**
 * ListingCard — traditional card view for items (UNUSED in star view but kept for potential grid view).
 */
function ListingCard({ item }) {
  const cover = item.image_paths && item.image_paths.length > 0 ? item.image_paths[0] : null;
  return (
    <Link to={"/listing/" + item.listing_id} data-testid={"listing-card-" + item.listing_id} className="group block rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-secondary overflow-hidden relative rounded-t-2xl">
        {cover ? (
          <SafeImage src={fileUrl(cover)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground font-tech text-xs">NO IMAGE</div>
        )}
        {item.share_design && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-[9px] font-tech uppercase tracking-wider rounded-full">
            <Share2 className="h-3 w-3" /> Open design
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-display text-base font-medium leading-tight">{item.title}</h3>
          <div className="whitespace-nowrap">
            <SalePrice
              isOnSale={item.is_on_sale}
              baseOriginalPrice={item.base_original_price != null ? item.base_original_price : item.price}
              activeSalePrice={item.active_sale_price}
              saleClassName="text-sm"
              baseClassName="text-xs"
            />
          </div>
        </div>
        <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">
          by {item.seller_name} <UserBadges isPro={item.seller_is_pro} isPlatformOwner={item.seller_is_platform_owner} milestoneBadges={item.seller_milestone_badges} className="inline-flex align-middle ml-1" /> · {item.category}
        </div>
      </div>
    </Link>
  );
}

/**
 * EmptyState — shown when no listings match the current filters.
 */
function EmptyState({ cat }) {
  return (
    <div className="border border-dashed border-border rounded-2xl py-20 px-6 text-center flex flex-col items-center">
      <div className="mb-6 opacity-90"><WireframeCube size={104} /></div>
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Nothing here yet</div>
      <h3 className="font-display text-2xl font-medium mb-3">No {cat !== "All" ? cat.toLowerCase() : ""} listings found</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
        No listings match your filters yet. Try clearing the search box or adjusting the category chips above.
      </p>
      <Link
        to="/designer/new"
        data-testid="browse-empty-cta"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-primary bg-primary/10 hover:bg-primary/20 text-primary font-tech text-xs uppercase tracking-[0.2em] transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Design your first print
      </Link>
    </div>
  );
}

/**
 * MoonViewer toggle button.
 */
function MoonButton({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-6 right-6 z-30 pointer-events-auto" aria-label="View the moon" title="View the moon">
      <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg transition-transform hover:scale-110">
        <circle cx="24" cy="24" r="20" fill="#e8e0d0" stroke="#c8c0b0" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="4" fill="#c8b8a0" opacity="0.6" />
        <circle cx="30" cy="22" r="3" fill="#c8b8a0" opacity="0.5" />
        <circle cx="22" cy="30" r="2.5" fill="#c8b8a0" opacity="0.4" />
        <circle cx="32" cy="30" r="2" fill="#c8b8a0" opacity="0.3" />
      </svg>
    </button>
  );
}

// ====================================================================
// SECTION 4: Hook Utilities (custom hook helpers)
// ====================================================================

/**
 * Hook to fetch user's country and coordinates via ipapi.co.
 */
function useUserLocation() {
  const [userCountry, setUserCountry] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const r = await fetch("https://ipapi.co/json/");
        const data = await r.json();
        setUserCountry(data.country_code);
        if (data.latitude != null && data.longitude != null) {
          setUserCoords({ lat: data.latitude, lon: data.longitude });
        }
      } catch (err) {
        console.warn("Could not fetch user country:", err);
      }
    };
    fetchLocation();
  }, []);

  return { userCountry, userCoords };
}

/**
 * Hook to manage sky mode (night/day/time) with localStorage persistence.
 */
function useSkyMode(userCoords) {
  const [skyMode, setSkyModeState] = useState(() => {
    try { return localStorage.getItem("pf_sky_mode") || "night"; } catch { return "night"; }
  });
  const [spaceView, setSpaceView] = useState(false);

  const saveSkyMode = useCallback((mode) => {
    setSkyModeState(mode);
    setSpaceView(false);
    try { localStorage.setItem("pf_sky_mode", mode); } catch { /* ignore */ }
  }, []);

  const { isDay, solarPhase } = useMemo(
    () => computeSolarPhase(skyMode, userCoords),
    [skyMode, userCoords]
  );

  useEffect(() => {
    if (!isDay) setSpaceView(false);
  }, [isDay]);

  return { skyMode, saveSkyMode, isDay, solarPhase, spaceView, setSpaceView };
}

/**
 * Hook to manage browse first-visit tour with Bob.
 */
function useBobFirstVisit() {
  const [bobState, setBobState] = useState("idle");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    try {
      const hasVisitedBrowse = localStorage.getItem("pf_browse_visited");
      if (!hasVisitedBrowse) {
        setFirstVisit(true);
        localStorage.setItem("pf_browse_visited", "1");
      }
    } catch (err) {
      console.warn("Could not check browse visit status:", err);
    }
  }, []);

  useEffect(() => {
    if (firstVisit) {
      setBobState("walking");
      const t1 = setTimeout(() => {
        setBobState("introducing");
        setShowSpeechBubble(true);
      }, 2000);
      const t2 = setTimeout(() => {
        setShowSpeechBubble(false);
        setBobState("walking");
      }, 6000);
      const t3 = setTimeout(() => {
        setBobState("in-tent");
      }, 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [firstVisit]);

  return { bobState, showSpeechBubble, firstVisit };
}

/**
 * Hook to manage starfield panning and zooming.
 */
function useStarfieldControls(pageRef, onUserInteractionRef = { current: () => {} }) {
  const [starOffset, setStarOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  const panRef = useRef(null);
  const zoomRef = useRef(0);

  const onWheel = useCallback((e) => {
    if (e.target.closest("a, button, input, [data-nozoom]")) return;
    
    // Only prevent default and zoom if we are over the starfield background
    // (not over the content/empty state overlays)
    if (e.target === pageRef.current || e.target.closest(".fixed.inset-0")) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      zoomRef.current = Math.max(0, Math.min(3, zoomRef.current + delta));
      setZoomLevel(zoomRef.current);
      onUserInteractionRef.current();
    }
  }, [pageRef, onUserInteractionRef]);

  const onStarfieldPointerDown = useCallback((e) => {
    if (e.target.closest("a, button, input")) return;
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: starOffset.x,
      baseY: starOffset.y,
      pointerId: e.pointerId,
    };
    setIsPanning(true);
    onUserInteractionRef.current();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }, [starOffset, onUserInteractionRef]);

  const onStarfieldPointerMove = useCallback((e) => {
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    const maxPan = Math.max(window.innerWidth, window.innerHeight);
    setStarOffset({
      x: Math.max(-maxPan, Math.min(maxPan, panRef.current.baseX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, panRef.current.baseY + dy)),
    });
  }, []);

  const onStarfieldPointerUp = useCallback((e) => {
    if (!panRef.current) return;
    try { e.currentTarget.releasePointerCapture(panRef.current.pointerId); } catch { /* ignore */ }
    panRef.current = null;
    setIsPanning(false);
  }, []);

return {
    starOffset, zoomLevel, isPanning, setZoomLevel, setStarOffset,
    onWheel, onStarfieldPointerDown, onStarfieldPointerMove, onStarfieldPointerUp,
  };
}

/**
 * Hook for ambient auto-interactions — the page feels alive without user input.
 * Drives gentle auto-zoom breathing, auto-pan drift, and periodic highlight pulses.
 */
function useAmbientInteractions(starOffset, setStarOffset, zoomLevel, setZoomLevel) {
  const timeRef = useRef(0);
  const frameRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const userInactiveTimerRef = useRef(null);

  // Track user interaction to pause auto-effects momentarily
  const markUserInteraction = useCallback(() => {
    isUserInteractingRef.current = true;
    clearTimeout(userInactiveTimerRef.current);
    userInactiveTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;
      timeRef.current += dt;

      if (!isUserInteractingRef.current) {
        const t = timeRef.current;

        // Auto-zoom breathing: slowly oscillate between 0 and 0.8 over ~12 seconds
        const breatheZoom = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.8;
        // Blend with current user-set zoom: if user hasn't touched zoom, use auto
        // We track if user has ever scrolled — if zoomRef is 0, use auto
        if (zoomLevel < 0.01) {
          setZoomLevel(breatheZoom);
        }

        // Auto-pan drift: gentle circular motion over ~30 seconds
        const driftRadius = 30;
        const driftSpeed = 0.2;
        const driftX = Math.sin(t * driftSpeed) * driftRadius;
        const driftY = Math.cos(t * driftSpeed * 0.7) * driftRadius;
        setStarOffset({ x: driftX, y: driftY });
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      clearTimeout(userInactiveTimerRef.current);
    };
  }, [zoomLevel, setZoomLevel, setStarOffset]);

  return { markUserInteraction };
}

/**
 * Hook for mouse parallax — the starfield subtly shifts toward the cursor,
 * giving the sky depth and making it feel alive and responsive.
 */
function useMouseParallax(disabled) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetRef.current = { x: nx, y: ny };
    };
    let raf = null;
    const tick = () => {
      setParallax((prev) => ({
        x: prev.x + (targetRef.current.x * 12 - prev.x) * 0.04,
        y: prev.y + (targetRef.current.y * 8 - prev.y) * 0.04,
      }));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [disabled]);

  return parallax;
}

// ====================================================================
// SECTION 5: Main Browse Component
// ====================================================================

export default function Browse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // --- State ---
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const initialCat = CATEGORIES.includes(params.get("cat")) ? params.get("cat") : "All";
  const [cat, setCat] = useState(initialCat);
  const [printTimeFilter, setPrintTimeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(null);
  const [showMoonViewer, setShowMoonViewer] = useState(false);

  const twoFingerRef = useRef(null);
  const pageRef = useRef(null);
  const [starSeed] = useState(() => Date.now());

  // Click-anywhere sparkle feedback — the sky answers with cosmic dust
  const sparkles = useSparkleField();

  // Bob interactivity: click Bob to make him wave + speak a quick hello
  const [bobWave, setBobWave] = useState(false);
  const [bobGreeting, setBobGreeting] = useState("");
  const bobWaveTimer = useRef(null);
  const handleBobClick = useCallback(() => {
    setBobWave(true);
    const hellos = [
      "Hi! Scroll to zoom into the stars.",
      "I'm Bob! Ask me anything about Print Cosmos.",
      "Zoom in to reveal listings, then click one!",
      "Try the sky mode toggle up top.",
      "Double-click a star to explore the marketplace.",
    ];
    setBobGreeting(hellos[Math.floor(Math.random() * hellos.length)]);
    clearTimeout(bobWaveTimer.current);
    bobWaveTimer.current = setTimeout(() => setBobWave(false), 2400);
  }, []);
  const handleBobKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBobClick();
    }
  }, [handleBobClick]);
  useEffect(() => () => clearTimeout(bobWaveTimer.current), []);

  // --- Hooks ---
  const { userCountry, userCoords } = useUserLocation();
  const { skyMode, saveSkyMode, isDay, solarPhase, spaceView, setSpaceView } = useSkyMode(userCoords);
  const { bobState, showSpeechBubble } = useBobFirstVisit();

  // Create a stable ref to wire user-interaction tracking between hooks
  const markUserInteractionRef = useRef(() => {});

  // Scroll hint — visible initially, dismissed on real user interactions
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Starfield controls — manage pan/zoom state (runs first to provide state)
  const {
    starOffset, zoomLevel, isPanning, setZoomLevel, setStarOffset,
    onWheel, onStarfieldPointerDown, onStarfieldPointerMove, onStarfieldPointerUp,
  } = useStarfieldControls(pageRef, markUserInteractionRef);

  // Ambient auto-interactions — the page breathes and drifts on its own (uses starOffset/zoomLevel from above)
  const { markUserInteraction } = useAmbientInteractions(starOffset, setStarOffset, zoomLevel, setZoomLevel);
  const handleUserInteraction = useCallback(() => {
    markUserInteraction();
    setShowScrollHint(false);
  }, [markUserInteraction]);

  // Wire the real markUserInteraction into the ref so starfield controls call the latest version
  markUserInteractionRef.current = handleUserInteraction;

  // Mouse parallax — the sky subtly follows the cursor for depth and life
  const parallax = useMouseParallax(isDay && !spaceView);

  // --- Derived Data ---
  const listingPositions = useMemo(() => generateListingPositions(500, starSeed), [starSeed]);
  const contentTitle = getContentTitle(loading, items, cat);
  const contentDesc = getContentDescription(loading, items, cat);
  const contentMeta = "Marketplace" + (cat !== "All" ? " \u00B7 " + cat : "") + getItemCountStr(loading, items);

  // --- Fetch Listings ---
  useEffect(() => {
    setLoading(true);
    const reqParams = {};
    if (cat !== "All") reqParams.category = cat;
    if (q) reqParams.q = q;
    if (printTimeFilter) reqParams.print_time = printTimeFilter;

    const t = setTimeout(() => {
      api.get("/listings", { params: reqParams })
        .then((r) => setItems(sortListings(r.data || [], userCountry)))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, cat, printTimeFilter, userCountry]);

  // --- Fetch Active Ad ---
  useEffect(() => {
    api.get("/public/ads/active")
      .then((r) => {
        const ads = r.data || [];
        setActiveAd(ads.length > 0 ? ads[0] : null);
      })
      .catch(() => setActiveAd(null));
  }, []);

  // --- Surprise Me ---
  const surpriseMe = async () => {
    try {
      const r = await api.get("/listings/random");
      if (r.data?.listing_id) {
        navigate("/listing/" + r.data.listing_id);
      } else {
        toast.error("No listings found");
      }
    } catch {
      toast.error("Could not find a random listing");
    }
  };

  // --- Touch Handlers (two-finger swipe to messages) ---
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      twoFingerRef.current = { startX: (e.touches[0].clientX + e.touches[1].clientX) / 2 };
    } else {
      twoFingerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length !== 2) twoFingerRef.current = null;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!twoFingerRef.current || e.changedTouches.length < 1) return;
    const endX = (e.changedTouches[0].clientX + (e.changedTouches[1]?.clientX ?? e.changedTouches[0].clientX)) / 2;
    if (endX - twoFingerRef.current.startX > 60) {
      navigate("/messages?tab=clubs");
    }
    twoFingerRef.current = null;
  }, [navigate]);

  // --- Render Listing Stars ---
  const renderListingStars = () => {
    if (loading) return null;
    // Use a smooth reveal: dots show immediately, cards fade in as zoomLevel approaches 1+
    const revealProgress = Math.max(0, Math.min(1, (zoomLevel - 0.3) / 0.7));
    return items.map((item, index) => {
      const position = listingPositions[index % listingPositions.length];
      const color = getListingColor(item);
      const ageDays = getListingAgeDays(item);
      const ageBrightness = getListingAgeBrightness(ageDays);
      const isFiltered = cat !== "All" && item.category !== cat;
      return (
        <ListingStar
          key={item.listing_id}
          item={item}
          position={position}
          color={color}
          isFiltered={isFiltered}
          revealed={zoomLevel >= 1}
          ageBrightness={ageBrightness}
          ageDays={ageDays}
        />
      );
    });
  };

  // --- Render Content Section ---
  const renderContentSection = () => {
    if (!loading && items.length === 0) {
    return (
      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-32 pointer-events-auto">
        <EmptyState cat={cat} />
      </div>
    );
  }
  return (
      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-32 pointer-events-none">
        <div className="text-xs font-tech uppercase tracking-[0.3em] text-white/60 mb-3 rise-in rise-in-1">
          <span className="text-white">•</span> {contentMeta}
        </div>
        <h1 className={"font-display text-4xl sm:text-5xl font-light tracking-tighter mb-6 text-white rise-in rise-in-2" + (loading ? " animate-pulse" : "")}>
          {contentTitle}
        </h1>
        <p className={(loading ? "text-white/50" : "text-white/70") + " text-sm max-w-xl rise-in rise-in-3"}>
          {contentDesc}
        </p>
      </div>
    );
  };

  // --- Render Bob & Tent Scene ---
  const renderBobAndTent = () => {
    if (isDay) return null;
    const isVisible = bobState === "walking" || bobState === "introducing";
    // After first-visit tour, show Bob as idle and clickable near the tent
    const isIdle = bobState === "in-tent";
    return (
      <>
        {(isVisible || isIdle) && (
          <div
            className="pointer-events-auto"
            style={{
              position: "absolute",
              bottom: isIdle ? "60px" : "80px",
              left: "50%",
              transform: "translateX(-50%)",
              animation: isVisible && bobState === "walking" ? "walk 2s ease-out forwards" : "none",
              cursor: "pointer",
            }}
            onClick={handleBobClick}
            onKeyDown={handleBobKeyDown}
            role="button"
            tabIndex={0}
          >
            <div className={bobWave ? "bob-idle-wander auto-glow-pulse" : isIdle ? "bob-idle-wander" : "ambient-drift"}>
              {user?.is_pro ? <BobPro state={bobWave ? "introducing" : (bobState || "idle")} /> : <Bob state={bobWave ? "introducing" : (bobState || "idle")} />}
            </div>
            {/* Wave greeting bubble */}
            {bobWave && (
              <div
                className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs px-4 py-3 rounded-2xl whitespace-nowrap font-tech max-w-xs text-center"
                style={{ animation: "fadeInUp 0.3s ease-out" }}
              >
                {bobGreeting}
              </div>
            )}
            {/* First-visit speech bubble */}
            {showSpeechBubble && !bobWave && (
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-4 py-3 rounded-xl whitespace-nowrap font-tech max-w-xs"
                style={{ animation: "fadeIn 0.5s ease-out" }}
              >
                Hi, I&apos;m Bob! I&apos;m an AI helper -- ask me anything about Print Cosmos.
              </div>
            )}
          </div>
        )}
        <div className="pointer-events-auto">
          <TentScene bobInside={isIdle} onTentClick={handleBobClick} />
        </div>
      </>
    );
  };

  // ================================================================
  // MAIN RENDER
  // ================================================================
  return (
    <div
      data-testid="browse-page"
      className="pt-14 min-h-screen relative bg-black overflow-hidden"
      ref={pageRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={onStarfieldPointerDown}
      onPointerMove={onStarfieldPointerMove}
      onPointerUp={onStarfieldPointerUp}
      onPointerCancel={onStarfieldPointerUp}
      onWheel={onWheel}
      style={isPanning ? { cursor: "grabbing" } : { cursor: "grab" }}
    >
      {/* ----- BACKGROUND: Night Sky (Starfield) ----- */}
      {!isDay && (
        <>
          <AuroraLayer />
          <StarfieldRenderer
            starCount={400}
            seed={starSeed}
            className="fixed inset-0"
            offset={{ x: starOffset.x + parallax.x, y: starOffset.y + parallax.y }}
          />
          <MeteorShower />
          <TreeSilhouettes />
        </>
      )}

      {/* ----- BACKGROUND: Day Sky ----- */}
      {isDay && !spaceView && (
        <DaytimeScene
          solarPhase={solarPhase}
          isPro={!!user?.is_pro}
          season={getSeason()}
          onSkyClick={() => setSpaceView(true)}
          onSunClick={() => {}}
        />
      )}

      {/* ----- BACKGROUND: Space View (from day sky) ----- */}
      {isDay && spaceView && (
        <div className="fixed inset-0" style={{ background: "#000008", zIndex: 0 }}>
          <StarfieldRenderer starCount={400} seed={starSeed} className="absolute inset-0" />
          <EarthView />
          <SunIcon />
          <button
            onClick={() => setSpaceView(false)}
            className="absolute top-20 left-6 z-50 px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider border border-white/30 text-white/70 rounded-full bg-black/40 hover:bg-black/60 hover:text-white transition-colors"
          >
← Back to surface
          </button>
        </div>
      )}

      {/* ----- SPARKLE FIELD (click feedback) ----- */}
      {sparkles.layer}

      {/* ----- STARFIELD OVERLAY: Listing Stars + Ads ----- */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: (!isDay || spaceView) ? 1 : 0,
          transition: "opacity 0.6s",
        }}
      >
        <SponsoredAd ad={activeAd} loading={loading} />
        {renderListingStars()}
      </div>

      {/* ----- CONTENT SECTION (Title, Description, Empty State) ----- */}
      {renderContentSection()}

      {/* ----- SEARCH BAR (Fixed top, no-zoom) ----- */}
      <div data-nozoom className="fixed top-16 left-0 right-0 z-50 px-6 md:px-12 lg:px-24 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 auto-float">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              data-testid="browse-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search prints..."
              className="pl-9 font-tech text-sm rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
            />
          </div>

          {/* Category & Surprise Me Buttons */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                data-testid={"cat-" + c.toLowerCase() + "-btn"}
                onClick={() => setCat(c)}
                className={
                  "px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border rounded-full transition-colors " +
                  (cat === c
                    ? "border-white/60 text-white bg-white/10 auto-glow-pulse"
                    : "border-white/20 text-white/60 hover:text-white hover:border-white/40")
                }
              >
                {c}
              </button>
            ))}
            <button
              data-testid="surprise-me-btn"
              onClick={surpriseMe}
              className="px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border border-accent/60 text-accent rounded-full hover:bg-accent/10 transition-colors inline-flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Surprise me
            </button>
          </div>

          {/* Print Time Filter */}
          <div className="flex flex-wrap gap-2">
            {PRINT_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                data-testid={"print-time-" + (opt.value || "any") + "-btn"}
                onClick={() => setPrintTimeFilter(opt.value)}
                className={
                  "px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border rounded-full transition-colors " +
                  (printTimeFilter === opt.value
                    ? "border-white/60 text-white bg-white/10 auto-glow-pulse"
                    : "border-white/20 text-white/60 hover:text-white hover:border-white/40")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sky Mode Toggle */}
          <div className="flex items-center gap-1 border border-white/20 rounded-full p-1 shrink-0" title="Sky mode">
            {SKY_MODE_OPTIONS.map(({ mode, icon, title }) => (
              <button
                key={mode}
                data-testid={"sky-mode-" + mode}
                onClick={() => saveSkyMode(mode)}
                title={title}
                className={
                  "w-8 h-7 rounded-full text-sm transition-colors " +
                  (skyMode === mode ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80")
                }
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ----- SCROLL HINT (shows until user zooms) ----- */}
      <ScrollHint visible={showScrollHint && !isDay} />

      {/* ----- BOTTOM: Bob, Tent, Moon Viewer ----- */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-20">
        {renderBobAndTent()}
        <MoonButton onClick={() => setShowMoonViewer(true)} />
        <MoonViewer isOpen={showMoonViewer} onClose={() => setShowMoonViewer(false)} />
      </div>
    </div>
  );
}
