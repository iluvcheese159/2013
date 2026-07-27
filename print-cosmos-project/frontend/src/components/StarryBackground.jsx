/* eslint-disable */
import { useMemo } from "react";

const DEFAULT_STAR_COUNT = 200;

function generateStars(count, seed) {
  const stars = [];
  // Simple seeded random for consistent variations
  let seedValue = seed;
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return seedValue / 233280;
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: seededRandom() * 100,
      y: seededRandom() * 100,
      size: seededRandom() * 2 + 0.5,
      opacity: seededRandom() * 0.5 + 0.3,
      twinkleSpeed: seededRandom() * 2 + 1,
    });
  }
  return stars;
}

export default function StarryBackground({ 
  starCount = DEFAULT_STAR_COUNT, 
  variationSeed = Date.now(),
  className = "",
  children 
}) {
  const stars = useMemo(() => generateStars(starCount, variationSeed), [starCount, variationSeed]);

  return (
    <div className={`relative ${className}`}>
      {/* Starry background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
