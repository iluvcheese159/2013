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
- [ ] 4.1 Lint/build check
- [ ] 4.2 Final review of changed files

