import { useRef, useEffect } from "react";

/**
 * Bob as a stick figure for the intro scene.
 * Based on reference image 2: circle head, line body, line limbs, no face features.
 */
export default function IntroBob({ state = "sitting", isPro = false }) {
  const svgRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      timeRef.current += dt;

      if (svgRef.current) {
        const t = timeRef.current;
        const sway = Math.sin(t * 1.5) * 2;
        const breathe = Math.sin(t * 0.8) * 0.5;

        const body = svgRef.current.querySelector("#ib-body");
        if (body) body.setAttribute("transform", "rotate(" + sway + " 30 50)");

        const head = svgRef.current.querySelector("#ib-head");
        if (head) head.setAttribute("transform", "translate(0, " + breathe + ")");

        const leftArm = svgRef.current.querySelector("#ib-left-arm");
        const rightArm = svgRef.current.querySelector("#ib-right-arm");
        if (leftArm) leftArm.setAttribute("transform", "rotate(" + (sway * 0.3 + 5) + " 20 45)");
        if (rightArm) rightArm.setAttribute("transform", "rotate(" + (-sway * 0.3 - 5) + " 40 45)");
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const strokeColor = isPro ? "#fbbf24" : "#6b7280";
  const strokeWidth = 2;

  return (
    <svg ref={svgRef} width="60" height="100" viewBox="0 0 60 100" fill="none" className="relative">
      <g id="ib-head">
        <circle cx="30" cy="12" r="10" stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
        <line x1="30" y1="22" x2="30" y2="30" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </g>
      <g id="ib-body">
        <line x1="30" y1="30" x2="30" y2="60" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <g id="ib-left-arm">
          <line x1="30" y1="38" x2="18" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="18" y1="50" x2="14" y2="48" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
        <g id="ib-right-arm">
          <line x1="30" y1="38" x2="42" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="42" y1="50" x2="46" y2="48" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
        <line x1="30" y1="60" x2="20" y2="85" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="20" y1="85" x2="16" y2="88" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="30" y1="60" x2="40" y2="85" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="40" y1="85" x2="44" y2="88" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </g>
      {isPro && (
        <g transform="translate(0, 2)">
          <path d="M22 2 L26 6 L30 1 L34 6 L38 2" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
