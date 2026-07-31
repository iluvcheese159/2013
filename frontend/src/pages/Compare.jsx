import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingCart, MessageSquare } from "lucide-react";
import SafeImage from "@/components/SafeImage";

const EMPTY = { title: "", category: "", print_time: "", price: "", listing_type: "", available_filament_colors: [], description: "", seller_name: "", image_paths: [] };

export default function Compare() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ids = [params.get("a"), params.get("b"), params.get("c")].filter(Boolean);
  const [items, setItems] = useState([EMPTY, EMPTY, EMPTY]);
  const [loading, setLoading] = useState(true);
  const [inputIds, setInputIds] = useState(ids.join(","));

  useEffect(() => {
    setLoading(true);
    Promise.all(ids.map((id) => api.get(`/listings/${id}`).then((r) => r.data).catch(() => EMPTY)))
      .then((results) => {
        const merged = [EMPTY, EMPTY, EMPTY];
        results.forEach((r, i) => { if (r?.listing_id) merged[i] = r; });
        setItems(merged);
      })
      .finally(() => setLoading(false));
  }, [ids]);

  const loadCompare = () => {
    const parts = inputIds.split(",").map((s) => s.trim()).filter(Boolean);
    const query = parts.slice(0, 3).map((id, i) => `${["a","b","c"][i]}=${encodeURIComponent(id)}`).join("&");
    window.location.search = `?${query}`;
  };

  return (
    <div data-testid="compare-page" className="pt-14 min-h-screen px-6 md:px-12 lg:px-24 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-2 rise-in">Compare</div>
          <h1 className="font-display text-3xl font-light tracking-tighter rise-in rise-in-1">Model comparison</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl font-tech text-xs uppercase tracking-wider rise-in rise-in-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <div className="mb-8 p-4 border border-border rounded-xl bg-card rise-in rise-in-2 auto-glow-pulse">
        <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Compare up to 3 listings by ID</div>
        <div className="flex gap-2">
          <Input
            value={inputIds}
            onChange={(e) => setInputIds(e.target.value)}
            placeholder="Listing IDs, comma separated"
            className="font-tech rounded-xl text-xs"
          />
          <Button onClick={loadCompare} className="rounded-xl font-tech text-xs uppercase tracking-wider">Compare</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground font-tech">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card auto-float" style={{ animationDelay: `${idx * 0.15}s` }}>
              {item.image_paths?.[0] ? (
                <SafeImage src={fileUrl(item.image_paths[0])} alt={item.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-secondary flex items-center justify-center text-muted-foreground font-tech text-xs">NO IMAGE</div>
              )}
              <div className="p-4 space-y-2">
                <div className="font-display text-sm font-medium leading-tight">{item.title || "Empty slot"}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">{item.category || "—"}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Type: {item.listing_type === "service" ? "Service" : "Product"}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Print time: {item.print_time || "—"}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Price: ${item.base_original_price ?? item.price ?? "—"}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Filament: {(item.available_filament_colors || []).join(", ") || "—"}</div>
                <div className="text-xs text-muted-foreground line-clamp-3">{item.description || "—"}</div>
                {item.listing_id && (
                  <Link to={`/listing/${item.listing_id}`} className="block">
                    <Button size="sm" className="w-full rounded-xl font-tech text-[10px] uppercase tracking-wider">View listing</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
