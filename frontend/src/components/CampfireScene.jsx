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

        // Gentle idle sway for Bob sitting in the bottom-left corner
        const bob = svgRef.current.querySelector("#cf-bob");
        if (bob) {
          const bobSway = Math.sin(t * 1.1) * 1.5;
          const bobRock = Math.sin(t * 0.7) * 0.8;
          bob.setAttribute("transform", "translate(18, 195) rotate(" + bobRock + " 20 30) translate(" + bobSway * 0.3 + ", 0)");
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

        {/* Dense forest — left cluster (surrounds Bob) */}
        <g id="cf-trees" opacity="0.85">
          {/* Far-left background trees */}
          <rect x="-5" y="170" width="5" height="80" fill="#060e06" />
          <polygon points="-3,130 -22,175 16,175" fill="#060e06" />
          <polygon points="-3,140 -18,170 12,170" fill="#081208" />
          <polygon points="-3,150 -14,165 8,165" fill="#060e06" />

          <rect x="12" y="155" width="6" height="95" fill="#0a1a0a" />
          <polygon points="15,105 -8,160 38,160" fill="#0a1a0a" />
          <polygon points="15,115 -4,155 34,155" fill="#0d220d" />
          <polygon points="15,125 0,150 30,150" fill="#0a1a0a" />
          <polygon points="15,135 4,145 26,145" fill="#0d220d" />

          <rect x="32" y="148" width="7" height="102" fill="#0a1a0a" />
          <polygon points="35,95 8,155 62,155" fill="#0a1a0a" />
          <polygon points="35,107 12,150 58,150" fill="#0d220d" />
          <polygon points="35,118 16,145 54,145" fill="#0a1a0a" />
          <polygon points="35,128 20,140 50,140" fill="#0d220d" />

          <rect x="52" y="158" width="5" height="92" fill="#060e06" />
          <polygon points="54,118 36,163 72,163" fill="#060e06" />
          <polygon points="54,128 40,158 68,158" fill="#081208" />
          <polygon points="54,138 44,153 64,153" fill="#060e06" />

          <rect x="68" y="145" width="8" height="105" fill="#0a1a0a" />
          <polygon points="72,88 40,152 104,152" fill="#0a1a0a" />
          <polygon points="72,100 44,147 100,147" fill="#0d220d" />
          <polygon points="72,112 48,142 96,142" fill="#0a1a0a" />
          <polygon points="72,122 52,137 92,137" fill="#0d220d" />

          <rect x="88" y="152" width="6" height="98" fill="#060e06" />
          <polygon points="91,112 70,157 112,157" fill="#060e06" />
          <polygon points="91,122 74,152 108,152" fill="#081208" />
          <polygon points="91,132 78,147 104,147" fill="#060e06" />

          {/* Mid-left trees */}
          <rect x="108" y="160" width="5" height="90" fill="#0a1a0a" />
          <polygon points="110,125 92,165 128,165" fill="#0a1a0a" />
          <polygon points="110,133 96,160 124,160" fill="#0d220d" />
          <polygon points="110,141 100,155 120,155" fill="#0a1a0a" />

          {/* Right side trees */}
          <rect x="290" y="155" width="7" height="95" fill="#0a1a0a" />
          <polygon points="293,108 265,160 321,160" fill="#0a1a0a" />
          <polygon points="293,118 270,155 316,155" fill="#0d220d" />
          <polygon points="293,128 275,150 311,150" fill="#0a1a0a" />

          <rect x="315" y="148" width="8" height="102" fill="#0a1a0a" />
          <polygon points="319,98 288,155 350,155" fill="#0a1a0a" />
          <polygon points="319,110 292,150 346,150" fill="#0d220d" />
          <polygon points="319,122 296,145 342,145" fill="#0a1a0a" />
          <polygon points="319,132 300,140 338,140" fill="#0d220d" />

          <rect x="340" y="158" width="6" height="92" fill="#060e06" />
          <polygon points="343,120 322,163 364,163" fill="#060e06" />
          <polygon points="343,130 326,158 360,158" fill="#081208" />
          <polygon points="343,140 330,153 356,153" fill="#060e06" />

          <rect x="358" y="165" width="5" height="85" fill="#0a1a0a" />
          <polygon points="360,132 342,170 378,170" fill="#0a1a0a" />
          <polygon points="360,140 346,165 374,165" fill="#0d220d" />

          <rect x="375" y="155" width="7" height="95" fill="#060e06" />
          <polygon points="378,112 356,160 400,160" fill="#060e06" />
          <polygon points="378,122 360,155 396,155" fill="#081208" />
          <polygon points="378,132 364,150 392,150" fill="#060e06" />
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

        {/* Bob — sitting in the bottom-left corner, watching the fire */}
        <g id="cf-bob" transform="translate(18, 195)" style={{ filter: "drop-shadow(0 0 5px rgba(255,255,255,0.35)) drop-shadow(0 0 12px rgba(249,115,22,0.25))" }}>
          {/* Round head (chibi style matching reference) */}
          <circle cx="20" cy="0" r="11" fill="none" stroke="#ffffff" strokeWidth="2" />
          {/* Neck */}
          <line x1="20" y1="11" x2="20" y2="18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Torso leaning toward the fire */}
          <line x1="20" y1="18" x2="28" y2="34" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Folded legs (sitting) */}
          <line x1="28" y1="34" x2="18" y2="46" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="34" x2="36" y2="46" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Arm reaching toward fire */}
          <line x1="22" y1="22" x2="36" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="28" x2="40" y2="26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Other arm resting */}
          <line x1="18" y1="24" x2="10" y2="30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
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
