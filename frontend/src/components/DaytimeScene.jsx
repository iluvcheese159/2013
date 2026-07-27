import { useEffect, useRef, useMemo, useState } from "react";
import { BobLawnChair } from "./Bob";

export function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function getSkyStyle(solarPhase, season) {
  const horizonProximity = 1 - Math.abs(solarPhase - 0.5) * 2;
  const baseTop = {
    winter: [15, 20, 40],
    spring: [15, 50, 130],
    summer: [20, 80, 160],
    fall: [30, 40, 60],
  };
  const baseMid = {
    winter: [80, 90, 110],
    spring: [100, 150, 200],
    summer: [100, 170, 220],
    fall: [100, 120, 140],
  };
  const baseHoriz = {
    winter: [160, 170, 190],
    spring: [180, 200, 220],
    summer: [200, 210, 230],
    fall: [170, 130, 100],
  };
  const base = { top: baseTop[season], mid: baseMid[season], horiz: baseHoriz[season] };

  const topR = Math.round(base.top[0] + horizonProximity * 10);
  const topG = Math.round(base.top[1] + horizonProximity * 80);
  const topB = Math.round(base.top[2] + horizonProximity * 60);
  const midR = Math.round(base.mid[0] + (1 - horizonProximity) * 120);
  const midG = Math.round(base.mid[1] + (1 - horizonProximity) * 20);
  const midB = Math.round(base.mid[2] - (1 - horizonProximity) * 80);
  const horizR = Math.round(base.horiz[0] + (1 - horizonProximity) * 55);
  const horizG = Math.round(base.horiz[1] - (1 - horizonProximity) * 80);
  const horizB = Math.round(base.horiz[2] - (1 - horizonProximity) * 160);

  const groundColors = {
    winter: "#e8eaf0",
    spring: "#4ade80",
    summer: "#22c55e",
    fall: "#a0722a",
  };
  const groundDark = {
    winter: "#c0c4d0",
    spring: "#16a34a",
    summer: "#15803d",
    fall: "#7a5a1e",
  };

  return {
    background: `linear-gradient(to bottom,
      rgb(${topR},${topG},${topB}) 0%,
      rgb(${midR},${midG},${midB}) 50%,
      rgb(${horizR},${horizG},${horizB}) 85%,
      ${groundColors[season]} 100%)`,
    groundDark: groundDark[season],
  };
}

function getSunPosition(solarPhase) {
  const x = 5 + solarPhase * 90;
  const arc = Math.sin(solarPhase * Math.PI);
  const y = 80 - arc * 65;
  return { x, y };
}

function getSunColor(solarPhase) {
  const arc = Math.sin(solarPhase * Math.PI);
  const g = Math.round(160 + arc * 80);
  const b = Math.round(arc * 60);
  return `rgb(255,${g},${b})`;
}

function getSunGlow(solarPhase) {
  const arc = Math.sin(solarPhase * Math.PI);
  return { size: 60 + (1 - arc) * 40, opacity: 0.25 + (1 - arc) * 0.2 };
}

function PalmTree({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-4" y="-60" width="8" height="60" fill="#5c3a1e" stroke="#3d2510" strokeWidth="1" />
      <g stroke="#1a7a2e" strokeWidth="3" fill="none">
        <path d="M0 -55 Q-25 -80 -35 -50" />
        <path d="M0 -55 Q-15 -75 -25 -45" />
        <path d="M0 -55 Q0 -78 5 -50" />
        <path d="M0 -55 Q15 -75 25 -45" />
        <path d="M0 -55 Q25 -80 35 -50" />
      </g>
      <g fill="#2d8a3e" opacity="0.8">
        <ellipse cx="-35" cy="-50" rx="18" ry="6" transform="rotate(-20, -35, -50)" />
        <ellipse cx="-25" cy="-45" rx="18" ry="6" transform="rotate(-10, -25, -45)" />
        <ellipse cx="-15" cy="-52" rx="18" ry="6" transform="rotate(-30, -15, -52)" />
        <ellipse cx="5" cy="-48" rx="18" ry="6" />
        <ellipse cx="25" cy="-45" rx="18" ry="6" transform="rotate(10, 25, -45)" />
        <ellipse cx="35" cy="-50" rx="18" ry="6" transform="rotate(20, 35, -50)" />
      </g>
    </g>
  );
}

