/* eslint-disable */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Share2, Edit3, Tag, Plus, Box, Trash2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

export default function MyDesigns() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get("/seller/designs").then((r) => setDesigns(r.data)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="pt-24 px-6 md:px-12 text-center">
        <h1 className="font-display text-3xl font-medium mb-4">Sign in to see your designs</h1>
        <Button data-testid="mydesigns-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
          Sign in
        </Button>
      </div>
    );
  }

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

  const removeDesign = async (d) => {
    if (!confirm(`Delete "${d.title}"?`)) return;
    try {
      await api.delete(`/designs/${d.design_id}`);
      setDesigns((prev) => prev.filter((x) => x.design_id !== d.design_id));
      toast.success("Design deleted");
    } catch {
      toast.error("Couldn't delete");
    }
  };

  return (
    <div data-testid="my-designs-page" className="pt-20 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
              <span className="text-primary">●</span> Workshop
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tighter">My designs</h1>
          </div>
          <Button
            data-testid="new-design-btn"
            onClick={() => navigate("/designer")}
            className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 mr-2" /> New design
          </Button>
        </div>
      </div>

      <div className="px-6 md:px-12 py-10">
        {designs.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-20 text-center">
            <Box className="h-8 w-8 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground mb-4">Nothing built yet.</p>
            <Button onClick={() => navigate("/designer")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
              Open the designer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((d) => (
              <DesignCard
                key={d.design_id}
                d={d}
                open={openMenu === d.design_id}
                onToggle={() => setOpenMenu(openMenu === d.design_id ? null : d.design_id)}
                onShare={() => togglePublic(d)}
                onEdit={() => navigate(`/designer?id=${d.design_id}`)}
                onSell={() => navigate(`/create?design_id=${d.design_id}&title=${encodeURIComponent(d.title)}&model_path=${encodeURIComponent(d.model_path || "")}`)}
                onDelete={() => removeDesign(d)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignCard({ d, open, onToggle, onShare, onEdit, onSell, onDelete }) {
  return (
    <div
      data-testid={`design-card-${d.design_id}`}
      className={`border rounded-xl bg-card overflow-hidden transition-all ${
        open ? "border-primary" : "border-border hover:border-foreground/30"
      }`}
    >
      {/* Rectangle with project name */}
      <button
        onClick={onToggle}
        data-testid={`design-tile-${d.design_id}`}
        className="w-full text-left p-6 flex items-center gap-4 group"
      >
        <div className="h-14 w-14 bg-secondary border border-border rounded-xl flex items-center justify-center group-hover:bg-primary/10">
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

      {/* Action buttons revealed when pressed */}
      {open && (
        <div className="grid grid-cols-3 border-t border-border" data-testid={`design-actions-${d.design_id}`}>
          <ActionBtn icon={Share2} label={d.is_public ? "Unshare" : "Share"} onClick={onShare} testid={`design-action-share-${d.design_id}`} />
          <ActionBtn icon={Edit3} label="Edit" onClick={onEdit} testid={`design-action-edit-${d.design_id}`} />
          <ActionBtn icon={Tag} label="Sell" onClick={onSell} testid={`design-action-sell-${d.design_id}`} />
          <button
            onClick={onDelete}
            data-testid={`design-action-delete-${d.design_id}`}
            className="col-span-3 border-t border-border py-2 text-[10px] font-tech uppercase tracking-wider text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className="flex flex-col items-center justify-center gap-1 py-4 text-[10px] font-tech uppercase tracking-wider text-foreground/80 hover:text-primary hover:bg-primary/5 border-r border-border last:border-r-0"
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      {label}
    </button>
  );
}
