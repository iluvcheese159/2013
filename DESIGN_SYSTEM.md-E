# Print Cosmos — Design System Reference

> This document is derived entirely from what already exists in the codebase.
> Nothing here is aspirational. Every rule below is already the de-facto standard —
> this document makes it explicit so future work stays consistent.

---

## 1. Typography

Three fonts are loaded from Google Fonts (`index.css`). Each has a strict role.

### Fonts

| Token | Family | Role |
|---|---|---|
| `font-display` | Chivo | Page headings, card titles, dialog titles, prices |
| `font-body` | Work Sans | Default body text — set on `html`/`body`, used implicitly everywhere |
| `font-tech` | Space Mono | Labels, badges, buttons, metadata, all-caps UI chrome |

### Type scale in use

| Size | Class | Typical use |
|---|---|---|
| 9px | `text-[9px]` | Micro-labels, badge text, image counters |
| 10px | `text-[10px]` | Section eyebrows, metadata rows, tab labels |
| 12px | `text-xs` | Secondary body, button text, nav links |
| 14px | `text-sm` | Primary body copy, form inputs |
| 16px | `text-base` | Card titles, sub-headings |
| 18px | `text-lg` | Minor headings |
| 20px | `text-xl` | Section headings (e.g. dialog titles) |
| 24px | `text-2xl` | Section headings, stat numbers |
| 30px | `text-3xl` | Page sub-headings |
| 36–48px | `text-4xl` / `text-5xl` | Hero headings |
| 60px+ | `text-6xl` | Home hero only |

### Heading style

All headings use `font-display` (Chivo) with `tracking-tighter` (`letter-spacing: -0.025em`)
and `font-light` (weight 300) for large display sizes. Smaller headings use `font-medium` (500).

```
// Large hero
font-display text-4xl sm:text-5xl font-light tracking-tighter

// Section heading
font-display text-2xl font-medium tracking-tight

// Dialog / card title
font-display text-xl font-medium tracking-tight
```

### Tech label style

The small all-caps labels seen throughout the app follow one pattern:

```
text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground
```

Eyebrow labels (above a heading) use slightly wider tracking:

```
text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground
```

The leading `● ` dot in eyebrow labels uses `text-primary` to add a colour accent.

---

## 2. Colour Tokens

Defined in `index.css` as CSS custom properties, consumed via Tailwind.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | white | `#080808` | Page background |
| `foreground` | `#121212` | `#f5f5f5` | Default text |
| `card` | white | `#0f0f0f` | Card surfaces |
| `primary` | purple `270 91% 65%` | purple `270 91% 70%` | CTAs, active states, accents |
| `accent` | light purple `265 84% 78%` | same | Secondary highlights |
| `muted-foreground` | 40% grey | 55% grey | Metadata, placeholders |
| `border` | 90% grey | 13% grey | All dividers and outlines |
| `destructive` | red `0 84% 60%` | red `0 62% 50%` | Delete, report, error |

**Never use raw hex values for these roles.** Use the token. The one exception is the
amber sale/highlight colour `#F59E0B` / `text-primary` (Tailwind `amber-500`) which
appears in sale badges and the Bob/tent scene — it is intentional and consistent.

---

## 3. Buttons

The shared `Button` component (`components/ui/button.jsx`) uses `rounded-xl` as its
base corner radius. All size variants inherit this.

### Variants

| Variant | Background | Use |
|---|---|---|
| `default` | `bg-primary` | Primary CTA — buy, save, publish |
| `outline` | transparent + `border-input` | Secondary actions — cancel, back, follow |
| `destructive` | `bg-destructive` | Delete, report, unlist |
| `ghost` | transparent | Toolbar actions, nav items |
| `secondary` | `bg-secondary` | Tertiary, low-emphasis |
| `link` | transparent + underline | Inline text links |

### Sizes

| Size | Height | Use |
|---|---|---|
| `sm` | `h-8` | Compact toolbar, top-bar actions |
| `default` | `h-9` | Standard form buttons |
| `lg` | `h-10` | Primary page CTAs (buy, checkout) |
| `icon` | `h-9 w-9` | Square icon-only buttons |

### Button text style

All button labels use `font-tech text-xs uppercase tracking-wider` — this is applied
manually at the call site, not baked into the component. Always apply it.

---

## 4. Cards

Cards use a consistent no-hard-border, shadow-based style:

```
rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow
```

- Corner radius: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inner elements
- No explicit `border` on the card itself — the shadow provides depth
- Hover lifts the shadow: `shadow-sm` → `shadow-lg`
- Image inside a card: `group-hover:scale-105 transition-transform duration-500`

The `Card` component from `components/ui/card.jsx` uses `rounded-xl border bg-card shadow`
(12px radius, with border). Prefer the manual pattern above for listing/product cards;
use the `Card` component for structured data panels (settings, specs, dialogs).

---

## 5. Spacing & Border Radius

### Corner radius hierarchy

