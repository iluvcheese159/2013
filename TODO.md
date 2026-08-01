# Print Cosmos — Ambient Interactivity Plan

## Goal
Make the Browse page feel more natural and interactive, then bring the same life to every page in the app.

## Steps

### Phase 1 — Browse polish
- [x] 1.1 Add "click empty sky → sparkle burst" at cursor (cosmic dust feedback)
- [x] 1.2 Add subtle aurora/nebula backdrop layer that pulses behind starfield
- [x] 1.3 Make Bob wave on click + gentle idle wander using existing `bob-wander` keyframe

### Phase 2 — Shared ambient toolkit
- [x] 2.1 Create `src/hooks/useAmbientLife.js` — deterministic random ambient animation styles
- [x] 2.2 Create `src/components/AmbientFX.jsx` — FloatingParticles, SparkleField, RevealOnScroll, TiltCard, KenBurns

### Phase 3 — Apply interactivity to every page
- [x] 3.1 `index.css` — add any missing keyframes/utilities
- [x] 3.2 `Home.jsx` — hero sparkles, RevealOnScroll sections, TiltCard cards
- [x] 3.3 `Forums.jsx` — SparkleField, TiltCard post cards, RevealOnScroll
- [x] 3.4 `Cart.jsx` — SparkleField, RevealOnScroll cart items
- [x] 3.5 `Profile.jsx` — RevealOnScroll sections, TiltCard badges/listings
- [x] 3.6 `Collections.jsx` — TiltCard collection cards
- [x] 3.7 `Boards.jsx` — TiltCard board cards
- [x] 3.8 `Wishlists.jsx` — TiltCard wish cards
- [x] 3.9 `Compare.jsx` — TiltCard comparison cards
- [x] 3.10 `Purchases.jsx` — TiltCard order cards
- [x] 3.11 `ListingDetail.jsx` — SparkleField, RevealOnScroll panels, TiltCard recipes
- [x] 3.12 `Designs.jsx` — TiltCard design cards
- [x] 3.13 `MyDesigns.jsx` — TiltCard design tiles
- [x] 3.14 `Docs.jsx` — RevealOnScroll sections
- [x] 3.15 `Terms.jsx` — RevealOnScroll sections
- [x] 3.16 `Privacy.jsx` — RevealOnScroll sections
- [x] 3.17 `FilamentCalculator.jsx` — SparkleField, TiltCard
- [x] 3.18 `PrintFailure.jsx` — TiltCard failure cards
- [x] 3.19 `Inspiration.jsx` — KenBurns slow zoom on background
- [x] 3.20 `Pro.jsx` — RevealOnScroll perk cards
- [x] 3.21 `Dashboard.jsx` — SparkleField, TiltCard stat boxes
- [x] 3.22 `Messages.jsx` — subtle RevealOnScroll message bubbles

### Phase 4 — Verify
- [x] 4.1 Lint/build check — `npm run build` passes (fixed unbalanced `<button>` JSX in Forums.jsx post cards)
- [x] 4.2 Final review of changed files — AmbientFX/useAmbientLife confirmed; FilamentCalculator + Purchases JSX verified balanced
- [x] 4.3 ListingDetail.jsx — SparkleField + FloatingParticles added to both returns (loading + main), ambient CSS classes (rise-in, auto-float, auto-glow-pulse, ambient-drift) already present
- [x] 4.4 Inspiration.jsx — SparkleField + FloatingParticles added to all three returns (loading, empty, main)
- [x] 4.5 Messages.jsx — SparkleField + FloatingParticles confirmed present in both returns
- [x] 4.6 Final build — `npm run build` passes with ambient interactivity on all pages

### Phase 5 — Post-feedback polish
- [x] 5.1 Remove "Documentation" section from Sidebar (already done — no `/docs` entry in NAV)
- [x] 5.2 Remove "Documentation" section from Footer component
- [x] 5.3 Remove `/docs` link from Home.jsx footer
- [x] 5.4 Remove `/docs` route from App.js + remove unused Docs import
- [x] 5.5 Make intro start immediately on page load — `HomeOrIntro` shows intro on first-session visit via `requestAnimationFrame`, no `checking` delay
- [x] 5.6 Rework loading animation — 40 floating particles (4 colors, varied shapes), 3 shooting stars with meteor-tail, larger 3D CosmosLoader (88px), animated "LOADING" text with letter-by-letter pulse, shimmer progress bar, corner decorative elements
- [x] 5.7 Final build verification — `npm run build` compiles successfully (478.84 kB JS, 18.27 kB CSS)

