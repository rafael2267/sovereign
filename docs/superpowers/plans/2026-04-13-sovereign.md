# Sovereign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sovereign — a single-page web app where the last person to pay via PayPal has their social handle displayed in giant gold text, with the price increasing $1 per purchase and all browsers updating in real time.

**Architecture:** Next.js App Router handles both the SPA frontend and serverless API routes. Supabase stores state and broadcasts real-time updates via WebSocket. PayPal handles payments; the webhook endpoint verifies the signature and atomically updates the database via a PostgreSQL RPC function. TDD throughout: API routes tested with Jest; components tested with React Testing Library.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + Realtime), PayPal REST API v2, next-intl, Jest + React Testing Library, Vercel

**Spec:** `docs/superpowers/specs/2026-04-13-sovereign-design.md`

---

## File Map

**Config**
- `package.json` — dependencies
- `next.config.ts` — next-intl plugin
- `tailwind.config.ts` — brand color palette
- `jest.config.ts` — Jest runner
- `jest.setup.ts` — @testing-library/jest-dom setup
- `.env.local.example` — all required env vars documented

**Database**
- `supabase/migrations/001_initial.sql` — `kings` table, `state` table, `crown_new_king` RPC, `get_stats` RPC, RLS policies, realtime enable

**Lib**
- `lib/supabase/client.ts` — browser Supabase client (singleton)
- `lib/supabase/server.ts` — server client + service-role client
- `lib/supabase/types.ts` — `King`, `State`, `Stats` TypeScript types
- `lib/supabase/queries.ts` — `getCurrentKing()`, `getStats()`, `getRecentKings()`
- `lib/paypal/auth.ts` — `getPayPalAccessToken()`
- `lib/paypal/orders.ts` — `createPayPalOrder(handle, network, priceInCents)`
- `lib/paypal/webhooks.ts` — `verifyWebhookSignature(headers, rawBody)`
- `lib/networks.ts` — `NETWORKS` array + `NETWORKS_MAP` + `buildProfileUrl()`

**API Routes**
- `app/api/king/route.ts` — `GET` returns current king + price
- `app/api/checkout/route.ts` — `POST` validates input, creates PayPal order, returns approval URL
- `app/api/paypal/webhook/route.ts` — `POST` verifies signature, calls `crown_new_king` RPC

**Components**
- `components/NetworkIcon.tsx` — renders branded SVG per network id
- `components/ThroneHero.tsx` — hero section; subscribes to Supabase Realtime
- `components/NetworkSelector.tsx` — 5 main + expandable "More" grid
- `components/PaymentModal.tsx` — handle input + NetworkSelector + pay button
- `components/StatsGrid.tsx` — 5 stat cards (Longest, Spender, Fastest, Attempts, Total)
- `components/RecentKings.tsx` — scrollable feed of last 10 kings
- `components/LanguageToggle.tsx` — EN / PT switcher

**i18n**
- `i18n.ts` — next-intl routing config
- `middleware.ts` — locale detection + cookie
- `messages/en.json` — English strings
- `messages/pt.json` — Portuguese strings

**App**
- `app/layout.tsx` — root layout with next-intl provider
- `app/page.tsx` — assembles all sections
- `app/globals.css` — base resets + font imports

**Tests**
- `__tests__/api/king.test.ts`
- `__tests__/api/checkout.test.ts`
- `__tests__/api/webhook.test.ts`
- `__tests__/components/NetworkSelector.test.tsx`
- `__tests__/components/PaymentModal.test.tsx`

---

## Task 1: Project Setup

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `tailwind.config.ts`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local.example`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /c/Users/rafae/Documents/Code/sovereign
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --yes
```

Expected: project files created — `app/`, `public/`, `package.json`, `tailwind.config.ts`, etc.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js next-intl
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Configure Tailwind brand colors**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#ffd700',
        'gold-dark': '#b8860b',
        'bg-base': '#0a0a0a',
        'bg-elevated': '#111111',
        'bg-card': '#1a1a1a',
        'border-subtle': '#1a1a1a',
        'text-muted': '#444444',
        'text-dim': '#333333',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
}

export default config
```

- [ ] **Step 6: Document env vars**

Create `.env.local.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-webhook-id
# Use https://api-m.sandbox.paypal.com for testing, https://api-m.paypal.com for prod
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 7: Update .gitignore**

Add these lines to `.gitignore`:

```
.env.local
.superpowers/
```

- [ ] **Step 8: Verify setup**

```bash
npm run build 2>&1 | tail -5
```

Expected: build completes without errors (TypeScript may warn about missing files — fine at this stage).

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, Jest, Supabase, next-intl deps"
```

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial.sql`:

