import { useState, useEffect, useCallback } from "react";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PrinterModelSelector from "@/components/PrinterModelSelector";
import PRINTER_MODELS from "@/constants/printerModels";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Search, 
  Upload, 
  Plus, 
  Tag, 
  Image, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";

export default function PrintFailure() {
  const { user, openAuth } = useAuth();
  const [failures, setFailures] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [fixText, setFixText] = useState("");
  const [fixImages, setFixImages] = useState([]);
  const [fixUploading, setFixUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [printerModel, setPrinterModel] = useState("");
  const [filamentType, setFilamentType] = useState("");
  const [listingId, setListingId] = useState("");
  const [imagePaths, setImagePaths] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const loadFailures = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (tagFilter) params.set("tag", tagFilter);
      if (search) params.set("search", search);
      const r = await api.get(`/print-failures?${params.toString()}`);
      setFailures(r.data || []);
    } catch (error) {
      console.warn("Error loading failures:", error);
      toast.error("Could not load print failures");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, tagFilter]);

  useEffect(() => {
    loadFailures();
  }, [loadFailures]);

  const handleSearch = () => {
    loadFailures();
  };

  const upload = async (file) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      return r.data.path;
    } catch (error) {
      console.warn("File upload failed:", error);
      toast.error("Could not upload file");
      return null;
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }
    
    setUploading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        printer_model: printerModel.trim() || undefined,
        filament_type: filamentType.trim() || undefined,
        listing_id: listingId.trim() || undefined,
        image_paths: imagePaths.filter(Boolean),
      };
      
      const r = await api.post("/print-failures", payload);
      setFailures((prev) => [r.data, ...prev]);
      setCreateOpen(false);
      resetForm();
      toast.success("Print failure reported");
    } catch (error) {
      console.warn("Create failure failed:", error);
      toast.error("Could not report failure");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setPrinterModel("");
    setFilamentType("");
    setListingId("");
    setImagePaths([]);
  };

  const handleUpvoteFix = async (fixId) => {
    if (upvoting) return;
    
    setUpvoting(true);
    try {
      const r = await api.post(`/print-failure-fixes/${fixId}/upvote`);
      toast.success(r.data.upvoted ? "Upvoted" : "Upvote removed");
      await loadFailures();
      if (selected?.failure_id) {
        const detail = await api.get(`/print-failures/${selected.failure_id}`);
        setSelected(detail.data);
      }
    } catch (error) {
      console.warn("Upvote failed:", error);
      toast.error("Could not upvote");
    } finally {
      setUpvoting(false);
    }
  };

  const handleAcceptFix = async (fixId) => {
    try {
      const r = await api.put(`/print-failures/${selected.failure_id}`, { status: "resolved" });
      setSelected(r.data);
      await loadFailures();
      toast.success("Fix marked as accepted");
    } catch (error) {
      console.warn("Accept fix failed:", error);
      toast.error("Could not accept fix");
    }
  };

  const handleAddFix = async () => {
    if (!fixText.trim()) {
      toast.error("Please describe the fix");
      return;
    }
    
    setFixUploading(true);
    try {
      const payload = {
        description: fixText.trim(),
        image_paths: fixImages.filter(Boolean),
      };
      
      const r = await api.post(`/print-failures/${selectedFailure.failure_id}/fixes`, payload);
      setFixOpen(false);
      setFixText("");
      setFixImages([]);
      toast.success("Fix suggested");
      await loadFailures();
    } catch (error) {
      console.warn("Add fix failed:", error);
      toast.error("Could not suggest fix");
    } finally {
      setFixUploading(false);
    }
  };

  const openDetail = async (failure) => {
    try {
      const r = await api.get(`/print-failures/${failure.failure_id}`);
      setSelected(r.data);
    } catch (error) {
      console.warn("Load detail failed:", error);
      toast.error("Could not load details");
    }
  };

  const cardClass = "border border-border rounded-2xl p-5 bg-card hover:border-primary/50 transition-colors cursor-pointer";

  return (
    <div data-testid="print-failures-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
              <span className="text-primary">●</span> Print Failure Database
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter">Learn from failures.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Upload your failed prints, search for solutions, and help others avoid the same mistakes.
            </p>
          </div>
          {user && (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-2" /> Report failure
            </Button>
          )}
        </div>
      </div>
      
      <div className="px-6 md:px-12 lg:px-24 py-10 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-tech text-sm">Loading failures...</div>
        ) : failures.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="font-display text-2xl font-light mb-2">No failures found</h3>
            <p className="text-sm text-muted-foreground">Be the first to report a failed print.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failures.map((f) => (
              <div key={f.failure_id} className={cardClass} onClick={() => openDetail(f)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-base font-medium leading-tight line-clamp-2">
                    {f.title}
                    {f.is_featured && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-400 text-amber-600"> Recommended</span>}
                  </h3>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-tech ${
                    f.status === "resolved" ? "bg-emerald-500/30 text-emerald-500" : "bg-amber-500/30 text-amber-500"
                  }`}>
                    {f.status === "resolved" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-sm text-emerald-600"> Resolved</span>
                      </>
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{f.description}</p>
                <div className="flex flex-wrap items-center gap-1">
                  {f.tags?.slice(0, 3)?.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary border border-border rounded-full text-[10px] font-tech text-muted-foreground">
                      <Tag className="h-2.5 w-2.5" /> {t}
                    </span>
                  ))}
                  {user && f.contributor_error && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-[10px] font-tech text-red-600 rounded-full">
                      <XCircle className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] font-tech text-muted-foreground">
                  <span>{f.user_name || "Anonymous"}</span>
                  <span className="flex items-center gap-2">
                    {f.fixes_count} fixes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Failure Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Report a Failure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Title</label>
              <Input data-testid="failure-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Warping on large flat prints" className="font-tech rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened and when?" className="font-tech text-sm rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="warping, bed-adhesion" className="font-tech rounded-xl" />
            </div>
<div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Printer Model</label>
                  <PrinterModelSelector
                    value={printerModel}
                    onChange={(id) => {
                      const model = PRINTER_MODELS.find((m) => m.id === id);
                      setPrinterModel(model ? model.name : "");
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Filament Type</label>
                  <Input value={filamentType} onChange={(e) => setFilamentType(e.target.value)} placeholder="PLA" className="font-tech rounded-xl" />
                </div>
              </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Related Listing ID (optional)</label>
              <Input value={listingId} onChange={(e) => setListingId(e.target.value)} placeholder="listing_abc123" className="font-tech rounded-xl" />
            </div>
            {imagePaths.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imagePaths.map((p, i) => (
                  <img key={i} src={fileUrl(p)} alt="" className="h-16 w-16 object-cover rounded-xl border border-border" />
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl py-3 px-4 hover:bg-secondary/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-tech text-muted-foreground">Click to upload images</span>
              <Input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const f of files) {
                  const p = await upload(f);
                  if (p) setImagePaths((prev) => [...prev, p]);
                }
              }} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={handleCreate} disabled={uploading || !title.trim() || !description.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {uploading ? "Reporting..." : "Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="flex flex-wrap gap-2">
                {selected.tags?.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary border border-border rounded-full text-[10px] font-tech text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" /> {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-tech text-muted-foreground">
                <span>By {selected.user_name || "Anonymous"}</span>
                <span className={selected.status === "resolved" ? "text-emerald-500" : "text-amber-500"}>{selected.status}</span>
              </div>
              {selected.image_paths?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selected.image_paths.map((p, i) => (
                    <img key={i} src={fileUrl(p)} alt="" className="rounded-xl border border-border" />
                  ))}
                </div>
              )}
              <div className="border-t border-border pt-4">
                <h3 className="font-display text-lg font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Fixes ({selected.fixes?.length || 0})
                </h3>
                {selected.fixes?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No fixes suggested yet. Be the first!</p>
                )}
                <div className="space-y-3">
                  {selected.fixes?.map((fix) => (
                    <div key={fix.fix_id} className="border border-border rounded-xl p-4 bg-background">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm flex-1">{fix.description}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleUpvoteFix(fix.fix_id)} disabled={upvoting} className="shrink-0">
                          {fix.upvotes_count || 0}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-tech text-muted-foreground">
                        <span>{fix.user_name || "Anonymous"}</span>
                        {fix.is_accepted && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> accepted</span>}
                      </div>
                      {fix.image_paths?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {fix.image_paths.map((p, i) => (
                            <img key={i} src={fileUrl(p)} alt="" className="h-12 w-12 object-cover rounded-lg border border-border" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {user && selected.status !== "resolved" && (
                  <div className="mt-4">
                    <Button onClick={() => { setFixOpen(true); setSelectedFailure(selected); }} className="rounded-xl font-tech text-xs uppercase tracking-wider">
                      <Plus className="h-3.5 w-3.5 mr-2" /> Suggest a fix
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Add Fix Dialog */}
      <Dialog open={fixOpen} onOpenChange={(open) => { setFixOpen(open); if (!open) { setFixText(""); setFixImages([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Suggest a Fix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={4} value={fixText} onChange={(e) => setFixText(e.target.value)} placeholder="Describe how you fixed this issue..." className="font-tech text-sm rounded-xl" />
            </div>
            {fixImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {fixImages.map((p, i) => (
                  <img key={i} src={fileUrl(p)} alt="" className="h-16 w-16 object-cover rounded-xl border border-border" />
                ))}
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl py-3 px-4 hover:bg-secondary/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-tech text-muted-foreground">Upload images</span>
              <Input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const f of files) {
                  const p = await upload(f);
                  if (p) setFixImages((prev) => [...prev, p]);
                }
              }} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={handleAddFix} disabled={fixUploading || !fixText.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {fixUploading ? "Posting..." : "Submit fix"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}