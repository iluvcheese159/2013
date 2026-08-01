/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ProInvoiceReceipt from "@/components/ProInvoiceReceipt";
import { Check, Sparkles, MessageSquare, Hammer, Percent } from "lucide-react";
import { toast } from "sonner";
import { FloatingParticles } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

const BRAND_URL = "https://printcosmos.net";

const PERKS = [
  { icon: Percent, title: "2% fee instead of 3.5%", body: "Keep more of every print you sell." },
  { icon: MessageSquare, title: "Priority replies", body: "Your DMs are free for everyone. Hyperspace boosts your replies to the top of buyers' inboxes." },
  { icon: Hammer, title: "Hyperspace designer toolkit", body: "Hyperspace shapes, snap-to-grid, multi-select coming soon." },
  { icon: Sparkles, title: "Hyperspace badge on your profile", body: "Stand out in search, listings, and DMs." },
];

export default function Pro() {
  const sparkles = useSparkleField();
  const { user, openAuth, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [proPrice, setProPrice] = useState(4.99);
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const [verifyStatus, setVerifyStatus] = useState(sessionId ? "polling" : null);
  const [invoice, setInvoice] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    api.get("/").then((r) => r.data?.pro_price && setProPrice(r.data.pro_price)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const poll = async () => {
      try {
        const r = await api.get(`/checkout/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          setVerifyStatus("paid");
          try {
            const me = await api.get("/auth/me");
            setUser(me.data);
          } catch {}
          try {
            const invoiceResponse = await api.get(`/pro/invoice/${sessionId}`);
            setInvoice(invoiceResponse.data);
          } catch {
            setInvoice(null);
          }
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 8) {
          setVerifyStatus("failed");
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        attempts.current += 1;
        if (attempts.current >= 8) setVerifyStatus("failed");
        else setTimeout(poll, 2000);
      }
    };
    poll();
  }, [sessionId, setUser]);

  const upgrade = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }
    setBusy(true);
    try {
      const r = await api.post("/pro/checkout", { origin_url: window.location.origin });
      window.location.href = r.data.url;
    } catch {
      toast.error("Could not start checkout");
      setBusy(false);
    }
  };

if (verifyStatus === "paid") {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {sparkles.layer}
        <FloatingParticles count={12} color="rgba(167, 139, 250, 0.15)" className="fixed inset-0" />
        <div data-testid="pro-success" className="relative z-10 pt-20 px-6 pb-16 text-center min-h-screen">
        <Sparkles className="h-12 w-12 text-accent mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-4xl font-medium tracking-tighter mb-4">You're Print Cosmos.</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Your fee just dropped to 2%, the Hyperspace badge is on your profile, and Hyperspace priority replies are active.
        </p>
        <div className="mb-8">
          <ProInvoiceReceipt invoice={invoice} />
        </div>
        <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
          Go to dashboard
        </Button>
      </div>
      </div>
    );
  }

return (
    <div className="relative min-h-screen overflow-hidden">
      {sparkles.layer}
      <FloatingParticles count={10} color="rgba(167, 139, 250, 0.12)" className="fixed inset-0" />
      <div data-testid="pro-page" className="relative z-10 pt-20 min-h-screen">
      <div className="px-6 md:px-12 py-16 max-w-5xl">
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-accent mb-3 rise-in">
          <span>●</span> Membership
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-light tracking-tighter mb-6 rise-in rise-in-1">
          Print Cosmos <span className="text-accent font-medium">Hyperspace</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl leading-relaxed mb-4 rise-in rise-in-2">
          Drop your platform fee to 2%, get a Print Cosmos badge across the platform, and unlock the Hyperspace
          toolkit. One-time payment of <span className="text-foreground font-tech">${proPrice.toFixed(2)}</span>.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground rise-in rise-in-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent font-bold">
            PH
          </div>
          <div>
            <div className="font-medium text-foreground">Print Cosmos</div>
            <a href={BRAND_URL} target="_blank" rel="noreferrer" className="underline">
              printhive.net
            </a>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12 auto-float">
          {PERKS.map((p) => (
            <div key={p.title} className="border border-border rounded-xl p-6 flex gap-4">
              <div className="h-10 w-10 border border-accent/30 bg-accent/5 text-accent rounded-xl flex items-center justify-center shrink-0">
                <p.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-display font-medium mb-1">{p.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{p.body}</div>
              </div>
            </div>
          ))}
        </div>

        {user?.is_pro ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs font-tech uppercase tracking-wider">
            <Check className="h-3.5 w-3.5" /> You're already Hyperspace
          </div>
        ) : (
          <Button
            data-testid="pro-upgrade-btn"
            onClick={upgrade}
            disabled={busy}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-tech text-xs uppercase tracking-wider auto-glow-pulse"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {busy ? "Redirecting…" : verifyStatus === "polling" ? "Verifying payment…" : `Upgrade — $${proPrice.toFixed(2)}`}
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
