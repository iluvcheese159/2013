# Print Cosmos — Intro Scene Visual Fixes

## Goal
Fix the intro scene: trees at the bottom are cut off after Bob looks up, the campsite (phase 0) forest/ground doesn't span the full width, and the star-field zoom transition is laggy/unstable.

## Steps

### 1. Phase 0 — Campsite forest spans the whole bottom
- [x] 1.1 `frontend/src/pages/Intro.jsx` — render full-width `<TreeSilhouettes>` (brown ground + grass + pines) behind `<CampfireScene>` so the forest spans the entire bottom of the screen.

### 2. Phase 1 — Camera pan keeps trees anchored (fixes "trees cut off")
- [x] 2.1 `frontend/src/pages/Intro.jsx` — restore the `camera-drift` container with `<TreeSilhouettes opacity={0.7}>` and the "Look up at the stars..." text while the campsite fades out, so the forest never disappears mid-pan.

### 3. Star-field zoom stability
- [x] 3.1 `frontend/src/pages/Intro.jsx` — add `willChange: "transform"` and use `scale3d(3)` (down from 4) on the zoom container; shorten transition timing (in ~1.8s, out ~1s).
- [x] 3.2 `frontend/src/pages/Intro.jsx` — render the star canvas at devicePixelRatio × 2 headroom so it stays crisp while CSS-zoomed.
- [x] 3.3 `frontend/src/pages/Intro.jsx` — defer the frosted blur layer until the zoom-in settles (`blurReady` state) to reduce GPU compositing cost.

### 4. Verify
- [x] 4.1 `npm run build` passes in `frontend/` (Compiled successfully; 481.78 kB JS, 18.88 kB CSS).

