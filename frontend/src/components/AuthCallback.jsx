import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CosmosLoader from "@/components/CosmosLoader";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }
    (async () => {
      try {
        const r = await api.post("/auth/session", { session_id: sessionId });
        setUser(r.data.user);
        // Clear hash and navigate
        window.history.replaceState({}, "", "/dashboard");
        navigate("/dashboard", { replace: true, state: { user: r.data.user } });
      } catch (e) {
        console.warn("Auth failed", e);
        navigate("/", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <CosmosLoader isActive={true} size={96} color="#00e5ff" />
        <div className="text-center">
          <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
            Authenticating
          </div>
          <div className="font-display text-2xl font-light mt-1">Print Cosmos</div>
        </div>
      </div>
    </div>
  );
}