| Radius | Tailwind | Use |
|---|---|---|
| `rounded-full` | 9999px | Pills, avatars, category filter chips, sky-mode toggle |
| `rounded-2xl` | 16px | Cards, containers, search bar wrapper |
| `rounded-xl` | 12px | Buttons, inputs, badges, inner card elements, dialogs |
| `rounded-lg` | 8px | Not used — skip this step |
| `rounded-md` | 6px | Not used — skip this step |

The CSS variable `--radius: 0.25rem` in the theme is the Radix/shadcn base — it is
overridden at the component level everywhere. Do not use `rounded` or `rounded-sm`.

### Page padding

| Breakpoint | Horizontal padding |
|---|---|
| Mobile | `px-6` |
| Tablet | `md:px-12` |
| Desktop | `lg:px-24` |

Vertical section padding: `py-10` standard, `py-6` compact.

---

## 6. Icons

**Library: `lucide-react`** — used exclusively throughout the app.

Standard icon size: `h-4 w-4` (16px). Toolbar/compact: `h-3.5 w-3.5` (14px).
Large decorative: `h-8 w-8` or `h-10 w-10`.

`strokeWidth` is left at the Lucide default (2) unless explicitly reduced to `1.5`
for decorative/large icons.

### Custom-built icons (not from Lucide)

Three components contain hand-drawn SVG art — do not replace these with Lucide equivalents:

- `Bob.jsx` — the 3D-printed stick figure character (default, Pro cape, sleeping, lawn chair variants)
- `WireframeCube.jsx` — rotating CSS 3D wireframe cube used in empty states
- `EmptyConstellation.jsx` — blank sky with moon and scattered stars for empty states
- `DaytimeScene.jsx` — sun, clouds, Earth SVG for the day-mode Browse background
- `TentScene.jsx` — campfire tent scene with fireflies and grass

