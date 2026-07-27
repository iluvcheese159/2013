/* eslint-disable */
import { useState, useEffect } from "react";

// Empty constellation state - blank sky with few random stars and a moon
// Signals "nothing built here yet" clearly
export default function EmptyConstellation() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate a small handful of random stars
    const randomStars = [];
    for (let i = 0; i < 5; i++) {
      randomStars.push({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
    setStars(randomStars);
  }, []);

  return (
    <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden border border-white/10">
      {/* Moon */}
      <svg className="absolute top-8 right-8 w-12 h-12" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="#fef3c7"
          opacity="0.8"
        />
        {/* Moon craters */}
        <circle cx="18" cy="18" r="3" fill="#fde68a" opacity="0.5" />
        <circle cx="30" cy="28" r="4" fill="#fde68a" opacity="0.5" />
        <circle cx="22" cy="32" r="2" fill="#fde68a" opacity="0.5" />
      </svg>
      
      {/* Random unconnected stars */}
      <svg className="absolute inset-0">
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#fff"
            opacity={star.opacity}
          />
        ))}
      </svg>
      
      {/* Empty state message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm font-tech mb-2">
            No constellation built yet
          </p>
          <p className="text-white/20 text-xs font-tech">
            Enable builder mode to create your club's constellation
          </p>
        </div>
      </div>
    </div>
  );
}
