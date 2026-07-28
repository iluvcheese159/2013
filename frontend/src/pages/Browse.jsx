import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Share2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/branding";
import BrandLogo from "@/components/BrandLogo";
import WireframeCube from "@/components/WireframeCube";
import SafeImage from "@/components/SafeImage";
import SalePrice from "@/components/SalePrice";
import UserBadges from "@/components/UserBadges";
import StarfieldRenderer from "@/components/StarfieldRenderer";
import DaytimeScene, { getSeason } from "@/components/DaytimeScene";
import ListingStar from "@/components/ListingStar";
import Bob, { BobPro, BobSleeping } from "@/components/Bob";
import TentScene from "@/components/TentScene";
import MoonViewer from "@/components/MoonViewer";

const CATEGORIES = ["All", "Decor", "Tools", "Toys", "Art", "Functional", "Other"];

const SELLER_TYPE_COLORS = {
  service:    { r: 180, g: 140, b: 255 },
  designer:   { r: 100, g: 180, b: 255 },
  traditional:{ r: 240, g: 245, b: 255 },
  finished:   { r: 240, g: 245, b: 230 },
};

const PRO_COLOR = { r: 255, g: 215, b: 0 };

function getListingColor(item) {
  const isPro = item.seller_is_pro === true;
  if (isPro) return PRO_COLOR;
  if (item.listing_type === "service") return SELLER_TYPE_COLORS.service;
  if (item.share_design) return SELLER_TYPE_COLORS.designer;
  if (item.listing_type === "product") return SELLER_TYPE_COLORS.traditional;
  return SELLER_TYPE_COLORS.traditional;
}

function getListingAgeDays(item) {
  if (!item.created_at) return 365;
  return Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
}

function getListingAgeBrightness(ageDays) {
  if (ageDays < 1)  return { baseOpacity: 1.0, glowSpread: 18, twinkleDuration: 0.8 };
  if (ageDays < 7)  return { baseOpacity: 0.85, glowSpread: 14, twinkleDuration: 1.5 };
  if (ageDays < 30) return { baseOpacity: 0.7, glowSpread: 10, twinkleDuration: 2.5 };
  return { baseOpacity: 0.55, glowSpread: 7, twinkleDuration: 4.0 };
}

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