```sql
-- Kings table: every person who has ever held the throne
CREATE TABLE kings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle           TEXT NOT NULL,
  network          TEXT NOT NULL,
  price_paid       INTEGER NOT NULL,          -- in cents
  paypal_order_id  TEXT NOT NULL UNIQUE,      -- idempotency key
  reigned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dethroned_at     TIMESTAMPTZ                -- NULL while still reigning
);

CREATE INDEX idx_kings_reigned_at ON kings (reigned_at DESC);
CREATE INDEX idx_kings_handle ON kings (handle);

-- State table: single row representing the live site state
CREATE TABLE state (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_king_id  UUID REFERENCES kings(id),
  current_price    INTEGER NOT NULL DEFAULT 100,  -- starts at $1 (100 cents)
  total_kings      INTEGER NOT NULL DEFAULT 0
);

-- Seed the single state row
INSERT INTO state (id, current_price, total_kings) VALUES (1, 100, 0);

-- RLS: public read, no direct writes (all writes via RPC)
ALTER TABLE kings ENABLE ROW LEVEL SECURITY;
ALTER TABLE state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kings_public_read" ON kings FOR SELECT USING (true);
CREATE POLICY "state_public_read" ON state FOR SELECT USING (true);

-- Enable Realtime on state table
ALTER PUBLICATION supabase_realtime ADD TABLE state;

-- RPC: atomically crown a new king (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION crown_new_king(
  p_handle          TEXT,
  p_network         TEXT,
  p_price_paid      INTEGER,
  p_paypal_order_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_king_id UUID;
BEGIN
  -- Idempotency: if this order was already processed, return NULL
  IF EXISTS (SELECT 1 FROM kings WHERE paypal_order_id = p_paypal_order_id) THEN
    RETURN NULL;
  END IF;

  -- Dethrone current king
  UPDATE kings
  SET dethroned_at = NOW()
  WHERE id = (SELECT current_king_id FROM state WHERE id = 1)
    AND dethroned_at IS NULL;

  -- Insert new king
  INSERT INTO kings (handle, network, price_paid, paypal_order_id, reigned_at)
  VALUES (p_handle, p_network, p_price_paid, p_paypal_order_id, NOW())
  RETURNING id INTO v_new_king_id;

  -- Update state atomically
  UPDATE state SET
    current_king_id = v_new_king_id,
    current_price   = current_price + 100,    -- +$1 in cents
    total_kings     = total_kings + 1
  WHERE id = 1;

  RETURN v_new_king_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: compute all stats in one query
CREATE OR REPLACE FUNCTION get_stats()
RETURNS JSON AS $$
DECLARE
  v_longest      JSON;
  v_spender      JSON;
  v_fastest      JSON;
  v_attempts     JSON;
BEGIN
  -- Longest completed reign
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'duration_seconds', EXTRACT(EPOCH FROM (dethroned_at - reigned_at))::int
  ) INTO v_longest
  FROM kings
  WHERE dethroned_at IS NOT NULL
  ORDER BY (dethroned_at - reigned_at) DESC
  LIMIT 1;

  -- Biggest spender (sum by handle+network, show top pair)
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'total_cents', SUM(price_paid)
  ) INTO v_spender
  FROM kings
  GROUP BY handle, network
  ORDER BY SUM(price_paid) DESC
  LIMIT 1;

  -- Fastest dethroned (shortest completed reign)
  SELECT json_build_object(
    'handle', handle,
    'network', network,
    'duration_seconds', EXTRACT(EPOCH FROM (dethroned_at - reigned_at))::int
  ) INTO v_fastest
  FROM kings
  WHERE dethroned_at IS NOT NULL
  ORDER BY (dethroned_at - reigned_at) ASC
  LIMIT 1;

  -- Most attempts (by handle, any network)
  SELECT json_build_object(
    'handle', handle,
    'network', (SELECT network FROM kings k2 WHERE k2.handle = kings.handle ORDER BY reigned_at DESC LIMIT 1),
    'count', COUNT(*)
  ) INTO v_attempts
  FROM kings
  GROUP BY handle
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN json_build_object(
    'longest_reign',    v_longest,
    'biggest_spender',  v_spender,
    'fastest_dethroned', v_fastest,
    'most_attempts',    v_attempts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply migration to Supabase**

In Supabase dashboard → SQL Editor → paste and run `001_initial.sql`.

Alternatively if using Supabase CLI:
```bash
npx supabase db push
```

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard → Table Editor, confirm:
- `kings` table exists with all columns
- `state` table has one row: `id=1, current_price=100, total_kings=0`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial.sql
git commit -m "feat: add database schema with kings table, state table, crown_new_king and get_stats RPCs"
```

---

## Task 3: Supabase Clients + Types

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/queries.ts`

- [ ] **Step 1: Copy `.env.local.example` to `.env.local` and fill in values**

```bash
cp .env.local.example .env.local
# Then edit .env.local with your Supabase URL and keys
```

- [ ] **Step 2: Create TypeScript types**

Create `lib/supabase/types.ts`:

```typescript
export type King = {
  id: string
  handle: string
  network: string
  price_paid: number       // cents
  paypal_order_id: string
  reigned_at: string       // ISO timestamp
  dethroned_at: string | null
}

export type State = {
  id: number
  current_king_id: string | null
  current_price: number    // cents
  total_kings: number
}

export type KingWithState = {
  current_king: Pick<King, 'id' | 'handle' | 'network' | 'reigned_at'> | null
  current_price: number
  total_kings: number
}

export type StatEntry = {
  handle: string
  network: string
  duration_seconds?: number
  total_cents?: number
  count?: number
} | null

export type Stats = {
  longest_reign: StatEntry
  biggest_spender: StatEntry
  fastest_dethroned: StatEntry
  most_attempts: StatEntry
}

export type RecentKing = Pick<King, 'id' | 'handle' | 'network' | 'price_paid' | 'reigned_at'>
```

- [ ] **Step 3: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (client) return client
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
```

- [ ] **Step 4: Create server clients**

Create `lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Service-role client bypasses RLS — use only in API routes
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 5: Create query helpers**

Create `lib/supabase/queries.ts`:

```typescript
import { createServerClient } from './server'
import type { KingWithState, Stats, RecentKing } from './types'

export async function getCurrentKing(): Promise<KingWithState> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('state')
    .select(`
      current_price,
      total_kings,
      current_king:kings!state_current_king_id_fkey (
        id, handle, network, reigned_at
      )
    `)
    .eq('id', 1)
    .single()

  if (error) throw new Error(`Failed to fetch current king: ${error.message}`)
  return data as unknown as KingWithState
}

export async function getStats(): Promise<Stats> {
  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_stats')
  if (error) throw new Error(`Failed to fetch stats: ${error.message}`)
  return data as Stats
}

