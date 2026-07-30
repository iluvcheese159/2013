/* eslint-disable */
import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserBadges from "@/components/UserBadges";
import SafeImage from "@/components/SafeImage";
import { fileUrl } from "@/lib/api";

// Shown at default zoom: just the coloured dot + glow (existing behaviour).
// Shown when zoomed in (revealed=true): title above, image card, seller strip on hover/tap-hold.
export default function ListingStar({ item, position, color, isFiltered, revealed, ageBrightness, ageDays }) {
  const [sellerVisible, setSellerVisible] = useState(false);
  const [ambientPulse, setAmbientPulse] = useState(false);
  const holdTimer = useRef(null);
  const pulseTimerRef = useRef(null);

  const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const isPro = item.seller_is_pro === true;
  const cover = item.image_paths?.[0];
  const brightness = ageBrightness || { baseOpacity: 0.55, glowSpread: 7, twinkleDuration: 4.0 };
  const twinkleDelay = (item.listing_id || 0) % 5;

  // Smooth reveal transition: always render both dot and card, fade between them
  const revealProgress = useMemo(() => revealed ? 1 : 0, [revealed]);

  // Ambient auto-pulse: each star gets a random periodic glow boost
  useEffect(() => {
    const starId = item.listing_id || 0;
    // Stagger the initial pulse based on star ID so they don't all pulse at once
    const initialDelay = (starId % 7) * 1000;
    const pulseInterval = 8000 + (starId % 5) * 2000; // 8-16 seconds between pulses

    const schedulePulse = () => {
      pulseTimerRef.current = setTimeout(() => {
        setAmbientPulse(true);
        // Pulse lasts 1.5 seconds
        setTimeout(() => setAmbientPulse(false), 1500);
        // Schedule next pulse
        schedulePulse();
      }, pulseInterval);
    };

    const initialTimer = setTimeout(() => {
      schedulePulse();
    }, initialDelay);

    return () => {
      clearTimeout(initialTimer);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [item.listing_id]);

  // Touch-and-hold to show seller strip
  const onTouchStart = () => {
    holdTimer.current = setTimeout(() => setSellerVisible(true), 500);
  };
  const onTouchEnd = () => {
    clearTimeout(holdTimer.current);
  };

  const baseStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
    opacity: isFiltered ? 0.2 : 1,
    transition: "opacity 0.3s, transform 0.3s",
  };

  return (
    <div
      data-testid={`listing-star-${item.listing_id}`}
      className="absolute pointer-events-auto z-30"
      style={{ ...baseStyle, transform: "translate(-50%, -50%)" }}
      onMouseEnter={() => revealed && setSellerVisible(true)}
      onMouseLeave={() => revealed && setSellerVisible(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchEnd}
    >
      {/* Dot layer - always visible, fades out when revealed */}
      <Link
        to={`/listing/${item.listing_id}`}
        className="block transition-opacity duration-500"
        style={{ opacity: revealed ? 0 : 1, pointerEvents: revealed ? "none" : "auto" }}
        title={item.title}
      >
        <div
          className="absolute -inset-2 rounded-full blur-sm"
          style={{
            backgroundColor: rgb,
            opacity: ambientPulse ? brightness.baseOpacity * 1.2 : brightness.baseOpacity * 0.6,
            transition: "opacity 0.5s ease-in-out",
          }}
        />
        <div
          className="relative rounded-full"
          style={{
            width: ambientPulse ? 12 : 8,
            height: ambientPulse ? 12 : 8,
            backgroundColor: rgb,
            boxShadow: ambientPulse
              ? `0 0 ${brightness.glowSpread * 2}px ${rgb}, 0 0 ${brightness.glowSpread * 3}px ${rgb}80`
              : `0 0 ${brightness.glowSpread}px ${rgb}`,
            animation: `twinkle ${brightness.twinkleDuration}s ease-in-out infinite`,
            animationDelay: `${twinkleDelay}s`,
            transition: "width 0.5s ease-in-out, height 0.5s ease-in-out, box-shadow 0.5s ease-in-out",
          }}
        />
        {isPro && (
          <div
            className="absolute -inset-3 rounded-full border border-yellow-300/40 animate-ping"
            style={{ animationDuration: "2s" }}
          />
        )}
      </Link>

      {/* Card layer - hidden initially, fades in when revealed */}
      <div
        className="transition-all duration-500"
        style={{ opacity: revealed ? 1 : 0, pointerEvents: revealed ? "auto" : "none" }}
      >
        <Link to={`/listing/${item.listing_id}`} className="block" title={item.title}>
          {/* Title above */}
          <div
            className="text-center mb-1 px-1 font-tech text-[10px] uppercase tracking-wider leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]"
            style={{ color: rgb, textShadow: `0 0 8px ${rgb}` }}
          >
            {item.title}
          </div>

          {/* Image card */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{
              width: 96,
              height: 96,
              borderColor: rgb,
              boxShadow: `0 0 ${12 + Math.round(brightness.glowSpread / 2)}px 2px ${rgb}50`,
            }}
          >
            {cover ? (
              <SafeImage src={fileUrl(cover)} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/60 text-white/30 text-[9px] font-tech">NO IMG</div>
            )}
          </div>

          {/* Seller strip — slides up on hover/tap-hold */}
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: sellerVisible ? 48 : 0, opacity: sellerVisible ? 1 : 0 }}
          >
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-b-xl"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", borderTop: `1px solid ${rgb}40` }}
            >
              <Avatar className="h-5 w-5 shrink-0 border border-white/20">
                <AvatarImage src={item.seller_picture} />
                <AvatarFallback className="text-[8px] bg-black/60 text-white/60">{item.seller_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[9px] font-tech text-white/80 truncate max-w-[60px]">{item.seller_name}</span>
              <UserBadges
                user={{ is_pro: item.seller_is_pro, is_platform_owner: item.seller_is_platform_owner }}
                milestoneBadges={item.seller_milestone_badges}
                maxInline={1}
                showTooltips={false}
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
