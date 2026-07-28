/* eslint-disable */
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

export const markIntroSeen = () => {
  try { localStorage.setItem("pf_intro_seen", "1"); } catch (_e) {}
};

function StarsBackground({ stars, opacity }) {
  if (!stars) return null;
  var o = opacity !== undefined ? opacity : 1;
  return React.createElement("div", { className: "absolute inset-0 overflow-hidden" },
    stars.map(function(s) {
      return React.createElement("div", {
        key: s.id,
        className: "absolute rounded-full",
        style: {
          left: s.x + "%",
          top: s.y + "%",
          width: s.size + "px",
          height: s.size + "px",
          backgroundColor: s.color,
          opacity: (s.opacity || 0) * o,
          animation: "twinkle " + s.twinkleSpeed + "s ease-in-out infinite " + s.twinklePhase + "s"
        }
      });
    })
  );
}

function generateDenseStars(count, seed) {
  var stars = [];
  var s = seed;
  var r = function() { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (var i = 0; i < count; i++) {
    var x = r() * 100;
    var y = r() * 100;
    var size = 0.5 + r() * 3;
    var brightness = 0.2 + (size / 3.5) * 0.7;
    stars.push({
      id: i, x: x, y: y, size: size,
      opacity: brightness,
      color: "rgb(240,245,255)",
      twinkleSpeed: 2 + r() * 5,
      twinklePhase: r() * Math.PI * 2,
    });
  }
  return stars;
}

var BENEFITS = [
  { id: "design", label: "Design", col: "#fbbf24", title: "Design printable models in your browser \u2014 no install needed", desc: "Create, edit, and prepare your models for printing directly in your browser. Supports STL, OBJ, and 3MF." },
  { id: "browse", label: "Discover", col: "#60a5fa", title: "Discover unique prints from independent makers worldwide", desc: "Browse a curated marketplace of thousands of 3D-printed creations. Filter by category, material, and print time." },
  { id: "sell", label: "Sell", col: "#f472b6", title: "Launch your storefront with 3.5% fees", desc: "Become a maker-entrepreneur. List your prints, set prices, and ship worldwide. Upgrade to Hyperspace for 2% fees." },
];

function IntroScene0() {
  return React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" },
    React.createElement("p", { className: "text-white/30 text-xs font-tech uppercase tracking-[0.4em]" }, "A quiet night in the cosmos...")
  );
}

function IntroScene1() {
  return React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" },
    React.createElement("p", { className: "text-white/50 text-lg font-tech uppercase tracking-[0.3em]" }, "Print Cosmos")
  );
}

function IntroScene2({ onStarClick, onScrollHint }) {
  return React.createElement("div", { className: "absolute inset-0" },
    React.createElement("div", { className: "absolute bottom-[10%] left-1/2 -translate-x-1/2 text-center" },
      React.createElement("p", { className: "text-white/30 text-[10px] font-tech uppercase tracking-[0.3em]" }, "Click a star or scroll to explore")
    )
  );
}

function IntroScene3({ benefit }) {
  if (!benefit) return null;
  return React.createElement("div", { className: "absolute inset-0 flex items-center justify-center px-6" },
    React.createElement("div", { className: "max-w-lg text-center" },
      React.createElement("div", {
        className: "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center",
        style: { backgroundColor: benefit.col, boxShadow: "0 0 40px 10px " + benefit.col + "66" }
      }),
      React.createElement("div", { className: "text-[10px] font-tech uppercase tracking-[0.4em] text-white/60 mb-3", style: { color: benefit.col } },
        "\u2722 " + benefit.label
      ),
      React.createElement("h2", { className: "font-display text-3xl md:text-4xl font-light tracking-tighter leading-tight mb-4 text-white" },
        benefit.title
      ),
      React.createElement("p", { className: "text-sm text-white/60 leading-relaxed max-w-md mx-auto" },
        benefit.desc
      )
    )
  );
}

function IntroScene4({ onGuest, onSignUp }) {
  return React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-10" },
    React.createElement("div", { className: "mb-8" },
      React.createElement(BrandLogo, { alt: "Print Cosmos", className: "h-16 md:h-20 w-auto object-contain" })
    ),
    React.createElement("p", { className: "text-white/50 text-xs font-tech uppercase tracking-[0.4em] mb-10" }, "Design. Print. Sell."),
    React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 items-center" },
      React.createElement(Button, {
        onClick: onGuest,
        variant: "outline",
        size: "lg",
        className: "bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl font-tech text-xs uppercase tracking-wider backdrop-blur-sm px-8",
        "data-testid": "continue-guest-btn"
      }, "Continue as Guest"),
      React.createElement(Button, {
        onClick: onSignUp,
        size: "lg",
        className: "bg-white text-black hover:bg-white/90 rounded-xl font-tech text-xs uppercase tracking-wider px-8",
        "data-testid": "signup-btn"
      }, "Sign Up / Sign In")
    )
  );
}

