import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { calculateMarketplaceCommission, getCommissionDisplayText } from "@/lib/commissionUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrinterModelSelector from "@/components/PrinterModelSelector";
import PRINTER_MODELS from "@/constants/printerModels";
import { Upload, X, Box } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Decor", "Tools", "Toys", "Art", "Functional", "Other"];

export default function CreateListing() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editListingId = params.get("edit");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("29.99");
  const [category, setCategory] = useState("Other");
  const [shareDesign, setShareDesign] = useState(false);
  const [imagePaths, setImagePaths] = useState([]);
  const [modelPath, setModelPath] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [negotiable, setNegotiable] = useState(false);
  const [listingType, setListingType] = useState("product");
  const [serviceRules, setServiceRules] = useState("");
  const [tosCertified, setTosCertified] = useState(false);
  const [filamentColors, setFilamentColors] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [commission, setCommission] = useState(() => {
    const result = calculateMarketplaceCommission("29.99", user?.is_pro || false);
    return result;
  });
  const [printTime, setPrintTime] = useState("");
  const [timeLapse, setTimeLapse] = useState(null);
  const [timeLapseFile, setTimeLapseFile] = useState(null);
  const [compatibilityTags, setCompatibilityTags] = useState([]);
  const [compatInput, setCompatInput] = useState("");
  const [printerModel, setPrinterModel] = useState("");
  const [filamentType, setFilamentType] = useState("");

  // Pre-fill from "Sell" action on My Designs OR from edit query param
  useEffect(() => {
    const t = params.get("title");
    const mp = params.get("model_path");
    if (t) setTitle(t);
    if (mp) { setModelPath(mp); setShareDesign(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing listing for editing
  useEffect(() => {
    if (!editListingId) return;
    api.get(`/listings/${editListingId}`)
      .then((r) => {
        const l = r.data;
        setTitle(l.title || "");
        setDescription(l.description || "");
        setPrice(String(l.base_original_price ?? l.price ?? ""));
        setCategory(l.category || "Other");
        setShareDesign(l.share_design || false);
        setImagePaths(l.image_paths || []);
        setModelPath(l.model_path || null);
        setNegotiable(l.negotiable || false);
        setListingType(l.listing_type || "product");
        setServiceRules(l.service_rules || "");
        setFilamentColors(l.available_filament_colors || []);
        setPrintTime(l.print_time || "");
        setCompatibilityTags(l.compatibility_tags || []);
        setPrinterModel(l.printer_model || "");
        setFilamentType(l.filament_type || "");
        setTosCertified(true);
      })
      .catch(() => toast.error("Failed to load listing"));
  }, [editListingId]);

  // Update commission whenever price or user pro status changes
  useEffect(() => {
    if (!negotiable && price) {
      const result = calculateMarketplaceCommission(price, user?.is_pro || false);
      setCommission(result);
    }
  }, [price, user?.is_pro, negotiable]);

  if (!user) {
    return (
      <div className="pt-32 px-6 md:px-12 lg:px-24 text-center">
        <h1 className="font-display text-3xl font-light mb-4">Sign in to create a listing</h1>
        <Button data-testid="create-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech uppercase tracking-wider">
          Sign in with Google
        </Button>
      </div>
    );
  }

  const upload = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const r = await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
    return r.data.path;
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const paths = [];
      for (const f of files) paths.push(await upload(f));
      setImagePaths((prev) => [...prev, ...paths]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleModel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["stl", "obj"].includes(ext)) {
      toast.error("Only STL or OBJ files");
      return;
    }
    setUploading(true);
    try {
      const path = await upload(file);
      setModelPath(path);
      toast.success("3D model uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addFilamentColor = () => {
    const color = colorInput.trim();
    if (!color) return;
    setFilamentColors((prev) => [...prev, color]);
    setColorInput("");
  };

  const handleTimeLapse = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await upload(file);
      setTimeLapse(path);
      setTimeLapseFile(file);
      toast.success("Time-lapse video uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFilamentColor = (color) => {
    setFilamentColors((prev) => prev.filter((c) => c !== color));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!tosCertified) {
      toast.error("You must certify copyright ownership and terms compliance before publishing.");
      return;
    }
    if (!title || !description || !price) {
      toast.error("Fill all required fields");
      return;
    }
    if (listingType === "product" && imagePaths.length < 2) {
      toast.error("Product listings need at least 2 photos (front + back)");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        price: parseFloat(price),
        base_original_price: parseFloat(price),
        active_sale_price: null,
        is_on_sale: false,
        available_filament_colors: filamentColors,
        image_paths: imagePaths,
        model_path: modelPath,
        share_design: shareDesign,
        category,
        listing_type: listingType,
        negotiable,
        service_rules: listingType === "service" ? serviceRules : null,
        print_time: printTime || null,
        compatibility_tags: compatibilityTags,
        printer_model: printerModel || null,
        filament_type: filamentType || null,
      };
      const saveListing = async () => {
        if (editListingId) {
          const r = await api.put(`/seller/listings/${editListingId}`, payload);
          if (timeLapseFile && r.data?.listing_id) {
            const form = new FormData();
            form.append("file", timeLapseFile);
            await api.post(`/listings/${r.data.listing_id}/time-lapse`, form, { headers: { "Content-Type": "multipart/form-data" } });
          }
          toast.success("Listing updated");
          navigate(`/listing/${editListingId}`);
        } else {
          const r = await api.post("/listings", payload);
          if (timeLapseFile && r.data?.listing_id) {
            const form = new FormData();
            form.append("file", timeLapseFile);
            await api.post(`/listings/${r.data.listing_id}/time-lapse`, form, { headers: { "Content-Type": "multipart/form-data" } });
          }
          toast.success("Listing published");
          navigate(`/listing/${r.data.listing_id}`);
        }
      };
      await saveListing();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="create-listing-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="text-[12px] font-tech uppercase tracking-[0.28em] text-muted-foreground mb-3">
          <span className="text-accent">•</span> NEW LISTING
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tighter">
          Ship your print.
        </h1>
      </div>

      <form onSubmit={submit} className="px-6 md:px-12 lg:px-24 py-10 grid lg:grid-cols-[1fr_360px] gap-10 max-w-6xl">
        <div className="space-y-8">
          <Field label="Title">
            <Input data-testid="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hexagonal vase, modular planter…" className="font-tech rounded-xl" required />
          </Field>

          <Field label="Description">
            <Textarea data-testid="description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Material, dimensions, print time, what makes it special…" rows={6} className="font-tech text-sm rounded-xl" required />
          </Field>

          <Field label="Listing type">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="type-product-btn"
                onClick={() => setListingType("product")}
                className={`p-3 border rounded-xl text-left transition-colors ${listingType === "product" ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"}`}
              >
                  <div className="font-display font-medium text-sm">Product</div>
                  <div className="text-[10px] font-tech text-muted-foreground">A finished 3D-printed object. Needs &gt;= 2 photos.</div>
              </button>
              <button
                type="button"
                data-testid="type-service-btn"
                onClick={() => setListingType("service")}
                className={`p-3 border rounded-xl text-left transition-colors ${listingType === "service" ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"}`}
              >
                <div className="font-display font-medium text-sm">Service</div>
                <div className="text-[10px] font-tech text-muted-foreground">Custom prints, design, repair — your rules.</div>
              </button>
            </div>
          </Field>

          {listingType === "service" && (
            <Field label="Service rules">
              <Textarea
                data-testid="service-rules-input"
                value={serviceRules}
                onChange={(e) => setServiceRules(e.target.value)}
                placeholder="Turnaround time, revisions included, file formats, what's not in scope…"
                rows={4}
                className="font-tech text-sm rounded-xl"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-6">
            <Field label="PRINT TIME (optional)">
              <Input data-testid="print-time-input" value={printTime} onChange={(e) => setPrintTime(e.target.value)} placeholder="e.g. 2h 30m" className="font-tech rounded-xl" />
            </Field>
            <Field label="TIME-LAPSE VIDEO (optional)">
              <Input type="file" accept="video/*" onChange={handleTimeLapse} className="font-tech rounded-xl text-xs" />
              {timeLapse && <div className="text-[10px] text-emerald-500 mt-1">Video uploaded</div>}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field label="PRICE (USD)">
              <Input data-testid="price-input" type="number" step="0.01" min="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" className="font-tech rounded-xl" disabled={negotiable} required={!negotiable} />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="negotiable-checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">PRICE IS NEGOTIABLE</span>
              </label>
            </Field>
            <Field label="CATEGORY">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="category-select" className="font-tech rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="font-tech text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Field label="PRINTER MODEL (optional)">
              <PrinterModelSelector
                value={printerModel}
                onChange={(id) => {
                  const model = PRINTER_MODELS.find((m) => m.id === id);
                  setPrinterModel(model ? model.name : "");
                }}
              />
            </Field>
            <Field label="FILAMENT TYPE (optional)">
              <Input data-testid="filament-type-input" value={filamentType} onChange={(e) => setFilamentType(e.target.value)} placeholder="e.g. Prusament PLA" className="font-tech rounded-xl" />
            </Field>
          </div>

          <Field label="FILAMENT COLORS">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  data-testid="filament-color-input"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="e.g. PLA Black, PETG White, Silk Gold..."
                  className="font-tech rounded-xl flex-1"
                />
                <Button type="button" onClick={addFilamentColor} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  Add
                </Button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!filamentColors.includes("Rainbow")) {
                      setFilamentColors((prev) => [...prev, "Rainbow"]);
                    }
                  }}
                  className="rounded-xl font-tech text-[10px] uppercase tracking-wider px-3 py-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-purple-600 text-white border border-border hover:opacity-90 transition-opacity"
                >
                  Rainbow
                </button>
              </div>
              {filamentColors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filamentColors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary border border-border rounded-full text-sm font-tech"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeFilamentColor(color)}
                        className="hover:text-destructive transition-colors"
                        aria-label={`Remove ${color}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                Optional. Buyers will be prompted to choose a color at checkout.
              </p>
            </div>
          </Field>

          <Field label="COMPATIBILITY TAGS">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  data-testid="compat-tag-input"
                  value={compatInput}
                  onChange={(e) => setCompatInput(e.target.value)}
                  placeholder="e.g. Bambu Lab P1S, 300x300 bed"
                  className="font-tech rounded-xl flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = compatInput.trim();
                      if (val && !compatibilityTags.includes(val)) {
                        setCompatibilityTags((prev) => [...prev, val]);
                        setCompatInput("");
                      }
                    }
                  }}
                />
                <Button type="button" onClick={() => {
                  const val = compatInput.trim();
                  if (val && !compatibilityTags.includes(val)) {
                    setCompatibilityTags((prev) => [...prev, val]);
                    setCompatInput("");
                  }
                }} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  Add
                </Button>
              </div>
              {compatibilityTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {compatibilityTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary border border-border rounded-full text-sm font-tech"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setCompatibilityTags((prev) => prev.filter((t) => t !== tag))}
                        className="hover:text-destructive transition-colors"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                Optional. Quick compatibility signals for buyers.
              </p>
            </div>
          </Field>

          <Field label="PHOTOS">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x" data-testid="image-carousel">
              <label className="snap-start shrink-0 h-28 w-28 border border-dashed border-border hover:border-primary rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/5 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[9px] font-tech uppercase tracking-wider text-muted-foreground text-center px-2">
                  {uploading ? "UPLOADING…" : "DROP OR CLICK"}
                </span>
                <input data-testid="images-input" type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
              {imagePaths.map((p, i) => (
                <div key={p} className="snap-start shrink-0 h-28 w-28 relative border border-border rounded-xl overflow-hidden bg-secondary group">
                  <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${p}`} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePaths((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 h-5 w-5 bg-background/90 border border-border rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-background/85 text-[9px] font-tech text-center">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-2">
              {imagePaths.length} / 10 PHOTOS • &gt;= 2 REQUIRED (FRONT + BACK)
            </p>
          </Field>

          <Field label="3D MODEL (STL/OBJ, OPTIONAL)">
            <label className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors block">
              <Box className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs font-tech uppercase tracking-wider text-muted-foreground">
                {modelPath ? "MODEL UPLOADED" : "UPLOAD .STL OR .OBJ"}
              </span>
              <input data-testid="model-input" type="file" accept=".stl,.obj" onChange={handleModel} className="hidden" />
            </label>
          </Field>
        </div>

        <aside className="space-y-6">
          <div className="border border-border rounded-xl p-6 sticky top-24">
            <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">EARNINGS PREVIEW</div>
            <div className="font-display text-5xl font-bold tracking-tighter text-primary drop-shadow-[0_0_12px_rgba(164,99,255,0.45)] mb-4">
              ${commission.sellerPayout.toFixed(2)}
            </div>
            <div className="space-y-1 text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-6">
              <div className="flex justify-between"><span>LIST PRICE</span><span>${price || "0.00"}</span></div>
              <div className="flex justify-between"><span>{getCommissionDisplayText(user?.is_pro || false)}</span><span>−${commission.platformFee.toFixed(2)}</span></div>
            </div>

            <div className="border-t border-border pt-5 mb-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <Label htmlFor="share-design" className="text-sm font-medium">Share design files</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open source your STL so buyers and the community can remix it.
                  </p>
                </div>
                <Switch
                  id="share-design"
                  data-testid="share-design-switch"
                  checked={shareDesign}
                  onCheckedChange={setShareDesign}
                />
              </div>
            </div>

            <Button
              data-testid="publish-listing-btn"
              type="submit"
              disabled={submitting || !tosCertified}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              {submitting ? "PUBLISHING…" : "PUBLISH LISTING"}
            </Button>
            <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={tosCertified}
                onChange={(e) => setTosCertified(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span>
                I explicitly certify that I own 100% of the copyright/licensing rights to this 3D design asset, agree to the Print Cosmos Terms & Conditions, and verify that this upload contains zero restricted or prohibited material.
              </span>
            </label>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}
