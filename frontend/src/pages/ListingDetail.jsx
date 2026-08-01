/* eslint-disable */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Share2, Download, ArrowLeft, MessageSquare, FileBox, Info, GitFork, GitBranch, Lock, Trash2, Box, Flag, ChevronLeft, ChevronRight, Star, Heart, ShoppingCart, Reply, Forward, SmilePlus, UserPlus, UserCheck, Bookmark, Share, Heart as HeartIcon, BookmarkCheck, Edit, EyeOff, AlertTriangle, Trash, HelpCircle, MapPin, FolderOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ModelViewer from "@/components/ModelViewer";
import { useCart } from "@/contexts/CartContext";
import SalePrice from "@/components/SalePrice";
import UserBadges from "@/components/UserBadges";
import RestrictedContentToggle from "@/components/RestrictedContentToggle";
import SafeImage from "@/components/SafeImage";
import StarfieldRenderer from "@/components/StarfieldRenderer";
import { FloatingParticles, RevealOnScroll, TiltCard } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

const TABS = [
  { id: "details", label: "Details", icon: Info },
  { id: "files", label: "Files", icon: FileBox },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "remixes", label: "Remixes", icon: GitFork },
  { id: "remix-tree", label: "Remix Tree", icon: GitBranch },
  { id: "related", label: "Related Models", icon: Box },
];

