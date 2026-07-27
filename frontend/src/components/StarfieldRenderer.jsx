import { useMemo, useRef, useEffect } from "react";

const BACKGROUND_STAR_COUNT = 300;

function powerDistribution(min, max, exponent, random) {
  return min + (max - min) * Math.pow(random, exponent);
}

function gaussianRandom(mean, stdev, random) {
  const u = 1 - random();
  const v = random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function getStarColor(random) {
  const r = random();
  if (r < 0.6) return { r: 240, g: 245, b: 255 };
  if (r < 0.85) return { r: 255, g: 250, b: 240 };
  return { r: 255, g: 240, b: 220 };
}

function generateStars(count, seed) {
  const stars = [];
  let seedValue = seed;
  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  const milkyWayAngle = Math.PI / 4;
  const milkyWayWidth = 0.3;

  for (let i = 0; i < count; i++) {
    let x, y;
    const inMilkyWay = random() < 0.4;

    if (inMilkyWay) {
      const bandPos = random();
      const bandOffset = gaussianRandom(0, milkyWayWidth / 2, random());
      x = bandPos + bandOffset * Math.cos(milkyWayAngle + Math.PI / 2);
      y = bandPos + bandOffset * Math.sin(milkyWayAngle + Math.PI / 2);
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));
    } else {
      x = random();
      y = random();
    }

    const size = powerDistribution(0.5, 3.5, 3, random());
    const baseBrightness = size / 3.5;
    const brightness = baseBrightness * (0.5 + random() * 0.5);
    const color = getStarColor(random);
    const twinkleSpeed = 2 + random() * 4;
    const twinklePhase = random() * Math.PI * 2;

    stars.push({
      id: i,
      x: x * 100,
      y: y * 100,
      size,
      opacity: 0.2 + brightness * 0.6,
      color: `rgb(${color.r}, ${color.g}, ${color.b})`,
      twinkleSpeed,
      twinklePhase,
    });
  }
  return stars;
}

export default function StarfieldRenderer({
  starCount = BACKGROUND_STAR_COUNT,
  seed = Date.now(),
  className = "",
  offset = null,
}) {
  const stars = useMemo(() => generateStars(starCount, seed), [starCount, seed]);
  const pannable = offset !== null;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        style={pannable ? {
          position: "absolute",
          width: "300%",
          height: "300%",
          top: "-100%",
          left: "-100%",
          transform: `translate(${offset.x}px, ${offset.y}px) translateZ(0)`,
          willChange: "transform",
        } : { position: "absolute", inset: 0 }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              opacity: star.opacity,
              transform: "translateZ(0)",
              willChange: "opacity",
              animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
              animationDelay: `${star.twinklePhase}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}