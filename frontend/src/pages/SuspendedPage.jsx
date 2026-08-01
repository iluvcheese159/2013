import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function SuspendedPage() {
  const { suspended, logout } = useAuth();

  const until = suspended?.until ? new Date(suspended.until).toLocaleString() : "an unknown date";
  const reason = suspended?.reason || "Account suspended";

  return (
    <div className="pt-32 px-6 md:px-12 lg:px-24 text-center min-h-screen">
      <div className="max-w-md mx-auto">
<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6 auto-float">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-light mb-4 rise-in">Account Suspended</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed rise-in rise-in-1">
          Your account has been suspended due to: <span className="text-foreground font-medium">{reason}</span>.
          The suspension will be lifted on <span className="text-foreground font-medium">{until}</span>.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          If you believe this is a mistake, you can contact support at <a href="mailto:support@printcosmos.app" className="text-primary underline">support@printcosmos.app</a>.
        </p>
        <Button onClick={logout} variant="outline" className="rounded-xl font-tech text-xs uppercase tracking-wider">
          Sign out
        </Button>
      </div>
    </div>
  );
}
