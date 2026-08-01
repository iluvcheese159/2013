import { useRef, useEffect } from "react";
import { bobKnowledge } from "@/data/bobKnowledge";

export default function Bob({ state = "idle", position = "tent", isWarning = false, onWarningComplete }) {
  const wobbleRef = useRef(0);
  const frameRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      wobbleRef.current += dt * 2;

      if (svgRef.current) {
        const wobble = Math.sin(wobbleRef.current) * 2;
        const speakAmplitude = Math.sin(wobbleRef.current * 3) * 3;
        const isSpeaking = state === "introducing";
        const isThinking = state === "waiting";

        svgRef.current.style.transform = `rotate(${wobble}deg)`;

        const mouth = svgRef.current.querySelector("#bob-mouth");
        if (mouth) {
          if (isThinking) {
            mouth.setAttribute("d", "M20 24 Q30 22 40 24");
          } else {
            mouth.setAttribute("d", `M23 24 Q30 ${22 + (isSpeaking ? speakAmplitude : 0)} 37 24`);
          }
        }

        const leftArm = svgRef.current.querySelector("#bob-left-arm");
        const rightArm = svgRef.current.querySelector("#bob-right-arm");
        if (leftArm) leftArm.setAttribute("transform", `rotate(${wobble * 0.5} 30 15)`);
        if (rightArm) rightArm.setAttribute("transform", `rotate(${-wobble * 0.5} 30 15)`);
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [state]);

  const lineColor = isWarning ? "#ef4444" : "#6b7280";
  const fillColor = isWarning ? "#1f1f1f" : "#1a1a1a";
  const eyeColor = isWarning ? "#ef4444" : "#6b7280";

  return (
    <div className="relative inline-block">
      <svg ref={svgRef} width="60" height="100" viewBox="0 0 60 100" fill="none" style={{ transition: "transform 0.05s linear" }}>
        {/* Head */}
        <g transform="translate(0, 12)">
          <ellipse cx="30" cy="15" rx="12" ry="14" fill={fillColor} stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 29 L30 38 L42 29" fill="none" stroke={lineColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="23" cy="10" r="3" fill={fillColor} stroke={lineColor} strokeWidth="1.2" />
          <circle cx="37" cy="10" r="3" fill={fillColor} stroke={lineColor} strokeWidth="1.2" />
          <circle cx="23" cy="10" r="1.2" fill={eyeColor} />
          <circle cx="37" cy="10" r="1.2" fill={eyeColor} />
          {/* Nose */}
          <path d="M28 14 L30 18 L32 14" fill="none" stroke={lineColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Mouth */}
          <path id="bob-mouth" d="M23 24 Q30 22 37 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          {/* Thinking dots — visible when state is "waiting" */}
          <g id="bob-thinking-dots" opacity={state === "waiting" ? 1 : 0} style={{ transition: "opacity 0.3s" }}>
            <circle cx="22" cy="28" r="1.5" fill="#6b7280" />
            <circle cx="30" cy="28" r="1.5" fill="#6b7280" />
            <circle cx="38" cy="28" r="1.5" fill="#6b7280" />
          </g>
          {/* Neck */}
          <line x1="26" y1="29" x2="26" y2="35" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="29" x2="34" y2="35" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
        </g>
        {/* Body */}
        <g transform="translate(0, 35)">
          <path d="M20 0 L40 0 L40 30 L20 30 Z" fill="none" stroke={lineColor} strokeWidth="1.5" />
          <line x1="30" y1="0" x2="30" y2="30" stroke={lineColor} strokeWidth="0.8" strokeDasharray="2 2" />
          {/* Left arm */}
          <g id="bob-left-arm">
            <path d="M20 8 L8 14 L8 18 L20 22" fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="8" x2="12" y2="12" stroke={lineColor} strokeWidth="1.5" />
            <line x1="20" y1="22" x2="12" y2="18" stroke={lineColor} strokeWidth="1.5" />
          </g>
          {/* Right arm */}
          <g id="bob-right-arm">
            <path d="M40 8 L52 14 L52 18 L40 22" fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="40" y1="8" x2="48" y2="12" stroke={lineColor} strokeWidth="1.5" />
            <line x1="40" y1="22" x2="48" y2="18" stroke={lineColor} strokeWidth="1.5" />
          </g>
          {/* Legs */}
          <g transform="translate(0, 5)">
            <path d="M26 30 L26 55 L22 55 L22 30 Z" fill="none" stroke={lineColor} strokeWidth="1.5" />
            <path d="M34 30 L34 55 L38 55 L38 30 Z" fill="none" stroke={lineColor} strokeWidth="1.5" />
          </g>
          {/* Feet */}
          <ellipse cx="24" cy="55" rx="6" ry="3" fill={fillColor} stroke={lineColor} strokeWidth="1.5" />
          <ellipse cx="36" cy="55" rx="6" ry="3" fill={fillColor} stroke={lineColor} strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

export function BobPro({ state = "idle" }) {
  const isSpeaking = state === "introducing";

  return (
    <div className="relative inline-block">
      <svg width="60" height="100" viewBox="0 0 60 100" fill="none">
        <g transform="translate(0, 12)">
          <ellipse cx="30" cy="15" rx="12" ry="14" fill="#1a1a1a" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 29 L30 38 L42 29" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="23" cy="10" r="3" fill="#1a1a1a" stroke="#fbbf24" strokeWidth="1.2" />
          <circle cx="37" cy="10" r="3" fill="#1a1a1a" stroke="#fbbf24" strokeWidth="1.2" />
          <circle cx="23" cy="10" r="1.2" fill="#fbbf24" />
          <circle cx="37" cy="10" r="1.2" fill="#fbbf24" />
          <path d="M28 14 L30 18 L32 14" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
          <path d={isSpeaking ? "M23 24 Q30 25 37 24" : "M23 24 Q30 22 37 24"} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
            {isSpeaking && (
              <animate
                attributeName="d"
                dur="0.45s"
                repeatCount="indefinite"
                values="M23 24 Q30 22 37 24;M23 24 Q30 26 37 24;M23 24 Q30 22 37 24"
              />
            )}
          </path>
          <line x1="26" y1="29" x2="26" y2="35" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="29" x2="34" y2="35" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pro crown */}
          <path d="M22 2 L26 6 L30 1 L34 6 L38 2" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(0, 35)">
          <path d="M20 0 L40 0 L40 30 L20 30 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="30" y1="0" x2="30" y2="30" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 2" />
          <path d="M20 8 L8 14 L8 18 L20 22" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="8" x2="12" y2="12" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="20" y1="22" x2="12" y2="18" stroke="#fbbf24" strokeWidth="1.5" />
          <path d="M40 8 L52 14 L52 18 L40 22" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="8" x2="48" y2="12" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="40" y1="22" x2="48" y2="18" stroke="#fbbf24" strokeWidth="1.5" />
          <g transform="translate(0, 5)">
            <path d="M26 30 L26 55 L22 55 L22 30 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <path d="M34 30 L34 55 L38 55 L38 30 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          </g>
          <ellipse cx="24" cy="55" rx="6" ry="3" fill="#1a1a1a" stroke="#fbbf24" strokeWidth="1.5" />
          <ellipse cx="36" cy="55" rx="6" ry="3" fill="#1a1a1a" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

export function BobSleeping({ visible = false }) {
  if (!visible) return null;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <ellipse cx="15" cy="15" rx="10" ry="12" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="2" fill="#6b7280" />
      <circle cx="19" cy="11" r="2" fill="#6b7280" />
      <path d="M10 18 Q15 21 20 18" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      {/* Zzz */}
      <text x="20" y="6" fill="#6b7280" fontSize="6" fontFamily="monospace">z</text>
      <text x="24" y="2" fill="#6b7280" fontSize="4" fontFamily="monospace">z</text>
    </svg>
  );
}

const WEEKLY_OUTFIT_COLORS = [
  { primary: "#e74c3c", secondary: "#c03030", accent: "#f0c040" },
  { primary: "#3498db", secondary: "#2472a4", accent: "#85c1e9" },
  { primary: "#2ecc71", secondary: "#1fa855", accent: "#a3e4bc" },
  { primary: "#f39c12", secondary: "#c97d0e", accent: "#f9e154" },
  { primary: "#9b59b6", secondary: "#7d3c98", accent: "#d2b4de" },
  { primary: "#1abc9c", secondary: "#128c76", accent: "#76d7c4" },
  { primary: "#e67e22", secondary: "#b8651a", accent: "#f5cba7" },
];

function getOutfitColors(dayIndex) {
  return WEEKLY_OUTFIT_COLORS[dayIndex % WEEKLY_OUTFIT_COLORS.length];
}

export function BobLawnChair({ isPro = false, outfitDay = 0 }) {
  const colors = getOutfitColors(outfitDay);
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="relative z-10">
      <path d="M10 50 L15 25 L45 25 L50 50 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1.5" />
      <line x1="15" y1="25" x2="10" y2="50" stroke={colors.secondary} strokeWidth="1.5" />
      <line x1="45" y1="25" x2="50" y2="50" stroke={colors.secondary} strokeWidth="1.5" />
      <line x1="15" y1="35" x2="45" y2="35" stroke={colors.secondary} strokeWidth="1" />
      <ellipse cx="30" cy="20" rx="10" ry="12" fill={colors.primary} stroke={colors.secondary} strokeWidth="1.5" />
      <circle cx="26" cy="16" r="2" fill={colors.secondary} />
      <circle cx="34" cy="16" r="2" fill={colors.secondary} />
      <path d="M26 22 Q30 24 34 22" fill="none" stroke={colors.accent} strokeWidth="1.2" strokeLinecap="round" />
      {isPro && (
        <ellipse cx="30" cy="8" rx="6" ry="2" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
      )}
    </svg>
  );
}

export function BobBeachChair({ isPro = false, outfitDay = 0 }) {
  const colors = getOutfitColors(outfitDay);
  return (
    <svg width="60" height="50" viewBox="0 0 60 50" fill="none" className="relative z-10">
      <path d="M8 45 L12 15 L48 15 L52 45 Z" fill="#4b5563" stroke="#6b7280" strokeWidth="1" />
      <path d="M12 15 L48 15 L52 45 L8 45 Z" fill="#5a6370" opacity="0.5" />
      <line x1="12" y1="15" x2="12" y2="45" stroke="#6b7280" strokeWidth="0.8" />
      <line x1="48" y1="15" x2="48" y2="45" stroke="#6b7280" strokeWidth="0.8" />
      <path d="M20 25 L40 25" stroke={colors.primary} strokeWidth="3" />
      <path d="M20 35 L40 35" stroke={colors.secondary} strokeWidth="3" />
      <ellipse cx="30" cy="12" rx="8" ry="10" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1" />
      <circle cx="26" cy="9" r="2" fill="#6b7280" />
      <circle cx="34" cy="9" r="2" fill="#6b7280" />
      <path d="M26 14 Q30 16 34 14" fill="none" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      {isPro && (
        <ellipse cx="30" cy="4" rx="5" ry="1.5" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.8" />
      )}
    </svg>
  );
}

export function BobSnowShoveling({ isPro = false, outfitDay = 0 }) {
  const colors = getOutfitColors(outfitDay);
  return (
    <svg width="60" height="100" viewBox="0 0 60 100" fill="none" className="relative z-10">
      {/* Winter cap */}
      <path d="M18 22 Q30 10 42 22" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" />
      <rect x="16" y="22" width="28" height="6" fill={colors.primary} stroke={colors.secondary} strokeWidth="0.5" />
      {/* Scarf */}
      <rect x="18" y="32" width="24" height="6" rx="3" fill={colors.accent} stroke={colors.secondary} strokeWidth="0.5" />
      {/* Body / sweater */}
      <path d="M20 38 L40 38 L40 70 L20 70 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" />
      <line x1="30" y1="38" x2="30" y2="70" stroke={colors.secondary} strokeWidth="0.5" />
      {/* Arms with shovel */}
      <path d="M20 42 L10 48 L10 55 L20 52" fill="none" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="48" x2="18" y2="50" stroke="#888" strokeWidth="1" />
      <line x1="10" y1="50" x2="18" y2="48" stroke="#888" strokeWidth="1" />
      <path d="M40 42 L50 48 L50 55 L40 52" fill="none" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pants */}
      <path d="M22 70 L22 90 L18 90 L18 72 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" opacity="0.8" />
      <path d="M38 70 L38 90 L42 90 L42 72 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" opacity="0.8" />
      {/* Boots */}
      <ellipse cx="20" cy="90" rx="5" ry="3" fill="#3a3a3a" />
      <ellipse cx="40" cy="90" rx="5" ry="3" fill="#3a3a3a" />
      {/* Head */}
      <g transform="translate(0, 12)">
        <ellipse cx="30" cy="15" rx="12" ry="14" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M18 29 L30 38 L42 29" fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="23" cy="10" r="3" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.2" />
        <circle cx="37" cy="10" r="3" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.2" />
        <circle cx="23" cy="10" r="1.2" fill={colors.accent} />
        <circle cx="37" cy="10" r="1.2" fill={colors.accent} />
        <path d="M28 14 L30 18 L32 14" fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
        <path id="bob-mouth" d="M23 24 Q30 22 37 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {isPro && (
        <path d="M22 2 L26 6 L30 1 L34 6 L38 2" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function BobSpringLying({ isPro = false, outfitDay = 0 }) {
  const colors = getOutfitColors(outfitDay);
  return (
    <svg width="70" height="50" viewBox="0 0 70 50" fill="none" className="relative z-10">
      {/* Torso lying down */}
      <ellipse cx="35" cy="28" rx="18" ry="8" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" />
      <line x1="35" y1="24" x2="35" y2="32" stroke={colors.secondary} strokeWidth="0.5" />
      {/* Legs */}
      <path d="M20 32 L15 45 L19 45 L22 35" fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 32 L55 45 L51 45 L48 35" fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms stretched out */}
      <path d="M25 26 L10 20" fill="none" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
      <path d="M45 26 L60 20" fill="none" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
      {/* Head resting on ground */}
      <g transform="translate(35, 18)">
        <ellipse cx="0" cy="0" rx="8" ry="7" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1" />
        <circle cx="-3" cy="-2" r="1.5" fill="#6b7280" />
        <circle cx="3" cy="-2" r="1.5" fill="#6b7280" />
        <path d="M-2 1 Q0 2 2 1" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      {isPro && (
        <ellipse cx="30" cy="10" rx="5" ry="2" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
      )}
    </svg>
  );
}

export function BobFallLeafShoveling({ isPro = false, outfitDay = 0 }) {
  const colors = getOutfitColors(outfitDay);
  return (
    <svg width="60" height="100" viewBox="0 0 60 100" fill="none" className="relative z-10">
      {/* Scarf */}
      <rect x="16" y="24" width="28" height="6" rx="3" fill={colors.accent} stroke={colors.secondary} strokeWidth="0.5" />
      {/* Sweater */}
      <path d="M20 30 L40 30 L40 65 L20 65 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" />
      <line x1="30" y1="30" x2="30" y2="65" stroke={colors.secondary} strokeWidth="0.5" />
      {/* Arms with shovel */}
      <path d="M20 34 L8 38 L8 44 L20 40" fill="none" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="38" x2="16" y2="40" stroke="#888" strokeWidth="1" />
      <line x1="8" y1="40" x2="16" y2="38" stroke="#888" strokeWidth="1" />
      <path d="M40 34 L52 38 L52 44 L40 40" fill="none" stroke={colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Jeans */}
      <path d="M22 65 L22 85 L18 85 L18 67 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" opacity="0.8" />
      <path d="M38 65 L38 85 L42 85 L42 67 Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="1" opacity="0.8" />
      {/* Boots */}
      <ellipse cx="20" cy="85" rx="5" ry="3" fill="#3a3a3a" />
      <ellipse cx="40" cy="85" rx="5" ry="3" fill="#3a3a3a" />
      {/* Head */}
      <g transform="translate(0, 12)">
        <ellipse cx="30" cy="15" rx="12" ry="14" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.5" />
        <path d="M18 29 L30 38 L42 29" fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="23" cy="10" r="3" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.2" />
        <circle cx="37" cy="10" r="3" fill="#1a1a1a" stroke="#6b7280" strokeWidth="1.2" />
        <circle cx="23" cy="10" r="1.2" fill={colors.accent} />
        <circle cx="37" cy="10" r="1.2" fill={colors.accent} />
        <path d="M28 14 L30 18 L32 14" fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
        <path id="bob-mouth" d="M23 24 Q30 22 37 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      {isPro && (
        <path d="M22 2 L26 6 L30 1 L34 6 L38 2" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function findBobResponse(message) {
  if (!message || typeof message !== "string") {
    return bobKnowledge.default_response.responses[0];
  }

  const lower = message.toLowerCase().trim();

  for (const [category, data] of Object.entries(bobKnowledge)) {
    if (!data.keywords || !data.responses) continue;
    for (const keyword of data.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return data.responses[Math.floor(Math.random() * data.responses.length)];
      }
    }
  }

  const defaults = bobKnowledge.default_response.responses;
  return defaults[Math.floor(Math.random() * defaults.length)];
}