/* eslint-disable */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SafeImage from "@/components/SafeImage";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/seller/orders").then((r) => setOrders(r.data)).catch(() => {});
  }, []);

  const saveTracking = async (txnId, listingId, tracking, carrier) => {
    if (!tracking || !carrier) return;
    setSaving(true);
    try {
      await api.put(`/seller/orders/${txnId}/tracking`, { listing_id: listingId, tracking_number: tracking, carrier });
      // refresh
      const r = await api.get("/seller/orders");
      setOrders(r.data);
    } catch (e) {
      console.warn(e);
      alert("Could not save tracking");
    }
    setSaving(false);
  };

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24">
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Orders</div>
      <h1 className="font-display text-3xl font-light mb-6">Seller Orders</h1>

      {orders.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">No orders yet.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.transaction_id}>
                  <TableCell>
                    {o.line_items.map((li) => (
                      <div key={li.listing_id} className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-secondary border border-border rounded-xl overflow-hidden">
                          {li.image_path && <SafeImage src={fileUrl(li.image_path)} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-medium">{li.listing_id}</div>
                          <div className="text-[10px] text-muted-foreground">Listing</div>
                        </div>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{o.buyer_email || o.buyer_id}</div>
                  </TableCell>
                  <TableCell>${o.amount?.toFixed(2)}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>
                    {o.line_items.map((li) => (
                      <div key={li.listing_id} className="mb-3">
                        <div className="text-[10px] text-muted-foreground mb-1">{li.listing_id}</div>
                        <div className="flex gap-2">
                          <Input defaultValue={li.tracking_number || ""} placeholder="Tracking #" onChange={(e) => (li._tracking = e.target.value)} />
                          <Select defaultValue={li.carrier || ""} onChange={(e) => (li._carrier = e.target.value)}>
                            <option value="">Carrier</option>
                            {CARRIERS.map((c) => (<option key={c} value={c}>{c}</option>))}
                          </Select>
                          <Button size="sm" onClick={() => saveTracking(o.transaction_id, li.listing_id, li._tracking || li.tracking_number || "", li._carrier || li.carrier || "") } disabled={saving}>
                            Save
                          </Button>
                        </div>
                        {li.tracking_number && li.carrier && (
                          <div className="text-[12px] mt-1"><strong>{li.carrier}</strong>: {li.tracking_number}</div>
                        )}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/seller/orders/${o.transaction_id}`)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
