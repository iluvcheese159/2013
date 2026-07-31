import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Lock, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";

export default function Collections() {
  const { user, openAuth } = useAuth();
  const [myCollections, setMyCollections] = useState([]);
  const [publicCollections, setPublicCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      user ? api.get("/collections").then((r) => setMyCollections(r.data || [])).catch(() => setMyCollections([])) : Promise.resolve(),
      api.get("/collections/public").then((r) => setPublicCollections(r.data || [])).catch(() => setPublicCollections([])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const create = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post("/collections", { name: name.trim(), description: description.trim(), is_public: isPublic });
      setMyCollections((prev) => [r.data, ...prev]);
      setCreateOpen(false);
      setName("");
      setDescription("");
      setIsPublic(true);
      toast.success("Collection created");
    } catch {
      toast.error("Could not create collection");
    } finally {
      setSubmitting(false);
    }
  };

  const follow = async (collection) => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/collections/${collection.collection_id}/follow`, {});
      setPublicCollections((prev) => prev.map((c) => c.collection_id === collection.collection_id ? { ...c, follower_count: r.data.following ? (c.follower_count || 0) + 1 : (c.follower_count || 0) - 1 } : c));
    } catch {
      toast.error("Could not follow collection");
    }
  };

  const Card = ({ col, showOwner = false, index = 0 }) => (
    <div key={col.collection_id} className="border border-border rounded-2xl p-5 bg-card hover:border-primary/50 transition-colors auto-float" style={{ animationDelay: `${0.12 * (index % 8)}s` }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-display text-lg font-medium leading-tight">{col.name}</h3>
          {col.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{col.description}</p>}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-full text-[10px] font-tech">
          <FolderOpen className="h-3 w-3" /> {col.item_count || 0} items
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
        <div className="flex items-center gap-3">
          {showOwner && <span>by {col.user_name}</span>}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {col.follower_count || 0} followers
          </span>
        </div>
        {col.is_public ? (
          <Button size="sm" variant="outline" onClick={() => follow(col)} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
            Follow
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> Private</span>
        )}
      </div>
    </div>
  );

  return (
    <div data-testid="collections-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">
              <span className="text-primary">●</span> Collections
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter rise-in rise-in-1">Curated picks.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl rise-in rise-in-2">
              Create public collections of listings you love. Follow other makers’ collections for inspiration.
            </p>
          </div>
          {user && (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-tech text-xs uppercase tracking-wider rise-in rise-in-3 auto-glow-pulse">
              <Plus className="h-3.5 w-3.5 mr-2" /> New collection
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 space-y-10">
        {user && (
          <section>
            <h2 className="font-display text-xl font-medium mb-4 rise-in">Your collections</h2>
            {myCollections.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center ambient-drift">
                <FolderOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="font-display text-2xl font-light mb-2">No collections yet</h3>
                <p className="text-sm text-muted-foreground">Create your first collection and start curating.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCollections.map((c, i) => Card({ col: c, showOwner: false, index: i }))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-medium mb-4 rise-in rise-in-1">Discover collections</h2>
          {publicCollections.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-16 text-center ambient-drift">
              <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-light mb-2">No public collections yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to share a curated list.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicCollections.map((c, i) => Card({ col: c, showOwner: true, index: i }))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setName(""); setDescription(""); setIsPublic(true); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Name</label>
              <Input data-testid="collection-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Favorite Desk Accessories" className="font-tech rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this collection about?" className="font-tech text-sm rounded-xl" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-primary" />
              <span className="text-xs font-tech text-muted-foreground">Public — others can follow</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={create} disabled={submitting || !name.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