function SnowCoveredEvergreen({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-3" y="-10" width="6" height="15" fill="#5c3a1e" stroke="#3d2510" strokeWidth="0.5" />
      <g fill="#1a6b2e" stroke="#0d4a1a" strokeWidth="0.5">
        <polygon points="0,-45 -15,-15 15,-15" />
        <polygon points="0,-38 -12,-12 12,-12" />
        <polygon points="0,-31 -9,-9 9,-9" />
        <polygon points="0,-24 -6,-6 6,-6" />
      </g>
      <g fill="white" opacity="0.7">
        <polygon points="0,-45 -15,-15 15,-15" />
        <polygon points="0,-38 -12,-12 12,-12" />
        <polygon points="0,-31 -9,-9 9,-9" />
      </g>
    </g>
  );
}

function Seagull({ x, y, delay }) {
  const [phase, setPhase] = useState(0);
  const wingRef = useRef(0);
  useEffect(() => {
    let lastTime = 0;
    const anim = (t) => {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      wingRef.current += dt * 8;
      setPhase(wingRef.current);
      requestAnimationFrame(anim);
    };
    const id = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(id);
  }, []);
  const flap = Math.sin(phase) * 4;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d={`M0 0 Q${flap} -3 ${flap * 1.5} 0 Q${flap} 3 0 0`} fill="none" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="0" cy="0" r="1.5" fill="#4a4a4a" />
    </g>
  );
}

function Snow({ x, y, size, delay }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let lastTime = 0;
    const anim = (t) => {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      setOffset((dt * 30 + delay) % 100);
      requestAnimationFrame(anim);
    };
    const id = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(id);
  }, [delay]);
  return (
    <circle cx={x} cy={y + offset} r={size} fill="white" opacity={0.6 + Math.random() * 0.3} />
  );
}

function Leaf({ x, y, delay }) {
  const [phase, setPhase] = useState(0);
  const [rot, setRot] = useState(0);
  useEffect(() => {
    let lastTime = 0;
    const anim = (t) => {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      setPhase(dt + delay);
      setRot((dt * 60 + delay * 100) % 360);
      requestAnimationFrame(anim);
    };
    const id = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(id);
  }, [delay]);
  return (
    <g transform={`translate(${x}, ${y + Math.sin(phase) * 5}) rotate(${rot})`}>
      <ellipse cx="0" cy="0" rx="3" ry="6" fill="#c0642a" opacity="0.7" />
    </g>
  );
}

function Cloud({ baseX, y, scale, speed }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let lastTime = 0;
    const anim = (t) => {
      if (!lastTime) lastTime = t;
      const dt = (t - lastTime) / 1000;
      lastTime = t;
      setOffset(dt * speed * 8);
      requestAnimationFrame(anim);
    };
    const id = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(id);
  }, [speed]);
  const x = ((baseX + offset) % 110) - 10;
  return (
    <div
      className="fixed pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${scale})`, zIndex: 1, opacity: 0.85 }}
    >
      <svg width="120" height="50" viewBox="0 0 120 50">
        <ellipse cx="60" cy="35" rx="50" ry="18" fill="white" opacity="0.9" />
        <ellipse cx="40" cy="30" rx="28" ry="20" fill="white" opacity="0.95" />
        <ellipse cx="75" cy="28" rx="24" ry="18" fill="white" opacity="0.9" />
        <ellipse cx="55" cy="24" rx="20" ry="16" fill="white" />
      </svg>
    </div>
  );
}

