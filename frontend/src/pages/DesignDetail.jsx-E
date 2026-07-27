/* eslint-disable */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import ModelViewer from "@/components/ModelViewer";
import { ArrowLeft, GitFork, Share2, Box, Lock, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function DesignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [journals, setJournals] = useState([]);
  const [journalTitle, setJournalTitle] = useState("");
  const [journalBody, setJournalBody] = useState("");
  const [journaling, setJournaling] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/designs/${id}`)
      .then((r) => setDesign(r.data))
      .catch(() => setDesign(null))
      .finally(() => setLoading(false));
    api.get(`/designs/${id}/journals`).then((r) => setJournals(r.data || [])).catch(() => setJournals([]));
  }, [id]);

  const handleFork = async () => {
    if (!user) { openAuth("signin"); return; }
    setForking(true);
    try {
      await api.post(`/designs/${id}/fork`);
      toast.success("Design forked! Find it in My Designs.");
      navigate("/my-designs");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not fork design");
    } finally {
      setForking(false);
    }
  };

  const addJournal = async () => {
    if (!journalTitle.trim() || !journalBody.trim()) return;
    setJournaling(true);
    try {
      const r = await api.post(`/designs/${id}/journals`, {
        title: journalTitle.trim(),
        body: journalBody.trim(),
      });
      setJournals((prev) => [r.data, ...prev]);
      setJournalTitle("");
      setJournalBody("");
    } catch {
      toast.error("Could not add journal entry");
    } finally {
      setJournaling(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 px-6 text-sm font-tech text-muted-foreground animate-pulse">
        Loading design…
      </div>
    );
  }

  if (!design) {
    return (
      <div className="pt-32 px-6 md:px-12 lg:px-24 text-center">
        <Box className="h-16 w-16 mx-auto mb-6 text-muted-foreground" strokeWidth={1} />
        <h1 className="font-display text-3xl font-light mb-4">Design not found</h1>
        <Button
          onClick={() => navigate("/designs")}
          variant="outline"
          className="rounded-xl font-tech text-xs uppercase tracking-wider"
        >
          Back to Designs
        </Button>
      </div>
    );
  }

  const hasModel = !!design.model_path;
  const images = design.image_paths || [];
  const isOwner = user && user.user_id === design.creator_id;

  return (
    <div data-testid="design-detail-page" className="pt-14 min-h-screen">
      {/* Back nav */}
      <div className="px-6 md:px-12 lg:px-24 py-6 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 grid lg:grid-cols-2 gap-10">
        {/* Media */}
        <div>
          {images.length > 0 ? (
            <div className="aspect-square bg-secondary border border-border rounded-2xl overflow-hidden">
              <SafeImage
                src={fileUrl(images[activeImg] || images[0])}
                alt={design.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : hasModel ? (
            <div className="aspect-square border border-border rounded-2xl overflow-hidden">
              <ModelViewer modelPath={design.model_path} />
            </div>
          ) : (
            <div className="aspect-square bg-secondary border border-border rounded-2xl flex items-center justify-center">
              <Box className="h-16 w-16 text-muted-foreground" strokeWidth={1} />
            </div>
          )}
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square border rounded-xl overflow-hidden ${i === activeImg ? "border-primary" : "border-border"}`}
                >
                  <SafeImage src={fileUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {hasModel && images.length > 0 && (
            <div className="mt-6 border border-border rounded-2xl">
              <div className="px-4 py-2 text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                3D Preview
              </div>
              <div className="h-64">
                <ModelViewer modelPath={design.model_path} />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
            <span className="text-primary">●</span> Open Design
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-light tracking-tighter mb-3">{design.title}</h1>

          <div className="flex items-center gap-2 text-xs font-tech text-muted-foreground mb-4 flex-wrap">
            <Link to={`/profile/${design.creator_id}`} className="hover:text-foreground">
              by {design.creator_name}
            </Link>
            <span>·</span>
            <span>{design.created_at ? new Date(design.created_at).toLocaleDateString() : ""}</span>
            {design.fork_count > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" /> {design.fork_count} fork{design.fork_count !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>

          {design.forked_from_design_id && (
            <div className="mb-4 px-3 py-2 border border-border rounded-xl text-[10px] font-tech text-muted-foreground flex items-center gap-2">
              <GitFork className="h-3 w-3" />
              Forked from{" "}
              <Link
                to={`/designs/${design.forked_from_design_id}`}
                className="text-primary hover:underline"
              >
                {design.forked_from_creator_name || "a design"}
              </Link>
            </div>
          )}

          {design.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{design.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            {!isOwner && design.is_public && (
              <Button
                data-testid="fork-design-btn"
                onClick={handleFork}
                disabled={forking}
                className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                {forking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Forking…
                  </>
                ) : (
                  <>
                    <GitFork className="h-3.5 w-3.5 mr-2" /> Fork this Design
                  </>
                )}
              </Button>
            )}
            {isOwner && (
              <Link to={`/designer/${id}`}>
                <Button className="rounded-xl font-tech text-xs uppercase tracking-wider">
                  Open in Editor
                </Button>
              </Link>
            )}
            {hasModel && !isOwner && (
              <Button
                variant="outline"
                data-testid="open-in-editor-btn"
                onClick={() => navigate(`/designer/${id}`)}
                className="rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in Editor
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border rounded-xl p-4 text-center">
              <div className="font-display text-2xl font-light">{design.fork_count || 0}</div>
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-1">Forks</div>
            </div>
            <div className="border border-border rounded-xl p-4 text-center">
              <div className="flex items-center justify-center h-8">
                {design.is_public ? (
                  <Share2 className="h-6 w-6 text-primary" />
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-1">
                {design.is_public ? "Public" : "Private"}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[10px] font-tech text-muted-foreground">
              <span className="uppercase tracking-wider">Created</span>
              <span>{design.created_at ? new Date(design.created_at).toLocaleDateString() : "—"}</span>
            </div>
            {design.updated_at && design.updated_at !== design.created_at && (
              <div className="flex justify-between text-[10px] font-tech text-muted-foreground">
                <span className="uppercase tracking-wider">Updated</span>
                <span>{new Date(design.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Design Journal */}
          <div className="mt-6 border border-border rounded-xl p-4">
            <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-3">Design Journal</div>
            {isOwner && (
              <div className="space-y-2 mb-4">
                <Input
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="Entry title (e.g. Version 2)"
                  className="font-tech rounded-xl text-xs"
                />
                <Textarea
                  rows={3}
                  value={journalBody}
                  onChange={(e) => setJournalBody(e.target.value)}
                  placeholder="What changed, what broke, what you learned..."
                  className="font-tech text-xs rounded-xl"
                />
                <Button onClick={addJournal} disabled={journaling} size="sm" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  {journaling ? "Saving..." : "Add Entry"}
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {journals.map((j) => (
                <div key={j.entry_id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-xs font-medium">{j.title}</div>
                    <div className="text-[10px] font-tech text-muted-foreground">
                      {j.created_at ? new Date(j.created_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{j.body}</div>
                </div>
              ))}
              {!journals.length && (
                <div className="text-xs text-muted-foreground">No journal entries yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
