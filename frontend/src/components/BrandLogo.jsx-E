export const DARK_THEME_LOGO_URL = "https://www.image2url.com/r2/default/images/1783620169402-d4dfca71-5220-471b-a917-79c1b0ae1158.png";
const DARK_THEME_STYLE = {
  backgroundColor: "#000000",
};

export default function BrandLogo({ alt, className = "", hoverScale = false, style }) {
  return (
    <img
      src={DARK_THEME_LOGO_URL}
      alt={alt}
      className={`${className} ${hoverScale ? "group-hover:scale-105 transition-transform" : ""}`.trim()}
      style={{ ...DARK_THEME_STYLE, ...style }}
    />
  );
}
