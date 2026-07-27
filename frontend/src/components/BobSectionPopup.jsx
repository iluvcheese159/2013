import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import Bob from "./Bob";

const POPUP_DURATION = 6000;
const STORAGE_KEY = "pf_bob_section_dismissed";

export default function BobSectionPopup({
  sectionName,
  title,
  text,
  onDismiss,
}) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(async () => {
    setDismissing(true);
    try {
      await api.post(`/bob/section/${sectionName}/visit`);
    } catch {
      /* ignore */
    }
    const dismissed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    if (!dismissed.includes(sectionName)) {
      dismissed.push(sectionName);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => onDismiss?.(), 400);
  }, [sectionName, onDismiss]);

  useEffect(() => {
    const dismissed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    if (dismissed.includes(sectionName)) return;
    timerRef.current = setTimeout(() => dismiss(), POPUP_DURATION);
    setVisible(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sectionName, dismiss]);

  if (!visible && !dismissing) return null;

  return (
    <div
      className={`fixed bottom-20 left-6 z-50 flex items-end gap-3 transition-all duration-500 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className={`bg-card border border-border rounded-2xl shadow-lg p-4 max-w-xs transition-all duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
              <MessageCircle className="h-3 w-3 text-accent" />
            </div>
            <span className="text-xs font-tech uppercase tracking-wider text-accent">
              Bob Says
            </span>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h4 className="text-sm font-display font-medium mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
      </div>
      <div className="relative">
        <Bob state="introducing" position="popup" />
      </div>
    </div>
  );
}