export default function Browse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [params] = useSearchParams();
  const initialCat = CATEGORIES.includes(params.get("cat")) ? params.get("cat") : "All";
  const [cat, setCat] = useState(initialCat);
  const [printTimeFilter, setPrintTimeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  
  const [showMoonViewer, setShowMoonViewer] = useState(false);
  const [bobState, setBobState] = useState("idle");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  
  const twoFingerRef = useRef(null);
  const [starSeed] = useState(() => Date.now());
  const [starOffset, setStarOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef(null);
  const pageRef = useRef(null);
  const [spaceView, setSpaceView] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  const zoomRef = useRef(0);
  const [activeAd, setActiveAd] = useState(null);

  const onWheel = (e) => {
    if (e.target.closest("a, button, input, [data-nozoom]")) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    zoomRef.current = Math.max(0, Math.min(3, zoomRef.current + delta));
    setZoomLevel(zoomRef.current);
  };

  const onStarfieldPointerDown = (e) => {
    if (e.target.closest("a, button, input")) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, baseX: starOffset.x, baseY: starOffset.y, pointerId: e.pointerId };
    setIsPanning(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (e) { /* ignore */ }
  };

  const onStarfieldPointerMove = (e) => {
    if (!panRef.current) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    const maxPan = Math.max(window.innerWidth, window.innerHeight);
    setStarOffset({
      x: Math.max(-maxPan, Math.min(maxPan, panRef.current.baseX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, panRef.current.baseY + dy)),
    });
  };

  const onStarfieldPointerUp = (e) => {
    if (!panRef.current) return;
    try { e.currentTarget.releasePointerCapture(panRef.current.pointerId); } catch (e) { /* ignore */ }
    panRef.current = null;
    setIsPanning(false);
  };
  
  const [skyMode, setSkyMode] = useState(() => {
    try { return localStorage.getItem("pf_sky_mode") || "night"; } catch (e) { return "night"; }
  });
  const saveSkyMode = (m) => {
    setSkyMode(m);
    setSpaceView(false);
    try { localStorage.setItem("pf_sky_mode", m); } catch (e) { /* ignore */ }
  };

  const { isDay, solarPhase } = useMemo(() => {
    if (skyMode === "day") return { isDay: true, solarPhase: 0.5 };
    if (skyMode === "night") return { isDay: false, solarPhase: 0.5 };
    if (!userCoords) return { isDay: false, solarPhase: 0.5 };
    const { lat, lon } = userCoords;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const decl = 0.006918 - 0.399912 * Math.cos(2 * Math.PI * dayOfYear / 365)
      + 0.070257 * Math.sin(2 * Math.PI * dayOfYear / 365)
      - 0.006758 * Math.cos(4 * Math.PI * dayOfYear / 365)
      + 0.000907 * Math.sin(4 * Math.PI * dayOfYear / 365);
    const latRad = lat * Math.PI / 180;
    const cosH = -Math.tan(latRad) * Math.tan(decl);
    if (cosH < -1) return { isDay: true, solarPhase: 0.5 };
    if (cosH > 1) return { isDay: false, solarPhase: 0.5 };
    const H = Math.acos(cosH) * 180 / Math.PI;
    const B = 2 * Math.PI * (dayOfYear - 1) / 365;
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B)
      - 0.014615 * Math.cos(2 * B) - 0.04089 * Math.sin(2 * B));
    const solarNoonUTC = 720 - 4 * lon - eot;
    const sunriseUTC = solarNoonUTC - H * 4;
    const sunsetUTC = solarNoonUTC + H * 4;
    const nowUTC = now.getUTCHours() * 60 + now.getUTCMinutes();
    const dayLength = sunsetUTC - sunriseUTC;
    const solarPhase = dayLength > 0 ? Math.max(0, Math.min(1, (nowUTC - sunriseUTC) / dayLength)) : 0.5;
    return { isDay: nowUTC >= sunriseUTC && nowUTC <= sunsetUTC, solarPhase };
  }, [skyMode, userCoords]);

  useEffect(() => { if (!isDay) setSpaceView(false); }, [isDay]);

  const listingPositions = useMemo(() => generateListingPositions(500, Date.now()), []);
  
  useEffect(() => {
    try {
      const hasVisitedBrowse = localStorage.getItem("pf_browse_visited");
      if (!hasVisitedBrowse) {
        setFirstVisit(true);
        localStorage.setItem("pf_browse_visited", "1");
      }
    } catch (e) {
      console.warn("Could not check browse visit status:", e);
    }
  }, []);

  useEffect(() => {
    if (firstVisit) {
      setBobState("walking");
      setTimeout(() => {
        setBobState("introducing");
        setShowSpeechBubble(true);
        setTimeout(() => {
          setShowSpeechBubble(false);
          setBobState("walking");
          setTimeout(() => {
            setBobState("in-tent");
          }, 2000);
        }, 4000);
      }, 2000);
    }
  }, [firstVisit]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      twoFingerRef.current = { startX: (e.touches[0].clientX + e.touches[1].clientX) / 2 };
    } else {
      twoFingerRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 2) twoFingerRef.current = null;
  };

  const handleTouchEnd = (e) => {
    if (!twoFingerRef.current || e.changedTouches.length < 1) return;
    const endX = (e.changedTouches[0].clientX + (e.changedTouches[1]?.clientX ?? e.changedTouches[0].clientX)) / 2;
    if (endX - twoFingerRef.current.startX > 60) {
      navigate("/messages?tab=clubs");
    }
    twoFingerRef.current = null;
  };

  useEffect(() => {
    const getUserCountry = async () => {
      try {
        const r = await fetch("https://ipapi.co/json/");
        const data = await r.json();
        setUserCountry(data.country_code);
        if (data.latitude != null && data.longitude != null) {
          setUserCoords({ lat: data.latitude, lon: data.longitude });
        }
      } catch (e) {
        console.warn("Could not fetch user country:", e);
      }
    };
    getUserCountry();
  }, []);

  useEffect(() => {
    setLoading(true);
    const reqParams = {};
    if (cat !== "All") reqParams.category = cat;
    if (q) reqParams.q = q;
    if (printTimeFilter) reqParams.print_time = printTimeFilter;
    const t = setTimeout(() => {
      api
        .get("/listings", { params: reqParams })
        .then((r) => {
          const sorted = [...(r.data || [])].sort((a, b) => {
            const aIsLocal = userCountry && a.seller_country === userCountry ? 0 : 1;
            const bIsLocal = userCountry && b.seller_country === userCountry ? 0 : 1;
            if (aIsLocal !== bIsLocal) return aIsLocal - bIsLocal;
            return new Date(b.created_at) - new Date(a.created_at);
          });
          setItems(sorted);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, cat, printTimeFilter, userCountry]);

  const surpriseMe = async () => {
    try {
      const r = await api.get("/listings/random");
      if (r.data?.listing_id) {
        navigate("/listing/" + r.data.listing_id);
      } else {
        toast.error("No listings found");
      }
    } catch (e) {
      toast.error("Could not find a random listing");
    }
  };

  useEffect(() => {
    api.get("/public/ads/active").then((r) => {
      const ads = r.data || [];
      setActiveAd(ads.length > 0 ? ads[0] : null);
    }).catch(() => setActiveAd(null));
  }, []);

  // Determine content text based on state
  var contentTitle = loading ? "Loading the cosmos..." 
    : items.length === 0 ? "No listings in " + cat
    : cat === "All" ? "Explore the marketplace" 
    : "Browse " + cat + " prints";

  var contentDesc = loading 
    ? "Scanning for " + (cat !== "All" ? cat.toLowerCase() : "all") + " listings in the marketplace."
    : items.length === 0
      ? "There are no listings matching this category yet. Try a different category or come back later \u2014 makers are adding new prints every day."
      : "Found " + items.length + " listing" + (items.length !== 1 ? "s" : "") + (cat !== "All" ? " in " + cat.toLowerCase() : "") + ". Zoom in with the scroll wheel to reveal cards, then click a star to view details.";

  var itemCountStr = (!loading && items.length > 0) ? (" \u00b7 " + items.length + " item" + (items.length !== 1 ? "s" : "")) : "";
  var contentMeta = "Marketplace" + (cat !== "All" ? " \u00b7 " + cat : "") + itemCountStr;

  return (
    <div 
      data-testid="browse-page" 
      className="pt-14 min-h-screen relative bg-black"
      ref={pageRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={onStarfieldPointerDown}
      onPointerMove={onStarfieldPointerMove}
      onPointerUp={onStarfieldPointerUp}
      onPointerCancel={onStarfieldPointerUp}
      onWheel={onWheel}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {/* Starfield background */}
      {!isDay && (<StarfieldRenderer starCount={400} seed={starSeed} className="fixed inset-0" offset={starOffset} />)}
      {isDay && !spaceView && (<DaytimeScene solarPhase={solarPhase} isPro={!!user?.is_pro} season={getSeason()} onSkyClick={function() { setSpaceView(true); }} onSunClick={function() {}} />)}

      {/* Space view overlay */}
      {isDay && spaceView && (
        <div className="fixed inset-0" style={{ background: "#000008", zIndex: 0 }}>
          <StarfieldRenderer starCount={400} seed={starSeed} className="absolute inset-0" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
            <svg width="520" height="220" viewBox="0 0 520 220">
              <defs>
                <radialGradient id="earthGrad" cx="45%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="35%" stopColor="#2563eb" />
                  <stop offset="70%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e3a5f" />
                </radialGradient>
                <clipPath id="earthClip">
                  <rect x="0" y="0" width="520" height="220" />
                </clipPath>
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
          <div className="absolute top-8 left-1/2 -translate-x-1/2" style={{ zIndex: 1 }}>
            <div style={{
              width: "70px", height: "70px", borderRadius: "50%",
              background: "radial-gradient(circle, #fff9c4 0%, #fde047 40%, #f59e0b 100%)",
              boxShadow: "0 0 60px 30px rgba(253,224,71,0.4), 0 0 120px 60px rgba(245,158,11,0.15)",
            }} />
          </div>
          <button
            onClick={function() { setSpaceView(false); }}
            className="absolute top-20 left-6 z-50 px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider border border-white/30 text-white/70 rounded-full bg-black/40 hover:bg-black/60 hover:text-white transition-colors"
          >
            {"\u2190"} Back to surface
          </button>
        </div>
      )}
      
      {/* Listing stars layer */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: (!isDay || spaceView) ? 1 : 0,
          transition: "opacity 0.6s",
          transform: "scale(" + (1 + zoomLevel * 0.4) + ")",
          transformOrigin: "center center",
        }}
      >
        {activeAd && !loading && (
          <Link
            to={activeAd.target_type === "listing" ? "/listing/" + activeAd.target_id : activeAd.target_type === "design" ? "/designs" : "/messages?tab=clubs"}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
            data-testid="sponsored-ad"
          >
            <div className="max-w-sm w-full rounded-xl border border-accent/40 bg-black/80 backdrop-blur-md p-3 shadow-lg">
              <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-accent mb-1">Sponsored</div>
              <div className="text-xs font-tech text-white/90 mb-1">{activeAd.blurb}</div>
              <div className="text-[10px] font-tech text-white/60">
                by {activeAd.seller_name} {"\u00B7"} {activeAd.target_name || activeAd.target_type}
              </div>
          </Link>
        )}
        {!loading && items.map(function(item, index) {
          var position = listingPositions[index % listingPositions.length];
          var color = getListingColor(item);
          var ageDays = getListingAgeDays(item);
          var ageBrightness = getListingAgeBrightness(ageDays);
          var isFiltered = cat !== "All" && item.category !== cat;
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
        })}
      </div>
      
      {/* Top search + filters */}
      <div data-nozoom className="fixed top-16 left-0 right-0 z-50 px-6 md:px-12 lg:px-24 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              data-testid="browse-search-input"
              value={q}
              onChange={function(e) { setQ(e.target.value); }}
              placeholder="Search prints..."
              className="pl-9 font-tech text-sm rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(function(c) {
              return (
                <button
                  key={c}
                  data-testid={"cat-" + c.toLowerCase() + "-btn"}
                  onClick={function() { setCat(c); }}
                  className={"px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border rounded-full transition-colors " + (cat === c ? "border-white/60 text-white bg-white/10" : "border-white/20 text-white/60 hover:text-white hover:border-white/40")}
                >
                  {c}
                </button>
              );
            })}
            <button
              data-testid="surprise-me-btn"
              onClick={surpriseMe}
              className="px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border border-accent/60 text-accent rounded-full hover:bg-accent/10 transition-colors inline-flex items-center gap-1"
            >
              <Zap className="h-3 w-3" /> Surprise me
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "", label: "Any time" },
              { value: "under_1_hour", label: "Under 1 hour" },
              { value: "1-4_hours", label: "1-4 hours" },
              { value: "4-12_hours", label: "4-12 hours" },
              { value: "12-24_hours", label: "12-24 hours" },
              { value: "weekend", label: "Weekend project" },
            ].map(function(opt) {
              return (
                <button
                  key={opt.value}
                  data-testid={"print-time-" + (opt.value || "any") + "-btn"}
                  onClick={function() { setPrintTimeFilter(opt.value); }}
                  className={"px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.2em] border rounded-full transition-colors " + (printTimeFilter === opt.value ? "border-white/60 text-white bg-white/10" : "border-white/20 text-white/60 hover:text-white hover:border-white/40")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {/* Sky mode toggle */}
          <div className="flex items-center gap-1 border border-white/20 rounded-full p-1 shrink-0" title="Sky mode">
            {[["night", "\u263E"], ["day", "\u2600\uFE0F"], ["time", "\uD83D\uDD52"]].map(function(pair) {
              var mode = pair[0];
              var icon = pair[1];
              return (
                <button
                  key={mode}
                  data-testid={"sky-mode-" + mode}
                  onClick={function() { saveSkyMode(mode); }}
                  title={mode === "night" ? "Night (always)" : mode === "day" ? "Day (always)" : "Time (follows your local time)"}
                  className={"w-8 h-7 rounded-full text-sm transition-colors " + (skyMode === mode ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80")}
                >
                  {icon}
                </button>
              );
            })}
          </div>
      </div>
      
      {/* Dynamic content area */}
      <div className="relative z-10 px-6 md:px-12 lg:px-24 py-32">
        <div className="text-xs font-tech uppercase tracking-[0.3em] text-white/60 mb-3">
          <span className="text-white">{"\u2022"}</span> {contentMeta}
        </div>
        <h1 className={"font-display text-4xl sm:text-5xl font-light tracking-tighter mb-6 text-white" + (loading ? " animate-pulse" : "")}>
          {contentTitle}
        </h1>
        <p className={(loading ? "text-white/50" : "text-white/70") + " text-sm max-w-xl"}>
          {contentDesc}
        </p>
      </div>
      
      {/* Bob and Tent Scene */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-20">
        {!isDay && (bobState === "walking" || bobState === "introducing") && (
          <div 
            className="absolute bottom-20 pointer-events-auto"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              animation: bobState === "walking" ? "walk 2s ease-out forwards" : "none",
            }}
          >
            {user?.is_pro ? <BobPro state={bobState} /> : <Bob state={bobState} />}
            {showSpeechBubble && (
              <div 
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-4 py-3 rounded-xl whitespace-nowrap font-tech max-w-xs"
                style={{ animation: "fadeIn 0.5s ease-out" }}
              >
                Hi, I&apos;m Bob! I&apos;m an AI helper -- ask me anything about Print Cosmos.
              </div>
            )}
          </div>
        )}
        
        {!isDay && (
          <div className="pointer-events-auto">
            <TentScene 
              bobInside={bobState === "in-tent"} 
              onTentClick={function() { console.info("Tent clicked"); }}
            />
          </div>
        )}
      
        <button
          onClick={function() { setShowMoonViewer(true); }}
          className="fixed bottom-6 right-6 z-30 pointer-events-auto"
          aria-label="View the moon"
          title="View the moon"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg transition-transform hover:scale-110">
            <circle cx="24" cy="24" r="20" fill="#e8e0d0" stroke="#c8c0b0" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="4" fill="#c8b8a0" opacity="0.6" />
            <circle cx="30" cy="22" r="3" fill="#c8b8a0" opacity="0.5" />
            <circle cx="22" cy="30" r="2.5" fill="#c8b8a0" opacity="0.4" />
            <circle cx="32" cy="30" r="2" fill="#c8b8a0" opacity="0.3" />
          </svg>
        </button>

        <MoonViewer
          isOpen={showMoonViewer}
          onClose={function() { setShowMoonViewer(false); }}
        />
      </div>
  );
}

function ListingCard(props) {
  var item = props.item;
  var cover = item.image_paths && item.image_paths.length > 0 ? item.image_paths[0] : null;
  return (
    <Link
      to={"/listing/" + item.listing_id}
      data-testid={"listing-card-" + item.listing_id}
      className="group block rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-secondary overflow-hidden relative rounded-t-2xl">
        {cover ? (
          <SafeImage src={fileUrl(cover)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground font-tech text-xs">
            NO IMAGE
          </div>
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
        <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">
          by {item.seller_name} <UserBadges isPro={item.seller_is_pro} isPlatformOwner={item.seller_is_platform_owner} milestoneBadges={item.seller_milestone_badges} className="inline-flex align-middle ml-1" /> {"\u00B7"} {item.category}
        </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded-2xl py-20 px-6 text-center flex flex-col items-center">
      <div className="mb-6 opacity-90">
        <WireframeCube size={104} />
      </div>
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Nothing here yet</div>
      <h3 className="font-display text-2xl font-medium mb-3">Be the first to list</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
        No listings match your filters yet. Try clearing the search box or adjusting the category chips above.
      </p>
      <Link to="/designer/new" data-testid="browse-empty-cta">
        <span className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-primary bg-primary/10 hover:bg-primary/20 text-primary font-tech text-xs uppercase tracking-[0.2em] transition-colors">
          <Plus className="h-3.5 w-3.5" /> Design your first print
        </span>
      </Link>
    </div>
  );
}
