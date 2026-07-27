import { useState } from "react";
import { Check, Sparkles, Medal, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MilestoneBadge3D from "@/components/MilestoneBadge3D";

function OwnerSeal({ className = "" }) {
  return (
    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-black ${className}`} title="Platform Owner" aria-label="Platform Owner">
      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </span>
  );
}

function GeminiStar({ className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} title="Pro" aria-label="Pro">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden="true">
        <path d="M12 1.8l2.4 4.2 4.9.7-3.3 3.4.8 4.8-4.8-2.2-4.8 2.2.8-4.8-3.3-3.4 4.9-.7L12 1.8zm0 9.9l1.7 3 3.5.5-2.4 2.5.6 3.4-3.4-1.6-3.4 1.6.6-3.4-2.4-2.5 3.5-.5 1.7-3z" />
      </svg>
    </span>
  );
}

export const MILESTONE_META = {
  "500_followers": { icon: Medal, label: "500 Followers Medal", kind: "medal", color: "text-yellow-500" },
  "1000_followers": { icon: Trophy, label: "1,000 Followers Trophy", kind: "trophy", color: "text-yellow-500" },
};

function MilestoneBadgeIcon({ badgeId }) {
  const [open, setOpen] = useState(false);
  const meta = MILESTONE_META[badgeId];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center hover:scale-110 transition-transform ${meta.color}`}
        title={`${meta.label} — click to view in 3D`}
        aria-label={meta.label}
        data-testid={`milestone-badge-${badgeId}`}
      >
        <Icon className="h-4 w-4" fill="currentColor" strokeWidth={1} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{meta.label}</DialogTitle>
          </DialogHeader>
          <div className="aspect-square bg-black rounded-xl overflow-hidden">
            <MilestoneBadge3D kind={meta.kind} />
          </div>
          <p className="text-xs text-muted-foreground text-center font-tech uppercase tracking-wider">
            Drag to rotate &middot; Earned for reaching {meta.kind === "trophy" ? "1,000" : "500"} followers
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function UserBadges({ isPro, isPlatformOwner, milestoneBadges = [], className = "" }) {
  const hasAnyBadge = isPro || isPlatformOwner || milestoneBadges.length > 0;
  if (!hasAnyBadge) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {isPlatformOwner ? <OwnerSeal /> : null}
      {isPro ? (
        <span className="inline-flex items-center justify-center rounded-full bg-accent/15 p-[2px]" title="Pro" aria-label="Pro">
          <GeminiStar />
          <Sparkles className="hidden" />
        </span>
      ) : null}
      {milestoneBadges.map((badgeId) => (
        <MilestoneBadgeIcon key={badgeId} badgeId={badgeId} />
      ))}
    </span>
  );
}
