import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, Lock, ArrowLeft } from "lucide-react";
import SafeImage from "@/components/SafeImage";

export default function CollectionDetail() {
  const { id } = useParams();
  const { user, openAuth } = useAuth();
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/collections/${id}`).then((r) => { setCol(r.data); setFollowing(false); }).catch(() => setCol(null)).finally(() => setLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/collections/${id}/follow`, {});
      setFollowing(r.data.following);
    } catch {
      // no-op
    }
  };

  if (loading) return <div className="pt-24 px-6 md:px-12 text-sm text-muted-foreground">Loading collection...</div>;
  if (!col) return <div className="pt-24 px-6 md:px-12 text-sm text-muted-foreground">Collection not found.</div>;

  return (
    <div data-testid="collection-detail-page" className="pt-14 min-h-screen px-6 md:px-12 lg:px-24 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-2">Collection</div>
          <h1 className="font-display text-3xl font-light tracking-tighter">{col.name}</h1>
          {col.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{col.description}</p>}
          <div className="flex items-center gap-3 text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-2">
            <span>by {col.user_name}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {col.follower_count || 0} followers</span>
            <span>·</span>
            <span>{col.item_count || 0} items</span>
            {!col.is_public && <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {col.is_public && user && !col.user_id === user.user_id && (
            <Button onClick={toggleFollow} variant="outline" className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {following ? "Following" : "Follow"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {(col.listings || []).length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl py-16 text-center">
          <div className="text-sm text-muted-foreground font-tech uppercase tracking-wider">This collection is empty.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
          {col.listings.map((listing) => (
            <Link
              key={listing.listing_id}
              to={`/listing/${listing.listing_id}`}
              data-testid={`collection-listing-${listing.listing_id}`}
              className="relative aspect-square bg-secondary overflow-hidden rounded-xl group block"
            >
              {listing.image_paths?.[0] ? (
                <SafeImage src={fileUrl(listing.image_paths[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-4 text-white text-xs font-tech">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {listing.view_count || 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current" /> {listing.rating_avg ? listing.rating_avg.toFixed(1) : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
