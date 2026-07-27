import { useEffect, useRef } from "react";

const COLORS = ["#f43f5e", "#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ec4899"];

export default function Confetti() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const pieces = Array.from({ length: 60 }, (_, i) => {
      const el = document.createElement("div");
      const left = Math.random() * 100;
      const delay = Math.random() * 0.8;
      const duration = 1.5 + Math.random() * 1.5;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 4 + Math.random() * 6;
      const drift = -30 + Math.random() * 60;
      el.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: -10px;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        border-radius: 2px;
        opacity: 0.9;
        animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
        --drift: ${drift}px;
      `;
      container.appendChild(el);
      return () => el.remove();
    });
    return () => pieces.forEach((cleanup) => cleanup());
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