export default function Intro() {
  var navigate = useNavigate();
  var { user, openAuth } = useAuth();
  var [phase, setPhase] = useState(0);
  var [benefitIdx, setBenefitIdx] = useState(0);
  var stars = useMemo(function() { return generateDenseStars(200, 42); }, []);
  var timers = useRef([]);

  useEffect(function() {
    var t1 = setTimeout(function() { setPhase(1); }, 1500);
    var t2 = setTimeout(function() { setPhase(2); }, 3000);
    timers.current = [t1, t2];
    return function() {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  var handleInteract = useCallback(function() {
    if (phase === 2) {
      if (benefitIdx < BENEFITS.length) {
        setPhase(3);
        var t = setTimeout(function() {
          if (benefitIdx + 1 >= BENEFITS.length) {
            setPhase(4);
          } else {
            setBenefitIdx(function(i) { return i + 1; });
            setPhase(2);
          }
        }, 4000);
        timers.current.push(t);
      } else {
        setPhase(4);
      }
    }
  }, [phase, benefitIdx]);

  useEffect(function() {
    var handler = function(e) {
      if (e.deltaY > 0) handleInteract();
    };
    window.addEventListener("wheel", handler, { passive: false });
    return function() { window.removeEventListener("wheel", handler); };
  }, [handleInteract]);

  var handleGuest = function() { markIntroSeen(); navigate("/"); };
  var handleSignUp = function() { markIntroSeen(); openAuth("signup"); };

  return React.createElement("div", { "data-testid": "intro-page", className: "fixed inset-0 bg-black overflow-hidden" },
    React.createElement(StarsBackground, { stars: stars, opacity: phase >= 1 ? 1 : 0 }),

    phase === 0 ? React.createElement("div", { className: "absolute inset-0", style: { animation: "fadeIn 2s ease-out" } },
      React.createElement(IntroScene0, null)
    ) : null,

    phase === 1 ? React.createElement("div", { className: "absolute inset-0", style: { animation: "fadeIn 1.5s ease-out" } },
      React.createElement(IntroScene1, null)
    ) : null,

    phase === 2 ? React.createElement("div", { className: "absolute inset-0", style: { animation: "fadeIn 1s ease-out" } },
      React.createElement(IntroScene2, { onStarClick: handleInteract }),
      BENEFITS.map(function(b, i) {
        var size = 6 + i * 2;
        var positions = [
          { left: "25%", top: "30%" },
          { left: "65%", top: "40%" },
          { left: "45%", top: "65%" }
        ];
        var pos = positions[i] || { left: "50%", top: "50%" };
        return React.createElement("button", {
          key: b.id,
          className: "absolute pointer-events-auto cursor-pointer transition-all duration-500 hover:scale-150",
          style: {
            left: pos.left,
            top: pos.top,
            transform: "translate(-50%,-50%)",
            opacity: benefitIdx === i ? 0.4 : 1
          },
          onClick: function() { setBenefitIdx(i); handleInteract(); }
        },
          React.createElement("div", {
            className: "rounded-full",
            style: {
              width: size + "px",
              height: size + "px",
              backgroundColor: b.col,
              boxShadow: "0 0 " + (size * 2) + "px " + b.col,
              animation: "pulse 2s ease-in-out infinite"
            }
          })
        );
      })
    ) : null,

    phase === 3 ? React.createElement("div", { className: "absolute inset-0", style: { animation: "fadeIn 0.5s ease-out" } },
      React.createElement(IntroScene3, { benefit: BENEFITS[benefitIdx] })
    ) : null,

    phase === 4 ? React.createElement("div", { className: "absolute inset-0", style: { animation: "fadeIn 1s ease-out" } },
      React.createElement(IntroScene4, { onGuest: handleGuest, onSignUp: handleSignUp })
    ) : null,

    phase >= 1 && phase < 4 ? React.createElement("button", {
      onClick: function() { setPhase(4); },
      className: "fixed top-6 right-6 z-50 text-white/40 hover:text-white/80 transition-colors text-[10px] font-tech uppercase tracking-wider",
      "data-testid": "skip-intro-btn",
      style: { animation: "fadeIn 1s ease 1s both" }
    }, "Skip") : null
  );
}
