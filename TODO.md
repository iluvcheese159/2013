# Print Cosmos — Visual Polish Task

## Goal
Fix star sizing, add proper Milky Way + blurred backdrop layering, improve the intro campfire scene with Bob visibility, and smooth all word/text transitions.

## Steps

### 1. Star Sizing & Visuals
- [x] 1.1 `StarfieldRenderer.jsx` — clamp sizes (0.35–1.8px), reduce opacity, thin Milky Way band, subtle glow only for larger stars
- [x] 1.2 `Intro.jsx` `generateMilkyWayStars` — clamp sizes (0.2–1.8px), lower brightness, reduce glow
- [x] 1.3 `ListingStar.jsx` — scale down dot (8→6px base), reduce glow spreads, image card 96→80px

### 2. Background Layering (Milky Way & Blur)
- [x] 2.1 `index.css` — add `cosmic-blur` backdrop overlay utility + soft vignette, smooth `twinkle`
- [x] 2.2 `Intro.jsx` — dedicated deepest Milky Way layer + blurred backdrop layer between stars and text/UI
- [x] 2.3 `Browse.jsx` — blurred backdrop layer behind content/title sections

### 3. Intro Animation & Bob
- [x] 3.1 `IntroBob.jsx` — white-line stick figure (stroke #ffffff)
- [x] 3.2 `CampfireScene.jsx` — render Bob sitting by the fire
- [x] 3.3 `Intro.jsx` — extend phase timing (campsite ~7s, camera-up ~4.5s) so Bob + campfire are visible

### 4. Smooth Word/Text Transitions
- [x] 4.1 `Intro.jsx` — text crossfade on facet change, softer easings
- [x] 4.2 `index.css` — cubic-bezier easing on fade-in-up/fadeIn, text crossfade keyframes

### 5. Verify
- [x] 5.1 `npm run build` passes (479.29 kB JS, 18.85 kB CSS)