export default function ListingDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("details");
  const [comments, setComments] = useState([]);
  const [remixes, setRemixes] = useState([]);
  const [related, setRelated] = useState([]);
  const [reportTarget, setReportTarget] = useState(null); // {type, id}
  const [reportReason, setReportReason] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [creatorClubStatus, setCreatorClubStatus] = useState(null);
  const [creatorClubOpen, setCreatorClubOpen] = useState(false);
  const [followingSeller, setFollowingSeller] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [selectedFilamentColor, setSelectedFilamentColor] = useState("");
  const [starSeed] = useState(() => Date.now());
  const [filamentColorError, setFilamentColorError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [askCreatorOpen, setAskCreatorOpen] = useState(false);
  const [askPrompt, setAskPrompt] = useState("");
  const [buyerRegions, setBuyerRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipePrinter, setRecipePrinter] = useState("");
  const [recipeNozzle, setRecipeNozzle] = useState("");
  const [recipeFilament, setRecipeFilament] = useState("");
  const [recipeLayer, setRecipeLayer] = useState("");
  const [recipeInfill, setRecipeInfill] = useState("");
  const [recipeSupports, setRecipeSupports] = useState("");
  const [recipeTime, setRecipeTime] = useState("");
  const [recipeSubmitting, setRecipeSubmitting] = useState(false);
  const [userCollections, setUserCollections] = useState([]);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [remixTree, setRemixTree] = useState(null);
  const [loadingRemixTree, setLoadingRemixTree] = useState(false);
  const { user, openAuth } = useAuth();
  const { add: addToCart } = useCart();
  const navigate = useNavigate();

  // Ambient click sparkles across the page
  const sparkles = useSparkleField();


  const openReport = (type, id) => {
    if (!user) { openAuth("signin"); return; }
    setReportTarget({ type, id });
    setReportReason("");
  };
  const submitReport = async () => {
    if (!reportReason.trim()) { toast.error("Reason required"); return; }
    try {
      await api.post("/reports", {
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason,
      });
      toast.success("Report sent. Thanks for keeping Print Cosmos clean.");
      setReportTarget(null);
    } catch { toast.error("Could not send report"); }
  };

  const prevImage = () => setActiveImg((i) => (i === 0 ? (item.image_paths.length - 1) : i - 1));
  const nextImage = () => setActiveImg((i) => (i + 1) % item.image_paths.length);

  useEffect(() => {
    if (!id) return;
    api.get(`/listings/${id}`).then((r) => setItem(r.data)).catch(() => setItem(null));
    api.get(`/listings/${id}/comments`).then((r) => setComments(r.data)).catch(() => setComments([]));
    api.get(`/listings/${id}/remixes`).then((r) => setRemixes(r.data)).catch(() => setRemixes([]));
    setLoadingRegions(true);
    api.get(`/listings/${id}/buyer-regions`).then((r) => setBuyerRegions(r.data?.regions || [])).catch(() => setBuyerRegions([])).finally(() => setLoadingRegions(false));
    setLoadingRecipes(true);
    api.get(`/listings/${id}/recipes`).then((r) => setRecipes(r.data || [])).catch(() => setRecipes([])).finally(() => setLoadingRecipes(false));
    if (user) {
      api.get("/collections").then((r) => setUserCollections(r.data || [])).catch(() => setUserCollections([]));
    }
  }, [id, user]);

  useEffect(() => {
    if (tab !== "remix-tree" || !id) return;
    setLoadingRemixTree(true);
    api.get(`/listings/${id}/remix-tree`).then((r) => setRemixTree(r.data)).catch(() => setRemixTree(null)).finally(() => setLoadingRemixTree(false));
  }, [tab, id]);

  const addToCollection = async () => {
    if (!selectedCollectionId || !item) return;
    try {
      await api.post(`/collections/${selectedCollectionId}/items`, { listing_id: item.listing_id });
      toast.success("Added to collection");
      setAddToCollectionOpen(false);
      setSelectedCollectionId("");
    } catch {
      toast.error("Could not add to collection");
    }
  };

  useEffect(() => {
    if (!item?.seller_id || !user || user.user_id === item.seller_id) {
      setCreatorClubStatus(null);
      setRelated([]);
      return;
    }
    api.get(`/creator-subscriptions/status/${item.seller_id}`)
      .then((r) => setCreatorClubStatus(r.data))
      .catch(() => setCreatorClubStatus(null));
    api.get(`/listings/${item.seller_id}/related`)
      .then((r) => setRelated((r.data || []).filter((l) => l.listing_id !== item.listing_id).slice(0, 10)))
      .catch(() => setRelated([]));
  }, [item?.seller_id, user?.user_id, item?.listing_id]);

  useEffect(() => {
    if (!item?.seller_id || !user || user.user_id === item.seller_id) {
      setFollowingSeller(false);
      return;
    }
    api.get(`/users/${item.seller_id}/follow-status`)
      .then((r) => setFollowingSeller(Boolean(r.data?.following)))
      .catch(() => setFollowingSeller(false));
  }, [item?.seller_id, user?.user_id]);

  // This effect must be declared before the `if (!item) return` below —
  // every hook has to run in the same order on every render, and item
  // starts out null on the first render. Declaring it after the early
  // return caused a real bug: "Rendered more hooks than during the
  // previous render" once the listing finished loading.
  useEffect(() => {
    setUserRating(item?.user_rating_value || 0);
  }, [item?.user_rating_value]);

  // Sync saved/liked/counts from item data
  useEffect(() => {
    if (item) {
      setSaved(item.user_saved || false);
      setLiked(item.user_liked || false);
      setSavedCount(item.saved_count || 0);
      setLikesCount(item.likes_count || 0);
      setSharesCount(item.shares_count || 0);
    }
  }, [item]);

  if (!item) {
    return (
      <div className="pt-32 px-6 md:px-12 lg:px-24 text-sm font-tech text-muted-foreground">
        {sparkles.layer}
        <FloatingParticles count={5} color="rgba(255,87,34,0.12)" className="fixed inset-0" />
        Loading listing…
      </div>
    );
  }

  const shipping = Number(item.shipping_fee || 0);
  const totalAmount = Number(item.price) + shipping;
  const fee = (totalAmount * 0.035).toFixed(2);
  const hasModel = !!item.model_path;
  const cover = item.image_paths?.[activeImg];
  const canRate = user && item.user_has_purchased && user.user_id !== item.seller_id;
  const filamentOptions = Array.isArray(item.available_filament_colors) ? item.available_filament_colors.filter(Boolean) : [];
  const requiresFilamentSelection = item.listing_type === "product" && filamentOptions.length > 0;

  const submitRating = async (value) => {
    if (!canRate || ratingSaving || value < 1 || value > 5) return;
    setRatingSaving(true);
    try {
      const response = await api.post(`/listings/${item.listing_id}/ratings`, { value });
      setUserRating(value);
      setItem((prev) => prev ? { ...prev, rating_avg: response.data.rating_avg, rating_count: response.data.rating_count, user_rating_value: value } : prev);
      toast.success("Rating saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save rating");
    } finally {
      setRatingSaving(false);
    }
  };

  const proceedCheckout = async (decision = "none") => {
    if (!user) {
      toast.info("Sign in to checkout");
      openAuth("signin");
      return;
    }
    if (requiresFilamentSelection && !selectedFilamentColor) {
      setFilamentColorError(true);
      return;
    }
    setBusy(true);
    try {
      const r = await api.post("/checkout/session", {
        listing_id: item.listing_id,
        origin_url: window.location.origin,
        shipping_fee: shipping,
        creator_subscription_decision: decision,
        selected_filament_color: selectedFilamentColor || null,
      });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error("Checkout failed");
      setBusy(false);
    }
  };

  const handleAddToCart = () => {
    if (requiresFilamentSelection && !selectedFilamentColor) {
      setFilamentColorError(true);
      return;
    }
    addToCart(item, { selected_filament_color: selectedFilamentColor || null });
    setFilamentColorError(false);
    toast.success("Added to cart");
  };

  const toggleFollowSeller = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }
    if (!item?.seller_id || user.user_id === item.seller_id) return;
    try {
      if (followingSeller) {
        await api.delete(`/users/${item.seller_id}/follow`);
        setFollowingSeller(false);
      } else {
        await api.post(`/users/${item.seller_id}/follow`);
        setFollowingSeller(true);
      }
    } catch {
      toast.error("Could not update follow status");
    }
  };

  const toggleSave = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }
    try {
      const res = await api.post(`/listings/${item.listing_id}/save`);
      setSaved(res.data.saved);
      setSavedCount(res.data.saved_count);
      toast.success(res.data.saved ? "Saved to your collection" : "Removed from collection");
    } catch {
      toast.error("Could not update save");
    }
  };

  const toggleLike = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }
    try {
      const res = await api.post(`/listings/${item.listing_id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
      toast.success(res.data.liked ? "Liked!" : "Unliked");
    } catch {
      toast.error("Could not update like");
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`/listings/${item.listing_id}/share`);
      setSharesCount(res.data.shares_count);
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Could not share");
    }
  };

  const handleBuy = async () => {
    if (!user) {
      toast.info("Sign in to checkout");
      openAuth("signin");
      return;
    }
    if (creatorClubStatus?.enabled && !creatorClubStatus?.has_active_subscription) {
      setCreatorClubOpen(true);
      return;
    }
    proceedCheckout("none");
  };

  const askCreator = async () => {
    if (!askPrompt.trim() || !user) return;
    try {
      await api.post("/messages/ask-creator", {
        listing_id: item.listing_id,
        prompt: askPrompt.trim(),
      });
      toast.success("Message sent to creator");
      setAskCreatorOpen(false);
      setAskPrompt("");
    } catch {
      toast.error("Could not send message");
    }
  };

  const submitRecipe = async () => {
    if (!recipePrinter.trim() || !recipeNozzle.trim() || !recipeFilament.trim() || !recipeLayer.trim() || !recipeInfill.trim() || !recipeSupports.trim()) {
      toast.error("Please fill all recipe fields");
      return;
    }
    setRecipeSubmitting(true);
    try {
      const r = await api.post(`/listings/${item.listing_id}/recipes`, {
        printer: recipePrinter,
        nozzle_size: recipeNozzle,
        filament_brand: recipeFilament,
        layer_height: recipeLayer,
        infill: recipeInfill,
        supports: recipeSupports,
        estimated_time: recipeTime || null,
      });
      setRecipes((prev) => [r.data, ...prev]);
      setRecipeOpen(false);
      setRecipePrinter("");
      setRecipeNozzle("");
      setRecipeFilament("");
      setRecipeLayer("");
      setRecipeInfill("");
      setRecipeSupports("");
      setRecipeTime("");
      toast.success("Recipe added");
    } catch {
      toast.error("Could not add recipe");
    } finally {
      setRecipeSubmitting(false);
    }
  };

  const upvoteRecipe = async (recipeId) => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/listings/${item.listing_id}/recipes/${recipeId}/upvote`, {});
      setRecipes((prev) => prev.map((rp) => rp.recipe_id === recipeId ? { ...rp, upvotes_count: r.data.upvotes_count, user_upvoted: r.data.active } : rp));
    } catch {
      toast.error("Could not upvote recipe");
    }
  };

  const counts = {
    details: null,
    files: hasModel ? 1 : 0,
    comments: comments.length,
    remixes: remixes.length,
  };

  return (
    <div data-testid="listing-detail-page" className="pt-14 min-h-screen relative bg-black">
      {sparkles.layer}
      <FloatingParticles count={6} color="rgba(255,87,34,0.1)" className="fixed inset-0 pointer-events-none" />
      {/* Subtle starfield background - dimmer than Browse page */}
      <StarfieldRenderer starCount={150} seed={starSeed} className="fixed inset-0 opacity-30" />
      
      {/* Content layer */}
      <div className="relative z-10">
        <div className="px-6 md:px-12 lg:px-24 py-6 border-b border-border bg-black/20 backdrop-blur-sm rise-in">
          <button onClick={() => navigate(-1)} className="text-xs font-tech uppercase tracking-[0.2em] text-white/60 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 grid lg:grid-cols-2 gap-10">
        {/* Left — media */}
        <div className="rise-in rise-in-1">
          <div className="aspect-square bg-secondary border border-border rounded-xl overflow-hidden relative group auto-float">
            {item.is_on_sale && (
              <div className="absolute left-2 top-2 z-10 px-2 py-1 rounded-xl bg-[#F59E0B] text-black text-[9px] font-tech uppercase tracking-wider">
                COSMIC SALE EVENT
              </div>
            )}
            {cover ? (
              <SafeImage
                src={fileUrl(cover)}
                alt={item.title}
                data-testid="listing-cover-img"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            ) : hasModel ? (
              <ModelViewer modelPath={item.model_path} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground font-tech text-xs">NO PREVIEW</div>
            )}
            {item.image_paths?.length > 1 && (
              <>
                <button
                  data-testid="img-prev-btn"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-primary transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  data-testid="img-next-btn"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-primary transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-xl text-[10px] font-tech">
                  {activeImg + 1} / {item.image_paths.length}
                </div>
              </>
            )}
          </div>
          {item.image_paths?.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {item.image_paths.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setActiveImg(i)}
                  data-testid={`listing-thumb-${i}`}
                  className={`aspect-square border rounded-xl overflow-hidden ${i === activeImg ? "border-primary" : "border-border"}`}
                >
                  <SafeImage src={fileUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {hasModel && cover && (
            <div className="mt-6 border border-border rounded-xl">
              <div className="px-4 py-2 text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground border-b border-border">3D Preview</div>
              <div className="h-72"><ModelViewer modelPath={item.model_path} /></div>
            </div>
          )}
        </div>

        {/* Right — summary + buy */}
        <div className="rise-in rise-in-2">
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {item.category}
            {item.listing_type === "service" && <span className="ml-2 px-2 py-0.5 bg-accent/10 text-accent rounded-xl">Service</span>}
            {item.print_time && <span className="ml-2 px-2 py-0.5 bg-secondary rounded-xl">⏱ {item.print_time}</span>}
            {(item.compatibility_tags || []).map((tag) => (
              <span key={tag} className="ml-2 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">✓ {tag}</span>
            ))}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-light tracking-tighter mb-2 rise-in">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] font-tech">
            <Stars value={item.rating_avg || 0} />
            <span className="text-muted-foreground">{item.rating_avg?.toFixed(1) || "0.0"}</span>
            <span className="rounded-full bg-secondary/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {item.rating_count || 0} {item.rating_count === 1 ? "review" : "reviews"}
            </span>
          </div>
          {user ? (
            <div className="mb-3 text-xs font-tech">
              {canRate ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="uppercase tracking-[0.3em] text-muted-foreground">Your rating</span>
                    <RatingStars value={userRating} onChange={submitRating} disabled={ratingSaving} />
                  </div>
                  {userRating > 0 && (
                    <div className="mt-2 text-[10px] text-primary">Your rating has been saved.</div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">
                  {item.user_has_purchased
                    ? "You cannot rate your own listing."
                    : "Buy this listing first to leave a rating."}
                </div>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-xs font-tech uppercase tracking-[0.2em] text-muted-foreground mb-3 flex-wrap">
            <Link to={`/profile/${item.seller_id}`} className="inline-flex">
            <Avatar className="h-6 w-6 border border-border hover:border-primary transition-colors cursor-pointer">
              <AvatarImage src={item.seller_picture} />
              <AvatarFallback className="text-[10px]">{item.seller_name?.[0]}</AvatarFallback>
            </Avatar>
            </Link>
            <Link to={`/profile/${item.seller_id}`} className="hover:text-foreground">by {item.seller_name}</Link>
            <UserBadges user={{ is_pro: item.seller_is_pro, is_platform_owner: item.seller_is_platform_owner, created_at: item.seller_created_at }} badges={item.seller_badges} milestoneBadges={item.seller_milestone_badges} />
            <span>·</span>
            <span>{item.sales_count} sold</span>
            <span>·</span>
            <span>listed {new Date(item.created_at).toLocaleDateString()}</span>
            {user && user.user_id !== item.seller_id && (
              <button
                onClick={toggleFollowSeller}
                className="ml-2 inline-flex items-center gap-1 px-2 py-1 border border-border rounded-xl hover:border-primary text-[10px]"
              >
                {followingSeller ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {followingSeller ? "Following" : "Follow"}
              </button>
            )}
          </div>
          {/* Report buttons */}
          {user && user.user_id !== item.seller_id && (
            <div className="flex items-center gap-2 mb-6">
              <button
                data-testid="report-listing-btn"
                onClick={() => openReport("listing", item.listing_id)}
                className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-destructive inline-flex items-center gap-1 px-2 py-1 border border-border rounded-xl hover:border-destructive"
              >
                <Flag className="h-3 w-3" /> Report listing
              </button>
              <button
                data-testid="report-seller-btn"
                onClick={() => openReport("seller", item.seller_id)}
                className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-destructive inline-flex items-center gap-1 px-2 py-1 border border-border rounded-xl hover:border-destructive"
              >
                <Flag className="h-3 w-3" /> Report seller
              </button>
            </div>
          )}
          {item.share_design && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-tech uppercase tracking-wider rounded-xl mb-6">
              <Share2 className="h-3 w-3" /> Open source design — files included
            </div>
          )}

          <div className="border border-border rounded-xl p-6 mb-6 auto-glow-pulse">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Price</div>
              <div className="font-display text-4xl font-light tracking-tighter text-primary">
                {item.negotiable ? (
                  <span className="text-2xl">Negotiable</span>
                ) : (
                  <SalePrice
                    isOnSale={item.is_on_sale}
                    baseOriginalPrice={item.base_original_price ?? item.price}
                    activeSalePrice={item.active_sale_price}
                    saleClassName="text-4xl"
                    baseClassName="text-2xl"
                  />
                )}
              </div>
            </div>
            {!item.negotiable && (
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground space-y-1 mb-6">
                <div className="flex justify-between"><span>Platform fee (3.5% of price + shipping)</span><span>${fee}</span></div>
                <div className="flex justify-between"><span>Seller receives</span><span>${(totalAmount - parseFloat(fee)).toFixed(2)}</span></div>
              </div>
            )}
            {buyerRegions.length > 0 && (
              <div className="mb-6 p-4 border border-border rounded-xl bg-secondary/30">
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Buyer regions (anonymized)</div>
                <div className="flex flex-wrap gap-2">
                  {buyerRegions.map((r) => (
                    <span key={r.country} className="px-2 py-1 bg-card border border-border rounded-lg text-[11px] font-tech text-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {r.country} <span className="text-muted-foreground">({r.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {requiresFilamentSelection && (
              <div className="mb-4">
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Select Filament Color Variant
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {filamentOptions.map((color) => {
                    const selected = selectedFilamentColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedFilamentColor(color);
                          setFilamentColorError(false);
                        }}
                        className={`filament-swatch h-8 w-8 rounded-full border-2 ${selected ? "border-white ring-2 ring-amber-300" : "border-border"}`}
                        style={getFilamentSwatchStyle(color)}
                        aria-label={color}
                      />
                    );
                  })}
                </div>
                {selectedFilamentColor && (
                  <div className="text-xs font-tech text-primary">{selectedFilamentColor}</div>
                )}
                {filamentColorError && (
                  <div className="vibrate-alert text-xs text-destructive font-tech mt-2">
                    Please select an available filament color option before launching your checkout route.
                  </div>
                )}
              </div>
            )}
            <Button
              data-testid="buy-now-btn"
              onClick={handleBuy}
              disabled={busy}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 rounded-xl font-tech uppercase tracking-wider mb-2 auto-glow-pulse"
            >
              {busy ? "Redirecting…" : "Buy now"}
            </Button>
            <Button
              data-testid="add-to-cart-btn"
              onClick={handleAddToCart}
              variant="outline"
              size="lg"
              className="w-full rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Add to cart
            </Button>
          </div>

          {user && (
            <Button
              variant="outline"
              data-testid="message-seller-btn"
              onClick={() => navigate(`/messages/${item.seller_id}`)}
              className="w-full rounded-xl font-tech text-xs uppercase tracking-wider mb-2"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-2" /> Message seller
            </Button>
          )}
          {user && user.user_id !== item.seller_id && (
            <Button
              variant="outline"
              data-testid="ask-creator-btn"
              onClick={() => setAskCreatorOpen(true)}
              className="w-full rounded-xl font-tech text-xs uppercase tracking-wider mb-2"
            >
              <HelpCircle className="h-3.5 w-3.5 mr-2" /> Ask the Creator
            </Button>
          )}
          <Button
            variant="outline"
            data-testid="compare-btn"
            onClick={() => navigate(`/compare?a=${item.listing_id}`)}
            className="w-full rounded-xl font-tech text-xs uppercase tracking-wider mb-2"
          >
            Compare
          </Button>

          <div className="border-t border-border/60 pt-5 mt-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-tech uppercase tracking-[0.25em] text-muted-foreground">Print Recipes</div>
              {user && (
                <Button size="sm" onClick={() => setRecipeOpen(true)} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  Add recipe
                </Button>
              )}
            </div>
            {loadingRecipes ? (
              <div className="text-xs text-muted-foreground font-tech">Loading recipes…</div>
            ) : recipes.length === 0 ? (
              <div className="text-xs text-muted-foreground font-tech leading-relaxed">No print recipes yet. If you’ve successfully printed this, share your settings.</div>
            ) : (
              <div className="space-y-2">
                {recipes.map((rp) => (
                  <div key={rp.recipe_id} className="border border-border rounded-xl p-3 bg-card/60">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-medium">{rp.author_name || "Anonymous"}</div>
                      <button
                        onClick={() => upvoteRecipe(rp.recipe_id)}
                        className={`text-[10px] font-tech uppercase tracking-wider px-2 py-1 border rounded-lg inline-flex items-center gap-1 transition-colors ${rp.user_upvoted ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
                      >
                        ▲ {rp.upvotes_count || 0}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-tech text-muted-foreground">
                      <div>Printer: <span className="text-foreground/80">{rp.printer}</span></div>
                      <div>Nozzle: <span className="text-foreground/80">{rp.nozzle_size}</span></div>
                      <div>Filament: <span className="text-foreground/80">{rp.filament_brand}</span></div>
                      <div>Layer: <span className="text-foreground/80">{rp.layer_height}</span></div>
                      <div>Infill: <span className="text-foreground/80">{rp.infill}</span></div>
                      <div>Supports: <span className="text-foreground/80">{rp.supports}</span></div>
                      {rp.estimated_time && <div className="col-span-2 text-foreground/80">Time: {rp.estimated_time}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={recipeOpen} onOpenChange={(open) => { setRecipeOpen(open); if (!open) { setRecipePrinter(""); setRecipeNozzle(""); setRecipeFilament(""); setRecipeLayer(""); setRecipeInfill(""); setRecipeSupports(""); setRecipeTime(""); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Add Print Recipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Printer</label>
                  <Input value={recipePrinter} onChange={(e) => setRecipePrinter(e.target.value)} placeholder="e.g. Prusa MK3S+" className="font-tech rounded-xl text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Nozzle size</label>
                    <Input value={recipeNozzle} onChange={(e) => setRecipeNozzle(e.target.value)} placeholder="0.4mm" className="font-tech rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Filament brand</label>
                    <Input value={recipeFilament} onChange={(e) => setRecipeFilament(e.target.value)} placeholder="e.g. Overture PLA" className="font-tech rounded-xl text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Layer height</label>
                    <Input value={recipeLayer} onChange={(e) => setRecipeLayer(e.target.value)} placeholder="0.2mm" className="font-tech rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Infill</label>
                    <Input value={recipeInfill} onChange={(e) => setRecipeInfill(e.target.value)} placeholder="20%" className="font-tech rounded-xl text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Supports</label>
                  <Input value={recipeSupports} onChange={(e) => setRecipeSupports(e.target.value)} placeholder="Yes / No / Tree" className="font-tech rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground mb-1 block">Estimated time (optional)</label>
                  <Input value={recipeTime} onChange={(e) => setRecipeTime(e.target.value)} placeholder="e.g. 2h 30m" className="font-tech rounded-xl text-xs" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRecipeOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
                <Button onClick={submitRecipe} disabled={recipeSubmitting} className="rounded-xl font-tech text-xs uppercase tracking-wider">
                  {recipeSubmitting ? "Saving..." : "Save recipe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={askCreatorOpen} onOpenChange={(open) => { setAskCreatorOpen(open); if (!open) setAskPrompt(""); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Ask the Creator</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Choose a quick prompt, or write your own question to {item.seller_name}.</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Can this fit a Prusa?",
                    "What filament do you recommend?",
                    "Do you offer custom modifications?",
                    "Can you make this in a different color?",
                    "What are the print settings?",
                    "Is this file ready-to-print?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setAskPrompt(prompt)}
                      className={`px-3 py-1.5 text-[11px] font-tech border rounded-xl transition-colors ${askPrompt === prompt ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  value={askPrompt}
                  onChange={(e) => setAskPrompt(e.target.value)}
                  placeholder="Type your own question..."
                  maxLength={500}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAskCreatorOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
                <Button onClick={askCreator} disabled={!askPrompt.trim()} className="rounded-xl font-tech text-xs uppercase tracking-wider">Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {item.time_lapse_video_path && (
            <div className="mt-4 border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground border-b border-border">Time-lapse</div>
              <video controls className="w-full bg-black" style={{ maxHeight: 320 }}>
                <source src={fileUrl(item.time_lapse_video_path)} type="video/mp4" />
                Your browser does not support video.
              </video>
            </div>
          )}

          {/* Seller actions: Edit, Unlist, Delete */}
          {user && user.user_id === item.seller_id && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Button
                onClick={() => navigate(`/create?edit=${item.listing_id}`)}
                className="w-full rounded-xl font-tech text-xs uppercase tracking-wider"
              >
                <Edit className="h-3.5 w-3.5 mr-2" /> Edit listing
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!window.confirm(`Unlist "${item.title}"? It will be hidden from the marketplace but you can relist later.`)) return;
                  try {
                    await api.put(`/seller/listings/${item.listing_id}`, { status: "archived" });
                    toast.success("Listing unlisted");
                    setItem((prev) => prev ? { ...prev, status: "archived" } : prev);
                  } catch (e) {
                    toast.error(e?.response?.data?.detail || "Could not unlist");
                  }
                }}
                className="w-full rounded-xl font-tech text-xs uppercase tracking-wider border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
              >
                <EyeOff className="h-3.5 w-3.5 mr-2" /> Unlist (archive)
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;
                  try {
                    await api.delete(`/seller/listings/${item.listing_id}`);
                    toast.success("Listing archived");
                    navigate("/dashboard");
                  } catch (e) {
                    toast.error(e?.response?.data?.detail || "Could not delete");
                  }
                }}
                className="w-full rounded-xl font-tech text-xs uppercase tracking-wider border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash className="h-3.5 w-3.5 mr-2" /> Delete permanently
              </Button>
            </div>
          )}

          {/* Save, Like, Share actions */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-border auto-float">
            <button
              onClick={toggleSave}
              disabled={!user}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider transition-colors ${
                saved
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border"
              }`}
              title={saved ? "Saved" : "Save for later"}
            >
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} strokeWidth={1.5} />
              <span>{savedCount || 0}</span>
            </button>
            <button
              onClick={toggleLike}
              disabled={!user}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider transition-colors ${
                liked
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border"
              }`}
              title={liked ? "Liked" : "Like"}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} strokeWidth={1.5} />
              <span>{likesCount || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
              title="Share"
            >
              <Share className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{sharesCount || 0}</span>
            </button>
            {user && (
              <button
                onClick={() => setAddToCollectionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
                title="Add to collection"
              >
                <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Collect</span>
              </button>
            )}
          </div>

          <Dialog open={addToCollectionOpen} onOpenChange={(open) => { setAddToCollectionOpen(open); if (!open) setSelectedCollectionId(""); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Add to Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Choose a collection to add this listing to.</div>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-tech"
                >
                  <option value="">Select a collection...</option>
                  {userCollections.map((c) => (
                    <option key={c.collection_id} value={c.collection_id}>{c.name}</option>
                  ))}
                </select>
                {userCollections.length === 0 && (
                  <div className="text-xs text-muted-foreground">You don't have any collections yet. Create one first.</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddToCollectionOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
                <Button onClick={addToCollection} disabled={!selectedCollectionId} className="rounded-xl font-tech text-xs uppercase tracking-wider">Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Thingiverse-style tabs */}
      <div className="px-6 md:px-12 lg:px-24 border-t border-border rise-in rise-in-3">
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            const count = counts[t.id];
            return (
              <button
                key={t.id}
                data-testid={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors text-xs font-tech uppercase tracking-[0.2em] ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t.label}
                {count != null && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/60"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10 min-h-[320px] ambient-drift">
        {tab === "details" && <DetailsPanel item={item} />}
        {tab === "files" && <FilesPanel item={item} />}
        {tab === "comments" && (
          <CommentsPanel
            listingId={item.listing_id}
            comments={comments}
            setComments={setComments}
            user={user}
            openAuth={openAuth}
          />
        )}
        {tab === "remixes" && (
          <RemixesPanel
            listingId={item.listing_id}
            remixes={remixes}
            setRemixes={setRemixes}
            user={user}
            openAuth={openAuth}
          />
        )}
        {tab === "remix-tree" && (
          <RemixTreePanel tree={remixTree} loading={loadingRemixTree} />
        )}
        {tab === "related" && (
          <RelatedModelsPanel
            listingId={item.listing_id}
            relatedListings={related}
            setRelated={setRelated}
            user={user}
          />
        )}
      </div>

      {/* Image lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none"
          data-testid="image-lightbox"
        >
          <div className="relative w-full h-[90vh] flex items-center justify-center bg-black/80 rounded-xl">
            {cover && (
              <SafeImage
                src={fileUrl(cover)}
                alt={item.title}
                data-testid="lightbox-img"
                className="max-h-full max-w-full object-contain"
              />
            )}
            {item.image_paths?.length > 1 && (
              <>
                <button
                  data-testid="lightbox-prev-btn"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/90 border border-border flex items-center justify-center hover:border-primary"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  data-testid="lightbox-next-btn"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/90 border border-border flex items-center justify-center hover:border-primary"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-background/90 rounded-xl text-xs font-tech">
                  {activeImg + 1} / {item.image_paths.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(v) => !v && setReportTarget(null)}>
        <DialogContent className="max-w-md" data-testid="report-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight">
              Report {reportTarget?.type}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Why are you reporting this?</div>
            <Textarea
              data-testid="report-reason-input"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Inappropriate content, scam, misleading photos, IP violation…"
              rows={4}
              className="font-tech text-sm rounded-xl"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setReportTarget(null)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button data-testid="report-submit-btn" onClick={submitReport} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-tech text-xs uppercase tracking-wider">
              Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creatorClubOpen} onOpenChange={setCreatorClubOpen}>
        <DialogContent className="max-w-lg" data-testid="creator-club-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight">
              Join {creatorClubStatus?.club_name || `${item.seller_name}'s Club`}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              This seller has a Store Subscription Club. Subscribe to unlock base-price checkout.
            </p>
            <div className="border border-border rounded-xl p-3 bg-secondary/30">
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-1">Membership</div>
              <div className="font-tech text-base text-foreground">${Number(creatorClubStatus?.price || 0).toFixed(2)} / month</div>
              {creatorClubStatus?.rules && (
                <div className="mt-2 text-xs leading-relaxed">{creatorClubStatus.rules}</div>
              )}
            </div>
            <p className="text-xs">
              If you skip membership, this checkout applies a 20% premium for non-members.
            </p>
          </div>
          <DialogFooter className="mt-3">
            <Button
              variant="outline"
              onClick={() => {
                setCreatorClubOpen(false);
                proceedCheckout("decline");
              }}
              className="rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              No, Thank You
            </Button>
            <Button
              onClick={() => {
                setCreatorClubOpen(false);
                proceedCheckout("subscribe");
              }}
              className="rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              Subscribe & Buy at Base Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function getFilamentSwatchStyle(colorValue) {
    const normalized = String(colorValue || "").trim();
    
    // Special handling for rainbow/gradient filaments
    if (normalized.toLowerCase() === "rainbow") {
      return { 
        background: "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        border: "1px solid #ccc"
      };
    }
    
    if (typeof CSS !== "undefined" && CSS.supports("color", normalized)) {
      return { backgroundColor: normalized };
    }

    const map = {
      black: "#111827",
      white: "#f8fafc",
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#10b981",
      yellow: "#f59e0b",
      orange: "#fb923c",
      purple: "#a855f7",
      gray: "#6b7280",
      silver: "#9ca3af",
      gold: "#d4a017",
    };

    const key = Object.keys(map).find((k) => normalized.toLowerCase().includes(k));
    return { backgroundColor: key ? map[key] : "#1f2937" };
  }

function Stars({ value = 0 }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="inline-flex gap-0.5">
      {stars.map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(value) ? "text-primary fill-primary" : "text-muted-foreground"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function RatingStars({ value = 0, onChange, disabled }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="inline-flex gap-1">
      {stars.map((s) => {
        const active = s <= value;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(s)}
            aria-label={`${s} star${s === 1 ? "" : "s"}`}
            className={`transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <Star className="h-4 w-4" fill={active ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

// ---- Details panel ----
function DetailsPanel({ item }) {
  return (
    <div data-testid="panel-details" className="max-w-3xl">
      <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">From the maker</div>
      <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">
        {item.description || "No description provided."}
      </p>
      {/* Printer & filament — genuinely optional, never shown as missing */}
      {(item.printer_model || item.filament_type) && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-xl">
          {item.printer_model && (
            <>
              <Spec label="Printer" value={item.printer_model} />
              {item.filament_type && <Spec label="Filament" value={item.filament_type} />}
            </>
          )}
          {item.filament_type && !item.printer_model && (
            <Spec label="Filament" value={item.filament_type} />
          )}
        </div>
      )}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-xl">
        <Spec label="Category" value={item.category} />
        <Spec label="Listed" value={new Date(item.created_at).toLocaleDateString()} />
        <Spec label="Sales" value={item.sales_count} />
        <Spec label="Design" value={item.share_design ? "Open source" : "Closed"} />
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="bg-card p-4">
      <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-base font-medium">{value}</div>
    </div>
  );
}

// ---- Files panel ----
function FilesPanel({ item }) {
  if (!item.share_design || !item.model_path) {
    return (
      <div data-testid="panel-files-unavailable" className="max-w-2xl">
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
          <div className="font-display text-lg font-medium mb-2">Files not available</div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The seller chose to keep the design closed-source. Buy the finished print, or DM the
            seller to ask about licensing.
          </p>
        </div>
      </div>
    );
  }
  const filename = item.model_path.split("/").pop();
  return (
    <div data-testid="panel-files" className="max-w-2xl space-y-3">
      <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-2">Open source files</div>
      <a
        href={fileUrl(item.model_path)}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="download-design-btn"
        className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl hover:border-primary group transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-secondary border border-border rounded-xl flex items-center justify-center">
            <Box className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="font-display font-medium truncate">{filename}</div>
            <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">3D model · printable</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-tech uppercase tracking-wider text-primary group-hover:underline">
          Download <Download className="h-3.5 w-3.5" />
        </span>
      </a>
      <div className="text-[10px] font-tech text-muted-foreground leading-relaxed">
        By downloading you agree to credit the original maker if you republish or remix.
      </div>
    </div>
  );
}

// ---- Comments panel ----
function CommentsPanel({ listingId, comments, setComments, user, openAuth }) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/listings/${listingId}/comments`, { body });
      setComments([r.data, ...comments]);
      setBody("");
    } catch {
      toast.error("Could not post");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (cid) => {
    if (!confirm("Delete comment?")) return;
    try {
      await api.delete(`/listings/${listingId}/comments/${cid}`);
      setComments(comments.filter((c) => c.comment_id !== cid));
    } catch {
      toast.error("Could not delete");
    }
  };

  const like = async (c) => {
    if (!user) { openAuth("signin"); return; }
    try {
      const r = await api.post(`/listings/${listingId}/comments/${c.comment_id}/like`);
      setComments(comments.map((x) => x.comment_id === c.comment_id
        ? { ...x, likes: r.data.likes, liked_by: r.data.liked
            ? [...(x.liked_by || []), user.user_id]
            : (x.liked_by || []).filter(id => id !== user.user_id) }
        : x));
    } catch { toast.error("Could not like"); }
  };

  const reportComment = (c) => {
    if (!user) { openAuth("signin"); return; }
    const reason = prompt("Report this comment — please tell us why:");
    if (!reason || !reason.trim()) return;
    api.post("/reports", { target_type: "comment", target_id: c.comment_id, reason })
      .then(() => toast.success("Comment reported"))
      .catch(() => toast.error("Could not report"));
  };

  const quickReply = (c) => {
    if (!user) { openAuth("signin"); return; }
    setBody((prev) => `@${c.user_tag || c.user_name} ${prev}`.trim());
  };

  return (
    <div data-testid="panel-comments" className="max-w-2xl">
      {user ? (
        <div className="mb-8">
          <Textarea
            data-testid="comment-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ask a question, leave a compliment, request a remix…"
            rows={3}
            className="font-tech text-sm rounded-xl mb-2"
          />
          <Button
            data-testid="comment-post-btn"
            onClick={post}
            disabled={posting || !body.trim()}
            className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
          >
            {posting ? "Posting…" : "Post comment"}
          </Button>
        </div>
      ) : (
        <SignInGate label="Sign in to comment" onSignIn={() => openAuth("signin")} />
      )}

      {comments.length === 0 ? (
        <div className="text-sm text-muted-foreground font-tech">No comments yet — be the first.</div>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => {
            const mine = user && c.user_id === user.user_id;
            const isLiked = user && (c.liked_by || []).includes(user.user_id);
            return (
              <li key={c.comment_id} data-testid={`comment-${c.comment_id}`} className="flex gap-3">
                <Link to={`/messages/${c.user_id}`} className="shrink-0">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={c.user_picture} />
                    <AvatarFallback>{c.user_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-sm font-medium inline-flex items-center gap-1">{c.user_name} <UserBadges user={{ is_pro: c.user_is_pro, is_platform_owner: c.user_is_platform_owner, created_at: c.user_created_at }} badges={c.user_badges} milestoneBadges={c.user_milestone_badges} /></span>
                    {c.user_tag && <span className="text-[10px] font-tech text-muted-foreground">@{c.user_tag}</span>}
                    <span className="text-[10px] font-tech text-muted-foreground ml-auto">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <RestrictedContentToggle text={c.body} className="mt-1" />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      data-testid={`comment-reply-${c.comment_id}`}
                      onClick={() => quickReply(c)}
                      className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      <Reply className="h-3 w-3" /> Reply
                    </button>
                    <button
                      data-testid={`comment-like-${c.comment_id}`}
                      onClick={() => like(c)}
                      className={`text-[10px] font-tech uppercase tracking-wider inline-flex items-center gap-1 ${isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <Heart className={`h-3 w-3 ${isLiked ? "fill-primary" : ""}`} /> {c.likes || 0}
                    </button>
                    <button
                      data-testid={`comment-forward-${c.comment_id}`}
                      onClick={() => user ? toast.info("Forward tools coming soon") : openAuth("signin")}
                      className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      <Forward className="h-3 w-3" /> Forward
                    </button>
                    <button
                      data-testid={`comment-react-${c.comment_id}`}
                      onClick={() => user ? toast.info("Emoji reactions coming soon") : openAuth("signin")}
                      className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      <SmilePlus className="h-3 w-3" /> React
                    </button>
                    <button
                      data-testid={`comment-report-${c.comment_id}`}
                      onClick={() => reportComment(c)}
                      className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                    >
                      <Flag className="h-3 w-3" /> Report
                    </button>
                    {mine && (
                      <button
                        data-testid={`comment-delete-${c.comment_id}`}
                        onClick={() => remove(c.comment_id)}
                        className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Remixes panel ----
function RemixesPanel({ listingId, remixes, setRemixes, user, openAuth }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Give your remix a title");
      return;
    }
    setPosting(true);
    try {
      const r = await api.post(`/listings/${listingId}/remixes`, {
        title,
        description,
      });
      setRemixes([r.data, ...remixes]);
      setTitle(""); setDescription(""); setShowForm(false);
      toast.success("Remix published");
    } catch {
      toast.error("Could not publish remix");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div data-testid="panel-remixes" className="max-w-3xl">
      {user ? (
        <div className="mb-8">
          {!showForm ? (
            <Button
              data-testid="remix-toggle-btn"
              onClick={() => setShowForm(true)}
              variant="outline"
              className="rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              <GitFork className="h-3.5 w-3.5 mr-2" /> Post a remix
            </Button>
          ) : (
            <div className="border border-border rounded-xl p-5 space-y-3">
              <input
                data-testid="remix-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Remix title…"
                className="w-full px-3 py-2 font-tech text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
              <Textarea
                data-testid="remix-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you change? (Open the designer first to attach a model.)"
                rows={3}
                className="font-tech text-sm rounded-xl"
              />
              <div className="flex gap-2">
                <Button data-testid="remix-submit-btn" onClick={submit} disabled={posting} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
                  {posting ? "Publishing…" : "Publish remix"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <SignInGate label="Sign in to post a remix" onSignIn={() => openAuth("signin")} />
      )}

      {remixes.length === 0 ? (
        <div className="text-sm text-muted-foreground font-tech">No remixes yet — be the first to fork this design.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {remixes.map((d) => (
            <div key={d.design_id} data-testid={`remix-card-${d.design_id}`} className="border border-border rounded-xl p-4 bg-card hover:border-primary transition-colors">
              <div className="aspect-square bg-secondary border border-border rounded-xl mb-3 flex items-center justify-center">
                {d.image_paths?.[0] ? (
                  <SafeImage src={fileUrl(d.image_paths[0])} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <Box className="h-8 w-8 text-muted-foreground" strokeWidth={1.2} />
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-tech uppercase tracking-wider text-accent mb-1">
                <GitFork className="h-3 w-3" /> Remix
              </div>
              <div className="font-display text-base font-medium leading-tight truncate">{d.title}</div>
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mt-1">by {d.creator_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignInGate({ label, onSignIn }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-6 mb-8 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-display text-base font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">Only signed-in makers can comment, remix, or message.</div>
      </div>
      <Button data-testid="gate-signin-btn" onClick={onSignIn} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
        Sign in
      </Button>
    </div>
  );
}

function TreeNode({ node, depth = 0 }) {
  const img = node.image_paths?.[0];
  return (
    <div className={`${depth > 0 ? "ml-6 border-l border-border pl-4" : ""}`}>
      <div className="flex items-center gap-3 py-2">
        <div className="h-10 w-10 rounded-lg border border-border bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
          {img ? (
            <SafeImage src={fileUrl(img)} alt={node.title} className="w-full h-full object-cover" />
          ) : (
            <Box className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-medium truncate">{node.title}</div>
          <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
            {node.creator_name || "Unknown"} {node.created_at ? `· ${new Date(node.created_at).toLocaleDateString()}` : ""}
          </div>
        </div>
      </div>
      {(node.children || []).length > 0 && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RemixTreePanel({ tree, loading }) {
  if (loading) return <div className="text-sm text-muted-foreground font-tech">Loading remix tree…</div>;
  if (!tree) return <div className="text-sm text-muted-foreground font-tech">No remix tree available.</div>;
  const count = (node) => {
    let n = 1;
    (node.children || []).forEach((c) => { n += count(c); });
    return n;
  };
  const total = count(tree);
  return (
    <div data-testid="panel-remix-tree" className="max-w-3xl">
      <div className="text-xs font-tech uppercase tracking-wider text-muted-foreground mb-4">
        {total} {total === 1 ? "version" : "versions"} in this tree
      </div>
      <TreeNode node={tree} depth={0} />
    </div>
  );
}
