import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Briefcase, Circle, Check } from "lucide-react";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/branding";

const TYPES = [
  { id: "personal", label: "Personal", icon: User, blurb: "Hobbyist, small batches, side projects." },
  { id: "business", label: "Business", icon: Briefcase, blurb: "Bulk orders, B2B prints, commercial use." },
  { id: "neutral", label: "Neutral", icon: Circle, blurb: "Decide later — I'm just exploring." },
];

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const open = !!user && !user.onboarded;
  const [userTag, setUserTag] = useState("");
  const [accountType, setAccountType] = useState("neutral");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put("/profile", { user_tag: userTag || null, account_type: accountType });
      setUser(r.data);
      toast.success("Profile set up");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg p-0 rounded-lg" data-testid="onboarding-modal">
        <div className="p-8">
          <img src={BRAND_LOGO_URL} alt={BRAND_NAME} className="h-14 w-auto object-contain mb-5" />
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary mb-3">Welcome to Print Cosmos</div>
          <h2 className="font-display text-2xl font-medium tracking-tight mb-2">Set up your maker profile</h2>
          <p className="text-sm text-muted-foreground mb-6">Pick a user tag and tell us how you'll use Print Cosmos.</p>

          <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">User tag</div>
          <Input
            data-testid="onboarding-user-tag"
            value={userTag}
            onChange={(e) => setUserTag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder="e.g. resin_ryan"
            className="font-tech text-sm rounded-xl mb-6"
            maxLength={20}
          />

          <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-3">I'm here for…</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
            {TYPES.map((t) => {
              const active = accountType === t.id;
              return (
                <button
                  key={t.id}
                  data-testid={`onboarding-type-${t.id}`}
                  onClick={() => setAccountType(t.id)}
                  className={`relative text-left p-4 border rounded-xl transition-all ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                  }`}
                >
                  {active && <Check className="absolute top-3 right-3 h-3.5 w-3.5 text-primary" />}
                  <t.icon className={`h-5 w-5 mb-3 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  <div className="font-display text-sm font-medium">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{t.blurb}</div>
                </button>
              );
            })}
          </div>

          <Button
            data-testid="onboarding-save-btn"
            onClick={save}
            disabled={busy}
            className="w-full bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
          >
            {busy ? "Saving…" : "Get started"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
