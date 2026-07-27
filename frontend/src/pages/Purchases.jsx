/* eslint-disable */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import { Package, ExternalLink, Truck, ShoppingBag, Clock, ChevronRight, MapPin, Loader2 } from "lucide-react";

const TRACK_URLS = {
  USPS: (num) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`,
  UPS: (num) => `https://www.ups.com/track?tracknum=${num}`,
  FedEx: (num) => `https://www.fedex.com/fedextrack/?tracknumbers=${num}`,
  DHL: (num) => `https://www.dhl.com/global-en/home/tracking.html?tracking=${num}`,
};

function StatusBadge({ status }) {
  const map = {
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    refunded: "bg-red-500/20 text-red-400 border-red-400/30",
    shipped: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "partially_shipped": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const cls = map[(status || "").toLowerCase()] || "bg-secondary/50 text-muted-foreground border-border";
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-tech uppercase tracking-wider rounded-full border ${cls}`}>
      {status || "unknown"}
    </span>
  );
}

function TrackingEvent({ evt }) {
  return (
    <div className="flex gap-2 text-xs">
      <div className="flex flex-col items-center">
        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
      </div>
      <div className="pb-3">
        <div className="text-foreground">{evt.description || evt.status || "Update"}</div>
        <div className="text-muted-foreground flex gap-2 text-[10px]">
          {evt.location && <span className="inline-flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {evt.location}</span>}
          {evt.datetime && <span>{new Date(evt.datetime).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

function LiveTracking({ li, transactionId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!li.tracking_number || !li.carrier || li.carrier === "Other") {
      setLoading(false);
      return;
    }
    let active = true;
    const poll = async () => {
      try {
        const r = await api.get(`/tracking/status/${transactionId}/${li.listing_id}`);
        if (active) {
          setData(r.data);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };
    poll();
    const interval = setInterval(poll, 20000);
    return () => { active = false; clearInterval(interval); };
  }, [li.tracking_number, li.carrier, li.listing_id, transactionId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-[10px] font-tech text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking tracking…
      </div>
    );
  }
  if (!data) return null;

  const statusColor = (s) => {
    const v = (s || "").toLowerCase();
    if (v.includes("delivered")) return "text-emerald-500";
    if (v.includes("transit")) return "text-blue-400";
    if (v.includes("out for delivery")) return "text-amber-400";
    if (v.includes("exception") || v.includes("failed")) return "text-red-400";
    return "text-muted-foreground";
  };

  return (
    <div className="mt-2 border border-border rounded-lg p-3 bg-secondary/30">
      <div className="flex items-center gap-2 mb-2">
        <Truck className={`h-3.5 w-3.5 ${statusColor(data.status)}`} />
        <span className={`text-[10px] font-tech uppercase tracking-wider font-medium ${statusColor(data.status)}`}>
          {data.status || "Pending"}
        </span>
        {data.eta && <span className="text-[10px] text-muted-foreground ml-auto">Est. {new Date(data.eta).toLocaleDateString()}</span>}
      </div>
      {(data.events && data.events.length > 0) && (
        <div className="mt-1">
          {data.events.slice(0, 3).map((evt, idx) => (
            <TrackingEvent key={idx} evt={evt} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Purchases() {
  const { user, openAuth } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get("/my/purchases").then((r) => setPurchases(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div data-testid="purchases-page-signin" className="pt-32 px-6 md:px-12 lg:px-24 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="font-display text-3xl font-light mb-4">Sign in to view your orders</h1>
        <Button data-testid="purchases-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech uppercase tracking-wider">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="purchases-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Your Orders
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter">Order History</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl">All your purchases from Print Cosmos makers.</p>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10">
        {loading ? (
          <div className="text-sm font-tech text-muted-foreground animate-pulse">Loading orders…</div>
        ) : purchases.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-20 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="font-display text-2xl font-light mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Browse the marketplace and support a maker today.</p>
            <Link to="/browse">
              <Button data-testid="browse-cta-btn" className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((p) => (
              <div key={p.transaction_id} data-testid={`order-card-${p.transaction_id}`} className="border border-border rounded-2xl overflow-hidden bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-0.5">Order</div>
                      <div className="font-mono text-sm font-medium">#{(p.transaction_id || "").slice(-8).toUpperCase()}</div>
                    </div>
                    <StatusBadge status={p.payment_status || p.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-0.5">Total</div>
                    <div className="font-display text-lg font-light">${(p.amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-0.5">Date</div>
                    <div className="text-sm">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {(p.line_items || []).map((li) => (
                    <div key={li.listing_id} data-testid={`order-item-${li.listing_id}`} className="flex gap-4 px-5 py-4">
                      {li.listing_image && (
                        <Link to={`/listing/${li.listing_id}`} className="flex-shrink-0">
                          <div className="h-16 w-16 rounded-xl border border-border overflow-hidden bg-secondary">
                            <SafeImage src={fileUrl(li.listing_image)} alt={li.listing_title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/listing/${li.listing_id}`} className="font-display text-base font-medium hover:text-primary transition-colors line-clamp-1">
                          {li.listing_title || li.listing_id}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {li.listing_category && (
                            <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-0.5 bg-secondary border border-border rounded-full text-muted-foreground">
                              {li.listing_category}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-tech">by {li.seller_name || li.seller_id}</span>
                        </div>
                        <div className="mt-2">
                          {li.tracking_number && li.carrier ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Truck className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] font-tech uppercase tracking-wider text-emerald-400">{li.carrier}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{li.tracking_number}</span>
                                {TRACK_URLS[li.carrier] && (
                                  <a
                                    href={TRACK_URLS[li.carrier](li.tracking_number)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-tech text-primary hover:underline"
                                  >
                                    Track <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                              <LiveTracking li={li} transactionId={p.transaction_id} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] font-tech text-muted-foreground">
                              <Clock className="h-3 w-3" /> Pending shipment
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <div className="font-display text-base font-light">${(li.total_amount || li.sale_price || 0).toFixed(2)}</div>
                        <StatusBadge status={li.status} />
                        <div>
                          <Link to={`/listing/${li.listing_id}`} className="inline-flex items-center gap-1 text-[10px] font-tech text-muted-foreground hover:text-primary transition-colors">
                            View <ChevronRight className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
