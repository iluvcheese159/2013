/* eslint-disable */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Hammer, Share2, Tag, Edit3, Plus, Box, Trash2, Globe, Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function DesignWorkshop() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // design being renamed
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.get("/seller/designs")
      .then((r) => setDesigns(r.data))
      .catch(() => setDesigns([]))
      .finally(() => setLoading(false));
  }, [user]);

  const togglePublic = async (d) => {
    try {
      await api.put(`/designs/${d.design_id}`, {
        title: d.title,
        description: d.description || "",
        is_public: !d.is_public,
        model_path: d.model_path,
        geometry: d.geometry,
        image_paths: d.image_paths || [],
      });
      setDesigns((prev) => prev.map((x) => (x.design_id === d.design_id ? { ...x, is_public: !x.is_public } : x)));
      toast.success(d.is_public ? "Design set to private" : "Design shared publicly");
    } catch {
      toast.error("Couldn't update");
    }
  };

  const remove = async (d) => {
    if (!confirm(`Delete "${d.title}"?`)) return;
    try {
      await api.delete(`/designs/${d.design_id}`);
      setDesigns((prev) => prev.filter((x) => x.design_id !== d.design_id));
      toast.success("Design deleted");
    } catch {
      toast.error("Couldn't delete");
    }
  };

  const openEditor = (d) => navigate(`/designer/${d.design_id}`);
  const sellFrom = (d) =>
    navigate(`/create?design_id=${d.design_id}&title=${encodeURIComponent(d.title)}&model_path=${encodeURIComponent(d.model_path || "")}`);

  const startEdit = (d) => {
    setEditing(d);
    setEditTitle(d.title);
    setEditDescription(d.description || "");
  };
  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api.put(`/designs/${editing.design_id}`, {
        title: editTitle,
        description: editDescription,
        is_public: editing.is_public,
        model_path: editing.model_path,
        geometry: editing.geometry,
        image_paths: editing.image_paths || [],
      });
      setDesigns((prev) => prev.map((x) =>
        x.design_id === editing.design_id ? { ...x, title: editTitle, description: editDescription } : x
      ));
      setEditing(null);
      toast.success("Updated");
    } catch {
      toast.error("Could not update");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="design-workshop-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
<div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">
              <span className="text-primary">●</span> Workshop
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter rise-in rise-in-1">Design</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl rise-in rise-in-2">
              Your projects live here. Open one to design, share, sell, or edit it.
            </p>
          </div>
          <Button
            data-testid="workshop-new-btn"
            onClick={() => navigate("/designer/new")}
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 mr-2" /> New design
          </Button>
        </div>
      </div>

      <div className="px-6 md:px-12 py-10">
        {!user ? (
          <div className="border border-dashed border-border rounded-2xl py-16 px-8 text-center max-w-2xl mx-auto">
            <Hammer className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.2} />
            <h2 className="font-display text-2xl font-medium tracking-tight mb-3">Sign in to start a project</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              You can open the editor to play around right now — but to save, share, or sell your work you'll need an account.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                data-testid="workshop-signin-btn"
                onClick={() => openAuth("signin")}
                className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                Sign in
              </Button>
              <Button
                data-testid="workshop-try-btn"
                onClick={() => navigate("/designer/new")}
                variant="outline"
                className="rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                Try the editor
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-sm font-tech text-muted-foreground">Loading…</div>
        ) : designs.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 px-8 text-center max-w-2xl mx-auto">
            <Box className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.2} />
            <h2 className="font-display text-2xl font-medium tracking-tight mb-3">No projects yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Open the editor and make something. It'll show up here.</p>
            <Button
              data-testid="workshop-first-btn"
              onClick={() => navigate("/designer/new")}
              className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              <Plus className="h-4 w-4 mr-2" /> Start designing
            </Button>
          </div>
        ) : (
          <>
            <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {designs.length} {designs.length === 1 ? "project" : "projects"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* New design tile */}
              <button
                data-testid="workshop-new-tile"
                onClick={() => navigate("/designer/new")}
                className="border border-dashed border-border rounded-xl p-6 flex items-center gap-4 hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="h-14 w-14 bg-secondary border border-border rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary">
                  <Plus className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <div className="font-display text-lg font-medium tracking-tight">New project</div>
                  <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    Open the 3D editor
                  </div>
                </div>
              </button>

              {designs.map((d) => (
                <ProjectCard
                  key={d.design_id}
                  d={d}
                  open={openId === d.design_id}
                  onToggle={() => setOpenId(openId === d.design_id ? null : d.design_id)}
                  onDesign={() => openEditor(d)}
                  onShare={() => togglePublic(d)}
                  onSell={() => sellFrom(d)}
                  onEdit={() => startEdit(d)}
                  onDelete={() => remove(d)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit (rename) dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-md" data-testid="workshop-edit-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight">Edit project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Title</div>
              <Input
                data-testid="workshop-edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-tech text-sm rounded-2xl"
              />
            </div>
            <div>
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Description</div>
              <Textarea
                data-testid="workshop-edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="font-tech text-sm rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              Cancel
            </Button>
            <Button
              data-testid="workshop-edit-save"
              onClick={saveEdit}
              disabled={busy}
              className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ d, open, onToggle, onDesign, onShare, onSell, onEdit, onDelete }) {
  return (
    <div
      data-testid={`project-card-${d.design_id}`}
      className={`border rounded-2xl bg-card overflow-hidden transition-all ${
        open ? "border-primary" : "border-border hover:border-foreground/30"
      }`}
    >
      <button
        onClick={onToggle}
        data-testid={`project-tile-${d.design_id}`}
        className="w-full text-left p-6 flex items-center gap-4 group"
      >
        <div className="h-14 w-14 bg-secondary border border-border rounded-2xl flex items-center justify-center group-hover:bg-primary/10">
          <Box className="h-6 w-6 text-muted-foreground group-hover:text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-medium tracking-tight truncate">{d.title}</div>
          <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mt-1 flex items-center gap-2">
            {d.is_public ? <><Globe className="h-3 w-3" /> Public</> : <><Lock className="h-3 w-3" /> Private</>}
            <span>·</span>
            <span>{new Date(d.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border" data-testid={`project-actions-${d.design_id}`}>
          <div className="grid grid-cols-4">
            <ActionBtn icon={Hammer} label="Design" onClick={onDesign} testid={`action-design-${d.design_id}`} />
            <ActionBtn icon={Share2} label={d.is_public ? "Unshare" : "Share"} onClick={onShare} testid={`action-share-${d.design_id}`} />
            <ActionBtn icon={Tag} label="Sell" onClick={onSell} testid={`action-sell-${d.design_id}`} />
            <ActionBtn icon={Edit3} label="Edit" onClick={onEdit} testid={`action-edit-${d.design_id}`} last />
          </div>
          <button
            onClick={onDelete}
            data-testid={`action-delete-${d.design_id}`}
            className="border-t border-border w-full py-2 text-[10px] font-tech uppercase tracking-wider text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, testid, last }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`flex flex-col items-center justify-center gap-1 py-4 text-[10px] font-tech uppercase tracking-wider text-foreground/80 hover:text-primary hover:bg-primary/5 ${
        last ? "" : "border-r border-border"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      {label}
    </button>
  );
}