Badge icons inside `UserBadges.jsx` are also inline SVG (the star/rising-creator shapes
that don't exist in Lucide).

---

## 7. Badge System

Defined in `components/UserBadges.jsx`.

### Two badge categories

**Main badges** — earned by activity, shown inline next to a username:

| Badge | Trigger |
|---|---|
| `platform_owner` | `user.is_platform_owner` |
| `pro_subscriber` | `user.is_pro` |
| `top_seller` | 50+ sales |
| `verified_seller` | 5-star avg, 5–8 listings |
| `community_star` | 10+ forum upvotes across 3–8 posts |
| `featured_designer` | curated design |
| `certified_service` | verified service + 4.5+ rating |
| `top_designer` | design score ≥ 80 |
| `rising_creator` | account < 90 days + high recent activity |

**Milestone badges** — earned by tenure/sales, shown on profile only:
`first_listing`, `first_sale`, `ten_sales`, `hundred_sales`, `year_one`, `year_three`, `year_five`

### Display rules

- Inline (next to a username in a list or card): max **3** badges shown, overflow shown as `+N`
- Profile page: all badges shown, milestone badges rendered as 3D `MilestoneBadge3D` components
- Badge size inline: 16px (`size={16}`)
- `platform_owner` always renders first regardless of sort order
- Tooltips on by default (`showTooltips={true}`), disable only in space-constrained contexts like `ListingStar`

### Usage pattern

```jsx
<UserBadges
  user={{ is_pro: item.seller_is_pro, is_platform_owner: item.seller_is_platform_owner }}
  milestoneBadges={item.seller_milestone_badges}
  maxInline={3}
/>
```

---

## 8. Motion Guidelines

### The two animation tiers

**Tier 1 — Ambient / background** (slow, continuous, non-interactive):
- Starfield twinkle: `2–6s ease-in-out infinite` (randomised per star)
- Bob idle wobble: 50ms interval, `Math.sin` oscillation, `0.1s ease-out` CSS transition
- Fireflies: `1s ease-in-out infinite`
- Tent glow: `2s ease-in-out infinite`
- WireframeCube spin: `12s linear infinite`
- Cloud drift: 50ms interval, continuous position increment
- Sun/sky colour transitions: `duration-[2000ms]`

These should feel like the world breathing. Never make them faster.

**Tier 2 — Interactive / feedback** (fast, triggered by user action):
- Button hover/active: `transition-colors` (Tailwind default ~150ms)
- Card hover shadow lift: `transition-shadow` (default ~150ms)
- Card image zoom: `transition-transform duration-500`
- Page entry: `rise-in` — `0.7s cubic-bezier(0.16, 1, 0.3, 1)` with staggered delays (0.08s per step)
- Dialog/overlay appear: `fadeInUp` — implicit via Radix animation
- Listing star hover scale: `transition-all duration-300`
- Seller strip slide-up: `transition-all duration-200` (max-height + opacity)
- Sky mode / space view opacity: `transition: opacity 0.6s`
- Filament swatch hover: `180ms ease`
- Vibrate alert (error): `vibrate-alert 260ms linear` × 3 iterations

### Rules

1. Background elements (stars, Bob, clouds, Earth) use Tier 1. Never put a `duration-150` on a star.
2. User-triggered state changes use Tier 2. Never put a `12s` on a button.
3. Page-level entry animations use `rise-in` with staggered `.rise-in-1` through `.rise-in-4` classes.
4. Easing: interactive transitions use Tailwind defaults (ease-in-out). Entry animations use
   `cubic-bezier(0.16, 1, 0.3, 1)` (fast out, slight overshoot — feels snappy without bouncing).
5. Do not introduce new `@keyframes` without adding them to `index.css`. Do not define
   animations inline in component styles unless they are parameterised (e.g. per-star twinkle phase).

---

## 9. Loading States

### Current state

Loading is currently handled with a boolean flag and either:
- Rendering nothing (the component returns early or renders an empty container)
- A plain text string: `"Loading…"` in `font-tech text-sm text-muted-foreground`

There is no shared loading component. The `Skeleton` component exists
(`components/ui/skeleton.jsx` — `animate-pulse rounded-md bg-primary/10`) but is not
used anywhere yet.

### Standard to follow for new loading states

Loading states should feel like the app's world, not a generic web pattern.

**For content lists (cards, listings, search results):**
Use 3–6 skeleton cards matching the shape of the real card:
```jsx
<div className="rounded-2xl bg-card shadow-sm animate-pulse">
  <div className="aspect-square bg-primary/10 rounded-t-2xl" />
  <div className="p-4 space-y-2">
    <div className="h-3 bg-primary/10 rounded-xl w-3/4" />
    <div className="h-2 bg-primary/10 rounded-xl w-1/2" />
  </div>
</div>
```

**For full-page loads (Browse, ListingDetail):**
Show the starfield background immediately (it renders from a seed, no API call needed),
then fade in content with `rise-in` once data arrives. The sky is never blank.

**For inline/small loading (a single stat, a button action):**
Replace the label with `"…"` in the same font/size. Do not show a spinner.

**Never use:**
- Generic CSS spinners
- Third-party loading libraries
- Skeleton shapes that don't match the real content shape

---

## 10. Empty States

### Existing pattern — `EmptyConstellation`

`components/EmptyConstellation.jsx` is the canonical empty state for the Discovery Clubs
constellation builder: black background, 5 faint random stars, a pale moon with craters,
and a centred text message in `font-tech`.

### Existing pattern — `WireframeCube` + text

Used in Browse's `EmptyState` function: the rotating wireframe cube above a heading and
a short description, with a CTA link. This is the standard for marketplace empty states.

```jsx
<div className="border border-dashed border-border rounded-2xl py-20 px-6 text-center flex flex-col items-center">
  <div className="mb-6 opacity-90"><WireframeCube size={104} /></div>
  <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
    Nothing here yet
  </div>
  <h3 className="font-display text-2xl font-bold mb-3">{heading}</h3>
  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
    {description}
  </p>
  {cta}
</div>
```

### Rules for new empty states

1. **Always include a visual anchor** — either `WireframeCube` (marketplace/content contexts)
   or `EmptyConstellation` (social/club/constellation contexts). Never just text.
2. **Three-line structure:** eyebrow label → heading → one-sentence description → optional CTA.
3. Use `border-dashed border-border` container to signal "this space is waiting to be filled."
4. The CTA (if present) should be a constructive action — "Design your first print", "Join a club" —
   not just "Go back."
5. Empty search results are a special case: keep the starfield/sky visible behind the empty state
   so the page doesn't feel dead. The empty state floats over the living background.

### Contexts and which pattern to use

| Context | Pattern |
|---|---|
| Empty cart | `WireframeCube` + "Your cart is empty" + Browse CTA |
| No search results | `WireframeCube` + "No prints match" + clear-filter CTA |
| No designs (Workshop) | `WireframeCube` + "No projects yet" (already implemented) |
| No club constellation | `EmptyConstellation` (already implemented) |
| No messages | Faint stars SVG + "No conversations yet" |
| No orders | `WireframeCube` + "No orders yet" |

---

## 11. Quick Reference Cheatsheet

```
Heading:     font-display text-4xl font-light tracking-tighter
Sub-heading: font-display text-2xl font-medium tracking-tight
Eyebrow:     text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground
Label:       text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground
Body:        text-sm (Work Sans, implicit)
Button text: font-tech text-xs uppercase tracking-wider

Card:        rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow
Button:      rounded-xl (all sizes)
Input:       rounded-xl
Badge/chip:  rounded-full
Dialog:      rounded-xl (Radix default)

Ambient anim:     2s–12s, ease-in-out or linear
Interactive anim: 150ms–500ms, ease-in-out or cubic-bezier(0.16,1,0.3,1)
Entry anim:       rise-in (0.7s) with .rise-in-1 through .rise-in-4 stagger

Icons:       lucide-react, h-4 w-4 default, strokeWidth 2 (1.5 for decorative)
Badges:      <UserBadges maxInline={3} /> — never more than 3 inline
```
