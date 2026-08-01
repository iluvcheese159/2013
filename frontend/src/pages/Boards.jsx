import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Lock, ClipboardList, Edit2, Trash2, Check, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { RevealOnScroll, TiltCard, FloatingParticles } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

export default function Boards() {
  const { user, openAuth } = useAuth();
  const sparkles = useSparkleField();
  const [myBoards, setMyBoards] = useState([]);
  const [publicBoards, setPublicBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      user ? api.get("/boards").then((r) => setMyBoards(r.data || [])).catch(() => setMyBoards([])) : Promise.resolve(),
      api.get("/boards/public").then((r) => setPublicBoards(r.data || [])).catch(() => setPublicBoards([])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const create = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const r = await api.post("/boards", { title: title.trim(), description: description.trim(), is_public: isPublic });
      setMyBoards((prev) => [r.data, ...prev]);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setIsPublic(false);
      toast.success("Board created");
    } catch {
      toast.error("Could not create board");
    } finally {
      setSubmitting(false);
    }
  };

  const Card = ({ board, showOwner = false }) => (
    <TiltCard maxTilt={4} glare={false}>
      <div key={board.board_id} className="border border-border rounded-2xl p-5 bg-card hover:border-primary/50 transition-colors auto-float">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-display text-lg font-medium leading-tight">{board.title}</h3>
            {board.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{board.description}</p>}
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-full text-[10px] font-tech">
            <ClipboardList className="h-3 w-3" /> {board.member_count || 1} members
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-3">
            {showOwner && board.owner_name && <span>by {board.owner_name}</span>}
          </div>
          {board.is_public ? (
            <span className="inline-flex items-center gap-1 text-emerald-500"><Check className="h-3 w-3" /> Public</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" /> Private</span>
          )}
        </div>
      </div>
    </TiltCard>
  );

  return (
    <div data-testid="boards-page" className="pt-14 min-h-screen">
      {sparkles.layer}
      <FloatingParticles count={6} color="rgba(0,229,255,0.2)" className="fixed inset-0" />
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">
              <span className="text-primary">●</span> Collaboration Boards
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter rise-in rise-in-1">Work together.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl rise-in rise-in-2">
              Create shared project boards with checklists and team members. Track progress on group prints, designs, or any collaborative work.
            </p>
          </div>
          {user && (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-2" /> New board
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 space-y-10 ambient-drift">
        {user && (
          <section>
            <h2 className="font-display text-xl font-medium mb-4">Your boards</h2>
            {myBoards.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl py-16 text-center">
                <ClipboardList className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                <h3 className="font-display text-2xl font-light mb-2">No boards yet</h3>
                <p className="text-sm text-muted-foreground">Create your first board and start collaborating.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-float">
                {myBoards.map((b) => Card({ board: b, showOwner: false }))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-medium mb-4">Discover public boards</h2>
          {publicBoards.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-16 text-center">
              <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-light mb-2">No public boards yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to share a project board.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-float">
              {publicBoards.map((b) => Card({ board: b, showOwner: true }))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTitle(""); setDescription(""); setIsPublic(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Title</label>
              <Input data-testid="board-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project Alpha" className="font-tech rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this board for?" className="font-tech text-sm rounded-xl" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-primary" />
              <span className="text-xs font-tech text-muted-foreground">Public — others can discover and join</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={create} disabled={submitting || !title.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}