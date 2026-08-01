import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { FloatingParticles, RevealOnScroll } from "@/components/AmbientFX";
import { useSparkleField } from "@/hooks/useAmbientLife";

export default function CheckoutSuccess() {
  const sparkles = useSparkleField();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling"); // polling | paid | failed | expired
  const [data, setData] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    /* eslint-disable */
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    const poll = async () => {
      try {
        const r = await api.get(`/checkout/status/${sessionId}`);
        setData(r.data);
        if (r.data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        if (r.data.status === "expired") {
          setStatus("expired");
          return;
        }
        attempts.current += 1;
        if (attempts.current >= 8) {
          setStatus("failed");
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        attempts.current += 1;
        if (attempts.current >= 8) setStatus("failed");
        else setTimeout(poll, 2000);
      }
    };
    poll();
    /* eslint-enable */
  }, [sessionId]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {sparkles.layer}
      <FloatingParticles count={10} color="rgba(52, 211, 153, 0.12)" className="fixed inset-0" />
      <div data-testid="checkout-success-page" className="relative z-10 pt-32 px-6 md:px-12 lg:px-24 min-h-screen flex flex-col items-center justify-center text-center">
      {status === "polling" && (
        <>
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-6" />
          <h1 className="font-display text-3xl font-light mb-3 rise-in">Verifying payment…</h1>
          <p className="text-sm text-muted-foreground rise-in rise-in-1">Hang tight while we confirm your payment.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-6 auto-float" strokeWidth={1.5} />
          <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter mb-3 rise-in">Order placed.</h1>
          <p className="text-sm text-muted-foreground max-w-md mb-8 rise-in rise-in-1">
            Your payment cleared. The seller has been notified and your print will ship soon.
          </p>
          <div className="flex gap-3 rise-in rise-in-2">
            <Link to="/browse">
              <Button data-testid="success-browse-btn" className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
                Browse more prints
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button data-testid="success-dashboard-btn" variant="outline" className="rounded-xl font-tech text-xs uppercase tracking-wider">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </>
      )}
      {(status === "failed" || status === "expired") && (
        <>
          <XCircle className="h-12 w-12 text-destructive mb-6" strokeWidth={1.5} />
          <h1 className="font-display text-3xl font-light mb-3 rise-in">Payment {status === "expired" ? "expired" : "incomplete"}.</h1>
          <p className="text-sm text-muted-foreground mb-8 rise-in rise-in-1">No charge was made. Try again when you&apos;re ready.</p>
          <Link to="/browse">
            <Button className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">Back to browse</Button>
          </Link>
        </>
      )}
    </div>
    </div>
  );
}