export async function getRecentKings(): Promise<RecentKing[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('kings')
    .select('id, handle, network, price_paid, reigned_at')
    .order('reigned_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(`Failed to fetch recent kings: ${error.message}`)
  return data as RecentKing[]
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase clients, TypeScript types, and query helpers"
```

---

## Task 4: Social Networks Config

**Files:**
- Create: `lib/networks.ts`
- Create: `components/NetworkIcon.tsx`

- [ ] **Step 1: Create networks config**

Create `lib/networks.ts`:

```typescript
export type NetworkId =
  | 'instagram' | 'x' | 'tiktok' | 'youtube' | 'twitch'
  | 'bluesky' | 'threads' | 'discord' | 'kick' | 'reddit'
  | 'bereal' | 'substack' | 'mastodon' | 'letterboxd'

export type Network = {
  id: NetworkId
  label: string
  buildUrl: (handle: string) => string
  main: boolean   // true = shown in primary grid; false = shown in "More"
}

export const NETWORKS: Network[] = [
  { id: 'instagram', label: 'Instagram',  buildUrl: (h) => `https://instagram.com/${h}`,       main: true },
  { id: 'x',         label: 'X / Twitter', buildUrl: (h) => `https://x.com/${h}`,              main: true },
  { id: 'tiktok',    label: 'TikTok',     buildUrl: (h) => `https://tiktok.com/@${h}`,          main: true },
  { id: 'youtube',   label: 'YouTube',    buildUrl: (h) => `https://youtube.com/@${h}`,         main: true },
  { id: 'twitch',    label: 'Twitch',     buildUrl: (h) => `https://twitch.tv/${h}`,            main: true },
  { id: 'bluesky',   label: 'Bluesky',    buildUrl: (h) => `https://bsky.app/profile/${h}`,     main: false },
  { id: 'threads',   label: 'Threads',    buildUrl: (h) => `https://threads.net/@${h}`,         main: false },
  { id: 'discord',   label: 'Discord',    buildUrl: (h) => `https://discord.com/users/${h}`,    main: false },
  { id: 'kick',      label: 'Kick',       buildUrl: (h) => `https://kick.com/${h}`,             main: false },
  { id: 'reddit',    label: 'Reddit',     buildUrl: (h) => `https://reddit.com/u/${h}`,         main: false },
  { id: 'bereal',    label: 'BeReal',     buildUrl: (h) => `https://bere.al/${h}`,              main: false },
  { id: 'substack',  label: 'Substack',   buildUrl: (h) => `https://${h}.substack.com`,         main: false },
  { id: 'mastodon',  label: 'Mastodon',   buildUrl: (h) => `https://mastodon.social/@${h}`,     main: false },
  { id: 'letterboxd',label: 'Letterboxd', buildUrl: (h) => `https://letterboxd.com/${h}`,       main: false },
]

export const NETWORKS_MAP: Record<NetworkId, Network> = Object.fromEntries(
  NETWORKS.map((n) => [n.id, n])
) as Record<NetworkId, Network>

export const VALID_NETWORK_IDS: string[] = NETWORKS.map((n) => n.id)
```

- [ ] **Step 2: Create NetworkIcon component**

Create `components/NetworkIcon.tsx`:

```tsx
'use client'
import { useId } from 'react'
import type { NetworkId } from '@/lib/networks'

type Props = { networkId: NetworkId | string; size?: number }

export function NetworkIcon({ networkId, size = 20 }: Props) {
  const uid = useId()
  const gid = uid.replace(/:/g, '')

  switch (networkId) {
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`ig-${gid}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={`url(#ig-${gid})`} strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="4" stroke={`url(#ig-${gid})`} strokeWidth="2" fill="none" />
          <circle cx="17.5" cy="6.5" r="1.4" fill={`url(#ig-${gid})`} />
        </svg>
      )
    case 'x':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" fill="#ffffff" />
        </svg>
      )
    case 'youtube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81z" fill="#FF0000" />
          <path d="M9.75 15.02l6.25-3.02-6.25-3.02v6.04z" fill="#ffffff" />
        </svg>
      )
    case 'twitch':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#9146FF">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      )
    case 'bluesky':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#0085ff">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C3.067 1.505 1.016.999 1.016.999c-.614 0-1.016.427-1.016 1.07 0 .61.427 5.12.427 6.74 0 .66-.303 2.927-2.24 3.36.554.082 1.122.108 1.706.047C1.574 11.89 4.8 9.5 12 9.5s10.426 2.39 12.107 2.716c.584.061 1.152.035 1.706-.047-1.937-.433-2.24-2.7-2.24-3.36 0-1.62.427-6.13.427-6.74 0-.643-.402-1.07-1.016-1.07 0 0-2.051.506-4.186 1.806C16.046 4.747 13.087 8.686 12 10.8z" />
        </svg>
      )
    case 'threads':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c.002-3.474.854-6.32 2.496-8.386C5.845 1.231 8.6.05 12.18.024h.014c2.746.018 5.1.806 6.998 2.339 1.822 1.474 3.019 3.479 3.554 5.957l-2.883.569c-.895-4.28-3.745-6.417-7.67-6.441-2.73.016-4.839.932-6.27 2.718C4.479 6.866 3.7 9.201 3.7 12v.057c-.001 2.803.779 5.143 2.225 6.859 1.43 1.701 3.541 2.62 6.254 2.637 2.408-.013 4.208-.668 5.463-1.933.97-.976 1.65-2.37 2.078-4.225a10.83 10.83 0 01-3.814.698c-2.163 0-3.992-.602-5.294-1.74-1.363-1.191-2.053-2.852-2.002-4.814.054-2.083.927-3.78 2.526-4.914 1.504-1.07 3.438-1.536 5.758-1.388 1.786.113 3.23.6 4.3 1.449a6.97 6.97 0 011.902 2.555l-2.636 1.073a4.03 4.03 0 00-1.1-1.467c-.668-.535-1.603-.857-2.874-.936-1.508-.095-2.734.214-3.644.88-.819.597-1.262 1.45-1.291 2.513-.027 1.026.327 1.853 1.022 2.457.74.645 1.8.97 3.148.97 1.676 0 3.033-.504 4.03-1.498.991-.989 1.541-2.394 1.638-4.177l.022-.38.376.02c.199.011.394.016.584.016 3.09 0 5.424-.772 6.934-2.298V12c0 3.572-.851 6.443-2.531 8.54-1.855 2.312-4.607 3.486-8.181 3.508z" />
        </svg>
      )
    case 'discord':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#5865F2">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
      )
    case 'kick':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#53fc18">
          <text x="2" y="18" fontSize="14" fontWeight="900" fontFamily="Arial">K</text>
        </svg>
      )
    case 'reddit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF4500">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      )
    case 'bereal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#ffffff" />
          <text x="3" y="17" fontSize="9" fontWeight="900" fontFamily="Arial" fill="#000000">BeReal</text>
        </svg>
      )
    case 'substack':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF6719">
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
        </svg>
      )
    case 'mastodon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#6364FF">
          <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
        </svg>
      )
    case 'letterboxd':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="7" cy="12" r="5" fill="#00C030" />
          <circle cx="12" cy="12" r="5" fill="#FF8000" opacity="0.85" />
          <circle cx="17" cy="12" r="5" fill="#40BCF4" opacity="0.85" />
        </svg>
      )
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#444" strokeWidth="2" fill="none" />
        </svg>
      )
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/networks.ts components/NetworkIcon.tsx
git commit -m "feat: add social networks config and NetworkIcon SVG component"
```

---

## Task 5: GET /api/king Route

**Files:**
- Create: `app/api/king/route.ts`
- Create: `__tests__/api/king.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/king.test.ts`:

```typescript
import { GET } from '@/app/api/king/route'

jest.mock('@/lib/supabase/queries', () => ({
  getCurrentKing: jest.fn(),
}))

import { getCurrentKing } from '@/lib/supabase/queries'

