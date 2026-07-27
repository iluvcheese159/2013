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
import { Upload, X, Box } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Decor", "Tools", "Toys", "Art", "Functional", "Other"];

export default function CreateListing() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
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
  const [listingType, setListingType] = useState("product"); // product | service
  const [serviceRules, setServiceRules] = useState("");
  const [tosCertified, setTosCertified] = useState(false);
  const [commission, setCommission] = useState(() => {
    const result = calculateMarketplaceCommission("29.99", user?.is_pro || false);
    return result;
  });

  // Pre-fill from "Sell" action on My Designs
  useEffect(() => {
    const t = params.get("title");
    const mp = params.get("model_path");
    if (t) setTitle(t);
    if (mp) { setModelPath(mp); setShareDesign(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const r = await api.post("/listings", {
        title,
        description,
        price: parseFloat(price),
        base_original_price: parseFloat(price),
        active_sale_price: null,
        is_on_sale: false,
        available_filament_colors: [],
        image_paths: imagePaths,
        model_path: modelPath,
        share_design: shareDesign,
        category,
        listing_type: listingType,
        negotiable,
        service_rules: listingType === "service" ? serviceRules : null,
      });
      toast.success("Listing published");
      navigate(`/listing/${r.data.listing_id}`);
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
          <Field label="TITLE">
            <Input data-testid="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hexagonal vase, modular planter…" className="font-tech rounded-xl" required />
          </Field>

          <Field label="DESCRIPTION">
            <Textarea data-testid="description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Material, dimensions, print time, what makes it special…" rows={6} className="font-tech text-sm rounded-xl" required />
          </Field>

          <Field label="LISTING TYPE">
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
            <Field label="Service rules (yours)">
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
