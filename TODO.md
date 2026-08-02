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

---

# Print Cosmos — Design Function Fix (3D Editor)

## Goal
Fix the design function in `frontend/src/pages/Editor.jsx`: 360° orbit not working, shapes disappearing, and the transform gizmo ("coordinate things") blocking shape usage.

## Steps

### 1. Restore 360° orbit controls
- [x] 1.1 Remove custom click-drag-move handler that hijacked left-drag and disabled OrbitControls
- [x] 1.2 Click-to-select with a drag threshold so orbiting never clears selection
- [x] 1.3 Keep TransformControls gizmo as the only way to move/rotate/scale shapes

### 2. Fix shapes disappearing
- [x] 2.1 Remove phantom default-box seed for saved designs (only open template picker for new)
- [x] 2.2 Mark loaded geometry as `skipHistory` so undo can't revert to an empty/phantom state
- [x] 2.3 Explicitly set `objects([])` when a saved design has no geometry
- [x] 2.4 Guard `idCounter` against non-numeric ids (NaN prevention)
- [x] 2.5 Add debounced autosave (1.2s) + autosave indicator so work survives leaving the editor

### 3. Stop coordinate gizmo from blocking
- [x] 3.1 Wrap `onSelect` / `toggleWorkplane` in `useCallback` (prevents full scene rebuild on every render)
- [x] 3.2 Only `transform.attach()` when the gizmo isn't already on the mesh (no re-attach mid-drag)
- [x] 3.3 Shrink the gizmo (`transform.setSize(0.7)`)
- [x] 3.4 `Escape` to deselect
- [x] 3.5 Fix `applySnap` division-by-zero when Snap = Off (shapes flying to Infinity)

### 4. Verify
- [x] 4.1 `npm run build` passes

