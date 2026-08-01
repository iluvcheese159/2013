/* eslint-disable */
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, fileUrl } from "@/lib/api";
import { ShoppingCart, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";
import { RevealOnScroll, TiltCard, FloatingParticles } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

export default function Cart() {
  const sparkles = useSparkleField();
  const navigate = useNavigate();
  const { items, remove, clear } = useCart();
  const { user, openAuth } = useAuth();
  const [selectedIds, setSelectedIds] = useState(() => new Set(items.map((item) => item.listing_id)));
  const [paymentMethod, setPaymentMethod] = useState("stripe_card");
  const [redeemThreads, setRedeemThreads] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    setSelectedIds(new Set(items.map((item) => item.listing_id)));
  }, [items]);

  const total = items.reduce((a, x) => a + Number(x.price || 0) + Number(x.shipping_fee || 0), 0);
  const fee = total * 0.035;
  const selectedItems = items.filter((item) => selectedIds.has(item.listing_id));
  const selectedTotal = selectedItems.reduce((a, x) => a + Number(x.price || 0) + Number(x.shipping_fee || 0), 0);
  const selectedFee = selectedTotal * 0.035;
  const filamentThreadsBalance = Number(user?.filament_threads_balance || 0);
  const potentialThreadDiscount = Math.min(Math.floor(filamentThreadsBalance / 100), Math.floor(selectedFee));
  const isDayTheme = typeof document !== "undefined" && document.documentElement.classList.contains("day-theme");

  const checkout = async (item) => {
    if (!user) { openAuth("signin"); return; }
    try {
      const r = await api.post("/checkout/session", {
        listing_id: item.listing_id,
        origin_url: window.location.origin,
        shipping_fee: Number(item.shipping_fee || 0),
        payment_method: paymentMethod,
        redeem_filament_threads_balance: redeemThreads,
        coupon_code: couponCode || null,
        selected_filament_color: item.selected_filament_color || null,
      });
      window.location.href = r.data.url;
    } catch { toast.error("Checkout failed"); }
  };

  const checkoutSelected = async () => {
    if (!user) { openAuth("signin"); return; }
    if (!selectedItems.length) {
      toast.error("Select at least one item to checkout");
      return;
    }

    try {
      const r = await api.post("/checkout/session", {
        origin_url: window.location.origin,
        payment_method: paymentMethod,
        redeem_filament_threads_balance: redeemThreads,
        coupon_code: couponCode || null,
        items: selectedItems.map((item) => ({
          listing_id: item.listing_id,
          shipping_fee: Number(item.shipping_fee || 0),
          selected_filament_color: item.selected_filament_color || null,
        })),
      });
      window.location.href = r.data.url;
    } catch {
      toast.error("Checkout failed");
    }
  };

