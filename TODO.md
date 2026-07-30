# Implementation Plan - COMPLETED

## Issues Fixed

### 1. Remove Apple Sign-in ✅
- Removed Apple button JSX from `AuthModal.jsx`
- Removed `appleNotice` function
- Removed `AppleIcon` component

### 2. Fix Browse.jsx Crash (`TypeError: n is not a function`) ✅
- Fixed `Snow-coveredEvergreen` → `SnowCoveredEvergreen` in `DaytimeScene.jsx` (3 occurrences)
- The hyphenated JSX was being parsed as a subtraction expression, causing `Snow` to be undefined

### 3. Fix Star Instability (disappearing/reappearing) ✅
- Removed `transform: scale()` from star field container in `Browse.jsx` (caused position shifts)
- Rewrote `ListingStar.jsx` to render both dot and card layers simultaneously with smooth opacity transitions instead of hard conditional rendering
- Added `transition-opacity duration-500` for smooth fade between dot and card states

### 4. Fix Intro/Bob Not Showing ✅
- Rewrote `HomeOrIntro` in `App.js` to use proper `useState`/`useEffect` pattern
- Added loading state to prevent flash of wrong content
- Fixed duplicate `useEffect` import

### 5. Fix Design Function Instability ✅
- Star zoom/click interaction now uses smooth opacity transitions instead of hard toggles
- Both dot and card layers are always rendered, just faded in/out
- Removed scale transform that was causing position shifts during zoom

### 6. Ambient Auto-Interactions (NEW) ✅
- **Auto-zoom breathing**: Stars slowly zoom in/out on their own (~12s cycle)
- **Auto-pan drift**: Starfield gently drifts in a circular motion (~30s cycle)
- **Auto-star pulses**: Each star gets a periodic glow boost every 8-16 seconds
- **Smart pause**: Auto-effects pause for 3 seconds when user interacts (scroll, pan, click)
- **File**: `frontend/src/pages/Browse.jsx` — Added `useAmbientInteractions` hook
- **File**: `frontend/src/components/ListingStar.jsx` — Added `ambientPulse` state with staggered timing per star
