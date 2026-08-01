/* eslint-disable */
import { useEffect, useRef, useState, useMemo } from "react";

/**
 * AmbientFX — a collection of lightweight, dependency-free micro-interactions
 * that make pages feel natural and alive. All components are optional and can
 * be composed freely:
 *
 *  - <FloatingParticles />   background dust / motes drifting upward
 *  - <RevealOnScroll />      fade + slide in when the element scrolls into view
 *  - <TiltCard />            3D mouse-tilt card (subtle, respects reduced motion)
 *  - <KenBurns />            slow zoom/pan wrapper for hero images
 *  - <ShimmerBorder />       animated border glow for cards
 *  - <Typewriter />          cycling text effect for live-feeling captions
 */

/** ------------------------------------------------------------------
 * FloatingParticles — gentle background motes.
 * Render absolutely inside a `relative` parent that has `overflow-hidden`.
 * ------------------------------------------------------------------ */
export function FloatingParticles({
  count = 12,
  className = "",
  color = "rgba(0, 229, 255, 0.25)",
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 9 + Math.random() * 9,
      delay: Math.random() * 8,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full floating-particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** ------------------------------------------------------------------
 * RevealOnScroll — fades and slides children into view when scrolled to.
 * Props:
 *   - as: element tag (default "div")
 *   - delay: seconds to stagger
 *   - className: extra classes
 *   - threshold: IntersectionObserver threshold (0 – 1)
 *   - direction: "up" | "down" | "left" | "right" | "none"
 * ------------------------------------------------------------------ */
export function RevealOnScroll({
  as: Tag = "div",
  children,
  delay = 0,
  className = "",
  threshold = 0.12,
  direction = "up",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const hiddenTransform = {
    up: "translate3d(0, 24px, 0)",
    down: "translate3d(0, -24px, 0)",
    left: "translate3d(24px, 0, 0)",
    right: "translate3d(-24px, 0, 0)",
    none: "translate3d(0, 0, 0)",
  }[direction];

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : hiddenTransform,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

/** ------------------------------------------------------------------
 * TiltCard — a card that subtly tilts toward the mouse.
 * Wraps children in a transform-style preserve-3d container.
 * Props:
 *   - maxTilt: degrees (default 6)
 *   - className: extra classes
 *   - glare: show a moving light glare (default true)
 * ------------------------------------------------------------------ */
export function TiltCard({ children, className = "", maxTilt = 6, glare = true }) {
  const ref = useRef(null);
  const frame = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, background: "transparent" });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * maxTilt * 2;
      const ry = (px - 0.5) * maxTilt * 2;

      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setStyle({
          transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`,
        });
        if (glare) {
          setGlareStyle({
            opacity: 1,
            background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.14) 0%, transparent 60%)`,
          });
        }
      });
    };

    const onLeave = () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)" });
      setGlareStyle({ opacity: 0, background: "transparent" });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [maxTilt, glare]);

  return (
    <div
      ref={ref}
      className={`relative will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d", ...style, transition: "transform 0.15s ease-out" }}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ ...glareStyle, transition: "opacity 0.3s ease", mixBlendMode: "overlay" }}
        />
      )}
    </div>
  );
}

/** ------------------------------------------------------------------
 * KenBurns — slow, cinematic zoom/pan for a full-bleed image.
 * Wrap an img/div with this to give it gentle motion.
 * ------------------------------------------------------------------ */
export function KenBurns({ children, className = "", duration = 24, zoom = 1.08 }) {
  const [pos, setPos] = useState({ x: 0, y: 0, s: 1 });

  useEffect(() => {
    let raf;
    let start;
    const keyframes = [
      { x: 0, y: 0, s: 1 },
      { x: -1.2, y: -0.8, s: zoom },
      { x: 0.8, y: 1, s: zoom },
      { x: 0, y: 0, s: 1 },
    ];
    const tick = (t) => {
      if (!start) start = t;
      const p = ((t - start) / (duration * 1000)) % 1;
      const seg = p * (keyframes.length - 1);
      const idx = Math.floor(seg);
      const frac = seg - idx;
      const a = keyframes[idx];
      const b = keyframes[Math.min(idx + 1, keyframes.length - 1)];
      setPos({
        x: a.x + (b.x - a.x) * frac,
        y: a.y + (b.y - a.y) * frac,
        s: a.s + (b.s - a.s) * frac,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, zoom]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="h-full w-full will-change-transform"
        style={{
          transform: `scale(${pos.s}) translate(${pos.x}%, ${pos.y}%)`,
          transition: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** ------------------------------------------------------------------
 * ShimmerBorder — an animated gradient border glow around any content.
 * ------------------------------------------------------------------ */
export function ShimmerBorder({ children, className = "", active = true }) {
  if (!active) return <div className={className}>{children}</div>;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <div className="shimmer-border" aria-hidden="true" />
    </div>
  );
}

/** ------------------------------------------------------------------
 * Typewriter — cycles through a list of strings like a live caption.
 * ------------------------------------------------------------------ */
export function Typewriter({ words, className = "", speed = 70, hold = 2200 }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx % words.length];
    let timer;
    if (!deleting && text === word) {
      timer = setTimeout(() => setDeleting(true), hold);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    } else {
      timer = setTimeout(() => {
        setText((t) => {
          if (deleting) return word.slice(0, t.length - 1);
          return word.slice(0, t.length + 1);
        });
      }, deleting ? speed / 2 : speed);
    }
    return () => clearTimeout(timer);
  }, [text, deleting, wordIdx, words, speed, hold]);

  return (
    <span className={className}>
      {text}
      <span className="typewriter-caret" aria-hidden="true" />
    </span>
  );
}

