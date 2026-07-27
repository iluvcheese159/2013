/* eslint-disable */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import StarryBackground from "@/components/StarryBackground";

export const markIntroSeen = () => {
  try { localStorage.setItem("pf_intro_seen", "1"); } catch (_e) {}
};

const FEATURED_STARS = [
  {
    id: 1,
    x: 30,
    y: 25,
    size: 3,
    text: "Design your own 3D-printable creations right in your browser",
  },
  {
    id: 2,
    x: 70,
    y: 45,
    size: 2.5,
    text: "Buy prints made by real makers",
  },
  {
    id: 3,
    x: 45,
    y: 70,
    size: 3.5,
    text: "Sell what you create",
  },
];

export default function Intro() {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const [currentStar, setCurrentStar] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  const advanceToNext = () => {
    if (currentStar < FEATURED_STARS.length - 1) {
      setCurrentStar(currentStar + 1);
    } else {
      // Show buttons after last star
      setIsVisible(true);
    }
  };

  const continueAsGuest = () => {
    markIntroSeen();
    navigate("/");
  };

  const openSignUp = () => {
    markIntroSeen();
    openAuth("signup");
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isVisible) return;
    
    autoAdvanceRef.current = setInterval(() => {
      advanceToNext();
    }, 5000);

    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [currentStar, isVisible]);

  // Scroll-based advancement
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) return;
      
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const progress = scrollY / (windowHeight * FEATURED_STARS.length);
      const newStar = Math.min(Math.floor(progress * FEATURED_STARS.length), FEATURED_STARS.length - 1);
      
      if (newStar !== currentStar) {
        setCurrentStar(newStar);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentStar, isVisible]);

  const currentFeaturedStar = FEATURED_STARS[currentStar];

  return (
    <div 
      ref={containerRef}
      data-testid="intro-page" 
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ height: `${(FEATURED_STARS.length + 1) * 100}vh` }}
    >
      {/* Starry background */}
      <StarryBackground 
        starCount={200} 
        variationSeed={Date.now()}
        className="fixed inset-0"
      />

      {/* Featured star with halo and text */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute transition-all duration-1000 ease-in-out"
          style={{
            left: `${currentFeaturedStar.x}%`,
            top: `${currentFeaturedStar.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Glowing halo */}
          <div
            className="absolute rounded-full bg-white/20 blur-xl transition-all duration-1000 ease-in-out"
            style={{
              width: `${currentFeaturedStar.size * 20}px`,
              height: `${currentFeaturedStar.size * 20}px`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          
          {/* The star itself */}
          <div
            className="absolute rounded-full bg-white transition-all duration-1000 ease-in-out"
            style={{
              width: `${currentFeaturedStar.size}px`,
              height: `${currentFeaturedStar.size}px`,
            }}
          />

          {/* Text callout */}
          <div
            className="absolute left-8 top-1/2 -translate-y-1/2 max-w-xs transition-all duration-1000 ease-in-out opacity-0 scale-95"
            style={{
              animation: "fadeInUp 0.8s ease-out forwards",
              animationDelay: "0.3s",
            }}
          >
            <p className="text-white/90 text-sm md:text-base font-light leading-relaxed">
              {currentFeaturedStar.text}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons (shown after last star) */}
      {isVisible && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-4 items-center justify-center pointer-events-auto transition-all duration-1000 ease-in-out">
          <Button
            onClick={continueAsGuest}
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-tech text-xs uppercase tracking-wider backdrop-blur-sm"
            data-testid="continue-guest-btn"
          >
            Continue as Guest
          </Button>
          <Button
            onClick={openSignUp}
            size="lg"
            className="bg-white text-black hover:bg-white/90 rounded-xl font-tech text-xs uppercase tracking-wider"
            data-testid="signup-btn"
          >
            Sign Up / Sign In
          </Button>
        </div>
      )}

      {/* Skip button */}
      {!isVisible && (
        <button
          onClick={() => {
            if (autoAdvanceRef.current) {
              clearInterval(autoAdvanceRef.current);
            }
            setIsVisible(true);
          }}
          className="fixed top-6 right-6 z-50 text-white/50 hover:text-white transition-colors text-[10px] font-tech uppercase tracking-wider"
          data-testid="skip-intro-btn"
        >
          Skip
        </button>
      )}
    </div>
  );
}
