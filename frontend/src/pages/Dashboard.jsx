import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Eye, DollarSign, ShoppingBag, Trash2, EyeOff, AlertTriangle, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/branding";
import { toast } from "sonner";
import SalePrice from "@/components/SalePrice";
import SafeImage from "@/components/SafeImage";

export default function Dashboard() {
  const { user, openAuth } = useAuth();
  const [listings, setListings] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);
  const [subEnabled, setSubEnabled] = useState(false);
  const [subName, setSubName] = useState("");
  const [subPrice, setSubPrice] = useState("4.99");
  const [subRules, setSubRules] = useState("");
  const [velocityStatus, setVelocityStatus] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [editorColorInput, setEditorColorInput] = useState("");
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [adTargetType, setAdTargetType] = useState("listing");
  const [adTargetId, setAdTargetId] = useState("");
  const [adBlurb, setAdBlurb] = useState("");
  const [adDurationDays, setAdDurationDays] = useState(7);
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [userAds, setUserAds] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/seller/listings").then((r) => setListings(r.data)).catch(() => {});
    api.get("/seller/designs").then((r) => setDesigns(r.data)).catch(() => {});
    api.get("/payments/onboarding/status").then((r) => setPaymentStatus(r.data)).catch(() => setPaymentStatus(null));
    api.get("/seller/velocity-status").then((r) => setVelocityStatus(r.data)).catch(() => setVelocityStatus(null));
    api.get("/clubs/my").then((r) => setUserClubs(r.data || [])).catch(() => setUserClubs([]));
    api.get("/ads").then((r) => setUserAds(r.data || [])).catch(() => setUserAds([]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setSubEnabled(Boolean(user.has_creator_subscription_enabled));
    setSubName(user.creator_subscription_custom_club_name || "");
    setSubPrice(Number(user.creator_subscription_monthly_price || 0).toFixed(2));
    setSubRules(user.creator_subscription_custom_rules || "");
  }, [user]);

  const beginStripeOnboarding = async () => {
    try {
      const r = await api.post("/payments/stripe/connect/onboard", { origin_url: window.location.origin });
      window.location.href = r.data.onboarding_url;
    } catch {
      // no-op UI fallback
    }
  };

  const beginPayPalOnboarding = async () => {
    try {
      const r = await api.post("/payments/paypal/onboard", { origin_url: window.location.origin });
      window.location.href = r.data.onboarding_url;
    } catch {
      // no-op UI fallback
    }
  };

  const saveStoreSubscriptionClub = async () => {
    setSubscriptionSaving(true);
    try {
      await api.put("/profile", {
        has_creator_subscription_enabled: subEnabled,
        creator_subscription_custom_club_name: subName.trim() || null,
        creator_subscription_monthly_price: subEnabled ? Number(subPrice || 0) : 0,
        creator_subscription_custom_rules: subRules.trim() || null,
      });
    } catch {
      // no-op fallback
    } finally {
      setSubscriptionSaving(false);
    }
  };

  const canCreateAds = () => {
    if (!user) return false;
    if (user.is_pro || user.has_creator_subscription_enabled) return true;
    if ((designs.filter((d) => d.is_public).length) >= 20) return true;
    return false;
  };

  const createAd = async () => {
    if (!adTargetId.trim() || !adBlurb.trim()) {
      toast.error("Please select a target and write a short blurb");
      return;
    }
    setAdSubmitting(true);
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + adDurationDays * 24 * 60 * 60 * 1000).toISOString();
      await api.post("/ads", {
        target_type: adTargetType,
        target_id: adTargetId,
        blurb: adBlurb.trim(),
        budget_usd: 10.0,
        start_date: now.toISOString(),
        end_date: endDate,
      });
      toast.success("Ad campaign created");
      setAdDialogOpen(false);
      setAdTargetId("");
      setAdBlurb("");
      setAdDurationDays(7);
      const ads = await api.get("/ads");
      setUserAds(ads.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create ad");
    } finally {
      setAdSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-32 px-6 md:px-12 lg:px-24 text-center">
        <img src={BRAND_LOGO_URL} alt={BRAND_NAME} className="h-20 w-auto object-contain mx-auto mb-6" />
        <h1 className="font-display text-3xl font-light mb-4">Sign in to view your shop</h1>
        <Button data-testid="dashboard-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech uppercase tracking-wider">
          Sign in with Google
        </Button>
      </div>
    );
  }

  const revenue = listings.reduce((acc, l) => acc + (l.price * l.sales_count), 0);
  const fees = revenue * 0.035;

  const refreshListings = async () => {
    const r = await api.get("/seller/listings");
    setListings(r.data);
  };

  const openListingEditor = (listing) => {
    setEditingListing({
      listing_id: listing.listing_id,
      title: listing.title || "",
      description: listing.description || "",
      base_original_price: Number(listing.base_original_price ?? listing.price ?? 0).toFixed(2),
      available_filament_colors: Array.isArray(listing.available_filament_colors) ? listing.available_filament_colors : [],
      is_on_sale: Boolean(listing.is_on_sale),
      active_sale_price: listing.active_sale_price != null ? Number(listing.active_sale_price).toFixed(2) : "",
      sale_expiration_date: listing.sale_expiration_date ? String(listing.sale_expiration_date).slice(0, 10) : "",
    });
    setEditorColorInput("");
  };

  const saveListingEditor = async () => {
    if (!editingListing) return;
    setEditorBusy(true);
    try {
      await api.put(`/seller/listings/${editingListing.listing_id}`, {
        title: editingListing.title,
        description: editingListing.description,
        base_original_price: Number(editingListing.base_original_price || 0),
        available_filament_colors: editingListing.available_filament_colors,
        is_on_sale: editingListing.is_on_sale,
        active_sale_price: editingListing.is_on_sale && editingListing.active_sale_price ? Number(editingListing.active_sale_price) : null,
        sale_expiration_date: editingListing.is_on_sale ? (editingListing.sale_expiration_date || null) : null,
      });
      await refreshListings();
      toast.success("Listing updated");
      setEditingListing(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not update listing");
    } finally {
      setEditorBusy(false);
    }
  };

  const deleteListing = async (listing, hard = false) => {
    if (typeof window !== "undefined") {
      const msg = hard
        ? `PERMANENTLY delete "${listing.title}"? This cannot be undone. All data will be lost.`
        : `Archive "${listing.title}"? It will be removed from the marketplace but kept in records.`;
      const ok = window.confirm(msg);
      if (!ok) return;
    }
    try {
      const endpoint = hard
        ? `/seller/listings/${listing.listing_id}/hard-delete`
        : `/seller/listings/${listing.listing_id}`;
      await api.delete(endpoint);
      await refreshListings();
      toast.success(hard ? "Listing permanently deleted" : "Listing archived");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not delete listing");
    }
  };

  return (
    <div data-testid="dashboard-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Dashboard
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter">
            Hi, {user.name.split(" ")[0]}.
          </h1>
          <div className="flex items-center gap-3">
            {user.is_seller && (
              <Link to="/seller/orders">
                <Button className="rounded-xl font-tech text-xs uppercase tracking-wider">Orders</Button>
              </Link>
            )}
            {canCreateAds() && (
              <Button onClick={() => setAdDialogOpen(true)} data-testid="create-ad-btn" className="rounded-xl font-tech text-xs uppercase tracking-wider">
                <Megaphone className="h-4 w-4 mr-2" /> Create an Ad
              </Button>
            )}
            <Link to="/create">
            <Button data-testid="create-listing-btn" className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
              <Plus className="h-4 w-4 mr-2" /> New listing
            </Button>
            </Link>
          </div>
        </div>
        {user.is_seller && paymentStatus && (!paymentStatus?.stripe?.ready || !paymentStatus?.paypal?.ready) && (
          <div className="mt-5 border border-accent/30 bg-accent/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-tech text-muted-foreground">
              Connect your payout accounts to unlock multi-party checkout splits.
            </div>
            <div className="flex items-center gap-2">
              {!paymentStatus?.stripe?.ready && (
                <Button onClick={beginStripeOnboarding} size="sm" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  Connect Stripe
                </Button>
              )}
              {!paymentStatus?.paypal?.ready && (
                <Button onClick={beginPayPalOnboarding} size="sm" variant="outline" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  Connect PayPal
                </Button>
              )}
            </div>
          </div>
        )}
        {user.is_seller && velocityStatus?.show_subscription_velocity_alert && (
          <div className="mt-5 mx-auto max-w-4xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 rounded-2xl p-4 text-center">
            <div className="text-sm leading-relaxed">
              🚀 Cosmic Velocity Detected! You have shared over 10 high-fidelity designs in the last 3 days! Your community swarm is expanding fast. Would you like to build recurring income? Toggle your Custom Store Subscription Club to ON right now to unlock direct monthly subscription memberships, allow followers to support your workspace, and establish your own custom membership rules!
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("subscription-club-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mt-2 text-xs font-tech uppercase tracking-wider text-[#F59E0B] underline"
            >
              Jump to subscription setup
            </button>
          </div>
        )}
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 grid grid-cols-1 md:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden mb-10">
        <StatBox icon={Package} label="Active listings" value={listings.length} />
        <StatBox icon={ShoppingBag} label="Total sales" value={listings.reduce((a, l) => a + l.sales_count, 0)} />
        <StatBox icon={DollarSign} label="Gross revenue" value={`$${revenue.toFixed(2)}`} />
        <StatBox icon={Eye} label="Platform fees" value={`$${fees.toFixed(2)}`} />
      </div>

      {user.is_seller && (
        <div className="px-6 md:px-12 lg:px-24 mb-10">
          <div id="subscription-club-panel" className="border border-border rounded-2xl p-5 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-2xl font-light tracking-tight">Store Subscription Club</h2>
                <p className="text-xs text-muted-foreground">Enable buyer membership for base pricing access and recurring supporter perks.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground">Enable Store Subscription Club</span>
                <Switch checked={subEnabled} onCheckedChange={setSubEnabled} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Custom Club Name</label>
                <Input
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Nebula Supporters Guild"
                  disabled={!subEnabled}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Monthly Price (USD)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={subPrice}
                  onChange={(e) => setSubPrice(e.target.value)}
                  disabled={!subEnabled}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Custom Rules</label>
              <Textarea
                rows={4}
                value={subRules}
                onChange={(e) => setSubRules(e.target.value)}
                placeholder="Members get early access drops and base price checkout."
                disabled={!subEnabled}
              />
            </div>

            <Button onClick={saveStoreSubscriptionClub} disabled={subscriptionSaving} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {subscriptionSaving ? "Saving..." : "Save Club Settings"}
            </Button>
            {subEnabled && canCreateAds() && (
              <Button onClick={() => { setAdTargetType("club"); setAdDialogOpen(true); }} data-testid="create-club-ad-btn" variant="outline" className="rounded-xl font-tech text-xs uppercase tracking-wider">
                <Megaphone className="h-4 w-4 mr-2" /> Promote your club
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="px-6 md:px-12 lg:px-24 pb-16">
        <h2 className="font-display text-2xl font-bold mb-6">Your listings</h2>
        {listings.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">You haven&apos;t listed anything yet.</p>
            <Link to="/create">
              <Button data-testid="empty-create-btn" className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
                Start your first listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((l) => (
              <div key={l.listing_id} data-testid={`my-listing-${l.listing_id}`} className="rounded-2xl bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <Link to={`/listing/${l.listing_id}`} className="block">
                  <div className="aspect-[4/3] bg-secondary border-b border-border overflow-hidden">
                    {l.image_paths?.[0] && <SafeImage src={fileUrl(l.image_paths[0])} alt="" className="w-full h-full object-cover" />}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/listing/${l.listing_id}`} className="font-display text-lg font-medium hover:text-primary block mb-2">{l.title}</Link>
                  <div className="mb-2">
                    <SalePrice
                      isOnSale={l.is_on_sale}
                      baseOriginalPrice={l.base_original_price ?? l.price}
                      activeSalePrice={l.active_sale_price}
                      saleClassName="text-base"
                      baseClassName="text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-3">
                    <span>{l.sales_count} sales</span>
                    <span className="text-emerald-500">{l.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {l.share_design ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full font-tech text-[9px] uppercase tracking-wider">Open</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full font-tech text-[9px] uppercase tracking-wider">Private</Badge>
                    )}
                    {l.is_on_sale && (
                      <Badge className="bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30 rounded-full font-tech text-[9px] uppercase tracking-wider">On Sale</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => openListingEditor(l)} data-testid={`edit-listing-btn-${l.listing_id}`} className="flex-1 rounded-xl font-tech text-xs uppercase tracking-wider">
                      Edit Listing Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteListing(l, false)}
                      data-testid={`archive-listing-btn-${l.listing_id}`}
                      title="Archive listing"
                      className="h-9 w-9 p-0 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => deleteListing(l, true)}
                      data-testid={`hard-delete-listing-btn-${l.listing_id}`}
                      title="Permanently delete listing"
                      className="h-9 w-9 p-0 rounded-xl border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {designs.length > 0 && (
          <>
            <h2 className="font-display text-2xl font-bold mb-6 mt-12">Your shared designs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {designs.map((d) => (
                <div key={d.design_id} className="rounded-2xl p-4 bg-card shadow-sm hover:shadow-lg transition-shadow">
                  <div className="font-medium mb-1">{d.title}</div>
                  <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                    {d.is_public ? "Public" : "Private"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={adDialogOpen} onOpenChange={(open) => { setAdDialogOpen(open); if (!open) { setAdTargetId(""); setAdBlurb(""); setAdDurationDays(7); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create an Ad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Promote</label>
              <div className="flex gap-2">
                {[
                  { value: "listing", label: "Listing" },
                  { value: "club", label: "Club" },
                  { value: "design", label: "Design" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setAdTargetType(opt.value); setAdTargetId(""); }}
                    className={`px-3 py-1.5 text-xs font-tech uppercase tracking-wider border rounded-xl transition-colors ${adTargetType === opt.value ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Select {adTargetType}</label>
              <select
                value={adTargetId}
                onChange={(e) => setAdTargetId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-tech"
              >
                <option value="">Choose a {adTargetType}...</option>
                {adTargetType === "listing" && listings.map((l) => (
                  <option key={l.listing_id} value={l.listing_id}>{l.title}</option>
                ))}
                {adTargetType === "club" && userClubs.map((c) => (
                  <option key={c.chat_id} value={c.chat_id}>{c.club_name}</option>
                ))}
                {adTargetType === "design" && designs.map((d) => (
                  <option key={d.design_id} value={d.design_id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Short blurb</label>
              <Textarea
                rows={3}
                value={adBlurb}
                onChange={(e) => setAdBlurb(e.target.value)}
                placeholder="Why should people check this out?"
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Duration (days)</label>
              <Input
                type="number"
                min={1}
                max={30}
                value={adDurationDays}
                onChange={(e) => setAdDurationDays(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdDialogOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={createAd} disabled={adSubmitting} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {adSubmitting ? "Creating..." : "Launch Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Edit Listing Details</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Item Title</label>
                <Input
                  value={editingListing.title}
                  onChange={(e) => setEditingListing((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Description</label>
                <Textarea
                  rows={4}
                  value={editingListing.description}
                  onChange={(e) => setEditingListing((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Base Price</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={editingListing.base_original_price}
                  onChange={(e) => setEditingListing((prev) => ({ ...prev, base_original_price: e.target.value }))}
                />
              </div>

<div>
                <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">List Your Available Filament Colors</label>
                <Input
                  value={editorColorInput}
                  onChange={(e) => setEditorColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const next = editorColorInput.trim();
                    if (!next) return;
                    setEditingListing((prev) => ({
                      ...prev,
                      available_filament_colors: Array.from(new Set([...(prev.available_filament_colors || []), next])),
                    }));
                    setEditorColorInput("");
                  }}
                  placeholder="Type a color and hit Enter (e.g. #000000, Galaxy Black)"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!editingListing.available_filament_colors?.includes("Rainbow")) {
                      setEditingListing((prev) => ({
                        ...prev,
                        available_filament_colors: Array.from(new Set([...(prev.available_filament_colors || []), "Rainbow"])),
                      }));
                    }
                  }}
                  className="rounded-xl font-tech text-[10px] uppercase tracking-wider px-3 py-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-purple-600 text-white border border-border hover:opacity-90 transition-opacity"
                >
                  Rainbow
                </button>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(editingListing.available_filament_colors || []).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingListing((prev) => ({
                        ...prev,
                        available_filament_colors: (prev.available_filament_colors || []).filter((c) => c !== color),
                      }))}
                      className="px-2 py-1 rounded-full border border-border text-[10px] font-tech hover:border-destructive hover:text-destructive"
                      title="Remove color"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-2xl p-3 space-y-3">
                <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editingListing.is_on_sale}
                    onChange={(e) => setEditingListing((prev) => ({ ...prev, is_on_sale: e.target.checked }))}
                    className="accent-primary"
                  />
                  Put this item up for Sale
                </label>
                {editingListing.is_on_sale && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Active Sale Price</label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={editingListing.active_sale_price}
                        onChange={(e) => setEditingListing((prev) => ({ ...prev, active_sale_price: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Sale Expiration Date</label>
                      <Input
                        type="date"
                        value={editingListing.sale_expiration_date}
                        onChange={(e) => setEditingListing((prev) => ({ ...prev, sale_expiration_date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingListing(null)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={saveListingEditor} disabled={editorBusy} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {editorBusy ? "Saving..." : "Confirm Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="bg-card p-6">
      <Icon className="h-4 w-4 text-muted-foreground mb-3" strokeWidth={1.5} />
      <div className="font-display text-2xl font-light tracking-tighter">{value}</div>
      <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
