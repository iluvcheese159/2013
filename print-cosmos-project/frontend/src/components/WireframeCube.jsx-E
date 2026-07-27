import { useEffect, useRef } from "react";

// Lightweight CSS-only rotating wireframe cube — no three.js, no external assets.
// Used as a subtle visual anchor for empty states.
export default function WireframeCube({ size = 96, className = "" }) {
  const rootRef = useRef(null);

  useEffect(() => {
    // Progressive-enhancement: nudge browsers to allocate a layer so the animation is buttery.
    if (rootRef.current) rootRef.current.style.willChange = "transform";
  }, []);

  const half = size / 2;
  const face = { position: "absolute", inset: 0, border: "1.5px solid rgba(192,132,252,0.85)", borderRadius: 2 };
  const faceBg = { backgroundColor: "rgba(139,92,246,0.06)" };

  return (
    <div
      className={`wireframe-cube ${className}`.trim()}
      data-testid="wireframe-cube"
      style={{ perspective: `${size * 6}px`, width: size, height: size }}
    >
      <div
        ref={rootRef}
        className="wireframe-cube-inner"
        style={{
          position: "relative",
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          animation: "wireframe-cube-spin 12s linear infinite",
        }}
      >
        <div style={{ ...face, ...faceBg, transform: `translateZ(${half}px)` }} />
        <div style={{ ...face, ...faceBg, transform: `rotateY(180deg) translateZ(${half}px)` }} />
        <div style={{ ...face, ...faceBg, transform: `rotateY(90deg) translateZ(${half}px)` }} />
        <div style={{ ...face, ...faceBg, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
        <div style={{ ...face, ...faceBg, transform: `rotateX(90deg) translateZ(${half}px)` }} />
        <div style={{ ...face, ...faceBg, transform: `rotateX(-90deg) translateZ(${half}px)` }} />
      </div>
    </div>
  );
}
