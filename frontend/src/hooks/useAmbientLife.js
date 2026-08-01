/* eslint-disable */
import { useMemo, useRef, useEffect, useState, useCallback } from "react";

/**
 * useAmbientLife — a shared hook that gives any page a "living" feel.
 *
 * Returns:
 *  - floatStyle: deterministic random auto-float animation style
 *  - driftStyle: deterministic random ambient-drift animation style
 *  - glowStyle:  deterministic random auto-glow-pulse animation style
 *  - shimmer:    boolean, sometimes true to apply shimmering class
 *  - sparkles:   { renderLayer } — attaches a global "click → sparkle burst" layer
 *
 * The randomness is seeded by the component key so animations stay stable across
 * re-renders (no layout jitter).
 */

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useAmbientLife(seedKey = "ambient", options = {}) {
  const { float = true, drift = false, glow = false } = options;
  const seed = useMemo(() => {
    let h = 2166136261;
    const s = String(seedKey);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }, [seedKey]);

  const random = useMemo(() => mulberry32(seed), [seed]);

  const floatStyle = useMemo(() => {
    if (!float) return undefined;
    const duration = 4.5 + random() * 4;      // 4.5 – 8.5s
    const delay = random() * 2;               // 0 – 2s
    return {
      animation: `auto-float ${duration}s ease-in-out ${delay}s infinite`,
    };
  }, [float, random]);

  const driftStyle = useMemo(() => {
    if (!drift) return undefined;
    const duration = 6 + random() * 6;        // 6 – 12s
    const delay = random() * 3;
    return {
      animation: `ambient-drift ${duration}s ease-in-out ${delay}s infinite`,
    };
  }, [drift, random]);

  const glowStyle = useMemo(() => {
    if (!glow) return undefined;
    const duration = 3 + random() * 3;        // 3 – 6s
    const delay = random() * 2;
    return {
      animation: `auto-glow-pulse ${duration}s ease-in-out ${delay}s infinite`,
    };
  }, [glow, random]);

  return { floatStyle, driftStyle, glowStyle };
}

/**
 * SparkleField — renders a fixed pointer-events-none layer that spawns a
 * small sparkle burst wherever the user clicks on the page. This gives every
 * page a tactile, "alive" response without interfering with real clicks.
 *
 * Usage:
 *   const sparkles = useSparkleField();          // in any component
 *   <>{sparkles.layer}</>                         // mount the layer
 *   ... and any click on the page will burst sparkles automatically.
 *
 * If `selector` is provided (a CSS selector string), only clicks within
 * matching elements will burst — e.g. ".ambient-sparkles".
 */
export function useSparkleField({ selector = null } = {}) {
  const [bursts, setBursts] = useState([]);
  const idRef = useRef(0);

  const spawn = useCallback((x, y) => {
    const id = ++idRef.current;
    const count = 8 + Math.floor(Math.random() * 6);
    const sparks = Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 18 + Math.random() * 26;
      const colors = ["#00e5ff", "#ff5722", "#fbbf24", "#a78bfa", "#ffffff"];
      return {
        id: id + "-" + i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 500 + Math.random() * 400,
      };
    });
    setBursts((prev) => [...prev, { id, x, y, sparks }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 950);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (selector) {
        const target = e.target.closest ? e.target.closest(selector) : null;
        if (!target) return;
      }
      spawn(e.clientX, e.clientY);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [spawn, selector]);

  const layer = (
    <div className="fixed inset-0 pointer-events-none z-[999]" aria-hidden="true">
      {bursts.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{ left: b.x ?? 0, top: b.y ?? 0 }}
        >
          {b.sparks.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full sparkle-burst"
              style={{
                width: s.size,
                height: s.size,
                backgroundColor: s.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                "--dx": `${s.dx}px`,
                "--dy": `${s.dy}px`,
                animationDuration: `${s.life}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return { layer, spawn };
}

