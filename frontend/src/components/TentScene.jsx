import { useState, useEffect, useRef, useMemo } from "react";

const SLEEPY_LINES = [
  "What?",
  "I'm trying to sleep here!",
  "Five more minutes...",
  "Do you know what time it is?",
  "Zzz... what?",
  "Can't a bot get some rest?",
];

export default function TentScene({ bobInside = true, onTentClick }) {
  const fireflies = useMemo(() => {
    const result = [];
    for (let i = 0; i < 8; i++) {
      result.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60 + 20,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
      });
    }
    return result;
  }, []);

  const windRef = useRef(0);
  const svgRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      windRef.current += dt * 1.2;

      if (svgRef.current) {
        const wind = windRef.current;
        const windOffset = Math.sin(wind) * 3;

        const trees = svgRef.current.querySelector("#tent-trees");
        const tent = svgRef.current.querySelector("#tent-structure");
        const grass = svgRef.current.querySelector("#tent-grass");
        if (trees) trees.setAttribute("transform", `translate(${windOffset * 0.3}, 0)`);
        if (tent) tent.setAttribute("transform", `translate(${windOffset}, 0)`);
        if (grass) grass.setAttribute("transform", `translate(${windOffset * 0.5}, 0)`);

        // Firefly animation
        const flyGroup = svgRef.current.querySelector("#tent-fireflies");
        if (flyGroup) {
          const circles = flyGroup.querySelectorAll("circle");
          circles.forEach((circle, i) => {
            const fly = fireflies[i];
            if (fly) {
              const y = fly.y + Math.sin(wind * fly.speed + fly.phase) * 5;
              circle.setAttribute("cy", y);
              const opacity = 0.4 + Math.sin(wind * 2 + fly.phase) * 0.4;
              circle.setAttribute("opacity", opacity);
            }
          });
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [fireflies]);

  const [bobSleepingVisible, setBobSleepingVisible] = useState(false);
  const [sleepyLine, setSleepyLine] = useState("");

  const handleTentClick = () => {
    if (bobInside) {
      setBobSleepingVisible(true);
      setSleepyLine(SLEEPY_LINES[Math.floor(Math.random() * SLEEPY_LINES.length)]);
      setTimeout(() => setBobSleepingVisible(false), 2000);
    }
    onTentClick?.();
  };

  return (
    <div className="absolute bottom-4 left-4 w-48 h-40 cursor-pointer" onClick={handleTentClick}>
      <svg ref={svgRef} width="192" height="160" viewBox="0 0 192 160">
        {/* Ground */}
        <ellipse cx="96" cy="140" rx="80" ry="20" fill="#1f2937" />
        <ellipse cx="96" cy="138" rx="70" ry="15" fill="#374151" />

        {/* Trees */}
        <g id="tent-trees">
          <rect x="20" y="80" width="8" height="40" fill="#78350f" />
          <polygon points="24,40 4,80 44,80" fill="#166534" />
          <polygon points="24,50 8,75 40,75" fill="#15803d" />
          <rect x="160" y="85" width="6" height="35" fill="#78350f" />
          <polygon points="163,50 148,80 178,80" fill="#166534" />
          <polygon points="163,60 150,78 176,78" fill="#15803d" />
        </g>

        {/* Tent */}
        <g id="tent-structure">
          <path d="M50 140 L96 60 L142 140 Z" fill="#4b5563" stroke="#6b7280" strokeWidth="2" />
          <path d="M85 140 L96 90 L107 140 Z" fill="#1f2937" />
          <line x1="70" y1="100" x2="96" y2="60" stroke="#6b7280" strokeWidth="1" />
          <line x1="122" y1="100" x2="96" y2="60" stroke="#6b7280" strokeWidth="1" />
          {bobInside && (
            <ellipse cx="96" cy="115" rx="15" ry="20" fill="#fbbf24" opacity="0.3">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
            </ellipse>
          )}
        </g>

        {/* Fireflies */}
        <g id="tent-fireflies">
          {fireflies.map((fly) => (
            <circle key={fly.id} cx={fly.x * 1.5} cy={fly.y} r="2" fill="#fef08a" opacity="0.5" />
          ))}
        </g>

        {/* Grass */}
        <g id="tent-grass">
          {Array.from({ length: 12 }, (_, i) => {
            const x = 30 + i * 12;
            const h = 8 + Math.random() * 6;
            return (
              <path key={i} d={`M${x} 140 Q${x + Math.sin(i) * 3} ${140 - h} ${x} ${140 - h}`}
                stroke="#22c55e" strokeWidth="2" fill="none" />
            );
          })}
        </g>
      </svg>

      {bobSleepingVisible && (
        <div className="absolute bottom-16 left-16 rise-in">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <ellipse cx="15" cy="15" rx="10" ry="12" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="2" fill="#6b7280" />
            <circle cx="19" cy="11" r="2" fill="#6b7280" />
            <path d="M10 18 Q15 21 20 18" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-3 py-2 rounded-lg whitespace-nowrap font-tech rise-in-1">
            {sleepyLine}
          </div>
        </div>
      )}
    </div>
  );
}