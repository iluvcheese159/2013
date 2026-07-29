import { useRef, useEffect, useMemo } from "react";

export default function CampfireScene({ bobRef }) {
  const svgRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  const fireflies = useMemo(() => {
    const result = [];
    for (let i = 0; i < 6; i++) {
      result.push({
        id: i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      });
    }
    return result;
  }, []);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      timeRef.current += dt;

      if (svgRef.current) {
        const t = timeRef.current;

        const flame = svgRef.current.querySelector("#cf-flame");
        if (flame) {
          const flicker = Math.sin(t * 8) * 2 + Math.sin(t * 13) * 1.5;
          const flickerX = Math.sin(t * 5) * 1.5;
          flame.setAttribute("transform", "translate(" + flickerX + ", " + (-flicker * 0.3) + ")");
        }

        const glow = svgRef.current.querySelector("#cf-glow");
        if (glow) {
          const pulse = 0.6 + Math.sin(t * 2) * 0.2;
          glow.setAttribute("opacity", pulse);
        }

        const flyGroup = svgRef.current.querySelector("#cf-fireflies");
        if (flyGroup) {
          const circles = flyGroup.querySelectorAll("circle");
          circles.forEach((circle, i) => {
            const fly = fireflies[i];
            if (fly) {
              const y = fly.y + Math.sin(t * fly.speed + fly.phase) * 4;
              const x = fly.x + Math.cos(t * fly.speed * 0.7 + fly.phase) * 3;
              circle.setAttribute("cx", x);
              circle.setAttribute("cy", y);
              const opacity = 0.3 + Math.sin(t * 2 + fly.phase) * 0.3;
              circle.setAttribute("opacity", Math.max(0, opacity));
            }
          });
        }

        const trees = svgRef.current.querySelector("#cf-trees");
        if (trees) {
          const sway = Math.sin(t * 0.5) * 1.5;
          trees.setAttribute("transform", "translate(" + sway + ", 0)");
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [fireflies]);

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[15vh]">
      <svg
        ref={svgRef}
        width="400"
        height="300"
        viewBox="0 0 400 300"
        fill="none"
        className="w-full max-w-lg"
        style={{ filter: "drop-shadow(0 0 20px rgba(249, 115, 22, 0.15))" }}
      >
        <ellipse cx="200" cy="270" rx="180" ry="30" fill="#1a1a1a" />
        <ellipse cx="200" cy="268" rx="160" ry="20" fill="#222" />

        <g id="cf-trees" opacity="0.6">
          <rect x="20" y="160" width="6" height="80" fill="#0a1a0a" />
          <polygon points="23,120 0,170 46,170" fill="#0a1a0a" />
          <polygon points="23,130 4,165 42,165" fill="#0d220d" />
          <polygon points="23,140 8,160 38,160" fill="#0a1a0a" />
          <rect x="60" y="140" width="8" height="100" fill="#0a1a0a" />
          <polygon points="64,90 30,150 98,150" fill="#0a1a0a" />
          <polygon points="64,100 35,145 93,145" fill="#0d220d" />
          <polygon points="64,110 40,140 88,140" fill="#0a1a0a" />
          <polygon points="64,120 45,135 83,135" fill="#0d220d" />
          <rect x="320" y="150" width="7" height="90" fill="#0a1a0a" />
          <polygon points="323,105 295,155 351,155" fill="#0a1a0a" />
          <polygon points="323,115 300,150 346,150" fill="#0d220d" />
          <polygon points="323,125 305,145 341,145" fill="#0a1a0a" />
          <rect x="360" y="170" width="5" height="70" fill="#0a1a0a" />
          <polygon points="362,140 345,175 379,175" fill="#0a1a0a" />
          <polygon points="362,148 348,172 376,172" fill="#0d220d" />
        </g>

        <g id="cf-tent" transform="translate(200, 140)">
          <path d="M-40 100 L0 20 L40 100 Z" fill="#2a2a2a" stroke="#444" strokeWidth="1.5" />
          <path d="M-20 100 L0 50 L20 100 Z" fill="#1a1a1a" />
          <line x1="-25" y1="60" x2="0" y2="20" stroke="#444" strokeWidth="1" />
          <line x1="25" y1="60" x2="0" y2="20" stroke="#444" strokeWidth="1" />
          <ellipse cx="0" cy="80" rx="12" ry="15" fill="#fbbf24" opacity="0.15" />
        </g>

        <g id="cf-log" transform="translate(170, 230)">
          <ellipse cx="0" cy="0" rx="30" ry="8" fill="#3a2010" stroke="#5a3a1a" strokeWidth="1" />
          <ellipse cx="0" cy="-2" rx="28" ry="6" fill="#4a2a10" />
          <line x1="-20" y1="-2" x2="20" y2="-2" stroke="#3a2010" strokeWidth="0.5" opacity="0.5" />
          <line x1="-15" y1="0" x2="15" y2="0" stroke="#3a2010" strokeWidth="0.5" opacity="0.5" />
          <line x1="-10" y1="2" x2="10" y2="2" stroke="#3a2010" strokeWidth="0.5" opacity="0.5" />
        </g>

        <g id="cf-campfire" transform="translate(230, 220)">
          <line x1="-15" y1="10" x2="15" y2="5" stroke="#5a3a1a" strokeWidth="4" strokeLinecap="round" />
          <line x1="-12" y1="5" x2="12" y2="10" stroke="#4a2a10" strokeWidth="4" strokeLinecap="round" />
          <line x1="-8" y1="8" x2="8" y2="8" stroke="#3a2010" strokeWidth="3" strokeLinecap="round" />
          <ellipse id="cf-glow" cx="0" cy="0" rx="25" ry="20" fill="#f97316" opacity="0.3" />
          <ellipse cx="0" cy="0" rx="15" ry="12" fill="#f59e0b" opacity="0.4" />
          <g id="cf-flame">
            <path d="M0 5 Q-6 -5 -3 -15 Q0 -25 0 -20 Q2 -25 5 -15 Q6 -5 0 5 Z" fill="#f97316" opacity="0.8" />
            <path d="M0 5 Q-3 -3 -1 -10 Q0 -15 0 -12 Q1 -15 3 -10 Q3 -3 0 5 Z" fill="#fbbf24" opacity="0.9" />
            <path d="M0 5 Q-1 0 0 -5 Q1 0 0 5 Z" fill="#fef08a" opacity="0.8" />
          </g>
          <circle cx="-4" cy="-18" r="1" fill="#fbbf24" opacity="0.6" />
          <circle cx="3" cy="-16" r="0.8" fill="#fbbf24" opacity="0.5" />
          <circle cx="0" cy="-22" r="0.6" fill="#fef08a" opacity="0.4" />
        </g>

        <g id="cf-fireflies">
          {fireflies.map((fly) => (
            <circle key={fly.id} cx={fly.x} cy={fly.y} r="1.5" fill="#fef08a" opacity="0.5" />
          ))}
        </g>

        <g opacity="0.4">
          <circle cx="50" cy="30" r="1" fill="white" />
          <circle cx="120" cy="20" r="1.5" fill="white" />
          <circle cx="180" cy="40" r="0.8" fill="white" />
          <circle cx="250" cy="15" r="1.2" fill="white" />
          <circle cx="310" cy="35" r="1" fill="white" />
          <circle cx="350" cy="25" r="0.8" fill="white" />
          <circle cx="80" cy="50" r="0.6" fill="white" />
          <circle cx="280" cy="45" r="0.7" fill="white" />
          <circle cx="150" cy="55" r="0.5" fill="white" />
          <circle cx="330" cy="50" r="0.6" fill="white" />
        </g>
      </svg>
    </div>
  );
}
