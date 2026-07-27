import { useState } from "react";
import { Check, Shield, Trophy, Gem, Palette, Cog, Circle, Zap, Star, Sparkles, Layers, Hand } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MilestoneBadge3D from "@/components/MilestoneBadge3D";

const BADGE_SPECS = {
  community_star: {
    id: "community_star",
    label: "Recognized Community Member",
    description: "10+ upvotes across 3–8 forum posts",
    category: "main",
    priority: 1,
    icon: Star,
    tint: "text-white",
    ring: "ring-white/50",
    gradient: "from-white via-gray-200 to-gray-400",
  },
  verified_seller: {
    id: "verified_seller",
    label: "Verified Seller",
    description: "5-star average across 5–8 listings",
    category: "main",
    priority: 2,
    icon: Shield,
    tint: "text-blue-300",
    ring: "ring-blue-400/50",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
  },
  top_seller: {
    id: "top_seller",
    label: "Top Seller",
    description: "50+ completed sales",
    category: "main",
    priority: 3,
    icon: Trophy,
    tint: "text-amber-400",
    ring: "ring-amber-400/50",
    gradient: "from-amber-500 via-amber-600 to-amber-700",
  },
  pro_subscriber: {
    id: "pro_subscriber",
    label: "Hyperspace Member",
    description: "Active Print Cosmos Hyperspace membership",
    category: "main",
    priority: 4,
    icon: Gem,
    tint: "text-yellow-300",
    ring: "ring-yellow-400/50",
    gradient: "from-yellow-400 via-yellow-500 to-amber-600",
  },
  featured_designer: {
    id: "featured_designer",
    label: "Featured Designer",
    description: "Design curated by Print Cosmos team",
    category: "main",
    priority: 5,
    icon: Palette,
    tint: "text-teal-300",
    ring: "ring-teal-400/50",
    gradient: "from-teal-400 via-teal-500 to-teal-600",
  },
  certified_service: {
    id: "certified_service",
    label: "Certified Print Service",
    description: "Verified print service provider with quality rating",
    category: "main",
    priority: 6,
    icon: Cog,
    tint: "text-gray-300",
    ring: "ring-gray-400/50",
    gradient: "from-gray-400 via-gray-500 to-gray-600",
  },
  top_designer: {
    id: "top_designer",
    label: "Top Designer",
    description: "Exceptional design portfolio recognized by community",
    category: "main",
    priority: 7,
    icon: Circle,
    tint: "text-blue-500",
    ring: "ring-blue-500/50",
    gradient: "from-blue-700 via-blue-800 to-indigo-900",
  },
  rising_creator: {
    id: "rising_creator",
    label: "Rising Creator",
    description: "New creator gaining traction quickly",
    category: "main",
    priority: 8,
    icon: Sparkles,
    tint: "text-cyan-300",
    ring: "ring-cyan-300/50",
    gradient: "from-cyan-300 via-cyan-400 to-cyan-500",
    animate: true,
  },
  rising_star: {
    id: "rising_star",
    label: "Rising Star",
    description: "3+ 5-star ratings within the first 30 days",
    category: "main",
    priority: 9,
    tint: "text-cyan-100",
    ring: "ring-cyan-100/60",
    gradient: "from-cyan-50 via-cyan-100 to-cyan-200",
    render: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-100 drop-shadow-[0_0_2px_rgba(200,240,255,0.8)]" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M15 9l2-4-3-1-2 4 3 1z" opacity="0.9" />
        <path d="M19 13l3-1-2-2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },
  login_streak_7: {
    id: "login_streak_7",
    label: "7-Day Login Streak",
    description: "Logged in 7 consecutive days",
    category: "main",
    priority: 10,
    tint: "text-gray-300",
    ring: "ring-gray-300/50",
    gradient: "from-gray-300 via-gray-400 to-gray-500",
    render: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-300" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5" />
        <ellipse cx="12" cy="12" rx="8" ry="3" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      </svg>
    ),
  },
  login_streak_30: {
    id: "login_streak_30",
    label: "30-Day Login Streak",
    description: "Logged in 30 consecutive days",
    category: "main",
    priority: 11,
    tint: "text-gray-100",
    ring: "ring-gray-100/60",
    gradient: "from-gray-100 via-gray-200 to-gray-300",
    render: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-100" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="9" ry="3.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  login_streak_100: {
    id: "login_streak_100",
    label: "100-Day Login Streak",
    description: "Logged in 100 consecutive days — rare dedication!",
    category: "main",
    priority: 12,
    tint: "text-sky-300",
    ring: "ring-sky-300/70",
    gradient: "from-sky-200 via-sky-300 to-sky-500",
    render: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-300" fill="none" aria-hidden="true">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="5" fill="currentColor" filter="url(#glow)" />
        <ellipse cx="12" cy="12" rx="9" ry="3.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  design_prolific: {
    id: "design_prolific",
    label: "Design Prolific",
    description: "10 original uploaded designs",
    category: "main",
    priority: 13,
    icon: Layers,
    tint: "text-blue-300",
    ring: "ring-blue-400/50",
    gradient: "from-blue-500 via-blue-600 to-blue-700",
  },
  helpful_hand: {
    id: "helpful_hand",
    label: "Helpful Hand",
    description: "5 forum answers marked as solved",
    category: "main",
    priority: 14,
    icon: Hand,
    tint: "text-orange-300",
    ring: "ring-orange-400/50",
    gradient: "from-orange-400 via-orange-500 to-red-500",
  },
  platform_owner: {
    id: "platform_owner",
    label: "Platform Owner",
    description: "Print Cosmos platform staff",
    category: "owner",
    priority: 0,
    render: () => (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <ellipse cx="12" cy="12" rx="10" ry="8" strokeWidth={1.5} />
        <path d="M9 12l2 2 4-4" strokeWidth={3} />
        <path d="M12 4v1M12 19v1M4 12h1M19 12h1" strokeWidth={1.5} opacity="0.5" />
      </svg>
    ),
    bg: "bg-gradient-to-br from-white via-gray-200 to-gray-400",
    ring: "ring-white/30",
    seal: true,
  },
};

const MILESTONE_SPECS = {
  first_listing: {
    id: "first_listing",
    label: "First Listing",
    description: "Published your first listing",
    category: "milestone",
    render: () => <Sparkles className="h-5 w-5 text-primary" strokeWidth={2} />,
    bg: "bg-gradient-to-br from-primary via-purple-600 to-primary",
  },
  first_sale: {
    id: "first_sale",
    label: "First Sale",
    description: "Completed your first sale",
    category: "milestone",
    render: () => <Zap className="h-5 w-5 text-green-400" strokeWidth={2} />,
    bg: "bg-gradient-to-br from-green-400 via-green-500 to-green-600",
  },
  "10_sales": {
    id: "10_sales",
    label: "10 Sales",
    description: "Reached 10 completed sales",
    category: "milestone",
    render: () => <Trophy className="h-5 w-5 text-amber-400" strokeWidth={2} />,
    bg: "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600",
  },
  "100_sales": {
    id: "100_sales",
    label: "100 Sales",
    description: "Reached 100 completed sales",
    category: "milestone",
    render: () => <Trophy className="h-5 w-5 fill-current text-yellow-400" strokeWidth={1} />,
    bg: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600",
  },
  year_one: {
    id: "year_one",
    label: "One Year",
    description: "Member for 1 year",
    category: "milestone",
    render: () => <Star className="h-5 w-5 fill-current text-orange-400" strokeWidth={1} />,
    bg: "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
  },
  year_three: {
    id: "year_three",
    label: "Three Years",
    description: "Member for 3 years",
    category: "milestone",
    render: () => <Star className="h-5 w-5 fill-current text-violet-400" strokeWidth={1} />,
    bg: "bg-gradient-to-br from-violet-400 via-violet-500 to-purple-600",
  },
  year_five: {
    id: "year_five",
    label: "Five Years",
    description: "Member for 5 years",
    category: "milestone",
    render: () => <Star className="h-5 w-5 fill-current text-pink-400" strokeWidth={1} />,
    bg: "bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600",
  },
};

function BadgeIcon({ spec, size = 16, showTooltip = true, className = "" }) {
  const content = (
    <TooltipContent side="top" align="center" className="max-w-xs text-xs font-tech text-white bg-black/95 border border-white/10 px-2 py-1.5 rounded">
      <div className="font-medium mb-0.5">{spec.label}</div>
      <div className="opacity-70">{spec.description}</div>
    </TooltipContent>
  );

  const badge = (
    <span
      className={`inline-flex items-center justify-center rounded-full ${spec.bg} ${spec.ring} ring-1 ${className}`}
      style={{ width: size, height: size }}
      aria-label={spec.label}
    >
      <span className={`inline-flex items-center justify-center ${spec.animate ? "animate-pulse" : ""}`}>
        {spec.render()}
      </span>
      {spec.seal && (
        <span className="absolute inset-0 rounded-full border border-white/20" />
      )}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        {content}
      </Tooltip>
    </TooltipProvider>
  );
}

function MilestoneBadge3DWrapper({ badgeId }) {
  const [open, setOpen] = useState(false);
  const spec = MILESTONE_SPECS[badgeId];
  if (!spec) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center hover:scale-110 transition-transform"
        title={`${spec.label} — click to view`}
        aria-label={spec.label}
        data-testid={`milestone-badge-${badgeId}`}
      >
        <BadgeIcon spec={spec} size={20} showTooltip={true} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{spec.label}</DialogTitle>
          </DialogHeader>
          <div className="aspect-square bg-black rounded-xl overflow-hidden">
            <MilestoneBadge3D kind="medal" />
          </div>
          <p className="text-xs text-muted-foreground text-center font-tech uppercase tracking-wider">
            {spec.description}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function computeUserBadges(user, listings = [], stats = {}) {
  const badges = [];

  if (user?.is_platform_owner) {
    badges.push("platform_owner");
  }

  if (user?.is_pro) {
    badges.push("pro_subscriber");
  }

  const totalSales = stats.total_sales || listings.reduce((sum, l) => sum + (l.sales_count || 0), 0);
  if (totalSales >= 50) {
    badges.push("top_seller");
  }

  const avgRating = stats.avg_rating || 0;
  const listingCount = listings.length;
  if (avgRating >= 5.0 && listingCount >= 5 && listingCount <= 8) {
    badges.push("verified_seller");
  }

  const forumUpvotes = stats.forum_upvotes || 0;
  const forumPosts = stats.forum_posts || 0;
  if (forumUpvotes >= 10 && forumPosts >= 3 && forumPosts <= 8) {
    badges.push("community_star");
  }

  const featuredDesigns = stats.featured_designs || 0;
  if (featuredDesigns > 0) {
    badges.push("featured_designer");
  }

  const hasServices = listings.some(l => l.listing_type === "service");
  const serviceRating = stats.service_rating || 0;
  if (hasServices && serviceRating >= 4.5) {
    badges.push("certified_service");
  }

  const designScore = stats.design_score || 0;
  if (designScore >= 80) {
    badges.push("top_designer");
  }

  const accountAgeDays = user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const recentActivity = stats.recent_activity_score || 0;
  if (accountAgeDays < 90 && recentActivity > 50) {
    badges.push("rising_creator");
  }

  if (accountAgeDays < 30 && (stats.rising_star_ratings || 0) >= 3) {
    badges.push("rising_star");
  }

  const loginStreak = stats.login_streak || 0;
  if (loginStreak >= 100) {
    badges.push("login_streak_100");
  } else if (loginStreak >= 30) {
    badges.push("login_streak_30");
  } else if (loginStreak >= 7) {
    badges.push("login_streak_7");
  }

  if ((stats.original_uploads || 0) >= 10) {
    badges.push("design_prolific");
  }

  if ((stats.solved_forum_answers || 0) >= 5) {
    badges.push("helpful_hand");
  }

  return badges;
}

export function computeMilestoneBadges(user, stats = {}) {
  const badges = [];
  const totalSales = stats.total_sales || 0;
  const totalDownloads = stats.total_downloads || 0;
  const totalViews = stats.total_views || 0;
  const accountAgeDays = user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (totalSales >= 1) badges.push("first_sale");
  if (totalSales >= 10) badges.push("10_sales");
  if (totalSales >= 50) badges.push("50_sales");
  if (totalSales >= 100) badges.push("100_sales");
  if (totalDownloads >= 100) badges.push("100_downloads");
  if (totalDownloads >= 1000) badges.push("1000_downloads");
  if (totalViews >= 10000) badges.push("10000_views");
  if (stats.has_listing) badges.push("first_listing");
  if (accountAgeDays >= 365) badges.push("year_one");
  if (accountAgeDays >= 365 * 3) badges.push("year_three");
  if (accountAgeDays >= 365 * 5) badges.push("year_five");

  return badges;
}

export default function UserBadges({
  user,
  listings = [],
  stats = {},
  milestoneBadges = [],
  className = "",
  maxInline = 3,
  showTooltips = true,
  variant = "inline",
}) {
  const earnedMainBadges = computeUserBadges(user, listings, stats);
  const earnedMilestoneBadges = [...new Set([...milestoneBadges, ...computeMilestoneBadges(user, stats)])];

  const ownerBadge = earnedMainBadges.includes("platform_owner") ? "platform_owner" : null;
  const otherBadges = earnedMainBadges.filter(b => b !== "platform_owner").sort((a, b) => (BADGE_SPECS[a]?.priority || 99) - (BADGE_SPECS[b]?.priority || 99));

  const inlineBadges = variant === "profile" ? [...(ownerBadge ? [ownerBadge] : []), ...otherBadges] : [...(ownerBadge ? [ownerBadge] : []), ...otherBadges].slice(0, maxInline);
  const overflowCount = variant === "inline" ? Math.max(0, otherBadges.length - maxInline) : 0;

  if (inlineBadges.length === 0 && earnedMilestoneBadges.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} data-testid="user-badges">
      {inlineBadges.map((badgeId) => {
        const spec = BADGE_SPECS[badgeId];
        if (!spec) return null;
        return <BadgeIcon key={badgeId} spec={spec} size={16} showTooltip={showTooltips} />;
      })}

      {overflowCount > 0 && variant === "inline" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center rounded-full bg-secondary border border-border text-[9px] font-tech text-muted-foreground px-1.5" style={{ width: 16, height: 16 }}>
                +{overflowCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-xs text-xs font-tech text-white bg-black/95 border border-white/10 px-2 py-1.5 rounded">
              <div className="font-medium mb-0.5">+{overflowCount} more badge{overflowCount > 1 ? "s" : ""}</div>
              <div className="opacity-70">View profile to see all</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {variant === "profile" && earnedMilestoneBadges.length > 0 && (
        <span className="inline-flex items-center gap-1 ml-1">
          {earnedMilestoneBadges.map((badgeId) => (
            <MilestoneBadge3DWrapper key={badgeId} badgeId={badgeId} />
          ))}
        </span>
      )}
    </span>
  );
}

export const MILESTONE_META = {
  "500_followers": { icon: Medal, label: "500 Followers Medal", kind: "medal", color: "text-yellow-500" },
  "1000_followers": { icon: Trophy, label: "1,000 Followers Trophy", kind: "trophy", color: "text-yellow-500" },
  "first_sale": { icon: Medal, label: "First Sale", kind: "medal", color: "text-emerald-400" },
  "10_sales": { icon: Medal, label: "10 Sales", kind: "medal", color: "text-emerald-400" },
  "50_sales": { icon: Trophy, label: "50 Sales", kind: "trophy", color: "text-amber-400" },
  "100_sales": { icon: Trophy, label: "100 Sales", kind: "trophy", color: "text-amber-400" },
  "100_downloads": { icon: Medal, label: "100 Downloads", kind: "medal", color: "text-sky-400" },
  "1000_downloads": { icon: Trophy, label: "1,000 Downloads", kind: "trophy", color: "text-sky-400" },
  "10000_views": { icon: Medal, label: "10,000 Views", kind: "medal", color: "text-violet-400" },
};

export const MILESTONE_SPECS_EXPORT = MILESTONE_SPECS;