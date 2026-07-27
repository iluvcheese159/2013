/* eslint-disable */
import { useState, useRef, useEffect } from "react";

export default function ConstellationBuilder({ onSave, initialData = null }) {
  const [stars, setStars] = useState(initialData?.stars || []);
  const [lines, setLines] = useState(initialData?.lines || []);
  const [constellationName, setConstellationName] = useState(initialData?.name || "");
  const [selectedStar, setSelectedStar] = useState(null);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const canvasRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (!isBuilderMode) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newStar = {
      id: `star_${Date.now()}`,
      x,
      y,
    };
    
    setStars([...stars, newStar]);
  };

  const handleStarClick = (e, starId) => {
    e.stopPropagation();
    
    if (isBuilderMode) {
      if (selectedStar === null) {
        setSelectedStar(starId);
      } else if (selectedStar !== starId) {
        // Create a line between the two stars
        const newLine = {
          id: `line_${Date.now()}`,
          from: selectedStar,
          to: starId,
        };
        setLines([...lines, newLine]);
        setSelectedStar(null);
      } else {
        setSelectedStar(null);
      }
    }
  };

  const handleDeleteStar = (e, starId) => {
    e.stopPropagation();
    setStars(stars.filter((s) => s.id !== starId));
    setLines(lines.filter((l) => l.from !== starId && l.to !== starId));
    setSelectedStar(null);
  };

  const handleSave = () => {
    onSave({
      stars,
      lines,
      name: constellationName,
    });
  };

  return (
    <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden border border-white/10">
      {/* Constellation canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
      >
        <svg className="w-full h-full">
          {/* Lines */}
          {lines.map((line) => {
            const fromStar = stars.find((s) => s.id === line.from);
            const toStar = stars.find((s) => s.id === line.to);
            if (!fromStar || !toStar) return null;
            return (
              <line
                key={line.id}
                x1={`${fromStar.x}%`}
                y1={`${fromStar.y}%`}
                x2={`${toStar.x}%`}
                y2={`${toStar.y}%`}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Stars */}
          {stars.map((star) => (
            <g key={star.id}>
              <circle
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r="4"
                fill="#fff"
                className="cursor-pointer hover:fill-yellow-200 transition-colors"
                onClick={(e) => handleStarClick(e, star.id)}
              />
              {selectedStar === star.id && (
                <circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r="6"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
              )}
              {isBuilderMode && (
                <circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r="8"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                  className="cursor-pointer hover:stroke-red-400"
                  onClick={(e) => handleDeleteStar(e, star.id)}
                />
              )}
            </g>
          ))}
        </svg>
      </div>
      
      {/* Constellation name input */}
      {stars.length > 0 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${stars.reduce((sum, s) => sum + s.x, 0) / stars.length}%`,
            top: `${stars.reduce((sum, s) => sum + s.y, 0) / stars.length}%`,
          }}
        >
          <input
            type="text"
            value={constellationName}
            onChange={(e) => setConstellationName(e.target.value)}
            placeholder="Name your constellation"
            className="bg-black/50 backdrop-blur-sm text-white text-sm font-tech text-center border border-white/20 rounded-xl px-3 py-1 focus:outline-none focus:border-white/40"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* Builder mode toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setIsBuilderMode(!isBuilderMode)}
          className={`px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider border rounded-xl transition-colors ${
            isBuilderMode
              ? "border-yellow-400 text-yellow-400 bg-yellow-400/10"
              : "border-white/20 text-white/60 hover:border-white/40"
          }`}
        >
          {isBuilderMode ? "Builder Mode ON" : "Builder Mode"}
        </button>
        {stars.length > 0 && (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider border border-primary text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
          >
            Save
          </button>
        )}
      </div>
      
      {/* Instructions */}
      {isBuilderMode && stars.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-[10px] font-tech text-white/40">
            Click anywhere to place stars. Click two stars to connect them with a line.
          </p>
        </div>
      )}
    </div>
  );
}