return (
    <div className="relative min-h-screen overflow-hidden">
      {sparkles.layer}
      <FloatingParticles count={8} color="rgba(0, 229, 255, 0.12)" className="fixed inset-0" />
      <div data-testid="cart-page" className="pt-20 min-h-screen px-6 md:px-12 py-16 max-w-3xl relative z-10">
      <button onClick={() => navigate(-1)} className="text-xs font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6 rise-in">
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in-1">
        <span className="text-primary">●</span> Cart
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter mb-8 rise-in-2">Your cart</h1>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl py-20 text-center auto-glow-pulse">
          <ShoppingCart className="h-8 w-8 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground mb-4">Nothing here yet. Browse the marketplace and add prints.</p>
          <Link to="/browse"><Button className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">Browse listings</Button></Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-8 auto-float">
            {items.map((it) => (
              <div key={it.listing_id} data-testid={`cart-item-${it.listing_id}`} className="flex items-center gap-4 p-3 rounded-2xl bg-card shadow-sm">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(it.listing_id)}
                    onChange={(event) => {
                      const next = new Set(selectedIds);
                      if (event.target.checked) next.add(it.listing_id);
                      else next.delete(it.listing_id);
                      setSelectedIds(next);
                    }}
                    className="h-4 w-4 text-primary border-border rounded-md"
                  />
                </label>
                <div className="h-16 w-16 bg-secondary border border-border rounded-xl overflow-hidden shrink-0">
                  {it.image && <SafeImage src={fileUrl(it.image)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/listing/${it.listing_id}`} className="font-display font-medium truncate block hover:text-primary">{it.title}</Link>
                  <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">by {it.seller}</div>
                  {it.selected_filament_color && (
                    <div className="text-[10px] font-tech text-primary">Filament: {it.selected_filament_color}</div>
                  )}
                  <div className="text-[10px] font-tech text-muted-foreground">Shipping ${Number(it.shipping_fee || 0).toFixed(2)}</div>
                </div>
                <div className="font-tech text-sm text-primary">${Number(it.price).toFixed(2)}</div>
                <Button size="sm" variant="outline" data-testid={`cart-buy-${it.listing_id}`} onClick={() => checkout(it)} className="rounded-xl font-tech text-[10px] uppercase tracking-wider">Buy</Button>
                <button data-testid={`cart-remove-${it.listing_id}`} onClick={() => remove(it.listing_id)} className="h-7 w-7 rounded-xl border border-border hover:border-destructive hover:text-destructive flex items-center justify-center">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-5 mb-4 bg-card shadow-sm auto-glow-pulse">
            <div className="mb-4">
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Payment method</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                  <input type="radio" name="checkout-method" checked={paymentMethod === "stripe_card"} onChange={() => setPaymentMethod("stripe_card")} className="accent-primary" />
                  Credit / Debit Card (Stripe)
                </label>
                <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                  <input type="radio" name="checkout-method" checked={paymentMethod === "stripe_wallet"} onChange={() => setPaymentMethod("stripe_wallet")} className="accent-primary" />
                  Apple Pay / Google Pay
                </label>
                <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                  <input type="radio" name="checkout-method" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} className="accent-primary" />
                  PayPal Express Checkout
                </label>
              </div>
            </div>

            <div className="mb-4 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center">
                  {isDayTheme ? (
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-primary" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3a9 9 0 0 1 0 18" opacity="0.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-primary" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M12 2l2.1 4.4L19 8l-3.5 3 1 4.8L12 13.8 7.5 15.8l1-4.8L5 8l4.9-1.6L12 2z" />
                      <circle cx="12" cy="12" r="2.4" />
                    </svg>
                  )}
                </span>
                <input type="checkbox" checked={redeemThreads} onChange={(e) => setRedeemThreads(e.target.checked)} className="accent-primary" />
                Redeem Filament Threads Balance
              </label>
              <div className="text-[10px] font-tech text-muted-foreground mt-1">
                Balance: {filamentThreadsBalance} threads · Potential checkout discount: ${potentialThreadDiscount.toFixed(2)}
              </div>
            </div>

            <div className="mb-4 border-t border-border pt-4">
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-1">Discount coupon</div>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="h-9 font-tech text-xs"
              />
            </div>

            <div className="flex items-center justify-between mb-3 gap-4">
              <div>
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Selected items</div>
                <div className="text-[10px] font-tech text-muted-foreground">{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Selected total</div>
                <div className="font-display text-2xl font-light text-primary">${selectedTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-tech text-muted-foreground">Platform fee 3.5% of selected price + shipping: ${selectedFee.toFixed(2)}</div>
              <Button data-testid="cart-checkout-selected-btn" onClick={checkoutSelected} className="rounded-xl font-tech text-xs uppercase tracking-wider bg-primary hover:bg-primary/90">Checkout selected</Button>
            </div>
          </div>
          <div className="rounded-2xl p-5 flex items-baseline justify-between mb-4 bg-card shadow-sm auto-float">
            <div>
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Cart subtotal</div>
              <div className="text-[10px] font-tech text-muted-foreground">Platform fee 3.5% of price + shipping: ${fee.toFixed(2)}</div>
            </div>
            <div className="font-display text-3xl font-light text-primary">${total.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <Button data-testid="cart-clear-btn" variant="outline" onClick={clear} className="rounded-xl font-tech text-xs uppercase tracking-wider">Clear cart</Button>
          </div>
          <p className="text-[10px] font-tech text-muted-foreground mt-4">
            Select items and complete them in one checkout session with credit card payment.
          </p>
        </>
      )}
    </div>
    </div>
  );
}
