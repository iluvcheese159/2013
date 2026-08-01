import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Box, Plus, Hammer, Eye } from "lucide-react";
import { toast } from "sonner";
import { RevealOnScroll, TiltCard, FloatingParticles } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

export default function Wishlists() {
  const { user, openAuth } = useAuth();
  const sparkles = useSparkleField();
  const [wishlists, setWishlists] = useState([]);
  const [publicWishlists, setPublicWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      user ? api.get("/wishlists").then((r) => setWishlists(r.data || [])).catch(() => setWishlists([])) : Promise.resolve(),
      api.get("/wishlists/public").then((r) => setPublicWishlists(r.data || [])).catch(() => setPublicWishlists([])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const create = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post("/wishlists", { title: title.trim(), description: description.trim() });
      setWishlists((prev) => [r.data, ...prev]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      toast.success("Wishlist created");
    } catch {
      toast.error("Could not create wishlist");
    } finally {
      setSubmitting(false);
    }
  };

  const buildWishlist = async (wishlist) => {
    if (!user) return openAuth("signin");
    try {
      await api.post(`/wishlists/${wishlist.wishlist_id}/build`, {});
      toast.success("Interest registered — creator notified");
    } catch {
      toast.error("Could not register interest");
    }
  };

  if (loading) {
    return (
      <div className="pt-24 px-6 text-center text-sm text-muted-foreground font-tech" data-testid="wishlists-page">
        Loading...
      </div>
    );
  }

  return (
    <div data-testid="wishlists-page" className="pt-14 min-h-screen">
      {sparkles.layer}
      <FloatingParticles count={6} color="rgba(167,139,250,0.25)" className="fixed inset-0" />
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in rise-in-1">
              <span className="text-primary">●</span> Wishlists
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter rise-in rise-in-2">I wish someone made this.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl rise-in rise-in-3">
              Post a wish, and makers can build it. If someone builds your wish, you get a free copy.
            </p>
          </div>
          {user && (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-tech text-xs uppercase tracking-wider rise-in rise-in-4">
              <Plus className="h-3.5 w-3.5 mr-2" /> New wish
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 space-y-10">
        {user && (
          <section>
            <h2 className="font-display text-xl font-medium mb-4 rise-in">Your wishes</h2>
            {wishlists.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center ambient-drift">
                <Box className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="font-display text-2xl font-light mb-2">No wishes yet</h3>
                <p className="text-sm text-muted-foreground">Create your first wish and let makers bring it to life.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlists.map((w) => (
                  <WishlistCard key={w.wishlist_id} wish={w} />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-medium mb-4 rise-in rise-in-1">Community wishes</h2>
          {publicWishlists.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-16 text-center ambient-drift">
              <Eye className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-light mb-2">No public wishes yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to post a wish others can build.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicWishlists.map((w) => (
                <div key={w.wishlist_id} className="border border-border rounded-2xl p-5 bg-card hover:border-primary/50 transition-colors">
                  <WishlistCard wish={w} showOwner={true} />
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => buildWishlist(w)} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                      <Hammer className="h-3 w-3 mr-1" /> I'll build this
                    </Button>
                    {w.build_count > 0 && <span className="text-[10px] font-tech text-muted-foreground">{w.build_count} build{w.build_count === 1 ? "" : "s"}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTitle(""); setDescription(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New Wish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Title</label>
              <Input data-testid="wishlist-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Modular Rocket Lamp" className="font-tech rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you wish existed..." className="font-tech text-sm rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={create} disabled={submitting || !title.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {submitting ? "Creating..." : "Create Wish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WishlistCard({ wish, showOwner = false }) {
  return (
    <div className="border border-border rounded-2xl p-5 bg-card hover:border-primary/50 transition-colors auto-float">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-display text-lg font-medium leading-tight">{wish.title}</h3>
          {wish.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{wish.description}</p>}
        </div>
        {wish.build_count > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-full text-[10px] font-tech">
            <Hammer className="h-3 w-3" /> {wish.build_count} build{wish.build_count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
        {showOwner && <span>by {wish.user_name}</span>}
        <span>{new Date(wish.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
