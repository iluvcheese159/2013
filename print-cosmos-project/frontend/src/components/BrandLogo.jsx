import { useEffect, useState } from "react";

export const DARK_THEME_LOGO_URL = "https://www.image2url.com/r2/default/images/1783620169402-d4dfca71-5220-471b-a917-79c1b0ae1158.png";
export const LIGHT_THEME_LOGO_URL = "https://www.image2url.com/r2/default/images/1783750967949-ac05222d-f45f-45dc-9f13-09c9187185f1.png";
const LIGHT_THEME_STYLE = {
  backgroundColor: "#ffffff",
};
const DARK_THEME_STYLE = {
  backgroundColor: "#000000",
};

export default function BrandLogo({ alt, className = "", hoverScale = false }) {
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    return !root.classList.contains("dark");
  });

  useEffect(() => {
    const syncTheme = () => {
      const root = document.documentElement;
      setIsLightTheme(!root.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncTheme);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  return (
    <img
      src={isLightTheme ? LIGHT_THEME_LOGO_URL : DARK_THEME_LOGO_URL}
      alt={alt}
      className={`${className} ${hoverScale ? "group-hover:scale-105 transition-transform" : ""}`.trim()}
      style={isLightTheme ? LIGHT_THEME_STYLE : DARK_THEME_STYLE}
    />
  );
}
