import { useState } from "react";
import { Button } from "@/components/ui/button";
import { containsRestrictedLanguage } from "@/lib/moderation";

export default function RestrictedContentToggle({ text, className = "" }) {
  const [show, setShow] = useState(false);
  const restricted = containsRestrictedLanguage(text);

  if (!restricted) {
    return <p className={`text-sm text-foreground/85 whitespace-pre-line ${className}`}>{text}</p>;
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/40 p-2 ${className}`}>
      {!show ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Comment contains restricted language.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShow(true)}
            className="h-7 rounded-xl font-tech text-[10px] uppercase tracking-wider"
          >
            Show Content
          </Button>
        </div>
      ) : (
        <p className="text-sm text-foreground/85 whitespace-pre-line">{text}</p>
      )}
    </div>
  );
}