export default function DaytimeScene({ solarPhase = 0.5, isPro = false, onSkyClick, onSunClick, season: seasonProp }) {
  const cloudRefs = useRef([]);
  const grassRef = useRef(null);
  const frameRef = useRef(null);
  const season = seasonProp || getSeason();
  const outfitDay = useMemo(() => Math.floor(Date.now() / 86400000) % 7, []);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const skyStyle = useMemo(() => getSkyStyle(solarPhase, season), [solarPhase, season]);
  const sunPos = useMemo(() => getSunPosition(solarPhase), [solarPhase]);
  const sunColor = useMemo(() => getSunColor(solarPhase), [solarPhase]);
  const sunGlow = useMemo(() => getSunGlow(solarPhase), [solarPhase]);

  return (
    <>
      <div
        className="fixed inset-0 transition-all"
        style={{
          background: skyStyle.background,
          cursor: onSkyClick ? 'pointer' : 'default',
          zIndex: 0,
          transitionDuration: "2000ms",
        }}
        onClick={onSkyClick}
      />

      <div
        className="fixed transition-all"
        style={{
          left: `${sunPos.x}%`,
          top: `${sunPos.y}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          cursor: onSunClick ? 'pointer' : 'default',
          transitionDuration: "2000ms",
        }}
        onClick={(e) => { e.stopPropagation(); onSunClick?.(); }}
      >
        <div
          style={{
            position: "absolute",
            width: `${sunGlow.size * 2}px`,
            height: `${sunGlow.size * 2}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${sunColor} 0%, transparent 70%)`,
            opacity: sunGlow.opacity,
            transform: "translate(-50%, -50%)",
            top: "50%",
            left: "50%",
          }}
        />
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: sunColor,
            boxShadow: `0 0 30px 10px ${sunColor}`,
            position: "relative",
          }}
        />
      </div>

      {/* Clouds */}
      <div ref={cloudRefs}>
        {[
          { baseX: 15, y: 18, scale: 1.2, speed: 1 },
          { baseX: 55, y: 12, scale: 0.9, speed: 0.6 },
          { baseX: 78, y: 22, scale: 1.0, speed: 0.8 },
        ].map((cloud, i) => (
          <Cloud key={i} {...cloud} />
        ))}
      </div>

      {/* Season-specific elements */}
      {season === "summer" && (
        <>
          <PalmTree x={15} y={220} />
          <PalmTree x={350} y={210} />
          {/* Beach umbrella */}
          <g transform="translate(480, 200)" style={{ zIndex: 2 }}>
            <line x1="0" y1="60" x2="0" y2="0" stroke="#8b7355" strokeWidth="3" />
            <path d="M-30 0 Q0 -20 30 0 Q0 -15 -30 0" fill="#e74c3c" opacity="0.8" stroke="#c0392b" strokeWidth="1" />
            <path d="M-25 2 Q0 -12 25 2" fill="#e67e22" opacity="0.6" stroke="#d35400" strokeWidth="0.5" />
          </g>
          {/* Newspaper on chair */}
          <g transform="translate(60, 230)" style={{ zIndex: 3 }}>
            <rect x="-8" y="-4" width="16" height="20" rx="1" fill="#f5f0e0" stroke="#d4c8a0" strokeWidth="0.5" />
            <line x1="-6" y1="2" x2="6" y2="2" stroke="#bbb" strokeWidth="0.5" />
            <line x1="-6" y1="6" x2="4" y2="6" stroke="#bbb" strokeWidth="0.5" />
            <line x1="-6" y1="10" x2="5" y2="10" stroke="#bbb" strokeWidth="0.5" />
          </g>
          {/* Swim shorts on Bob */}
          <g transform="translate(30, 210)" style={{ zIndex: 4 }}>
            <path d="M22 48 L22 62 L18 62 L18 52 L22 48" fill="#e84040" stroke="#c03030" strokeWidth="0.5" />
            <path d="M38 48 L38 62 L42 62 L42 52 L38 48" fill="#e84040" stroke="#c03030" strokeWidth="0.5" />
            <circle cx="30" cy="50" r="4" fill="none" stroke="#f0c040" strokeWidth="1" />
          </g>
          {/* Seagulls */}
          <Seagull x={100} y={80} delay={0} />
          <Seagull x={250} y={60} delay={1.5} />
          <Seagull x={400} y={90} delay={3} />
          <Seagull x={520} y={70} delay={4.5} />
          {/* Warm ground */}
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px", background: "linear-gradient(to bottom, #f5de5c 0%, #d4a017 40%, #b8860b 100%)", zIndex: 2 }} />
        </>
      )}

      {season === "winter" && (
        <>
          <Snow-coveredEvergreen x={15} y={200} />
          <Snow-coveredEvergreen x={340} y={195} />
          {/* Snow-covered tent */}
          <g transform="translate(460, 200)" style={{ zIndex: 2 }}>
            <path d="M-40 0 L0 -50 L40 0 Z" fill="#3a3a4a" stroke="#2a2a3a" strokeWidth="1" />
            <path d="M-35 0 L0 -45 L35 0 Z" fill="#4a4a5a" opacity="0.5" />
            <line x1="0" y1="-45" x2="0" y2="0" stroke="#5a5a6a" strokeWidth="0.5" />
            {/* Snow on tent */}
            <path d="M-38 -2 Q0 -15 38 -2" fill="white" opacity="0.8" />
            <path d="M-30 0 Q0 -8 30 0" fill="white" opacity="0.6" />
          </g>
          {/* Snow on ground */}
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px", background: "linear-gradient(to bottom, #e8eaf0 0%, #c8cce0 40%, #a8b0c8 100%)", zIndex: 2 }} />
          {/* Snow particles */}
          {Array.from({ length: 12 }, (_, i) => (
            <Snow key={i} x={Math.random() * 600} y={Math.random() * 200} size={2 + Math.random() * 3} delay={i * 0.7} />
          ))}
        </>
      )}

      {season === "spring" && (
        <>
          <Snow-coveredEvergreen x={10} y={195} />
          <Snow-coveredEvergreen x={330} y={190} />
          {/* Flowers */}
          {[50, 120, 200, 280, 380, 450, 530].map((fx, i) => (
            <g key={i} transform={`translate(${fx}, 230)`}>
              <line x1="0" y1="0" x2="0" y2="-10" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="0" cy="-10" r="3" fill={["#ef4444", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"][i % 5]} />
            </g>
          ))}
          {/* Grass with flowers */}
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px", background: "linear-gradient(to bottom, #4ade80 0%, #16a34a 40%, #15803d 100%)", zIndex: 2 }} />
        </>
      )}

      {season === "fall" && (
        <>
          <Snow-coveredEvergreen x={15} y={198} />
          <Snow-coveredEvergreen x={340} y={193} />
          {/* Fallen leaves */}
          {Array.from({ length: 15 }, (_, i) => (
            <Leaf key={i} x={20 + i * 40} y={200 + Math.sin(i) * 30} delay={i * 0.3} />
          ))}
          {/* Leaf pile */}
          <g transform="translate(460, 215)" style={{ zIndex: 2 }}>
            <ellipse cx="0" cy="0" rx="25" ry="10" fill="#c0642a" opacity="0.7" />
            <ellipse cx="-10" cy="-2" rx="15" ry="6" fill="#a05020" opacity="0.6" />
            <ellipse cx="10" cy="-2" rx="15" ry="6" fill="#d07430" opacity="0.6" />
          </g>
          {/* Grass with fall tinge */}
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px", background: "linear-gradient(to bottom, #c08020 0%, #a06010 40%, #7a4a0e 100%)", zIndex: 2 }} />
        </>
      )}

      {/* Grass overlay (for all seasons except summer/winter which have custom ground) */}
      {season !== "summer" && season !== "winter" && (
        <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px", background: skyStyle.groundDark ? `linear-gradient(to bottom, #4ade80 0%, ${skyStyle.groundDark} 40%, #15803d 100%)` : undefined, zIndex: 2 }} />
      )}

      {/* Grass SVG animated details */}
      {season === "spring" && (
        <div className="fixed bottom-16 left-6 z-20 pointer-events-none">
          <svg ref={grassRef} width="160" height="40" viewBox="0 0 160 40" className="absolute bottom-0 left-0" style={{ zIndex: 1 }}>
            {Array.from({ length: 14 }, (_, i) => {
              const x = 8 + i * 11;
              const h = 10 + Math.sin(i * 0.7) * 4;
              return (
                <path key={i} d={`M${x} 40 Q${x + Math.sin(i) * 3} ${40 - h} ${x} ${40 - h}`}
                  stroke={["#22c55e", "#4ade80", "#16a34a"][i % 3]} strokeWidth="2" fill="none" />
              );
            })}
          </svg>
          <BobLawnChair isPro={isPro} outfitDay={outfitDay} />
        </div>
      )}

      {season === "fall" && (
        <div className="fixed bottom-16 left-6 z-20 pointer-events-none">
          <svg ref={grassRef} width="160" height="40" viewBox="0 0 160 40" className="absolute bottom-0 left-0" style={{ zIndex: 1 }}>
            {Array.from({ length: 14 }, (_, i) => {
              const x = 8 + i * 11;
              const h = 8 + Math.sin(i * 0.7) * 3;
              return (
                <path key={i} d={`M${x} 40 Q${x + Math.sin(i) * 3} ${40 - h} ${x} ${40 - h}`}
                  stroke="#8b6914" strokeWidth="2" fill="none" />
              );
            })}
          </svg>
          <BobLawnChair isPro={isPro} outfitDay={outfitDay} />
        </div>
      )}

      {season === "winter" && (
        <div className="fixed bottom-16 left-6 z-20 pointer-events-none">
          <svg ref={grassRef} width="160" height="40" viewBox="0 0 160 40" className="absolute bottom-0 left-0" style={{ zIndex: 1 }}>
            {Array.from({ length: 14 }, (_, i) => {
              const x = 8 + i * 11;
              const h = 6 + Math.sin(i * 0.7) * 2;
              return (
                <path key={i} d={`M${x} 40 Q${x + Math.sin(i) * 3} ${40 - h} ${x} ${40 - h}`}
                  stroke="#c8d0e0" strokeWidth="2" fill="none" />
              );
            })}
          </svg>
          <BobLawnChair isPro={isPro} outfitDay={outfitDay} />
        </div>
      )}
    </>
  );
}