describe('GET /api/king', () => {
  it('returns current king data as JSON', async () => {
    const mockData = {
      current_king: { id: 'uuid-1', handle: 'elonmusk', network: 'instagram', reigned_at: '2026-01-01T00:00:00Z' },
      current_price: 4700,
      total_kings: 46,
    }
    ;(getCurrentKing as jest.Mock).mockResolvedValue(mockData)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockData)
  })

  it('returns 500 when query fails', async () => {
    ;(getCurrentKing as jest.Mock).mockRejectedValue(new Error('DB error'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx jest __tests__/api/king.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/king/route'`

- [ ] **Step 3: Implement route**

Create `app/api/king/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCurrentKing } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const data = await getCurrentKing()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch king' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npx jest __tests__/api/king.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/king/ __tests__/api/king.test.ts
git commit -m "feat: add GET /api/king route with tests"
```

---

## Task 6: PayPal Helpers

**Files:**
- Create: `lib/paypal/auth.ts`
- Create: `lib/paypal/orders.ts`
- Create: `lib/paypal/webhooks.ts`

- [ ] **Step 1: Create auth helper**

Create `lib/paypal/auth.ts`:

```typescript
export async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`)
  }

  const data = await res.json()
  return data.access_token as string
}
```

- [ ] **Step 2: Create order creation helper**

Create `lib/paypal/orders.ts`:

```typescript
import { getPayPalAccessToken } from './auth'

type CreateOrderResult = { approvalUrl: string; orderId: string }

export async function createPayPalOrder(
  handle: string,
  network: string,
  priceInCents: number
): Promise<CreateOrderResult> {
  const accessToken = await getPayPalAccessToken()
  const priceInDollars = (priceInCents / 100).toFixed(2)

  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: priceInDollars },
          custom_id: `${handle}|${network}`,
          description: 'Sovereign — Claim the Throne',
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
        brand_name: 'Sovereign',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal order creation failed: ${err}`)
  }

  const order = await res.json()
  const approvalUrl = order.links.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href

  if (!approvalUrl) throw new Error('No approval URL in PayPal response')

  return { approvalUrl, orderId: order.id }
}
```

- [ ] **Step 3: Create webhook verification helper**

Create `lib/paypal/webhooks.ts`:

```typescript
import { getPayPalAccessToken } from './auth'

export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo:        headers.get('paypal-auth-algo'),
        cert_url:         headers.get('paypal-cert-url'),
        transmission_id:  headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id:       process.env.PAYPAL_WEBHOOK_ID,
        webhook_event:    JSON.parse(rawBody),
      }),
    }
  )

  if (!res.ok) return false
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/paypal/
git commit -m "feat: add PayPal auth, order creation, and webhook verification helpers"
```

---

## Task 7: POST /api/checkout Route

**Files:**
- Create: `app/api/checkout/route.ts`
- Create: `__tests__/api/checkout.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/checkout.test.ts`:

```typescript
import { POST } from '@/app/api/checkout/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/queries', () => ({
  getCurrentKing: jest.fn().mockResolvedValue({ current_price: 4700 }),
}))
jest.mock('@/lib/paypal/orders', () => ({
  createPayPalOrder: jest.fn().mockResolvedValue({
    approvalUrl: 'https://paypal.com/approve/123',
    orderId: 'ORDER-123',
  }),
}))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/checkout', () => {
  it('returns PayPal approval URL for valid input', async () => {
    const req = makeRequest({ handle: 'elonmusk', network: 'instagram' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.url).toBe('https://paypal.com/approve/123')
  })

  it('rejects invalid handle (special chars)', async () => {
    const req = makeRequest({ handle: 'elon!musk', network: 'instagram' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects handle longer than 50 chars', async () => {
    const req = makeRequest({ handle: 'a'.repeat(51), network: 'instagram' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects unknown network', async () => {
    const req = makeRequest({ handle: 'elonmusk', network: 'myspace' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx jest __tests__/api/checkout.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/checkout/route'`

- [ ] **Step 3: Implement route**

Create `app/api/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentKing } from '@/lib/supabase/queries'
import { createPayPalOrder } from '@/lib/paypal/orders'
import { VALID_NETWORK_IDS } from '@/lib/networks'

const HANDLE_REGEX = /^[\w.]{1,50}$/   // word chars + dots, 1–50 chars

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { handle, network } = body

  if (!handle || !HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 })
  }
  if (!network || !VALID_NETWORK_IDS.includes(network)) {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 })
  }

  try {
    const state = await getCurrentKing()
    const { approvalUrl } = await createPayPalOrder(handle, network, state.current_price)
    return NextResponse.json({ url: approvalUrl })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx jest __tests__/api/checkout.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/checkout/ __tests__/api/checkout.test.ts
git commit -m "feat: add POST /api/checkout route with input validation and tests"
```

---

## Task 8: POST /api/paypal/webhook Route

**Files:**
- Create: `app/api/paypal/webhook/route.ts`
- Create: `__tests__/api/webhook.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/api/webhook.test.ts`:

```typescript
import { POST } from '@/app/api/paypal/webhook/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/paypal/webhooks', () => ({
  verifyWebhookSignature: jest.fn(),
}))
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: jest.fn(),
  })),
}))

import { verifyWebhookSignature } from '@/lib/paypal/webhooks'
import { createServiceRoleClient } from '@/lib/supabase/server'

const captureEvent = (customId: string, amount = '47.00') => ({
  event_type: 'PAYMENT.CAPTURE.COMPLETED',
  resource: {
    id: 'CAPTURE-123',
    custom_id: customId,
    amount: { value: amount },
  },
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/paypal/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/paypal/webhook', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects requests with invalid signature', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(false)
    const res = await POST(makeRequest(captureEvent('elonmusk|instagram')))
    expect(res.status).toBe(400)
  })

  it('crowns new king on valid PAYMENT.CAPTURE.COMPLETED', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const mockRpc = jest.fn().mockResolvedValue({ data: 'uuid-new-king', error: null })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue({ rpc: mockRpc })

    const res = await POST(makeRequest(captureEvent('elonmusk|instagram')))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('crown_new_king', {
      p_handle: 'elonmusk',
      p_network: 'instagram',
      p_price_paid: 4700,
      p_paypal_order_id: 'CAPTURE-123',
    })
  })

  it('ignores non-capture events', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const res = await POST(makeRequest({ event_type: 'PAYMENT.SALE.COMPLETED' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
  })

  it('returns 400 on malformed custom_id', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const res = await POST(makeRequest(captureEvent('no-pipe-here')))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx jest __tests__/api/webhook.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/paypal/webhook/route'`

- [ ] **Step 3: Implement route**

Create `app/api/paypal/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paypal/webhooks'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const isValid = await verifyWebhookSignature(req.headers, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ received: true })
  }

  const capture = event.resource
  const customId: string = capture.custom_id ?? ''
  const parts = customId.split('|')

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return NextResponse.json({ error: 'Invalid custom_id format' }, { status: 400 })
  }

  const [handle, network] = parts
  const pricePaid = Math.round(parseFloat(capture.amount.value) * 100)
  const paypalOrderId: string = capture.id

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('crown_new_king', {
    p_handle: handle,
    p_network: network,
    p_price_paid: pricePaid,
    p_paypal_order_id: paypalOrderId,
  })

  if (error) {
    console.error('crown_new_king RPC error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, king_id: data })
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx jest __tests__/api/webhook.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/paypal/ __tests__/api/webhook.test.ts
git commit -m "feat: add POST /api/paypal/webhook with signature verification and tests"
```

---

## Task 9: NetworkSelector Component

**Files:**
- Create: `components/NetworkSelector.tsx`
- Create: `__tests__/components/NetworkSelector.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/NetworkSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { NetworkSelector } from '@/components/NetworkSelector'

describe('NetworkSelector', () => {
  it('renders 5 main network buttons', () => {
    const onSelect = jest.fn()
    render(<NetworkSelector selected={null} onSelect={onSelect} />)
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('X / Twitter')).toBeInTheDocument()
    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
    expect(screen.getByText('Twitch')).toBeInTheDocument()
  })

  it('does not show More networks by default', () => {
    render(<NetworkSelector selected={null} onSelect={jest.fn()} />)
    expect(screen.queryByText('Bluesky')).not.toBeInTheDocument()
  })

  it('shows More networks after clicking More button', () => {
    render(<NetworkSelector selected={null} onSelect={jest.fn()} />)
    fireEvent.click(screen.getByText('More'))
    expect(screen.getByText('Bluesky')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
  })

  it('calls onSelect with network id when a network is clicked', () => {
    const onSelect = jest.fn()
    render(<NetworkSelector selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Instagram'))
    expect(onSelect).toHaveBeenCalledWith('instagram')
  })

  it('highlights the selected network', () => {
    const { container } = render(<NetworkSelector selected="instagram" onSelect={jest.fn()} />)
    const instagramBtn = container.querySelector('[data-network="instagram"]')
    expect(instagramBtn).toHaveClass('border-gold')
  })
})
```

- [ ] **Step 2: Run — confirm FAIL**

```bash
npx jest __tests__/components/NetworkSelector.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/NetworkSelector'`

- [ ] **Step 3: Implement component**

Create `components/NetworkSelector.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { NETWORKS } from '@/lib/networks'
import { NetworkIcon } from './NetworkIcon'
import type { NetworkId } from '@/lib/networks'

type Props = {
  selected: NetworkId | null
  onSelect: (id: NetworkId) => void
}

export function NetworkSelector({ selected, onSelect }: Props) {
  const [showMore, setShowMore] = useState(false)

  const mainNetworks = NETWORKS.filter((n) => n.main)
  const moreNetworks = NETWORKS.filter((n) => !n.main)

  function NetworkButton({ network }: { network: (typeof NETWORKS)[0] }) {
    const isSelected = selected === network.id
    return (
      <button
        data-network={network.id}
        onClick={() => onSelect(network.id as NetworkId)}
        className={`
          flex flex-col items-center gap-1.5 p-2.5 rounded-md border text-center
          transition-colors cursor-pointer
          ${isSelected
            ? 'border-gold bg-bg-elevated'
            : 'border-bg-card bg-bg-elevated hover:border-bg-card/80'
          }
        `}
      >
        <NetworkIcon networkId={network.id} size={22} />
        <span className={`text-[9px] font-bold tracking-wide ${isSelected ? 'text-gold' : 'text-text-muted'}`}>
          {network.label}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {mainNetworks.map((n) => <NetworkButton key={n.id} network={n} />)}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border border-bg-card bg-bg-elevated hover:border-text-dim transition-colors"
        >
          <span className="text-text-muted text-lg leading-none">···</span>
          <span className="text-[9px] font-bold text-text-muted tracking-wide">
            {showMore ? 'Less' : 'More'}
          </span>
        </button>
      </div>

      {showMore && (
        <div className="border border-bg-card rounded-md p-2.5 space-y-2">
          <p className="text-[8px] uppercase tracking-widest text-text-dim">Other Networks</p>
          <div className="grid grid-cols-3 gap-2">
            {moreNetworks.map((n) => <NetworkButton key={n.id} network={n} />)}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx jest __tests__/components/NetworkSelector.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add components/NetworkSelector.tsx __tests__/components/NetworkSelector.test.tsx
git commit -m "feat: add NetworkSelector component with expandable More section and tests"
```

---

## Task 10: PaymentModal Component

**Files:**
- Create: `components/PaymentModal.tsx`
- Create: `__tests__/components/PaymentModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/PaymentModal.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentModal } from '@/components/PaymentModal'

global.fetch = jest.fn()

describe('PaymentModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders handle input and network selector', () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    expect(screen.getByPlaceholderText(/your handle/i)).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('disables pay button when handle is empty', () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('disables pay button when no network is selected', async () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/your handle/i), 'elonmusk')
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('redirects to PayPal URL on successful checkout', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://paypal.com/approve/123' }),
    })
    const assignMock = jest.fn()
    Object.defineProperty(window, 'location', { value: { assign: assignMock }, writable: true })

    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/your handle/i), 'elonmusk')
    fireEvent.click(screen.getByText('Instagram'))
    fireEvent.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('https://paypal.com/approve/123'))
  })
})
```

- [ ] **Step 2: Run — confirm FAIL**

```bash
npx jest __tests__/components/PaymentModal.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/PaymentModal'`

- [ ] **Step 3: Implement component**

Create `components/PaymentModal.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { NetworkSelector } from './NetworkSelector'
import type { NetworkId } from '@/lib/networks'

type Props = {
  price: number     // in cents
  onClose: () => void
}

const HANDLE_REGEX = /^[\w.]{1,50}$/

export function PaymentModal({ price, onClose }: Props) {
  const [handle, setHandle] = useState('')
  const [network, setNetwork] = useState<NetworkId | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceDisplay = `$${(price / 100).toFixed(0)}`
  const isValid = HANDLE_REGEX.test(handle) && network !== null

  async function handlePay() {
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, network }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      window.location.assign(data.url)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-elevated border border-bg-card rounded-xl p-6 w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-gold font-serif text-sm uppercase tracking-widest">Claim the Throne</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Handle input */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-text-muted block">Your @ handle</label>
          <div className="flex items-center bg-bg-base border border-bg-card rounded px-3">
            <span className="text-text-muted font-mono text-sm mr-1">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 50))}
              placeholder="your handle"
              className="bg-transparent text-gold font-mono text-sm py-2.5 outline-none w-full placeholder:text-text-dim"
            />
          </div>
        </div>

        {/* Network selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-text-muted block">Social Network</label>
          <NetworkSelector selected={network} onSelect={setNetwork} />
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={!isValid || loading}
          className="w-full bg-gold text-bg-base font-black text-sm uppercase tracking-widest py-3 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          {loading ? 'Redirecting...' : `Pay ${priceDisplay} via PayPal`}
        </button>

        <p className="text-text-dim text-[10px] text-center">
          You will be redirected to PayPal to complete payment
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx jest __tests__/components/PaymentModal.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/PaymentModal.tsx __tests__/components/PaymentModal.test.tsx
git commit -m "feat: add PaymentModal component with handle input, network selector, and tests"
```

---

## Task 11: ThroneHero Component

**Files:**
- Create: `components/ThroneHero.tsx`
- Create: `lib/utils/time.ts`

- [ ] **Step 1: Create time formatting utility**

Create `lib/utils/time.ts`:

```typescript
export function formatReignDuration(reignedAt: string): string {
  const ms = Date.now() - new Date(reignedAt).getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h on top`
  if (hours > 0) return `${hours}h ${minutes % 60}m on top`
  if (minutes > 0) return `${minutes}m on top`
  return `${seconds}s on top`
}
```

- [ ] **Step 2: Implement ThroneHero**

Create `components/ThroneHero.tsx`:

```tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { NetworkIcon } from './NetworkIcon'
import { NETWORKS_MAP } from '@/lib/networks'
import { formatReignDuration } from '@/lib/utils/time'
import type { NetworkId } from '@/lib/networks'

type King = {
  id: string
  handle: string
  network: string
  reigned_at: string
}

type Props = {
  initialKing: King | null
  initialPrice: number
  onClaim: () => void
}

export function ThroneHero({ initialKing, initialPrice, onClaim }: Props) {
  const [king, setKing] = useState<King | null>(initialKing)
  const [price, setPrice] = useState(initialPrice)
  const [duration, setDuration] = useState('')
  const supabase = createBrowserClient()

  const refreshKing = useCallback(async () => {
    const res = await fetch('/api/king')
    if (!res.ok) return
    const data = await res.json()
    setKing(data.current_king)
    setPrice(data.current_price)
  }, [])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('state-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'state', filter: 'id=eq.1' },
        refreshKing
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, refreshKing])

  // Polling fallback (every 30s) in case WebSocket drops
  useEffect(() => {
    const interval = setInterval(refreshKing, 30_000)
    return () => clearInterval(interval)
  }, [refreshKing])

  // Live duration counter
  useEffect(() => {
    if (!king) return
    const tick = () => setDuration(formatReignDuration(king.reigned_at))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [king])

  const network = king ? NETWORKS_MAP[king.network as NetworkId] : null
  const profileUrl = king && network ? network.buildUrl(king.handle) : null

  return (
    <section className="flex flex-col items-center text-center py-16 px-6 border-b border-bg-card">
      {/* Title */}
      <div className="inline-block border-t-2 border-b-2 border-gold px-4 py-1 mb-5">
        <span className="text-gold text-[10px] font-bold uppercase tracking-[6px]">Sovereign</span>
      </div>

      {king ? (
        <>
          <p className="text-gold-dark text-[9px] uppercase tracking-[3px] mb-1">currently reigning</p>
          <h1 className="text-gold font-serif text-5xl sm:text-6xl font-black leading-tight mb-3">
            @{king.handle}
          </h1>

          {/* Network badge */}
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit @${king.handle} on ${network?.label}`}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-card border border-bg-elevated hover:border-text-muted transition-colors mb-4"
            >
              <NetworkIcon networkId={king.network} size={20} />
            </a>
          )}

          <p className="text-text-muted font-mono text-xs mb-8">{duration}</p>
        </>
      ) : (
        <>
          <p className="text-gold-dark text-sm mb-6">No one reigns yet. Be the first.</p>
        </>
      )}

      {/* CTA */}
      <button
        onClick={onClaim}
        className="bg-gold text-bg-base font-black text-sm uppercase tracking-[3px] px-10 py-3.5 hover:bg-yellow-300 transition-colors"
      >
        Claim the Throne — ${(price / 100).toFixed(0)}
      </button>
      <p className="text-bg-card text-[10px] mt-3 tracking-wide">price increases $1 with every purchase</p>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ThroneHero.tsx lib/utils/time.ts
git commit -m "feat: add ThroneHero component with Supabase Realtime subscription and polling fallback"
```

---

## Task 12: StatsGrid + RecentKings Components

**Files:**
- Create: `components/StatsGrid.tsx`
- Create: `components/RecentKings.tsx`

- [ ] **Step 1: Create StatsGrid**

Create `components/StatsGrid.tsx`:

```tsx
import { NetworkIcon } from './NetworkIcon'
import type { Stats } from '@/lib/supabase/types'

type Props = { stats: Stats; totalKings: number }

function StatCard({
  icon,
  label,
  handle,
  network,
  sub,
}: {
  icon: string
  label: string
  handle?: string | null
  network?: string | null
  sub?: string | null
}) {
  return (
    <div className="bg-bg-base p-4 text-center flex flex-col items-center gap-1">
      <div className="text-gold-dark text-[8px] uppercase tracking-[3px] mb-1">
        {icon} {label}
      </div>
      {handle ? (
        <>
          <div className="flex items-center gap-1.5">
            {network && <NetworkIcon networkId={network} size={12} />}
            <span className="text-gold text-sm font-black font-serif">@{handle}</span>
          </div>
          {sub && <span className="text-text-dim font-mono text-[10px]">{sub}</span>}
        </>
      ) : (
        <span className="text-text-dim text-xs">No data yet</span>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function StatsGrid({ stats, totalKings }: Props) {
  const { longest_reign, biggest_spender, fastest_dethroned, most_attempts } = stats

  return (
    <div className="grid grid-cols-2 gap-px bg-bg-card">
      <StatCard
        icon="👑"
        label="Longest Reign"
        handle={longest_reign?.handle}
        network={longest_reign?.network}
        sub={longest_reign?.duration_seconds != null ? formatDuration(longest_reign.duration_seconds) : null}
      />
      <StatCard
        icon="💸"
        label="Biggest Spender"
        handle={biggest_spender?.handle}
        network={biggest_spender?.network}
        sub={biggest_spender?.total_cents != null ? `$${(biggest_spender.total_cents / 100).toFixed(0)} total` : null}
      />
      <StatCard
        icon="⚡"
        label="Fastest Dethroned"
        handle={fastest_dethroned?.handle}
        network={fastest_dethroned?.network}
        sub={fastest_dethroned?.duration_seconds != null ? formatDuration(fastest_dethroned.duration_seconds) : null}
      />
      <StatCard
        icon="🔁"
        label="Most Attempts"
        handle={most_attempts?.handle}
        network={most_attempts?.network}
        sub={most_attempts?.count != null ? `${most_attempts.count} purchases` : null}
      />
      <div className="col-span-2 bg-bg-base p-4 text-center">
        <div className="text-gold-dark text-[8px] uppercase tracking-[3px] mb-1">🏰 Total Kings</div>
        <div className="text-gold text-3xl font-black font-serif">{totalKings}</div>
        <div className="text-text-dim font-mono text-[10px]">unique rulers</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create RecentKings**

Create `components/RecentKings.tsx`:

```tsx
import { NetworkIcon } from './NetworkIcon'
import type { RecentKing } from '@/lib/supabase/types'

type Props = { kings: RecentKing[] }

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export function RecentKings({ kings }: Props) {
  if (kings.length === 0) return null

  return (
    <div className="px-4 py-5">
      <p className="text-gold-dark text-[8px] uppercase tracking-[4px] mb-3">Recent Kings</p>
      <div className="flex flex-col gap-1.5">
        {kings.map((king, i) => (
          <div
            key={king.id}
            className={`flex items-center justify-between px-3 py-2 ${
              i === 0 ? 'bg-bg-elevated border-l-2 border-gold' : 'bg-bg-base border-l-2 border-bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <NetworkIcon networkId={king.network} size={12} />
              <span className={`font-serif text-sm font-bold ${i === 0 ? 'text-gold' : 'text-text-muted'}`}>
                @{king.handle}
              </span>
            </div>
            <span className="text-text-dim font-mono text-[10px]">
              ${(king.price_paid / 100).toFixed(0)} · {timeAgo(king.reigned_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/StatsGrid.tsx components/RecentKings.tsx
git commit -m "feat: add StatsGrid and RecentKings components"
```

---

## Task 13: i18n Setup

**Files:**
- Create: `i18n.ts`
- Create: `middleware.ts`
- Create: `messages/en.json`
- Create: `messages/pt.json`
- Create: `components/LanguageToggle.tsx`
- Modify: `next.config.ts`

- [ ] **Step 1: Create i18n config**

Create `i18n.ts`:

```typescript
import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['en', 'pt'] as const

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as (typeof locales)[number])) notFound()
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 2: Create middleware**

Create `middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localeDetection: true,
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

- [ ] **Step 3: Update next.config.ts**

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Create English messages**

Create `messages/en.json`:

```json
{
  "hero": {
    "title": "Sovereign",
    "currentlyReigning": "currently reigning",
    "noKing": "No one reigns yet. Be the first.",
    "claim": "Claim the Throne — ${price}",
    "priceNote": "price increases $1 with every purchase"
  },
  "modal": {
    "title": "Claim the Throne",
    "handleLabel": "Your @ handle",
    "handlePlaceholder": "your handle",
    "networkLabel": "Social Network",
    "pay": "Pay {price} via PayPal",
    "paying": "Redirecting...",
    "redirectNote": "You will be redirected to PayPal to complete payment",
    "moreNetworks": "More",
    "lessNetworks": "Less"
  },
  "stats": {
    "longestReign": "Longest Reign",
    "biggestSpender": "Biggest Spender",
    "fastestDethroned": "Fastest Dethroned",
    "mostAttempts": "Most Attempts",
    "totalKings": "Total Kings",
    "uniqueRulers": "unique rulers",
    "noData": "No data yet"
  },
  "recent": {
    "title": "Recent Kings"
  }
}
```

- [ ] **Step 5: Create Portuguese messages**

Create `messages/pt.json`:

```json
{
  "hero": {
    "title": "Sovereign",
    "currentlyReigning": "reinando agora",
    "noKing": "Ninguém reina ainda. Seja o primeiro.",
    "claim": "Reivindicar o Trono — ${price}",
    "priceNote": "o preço aumenta $1 a cada compra"
  },
  "modal": {
    "title": "Reivindicar o Trono",
    "handleLabel": "Seu @ handle",
    "handlePlaceholder": "seu handle",
    "networkLabel": "Rede Social",
    "pay": "Pagar {price} via PayPal",
    "paying": "Redirecionando...",
    "redirectNote": "Você será redirecionado ao PayPal para concluir o pagamento",
    "moreNetworks": "Mais",
    "lessNetworks": "Menos"
  },
  "stats": {
    "longestReign": "Reinado Mais Longo",
    "biggestSpender": "Maior Gastador",
    "fastestDethroned": "Destronado Mais Rápido",
    "mostAttempts": "Mais Tentativas",
    "totalKings": "Total de Reis",
    "uniqueRulers": "governantes únicos",
    "noData": "Sem dados ainda"
  },
  "recent": {
    "title": "Reis Recentes"
  }
}
```

- [ ] **Step 6: Create LanguageToggle**

Create `components/LanguageToggle.tsx`:

```tsx
'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
      {['en', 'pt'].map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-1.5 py-0.5 transition-colors ${
            locale === l ? 'text-gold' : 'text-text-dim hover:text-text-muted'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add i18n.ts middleware.ts messages/ components/LanguageToggle.tsx next.config.ts
git commit -m "feat: add next-intl i18n with EN/PT support and LanguageToggle"
```

---

## Task 14: Main Page + Layout Assembly

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update globals.css**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background-color: #0a0a0a;
    color: #ffffff;
  }

  body {
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 2: Update root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sovereign',
  description: 'Pay to reign. The last one to pay has their name displayed for the world to see.',
  openGraph: {
    title: 'Sovereign',
    description: 'Pay to reign.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = await params
  const validLocales = ['en', 'pt']
  if (!validLocales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Move layout under locale segment**

Next-intl requires locale in the URL (`/en/`, `/pt/`). Move layout and page under `app/[locale]/`:

```bash
mkdir -p app/[locale]
mv app/layout.tsx app/[locale]/layout.tsx
mv app/page.tsx app/[locale]/page.tsx
```

- [ ] **Step 4: Implement main page**

Replace `app/[locale]/page.tsx`:

```tsx
import { getCurrentKing, getStats, getRecentKings } from '@/lib/supabase/queries'
import { ThroneHeroWrapper } from '@/components/ThroneHeroWrapper'
import { StatsGrid } from '@/components/StatsGrid'
import { RecentKings } from '@/components/RecentKings'
import { LanguageToggle } from '@/components/LanguageToggle'

export const revalidate = 0   // always fresh

export default async function HomePage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const { success } = await searchParams

  const [kingData, stats, recentKings] = await Promise.all([
    getCurrentKing(),
    getStats(),
    getRecentKings(),
  ])

  return (
    <main className="min-h-screen bg-bg-base max-w-lg mx-auto">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-bg-card">
        <span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">sovereign</span>
        <LanguageToggle />
      </nav>

      {/* Success banner */}
      {success === 'true' && (
        <div className="bg-gold/10 border-b border-gold/20 px-4 py-3 text-center">
          <p className="text-gold text-xs tracking-wide">
            Payment received — you&apos;ll be crowned shortly.
          </p>
        </div>
      )}

      {/* Hero with realtime */}
      <ThroneHeroWrapper
        initialKing={kingData.current_king}
        initialPrice={kingData.current_price}
      />

      {/* Stats */}
      <StatsGrid stats={stats} totalKings={kingData.total_kings} />

      {/* Recent Kings */}
      <RecentKings kings={recentKings} />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-bg-card">
        <p className="text-text-dim font-mono text-[9px] tracking-widest uppercase">sovereign · pay to reign</p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 5: Create ThroneHeroWrapper (client boundary)**

Create `components/ThroneHeroWrapper.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { ThroneHero } from './ThroneHero'
import { PaymentModal } from './PaymentModal'

type King = {
  id: string
  handle: string
  network: string
  reigned_at: string
} | null

type Props = {
  initialKing: King
  initialPrice: number
}

export function ThroneHeroWrapper({ initialKing, initialPrice }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <ThroneHero
        initialKing={initialKing}
        initialPrice={initialPrice}
        onClaim={() => setModalOpen(true)}
      />
      {modalOpen && (
        <PaymentModal
          price={initialPrice}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 6: Run dev server and verify**

```bash
npm run dev
```

Open http://localhost:3000 — verify:
- Page loads in English
- Switches to `/pt` on language toggle
- Hero section shows "No one reigns yet" (empty DB)
- Stats cards show "No data yet"
- Clicking "Claim the Throne" opens modal
- Modal shows handle input + network grid

- [ ] **Step 7: Commit**

```bash
git add app/ components/ThroneHeroWrapper.tsx
git commit -m "feat: assemble main page with hero, stats, recent kings, i18n, and payment modal"
```

---

## Task 15: Full Integration Smoke Test

**Goal:** Verify the complete payment flow works end-to-end using PayPal sandbox.

- [ ] **Step 1: Set up PayPal sandbox credentials**

1. Go to https://developer.paypal.com → Log in
2. Create a sandbox app → copy Client ID and Client Secret
3. Update `.env.local` with sandbox credentials and `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`
4. Create a webhook in the PayPal developer dashboard pointing to your URL (use ngrok for local testing)
5. Copy the Webhook ID into `PAYPAL_WEBHOOK_ID` in `.env.local`

- [ ] **Step 2: Set up ngrok for local webhook testing**

```bash
# In a separate terminal:
npx ngrok http 3000
# Copy the HTTPS URL, e.g. https://abc123.ngrok-free.app
```

Update PayPal webhook URL in developer dashboard to `https://abc123.ngrok-free.app/api/paypal/webhook`

- [ ] **Step 3: Run dev server**

```bash
npm run dev
```

- [ ] **Step 4: Run full payment flow**

1. Open http://localhost:3000
2. Click "Claim the Throne"
3. Enter a test handle (e.g. `testuser`) and select Instagram
4. Click Pay → redirected to PayPal sandbox
5. Log in with a sandbox buyer account and complete payment
6. Redirected back to `/?success=true` → success banner shows
7. Within seconds: site updates to show `@testuser` without refresh (realtime working)
8. Stats update: Total Kings = 1

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: complete Sovereign v1 — integration verified with PayPal sandbox"
```

---

## Task 16: Deployment

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create Vercel config**

Create `vercel.json`:

```json
{
  "framework": "nextjs"
}
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --prod
```

Follow prompts to link to your Vercel account and project.

- [ ] **Step 3: Set environment variables in Vercel**

In Vercel dashboard → Project → Settings → Environment Variables, add all vars from `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_BASE_URL           → https://api-m.paypal.com  (production)
NEXT_PUBLIC_BASE_URL      → https://your-domain.vercel.app
```

- [ ] **Step 4: Update PayPal webhook URL**

In PayPal developer dashboard, update the webhook URL to your production Vercel URL:
`https://your-domain.vercel.app/api/paypal/webhook`

- [ ] **Step 5: Verify production**

1. Open production URL
2. Confirm page loads
3. Confirm realtime works (open two tabs, pay in one, other updates)

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "chore: add Vercel deployment config"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ SPA with giant @ display — ThroneHero
- ✅ Price starts $1, increases $1 per purchase — `crown_new_king` RPC + checkout
- ✅ PayPal payment — `/api/checkout` + `/api/paypal/webhook`
- ✅ Supabase Realtime — ThroneHero subscription + 30s polling fallback
- ✅ Network badge (icon + link) — NetworkIcon + profileUrl in ThroneHero
- ✅ Stats: Longest Reign, Biggest Spender, Fastest Dethroned, Most Attempts, Total Kings — StatsGrid + `get_stats` RPC
- ✅ Recent Kings feed — RecentKings
- ✅ Mobile-first — Tailwind responsive classes
- ✅ i18n EN/PT — next-intl + messages/ + LanguageToggle
- ✅ Idempotent webhook — `paypal_order_id` UNIQUE constraint + RPC check
- ✅ Input validation — regex in checkout route + modal
- ✅ Error handling — all error states covered in spec implemented
- ✅ TDD — tests for all 3 API routes + 2 key components
