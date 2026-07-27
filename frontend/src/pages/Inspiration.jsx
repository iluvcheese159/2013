import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, ArrowLeft, ArrowRight, Star, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";

export default function Inspiration() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/listings"), api.get("/designs")])
      .then(([l, d]) => {
        const listings = (l.data || []).map((x) => ({ ...x, item_type: "listing" }));
        const designs = (d.data || []).map((x) => ({ ...x, item_type: "design" }));
        setItems([...listings, ...designs]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const current = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const toggleFavorite = async () => {
    if (!user) return openAuth("signin");
    const item = current;
    if (!item) return;
    const key = item.item_type === "listing" ? item.listing_id : item.design_id;
    const isFav = !!favorites[key];
    try {
      if (item.item_type === "listing") {
        await api.post(`/listings/${key}/save`);
      }
      setFavorites((prev) => ({ ...prev, [key]: !isFav }));
    } catch {
      toast.error("Could not update favorite");
    }
  };

  const next = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1);
  }, [hasNext]);

  const prev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1);
  }, [hasPrev]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-tech text-xs uppercase tracking-wider">
        Loading inspiration...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-tech text-xs uppercase tracking-wider">
        No items yet
      </div>
    );
  }

  const isListing = current.item_type === "listing";
  const key = isListing ? current.listing_id : current.design_id;
  const image = isListing ? current.image_paths?.[0] : current.image_paths?.[0];
  const title = current.title || "Untitled";
  const subtitle = isListing ? `${current.category || ""} · $${current.base_original_price ?? current.price ?? 0}` : `by ${current.creator_name || "Unknown"}`;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div className="absolute inset-0">
        {image ? (
          <SafeImage src={fileUrl(image)} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <div className="text-muted-foreground font-tech text-xs">NO PREVIEW</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:text-white hover:bg-white/10 rounded-xl font-tech text-xs uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit
        </Button>
        <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-white/70">
          {index + 1} / {items.length}
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
        <button onClick={prev} disabled={!hasPrev} className={`pointer-events-auto h-12 w-12 rounded-full border border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 ${!hasPrev ? "opacity-20 cursor-not-allowed" : ""}`}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={next} disabled={!hasNext} className={`pointer-events-auto h-12 w-12 rounded-full border border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 ${!hasNext ? "opacity-20 cursor-not-allowed" : ""}`}>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="max-w-xl">
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-white/60 mb-2">
            {isListing ? "Listing" : "Open Design"} · {subtitle}
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-light tracking-tighter leading-[0.95] mb-4">{title}</h2>
          <div className="flex items-center gap-3">
            <Button onClick={toggleFavorite} variant="outline" className={`rounded-xl font-tech text-xs uppercase tracking-wider border-white/20 ${favorites[key] ? "bg-white text-black border-white" : "text-white hover:bg-white/10"}`}>
              <Heart className={`h-4 w-4 mr-2 ${favorites[key] ? "fill-current" : ""}`} /> {favorites[key] ? "Saved" : "Save"}
            </Button>
            {isListing && (
              <Button variant="outline" onClick={() => navigate(`/listing/${current.listing_id}`)} className="rounded-xl font-tech text-xs uppercase tracking-wider border-white/20 text-white hover:bg-white/10">
                <ExternalLink className="h-4 w-4 mr-2" /> View
              </Button>
            )}
            {!isListing && (
              <Button variant="outline" onClick={() => navigate(`/designs/${current.design_id}`)} className="rounded-xl font-tech text-xs uppercase tracking-wider border-white/20 text-white hover:bg-white/10">
                <ExternalLink className="h-4 w-4 mr-2" /> View
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
