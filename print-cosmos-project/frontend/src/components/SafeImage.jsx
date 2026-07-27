import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Drop-in replacement for <img> that shows a clean placeholder instead of
 * the browser's broken-image icon whenever a src is missing or fails to
 * load (deleted file, network hiccup, corrupted upload, etc). Pass the same
 * props you'd pass to <img> — src, alt, className.
 */
export default function SafeImage({ src, alt = "", className = "", iconSize = 20, ...props }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary text-muted-foreground ${className}`}
        role="img"
        aria-label={alt || "Image unavailable"}
      >
        <ImageOff className="opacity-40" size={iconSize} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
