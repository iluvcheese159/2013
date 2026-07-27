import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Bob from "./Bob";

export default function WarningBob() {
  const { user } = useAuth();
  const [warningShown, setWarningShown] = useState(false);
  const [warningTimestamp, setWarningTimestamp] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (user?.is_platform_owner) return;

    const enforcementStatus = user?.enforcement_status;
    const now = Date.now();

    if (
      enforcementStatus === "Warned" &&
      (!warningShown || now - warningTimestamp > 5 * 60 * 1000)
    ) {
      setWarningShown(true);
      setWarningTimestamp(now);
    }

    if (enforcementStatus !== "Warned" && warningShown) {
      setWarningShown(false);
    }
  }, [user, warningShown]);

  useEffect(() => {
    if (warningShown) {
      const timer = setTimeout(() => {
        setWarningShown(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [warningShown]);

  if (!warningShown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative">
        <Bob
          state="warning"
          isWarning={true}
          onWarningComplete={() => {}}
        />
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-sm font-tech text-center whitespace-nowrap shadow-lg backdrop-blur-sm border border-red-500/30">
          ⚠ Careful — read this
        </div>
      </div>
    </div>
  );
}