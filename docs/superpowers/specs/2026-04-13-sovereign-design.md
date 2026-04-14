# Sovereign — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

---

## Concept

Sovereign is a single-page web application where the last person to pay has their social media handle displayed in giant text on screen. Every purchase increases the price by $1. The product being sold is attention and ego — being the visible "sovereign" for however long it takes for the next person to pay.

The viral mechanic: streamers, influencers, and brands competing publicly to hold the top spot, spending increasingly more out of stubbornness, while audiences watch the name change in real time.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js (App Router) |
| Database + Realtime | Supabase (PostgreSQL + WebSocket) |
| Payments | PayPal |
| Hosting | Vercel |
| i18n | next-intl |

All services have free tiers sufficient for early traffic.

---

## Architecture

```
Browser (Next.js SPA)
  │
  ├── Supabase Realtime (WebSocket) ──→ live update when new king is crowned
  │    └── fallback: polling every 30s if WebSocket unavailable
  │
  └── Next.js API Routes (Vercel)
        ├── POST /api/checkout          → creates PayPal order with handle + network stored in PayPal's custom_id field
        ├── POST /api/paypal/webhook    → validates signature, updates Supabase, triggers realtime
        └── GET  /api/king             → initial state for SSR
```

### Payment flow

1. User fills in their @ handle and selects a social network
2. Clicks pay → calls `/api/checkout` → receives PayPal order URL
3. User is redirected to PayPal to complete payment
4. PayPal calls `/api/paypal/webhook` with confirmation
5. API validates webhook signature and checks idempotency (`paypal_order_id`)
6. Supabase is updated atomically: new king inserted, price incremented, state updated
7. Supabase Realtime broadcasts the change to all connected browsers
8. Every open tab updates instantly — no refresh needed

---

## Data Model

### Table: `kings`

Stores every person who has ever held the throne.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `handle` | text | @ without the @, e.g. `elonmusk` |
| `network` | text | `instagram` \| `x` \| `tiktok` \| `youtube` \| `twitch` \| `bluesky` \| `threads` \| `discord` \| `kick` \| `reddit` \| `bereal` \| `substack` \| `mastodon` \| `letterboxd` |
| `price_paid` | integer | In cents, e.g. `4700` = $47 |
| `paypal_order_id` | text | For idempotency checks |
| `reigned_at` | timestamptz | When they assumed the throne |
| `dethroned_at` | timestamptz | When dethroned; null if still reigning |

### Table: `state`

Single row (id = 1) representing the current site state.

| Column | Type | Notes |
|---|---|---|
| `id` | integer | Always 1 |
| `current_king_id` | uuid | FK → kings.id |
| `current_price` | integer | Price of the next purchase, in cents |
| `total_kings` | integer | Running count of unique rulers |

### Derived queries (no extra tables needed)

- **Longest Reign** — `kings` where `dethroned_at IS NOT NULL`, ordered by `(dethroned_at - reigned_at)` DESC (current king excluded — their reign is ongoing)
- **Biggest Spender** — `kings` grouped by `handle`, summed `price_paid` DESC
- **Fastest Dethroned** — `kings` ordered by `(dethroned_at - reigned_at)` ASC, nulls last
- **Most Attempts** — `kings` grouped by `handle`, count DESC
- **Recent Kings** — `kings` ordered by `reigned_at` DESC, limit 10

---

## UI Components

### Page layout (mobile-first, single page)

```
┌─────────────────────────────┐
│  [EN | PT]          SOVEREIGN│  ← minimal nav/lang switcher
├─────────────────────────────┤
│                             │
│   ══ SOVEREIGN ══           │  ← title with double border lines
│   currently reigning        │
│   @elonmusk                 │  ← giant gold text
│   [instagram icon]          │  ← clickable icon (36px circle, links to profile)
│   3 minutes on top          │
│                             │
│  [ CLAIM THE THRONE — $47 ] │  ← gold CTA button
│  price increases $1 each    │
│                             │
├─────────────────────────────┤
│  👑 Longest   💸 Spender    │
│  ⚡ Fastest   🔁 Attempts   │
│       🏰 Total Kings        │  ← 2×2 grid + 1 full-width
├─────────────────────────────┤
│  Recent Kings               │
│  @handle   $47 · 3min ago   │  ← feed with left gold border on active
│  @handle   $46 · 2h ago     │
└─────────────────────────────┘
```

Desktop: same layout, wider max-width container, stats grid expands to 3 columns.

### Payment modal

Triggered by the CTA button. Contains:
- Text input for @ handle (alphanumeric + underscores, max 30 chars, client-validated)
- Social network selector grid:
  - **Main (5):** Instagram, X/Twitter, TikTok, YouTube, Twitch — each with branded SVG icon
  - **More (expandable, 9):** Bluesky, Threads, Discord, Kick, Reddit, BeReal, Substack, Mastodon, Letterboxd
- Confirm button: "PAY $X VIA PAYPAL" → redirects to PayPal

### Social network badge (on throne)

- 36px dark circle (`#1a1a1a`) with the network's branded SVG icon (20px)
- Positioned below the @ handle, centered
- Links to `<network-base-url>/<handle>` (e.g. `instagram.com/elonmusk`)
- Tooltip shows full URL on hover

---

## Visual Identity

- **Background:** `#0a0a0a` (near black)
- **Primary:** `#ffd700` (gold)
- **Secondary:** `#b8860b` (dark gold, for labels)
- **Muted:** `#444` / `#333` (timestamps, secondary text)
- **Dividers:** `#1a1a1a`
- **Typography:** Georgia (serif) for the @ handle and title; monospace for timestamps and prices
- **Title treatment:** "SOVEREIGN" in small caps with gold border lines above and below
- **CTA button:** solid gold background, black text, uppercase, letter-spacing

---

## i18n

- Default language: English
- Second language: Portuguese (Brazil)
- Library: `next-intl`
- Language toggle: small button in the top nav (EN | PT)
- Only static UI strings are translated; handles, names, and timestamps are language-agnostic
- Language preference stored in a cookie

---

## Error Handling

| Situation | Behavior |
|---|---|
| User closes PayPal without paying | Nothing changes; session data expires naturally |
| Duplicate webhook (PayPal retry) | Ignored — idempotency check on `paypal_order_id` |
| Supabase offline | Site shows last known state; CTA button disabled with "temporarily unavailable" message |
| Invalid @ (special chars, too long) | Client-side validation blocks form submission before redirect |
| Two simultaneous payments | Supabase atomic transaction — first confirmed webhook wins; second is ignored as duplicate |
| WebSocket disconnected | Falls back to polling every 30s silently |

---

## Out of Scope (v1)

- Native mobile app (iOS/Android) — web app on mobile browser covers the use case
- Apple/Google in-app purchases
- Admin dashboard or moderation panel
- Email notifications
- User accounts or login
- Multiple concurrent "thrones"
