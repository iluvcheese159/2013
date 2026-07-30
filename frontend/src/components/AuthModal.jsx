import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, X } from "lucide-react";
import { BRAND_LOGO_URL, BRAND_NAME } from "@/lib/branding";

export default function AuthModal() {
  const { authModal, closeAuth, loginEmail, registerEmail, loginWithGoogle } = useAuth();
  const isSignup = authModal === "signup";
  const open = authModal !== null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setEmail(""); setPassword(""); setName(""); setError(""); setBusy(false); };
  const close = () => { reset(); closeAuth(); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (isSignup) {
        await registerEmail(email, password, name || email.split("@")[0]);
        toast.success("Welcome to Print Cosmos");
      } else {
        await loginEmail(email, password);
        toast.success("Signed in");
      }
      close();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-lg border-border" data-testid="auth-modal">
        <button onClick={close} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <X className="h-4 w-4" />
        </button>
        <div className="p-8">
          <img src={BRAND_LOGO_URL} alt={BRAND_NAME} className="h-16 w-auto object-contain mb-6" />
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary mb-3">
            {isSignup ? "Create account" : "Welcome back"}
          </div>
          <h2 className="font-display text-2xl font-medium tracking-tight mb-6">
            {isSignup ? "Join Print Cosmos" : "Sign in to Print Cosmos"}
          </h2>

          <form onSubmit={submit} className="space-y-3">
            {isSignup && (
              <Field icon={<UserIcon className="h-3.5 w-3.5" />} label="Name">
                <Input
                  data-testid="auth-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="font-tech text-sm rounded-xl pl-9"
                  required
                />
              </Field>
            )}
            <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email">
              <Input
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@maker.com"
                className="font-tech text-sm rounded-xl pl-9"
                required
              />
            </Field>
            <Field icon={<Lock className="h-3.5 w-3.5" />} label="Password">
              <Input
                data-testid="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="font-tech text-sm rounded-xl pl-9"
                required
                minLength={6}
              />
            </Field>
            {error && <div className="text-xs text-destructive font-tech">{error}</div>}
            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            >
              {busy ? "..." : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Button
              data-testid="auth-google-btn"
              variant="outline"
              onClick={loginWithGoogle}
              className="w-full rounded-xl font-tech text-xs uppercase tracking-wider border-border"
            >
              <GoogleIcon /> Google
            </Button>
          </div>

          <div className="text-xs font-tech text-center text-muted-foreground mt-6">
            {isSignup ? "Already have an account? " : "New here? "}
            <button
              type="button"
              onClick={() => { reset(); /* swap mode */ (isSignup ? document.querySelector("[data-mode-signin]") : document.querySelector("[data-mode-signup]"))?.click(); }}
              className="text-primary hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
            <button data-mode-signin onClick={() => window.dispatchEvent(new CustomEvent("auth:open", { detail: "signin" }))} className="hidden" />
            <button data-mode-signup onClick={() => window.dispatchEvent(new CustomEvent("auth:open", { detail: "signup" }))} className="hidden" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon, children }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

