# Print Cosmos — PRD

## Original Problem Statement
Build a website where users can sell 3D-printed items. The platform takes a percentage of each sale (set to **3.5%**). The product is a hybrid of:
- **Thingiverse** — share 3D designs
- **Tinkercad** — design 3D objects in a simple in-browser editor
- **eBay** — list and sell physical items, only for 3D-printed items

The landing page introduces the platform; the top nav has tabs to Browse or Design; the top-right has Sign in / Sign up (Google) and a Become a Seller CTA. **Users can also Become a Creator** (publish designs). Before finalizing a listing, the seller can choose to share or not share their design files.

## User-Confirmed Choices (2026-02)
- Auth: **Emergent-managed Google Auth**
- 3D editor: **Both** — upload STL/OBJ + simple in-browser editor (cube/sphere/cylinder, transform, color)
- Payments: Stripe (test mode) with **3.5%** commission
- File storage: **Emergent Object Storage** (yes)
- Design: minimalist, **dark black + purple**, theme toggle for users

## Architecture
- **Backend**: FastAPI on 8001, MongoDB, single `/app/backend/server.py`.
  - Auth: Emergent Google OAuth (`/api/auth/session`, `/api/auth/me`, `/api/auth/logout`).
  - Roles: `is_seller`, `is_creator` (POST `/api/auth/become-seller`, `/api/auth/become-creator`).
  - Storage: Emergent Object Storage via `emergentintegrations` (`/api/upload`, `/api/files/{path}`).
  - Marketplace: `/api/listings`, `/api/listings/{id}`, `/api/seller/listings`.
  - Designs (Thingiverse-style): `/api/designs`, `/api/designs/{id}`, `/api/seller/designs`.
  - Payments: Stripe Checkout via `emergentintegrations.payments.stripe.checkout` (`/api/checkout/session`, `/api/checkout/status/{id}`, `/api/webhook/stripe`).
- **Frontend**: React 19 + CRA + Tailwind + shadcn/ui.
  - Routes: `/`, `/browse`, `/listing/:id`, `/designer`, `/designs`, `/dashboard`, `/create`, `/checkout/success`.
  - 3D: vanilla **three.js** (in `useEffect`) — avoids visual-edits Babel plugin incompatibility with @react-three/fiber.
  - Theme: dark default, optional light, controlled via `<ThemeToggle />`.
  - Typography: Chivo (display), Work Sans (body), Space Mono (technical).

## User Personas
1. **Maker / Seller** — designs or sources 3D models, prints them at home, lists finished prints for sale.
2. **Creator** — shares STL/scenes built in the in-browser designer with the community.
3. **Buyer** — browses, previews 3D models, buys finished prints via Stripe.

## Roles
- Visitor — browse listings, view community designs.
- Authenticated user — save designs, become creator/seller.
- Creator (`is_creator`) — publishes designs to community.
- Seller (`is_seller`) — publishes paid listings.
A user may be both.

## What's been implemented (2026-02)
- Landing page (hero, three pillars, how-it-works, CTA).
- Browse with search + category filter chips.
- Listing detail with image gallery, 3D preview (STL/OBJ), Stripe buy flow, 3.5% fee breakdown.
- In-browser 3D Designer (vanilla three.js): cube/sphere/cylinder primitives, position/rotation/scale via inputs and step buttons, color picker, OrbitControls, save to community.
- Community designs page.
- Create Listing flow: title/description/price/category, image upload, STL/OBJ upload, "share design files" toggle, live earnings preview (3.5% fee).
- Seller dashboard: KPI tiles (listings/sales/revenue/fees), listings table, shared designs grid.
- Emergent Google Auth with `/api/auth/session` + cookie + AuthCallback route handler.
- Emergent Object Storage upload/download.
- Stripe test-mode checkout + status polling + payment_transactions ledger.
- **Become a Seller** and **Become a Creator** buttons in header; auto-promotion when posting a listing/design.
- Dark + purple minimalist theme, with light theme available.
- **[2026-02] Editor free-drag, pinch-zoom, right-click orbit**: Left-click drag on a shape now moves it freely along the ground plane (no need to grab TransformControls arrows). Two-finger pinch zooms (touch DOLLY_PAN). Right-click drag orbits and native context menu is suppressed. Fixed pre-existing three.js r169 TransformControls compat bug via `getHelper()`.
- **[2026-02] Rigid mascot system fully removed** per user request. Deleted RigidMascot.jsx, RigidMascotTour.jsx, RigidWarningGate.jsx, sprite SVG, all imports/usages in App.js/Browse/Forums, mascot references in Terms (Section 5 renamed to "Moderation & Enforcement"), and .rigid-mascot-* CSS classes. Backend endpoints (/api/launch-tour/complete, /api/enforcement/acknowledge) left dormant.

## Prioritized Backlog
**P1**
- Buyer order history page (`/orders`).
- Listing edit + soft-delete.
- Seller payout dashboard once Stripe Connect or manual payout is wired.
- Designs detail page with remix/fork action.

**P2**
- Collaborators on designs (multi-user authorship).
- Reviews & ratings on listings.
- Shipping address + tracking number entry.
- Search ranking by sales / recency hybrid.
- Apple Sign-in (requires paid Apple Developer account).
- Email notifications (Resend) for orders & purchases.

## Next Action Items
- Group chats UI (backend exists; wire multi-participant frontend).
- Drag-handles on 3D objects to scale L/W/H visually (Tinkercad parity beyond current TransformControls scale mode).
- Wire `/orders` page (buyer + seller view) using `payment_transactions`.
- Add edit/delete on `/dashboard` listings.
- Image lightbox on listing detail.
- Hole/Group boolean cutting operations in 3D Designer.
- Interactive sidebar hover animations (shapes jumping out of cart icon).
