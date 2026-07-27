import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PartyPopper, Package, Image, PenTool } from "lucide-react";

const TYPE_ICONS = {
  print_finished: PartyPopper,
  listing_published: Package,
  design_uploaded: PenTool,
};

export default function ActivityFeed({ limit = 20 }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/feed/activities")
      .then((r) => setActivities(r.data || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="text-xs text-muted-foreground font-tech uppercase tracking-wider">Loading feed…</div>;
  if (!activities.length) return <div className="text-xs text-muted-foreground font-tech uppercase tracking-wider">Follow makers to see their latest prints and listings here.</div>;

  return (
    <div className="space-y-3">
      {activities.slice(0, limit).map((a) => {
        const Icon = TYPE_ICONS[a.activity_type] || Package;
        return (
          <Link
            key={a.activity_id}
            to={a.target_type === "transaction" ? `/seller/orders/${a.target_id}` : a.target_type === "listing" ? `/listing/${a.target_id}` : "/browse"}
            className="flex items-start gap-3 border border-border rounded-xl p-3 bg-card hover:bg-secondary/40 transition-colors"
          >
            <div className="mt-0.5 h-8 w-8 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                <span className="font-tech">{a.user_name || "A maker"}</span>{" "}
                <span className="text-muted-foreground">{a.message}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-tech mt-0.5">
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
