/* eslint-disable */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Truck, MapPin, Package, Loader2, PartyPopper } from "lucide-react";
import Confetti from "@/components/Confetti";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"];

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return "text-emerald-500";
  if (s.includes("transit")) return "text-blue-400";
  if (s.includes("out for delivery")) return "text-amber-400";
  if (s.includes("exception") || s.includes("failed")) return "text-red-400";
  return "text-muted-foreground";
}

function EventItem({ evt }) {
  return (
    <div className="flex gap-3 text-xs">
      <div className="flex flex-col items-center">
        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
        <div className="w-px flex-1 bg-border my-1" />
      </div>
      <div className="pb-4">
        <div className="font-medium text-foreground">{evt.description || evt.status || "Update"}</div>
        <div className="text-muted-foreground flex gap-2 flex-wrap">
          {evt.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {evt.location}</span>}
          {evt.datetime && <span>{formatDate(evt.datetime)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SellerOrderDetail() {
  const { transactionId } = useParams();
  const [order, setOrder] = useState(null);
  const [trackingStatuses, setTrackingStatuses] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingTrack, setLoadingTrack] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!transactionId) return;
    api.get(`/seller/orders/${transactionId}`).then((r) => setOrder(r.data)).catch(() => {});
  }, [transactionId]);

  useEffect(() => {
    if (!order) return;
    let active = true;
    const poll = async () => {
      setLoadingTrack(true);
      const results = {};
      for (const li of order.line_items) {
        try {
          const r = await api.get(`/tracking/status/${order.transaction_id}/${li.listing_id}`);
          results[li.listing_id] = r.data;
        } catch {
          results[li.listing_id] = null;
        }
      }
      if (active) {
        setTrackingStatuses(results);
        setLoadingTrack(false);
      }
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [order]);

  const saveTracking = async (listingId, tracking, carrier) => {
    if (!tracking || !carrier) return;
    setSaving(true);
    try {
      await api.put(`/seller/orders/${order.transaction_id}/tracking`, { listing_id: listingId, tracking_number: tracking, carrier });
      const r = await api.get(`/seller/orders/${order.transaction_id}`);
      setOrder(r.data);
    } catch (e) {
      console.warn(e);
      alert("Could not save tracking");
    }
    setSaving(false);
  };

  const markFinished = async () => {
    if (!order) return;
    setFinishing(true);
    try {
      const r = await api.post(`/seller/orders/${order.transaction_id}/finish`);
      setOrder((prev) => (prev ? { ...prev, status: "completed" } : prev));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success("Marked as finished — followers notified!");
    } catch {
      toast.error("Could not mark finished");
    } finally {
      setFinishing(false);
    }
  };

  if (!order) {
    return (
      <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24">
        <div className="text-sm text-muted-foreground">Loading order details…</div>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24">
      {showConfetti && <Confetti />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground">Seller Order</div>
          <h1 className="font-display text-3xl font-light">Order {order.transaction_id}</h1>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== "completed" && (
            <Button onClick={markFinished} disabled={finishing} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              <PartyPopper className="h-4 w-4 mr-2" /> {finishing ? "Finishing…" : "Finished!"}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="border border-border rounded-xl p-6 space-y-6">
          <div className="text-sm text-muted-foreground">Buyer</div>
          <div className="font-medium">{order.buyer_email || order.buyer_id}</div>
          <div className="text-sm text-muted-foreground">Order Status</div>
          <div className="font-medium">{order.status}</div>
          <div className="text-sm text-muted-foreground">Payment Status</div>
          <div className="font-medium">{order.payment_status}</div>
          <div className="text-sm text-muted-foreground">Created</div>
          <div className="font-medium">{new Date(order.created_at).toLocaleString()}</div>
        </div>

        <div className="border border-border rounded-xl p-6 space-y-6">
          <div className="text-sm text-muted-foreground">Totals</div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span>Order Amount</span><span>${order.amount?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping Fee</span><span>${order.shipping_fee?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Platform Fee</span><span>${order.platform_fee?.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/50 px-6 py-4 font-medium">Items</div>
        <div className="divide-y divide-border">
          {order.line_items.map((li) => {
            const trackData = trackingStatuses[li.listing_id];
            return (
            <div key={li.listing_id} className="p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium">{li.listing_id}</div>
                  <div className="text-[12px] text-muted-foreground">Seller item</div>
                </div>
                <div className="text-sm text-muted-foreground">Status: {li.status || order.status}</div>
                <div className="text-sm">${(li.total_amount || 0).toFixed(2)}</div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <Input
                  defaultValue={li.tracking_number || ""}
                  placeholder="Tracking number"
                  onChange={(e) => (li._tracking = e.target.value)}
                  className="w-full"
                  disabled={saving}
                />
                <Select
                  defaultValue={li.carrier || ""}
                  onChange={(e) => (li._carrier = e.target.value)}
                  className="w-full"
                  disabled={saving}
                >
                  <option value="">Carrier</option>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  onClick={() => saveTracking(li.listing_id, li._tracking || li.tracking_number || "", li._carrier || li.carrier || "")}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Tracking"}
                </Button>
              </div>

              {trackData && (
                <div className="mt-4 border border-border rounded-xl p-4 bg-secondary/20">
                  <div className="flex items-center gap-2 mb-3">
                    {loadingTrack ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Truck className={`h-4 w-4 ${statusColor(trackData.status)}`} />
                    )}
                    <span className={`text-xs font-tech uppercase tracking-wider font-medium ${statusColor(trackData.status)}`}>
                      {trackData.status || "Pending"}
                    </span>
                    {trackData.eta && (
                      <span className="text-xs text-muted-foreground ml-auto">Est. {formatDate(trackData.eta)}</span>
                    )}
                  </div>
                  {trackData.events && trackData.events.length > 0 && (
                    <div className="mt-2">
                      {trackData.events.map((evt, idx) => (
                        <EventItem key={idx} evt={evt} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <div><strong>Carrier:</strong> {li.carrier || "—"}</div>
                <div><strong>Tracking #:</strong> {li.tracking_number || "—"}</div>
                <div><strong>Shipped at:</strong> {li.shipped_at ? new Date(li.shipped_at).toLocaleString() : "Not shipped yet"}</div>
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
