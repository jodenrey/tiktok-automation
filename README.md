# tiktok-automation

A full-stack AI-powered platform that auto-generates and publishes TikTok slideshows on a schedule.

> Set up an automation once with a niche, hooks, and a style prompt. Claude generates fresh carousel content on your cron, fetches matching images, writes captions + hashtags, and publishes to TikTok.

## Stack

- **Framework**: Next.js 16 (App Router) · React 19 · TypeScript
- **Styling**: Tailwind CSS v4 · shadcn-style components · `lucide-react`
- **Database**: PostgreSQL via Prisma 6
- **Auth**: NextAuth v5 (Credentials provider, JWT sessions)
- **AI**: Anthropic Claude (`@anthropic-ai/sdk`) — slide content + captions
- **Image search**: Unsplash · Google CSE · Pinterest fallback (graceful)
- **Job scheduling**: BullMQ + Redis (graceful inline fallback if no Redis)
- **Billing (test mode)**: Stripe Checkout → grants `User.purchasedCredits` via webhook (`/settings/billing`)
- **TikTok publishing**: Content Posting API integration (PULL_FROM_URL)

## Features

| Page | What it does |
|------|--------------|
| `/` Landing | Marketing site with hero, features, pricing |
| `/login`, `/signup` | Email + password auth (Credentials provider) |
| `/dashboard` | Stats cards, automations list, recent generations |
| `/automations` | Full automations list |
| `/automations/new` | Create a new automation: title, niche, hooks, style prompt, image source, schedule, TikTok account, caption mode |
| `/automations/[id]` | Detail view with run-now / pause / resume / delete |
| `/automations/[id]/edit` | Edit existing automation (same form, prefilled) |
| `/posts` | All slideshows generated, manual or automated |
| `/posts/[id]` | **Slideshow preview** — interactive carousel viewer with thumbs, caption, hashtags, analytics |
| `/analytics` | Aggregate views / likes / shares / saves across posts |
| `/collections` | Image collection library (UI scaffolded) |
| `/settings` | Account, TikTok connections, Stripe billing shortcut |
| `/settings/billing` | Buy export **credits** (Stripe test Checkout + webhook grant) |

## How the automation pipeline works

1. **Cron fires** (BullMQ repeatable job, in PST timezone) → enqueues `run-automation` for the automation id.
2. **Worker picks up the job** (`npm run worker`):
   - Picks a hook that hasn't been used in the last 20 runs (`src/lib/run-automation.ts`)
   - Calls Claude with the user's `stylePrompt` + hook → returns a JSON blob with slides, caption, hashtags (`src/lib/claude.ts`)
   - For each slide, fetches an image from Unsplash / Google CSE / a user collection (`src/lib/images.ts`)
   - Persists the slideshow + slides + post record in Postgres
   - Optionally calls the TikTok Content Posting API (`src/lib/tiktok.ts`)
   - Consumes credits (monthly `credits` first, then `purchasedCredits`)

If `REDIS_URL` is **not** set, scheduling falls back to inline execution — clicking *Run now* in the UI runs the full pipeline synchronously, so the demo works end-to-end with zero infra.

If `ANTHROPIC_API_KEY` is **not** set, content generation falls back to a deterministic mock so the UI stays clickable.

If `UNSPLASH_ACCESS_KEY` is **not** set, image search falls back to seeded Picsum URLs.

## Quick start

```bash
# 1. Install
npm install

# 2. Bring up Postgres + Redis (or point at hosted ones)
docker run --name tiktok-automation-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
docker run --name tiktok-automation-redis -p 6379:6379 -d redis:7

# 3. Configure env
cp .env.example .env
# then fill in DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, UNSPLASH_ACCESS_KEY, REDIS_URL

# 4. Push schema + seed
npm run db:push
npm run db:seed     # creates demo@tiktok-automation.dev / password123

# 5. Run the app
npm run dev         # → http://localhost:3000

# 6. (Optional) Run the worker for cron schedules
npm run worker
```

### Default demo credentials (after `npm run db:seed`)

```
Email:    demo@tiktok-automation.dev
Password: password123
```

## Stripe credits (testing)

1. In [Stripe Dashboard → Test mode](https://dashboard.stripe.com/test/apikeys) copy **`STRIPE_SECRET_KEY`** into `.env`. Optionally set **`NEXT_PUBLIC_APP_URL`** (defaults to `NEXTAUTH_URL` for redirects).
2. Forward webhooks to your local Next server with the Stripe CLI ([install Stripe CLI](https://stripe.com/docs/stripe-cli)):

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the printed **`whsec_…`** signing secret → **`STRIPE_WEBHOOK_SECRET`** in `.env`, restart `npm run dev`.
3. Open **`/settings/billing`**, purchase a pack (use test card **`4242424242424242`**).

Credits are appended to **`purchasedCredits`** on `checkout.session.completed`. Idempotent by Stripe event id (table `StripeEvent`). **Run `npm run db:push`** after pulling so `stripeCustomerId`, `StripeEvent`, and webhook columns exist.

## Project structure

```
tiktok-automation/
├── prisma/
│   ├── schema.prisma          # User, Automation, Schedule, Slideshow, Slide, Post, Collection, TikTokAccount
│   └── seed.ts                # demo user + automation
├── src/
│   ├── app/
│   │   ├── (auth)/{login,signup}/    # auth pages
│   │   ├── (app)/                    # protected routes (dashboard, automations, posts, analytics, ...)
│   │   ├── api/
│   │   │   ├── auth/                 # nextauth + register
│   │   │   ├── automations/          # CRUD + /run
│   │   │   ├── slideshows/           # generate + publish
│   │   │   └── images/search         # unsplash/google/picsum proxy
│   │   ├── page.tsx                  # landing page
│   │   ├── layout.tsx
│   │   └── globals.css               # tailwind v4 theme + dark mode tokens
│   ├── components/
│   │   ├── ui/                       # shadcn-style primitives (button, card, dialog, ...)
│   │   ├── app-sidebar.tsx
│   │   ├── automation-form.tsx
│   │   ├── slideshow-viewer.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth v5 config
│   │   ├── prisma.ts                 # singleton client
│   │   ├── claude.ts                 # Anthropic wrapper + mock fallback
│   │   ├── images.ts                 # Unsplash / Google / picsum
│   │   ├── tiktok.ts                 # Content Posting API + simulator
│   │   ├── queue.ts                  # BullMQ queue + scheduler + inline fallback
│   │   ├── run-automation.ts         # the pipeline (Claude → images → DB → TikTok)
│   │   ├── schemas.ts                # zod input schemas
│   │   └── utils.ts                  # cn(), describeCron(), formatNumber()
│   └── workers/
│       └── automation-worker.ts      # BullMQ worker entry (npm run worker)
├── middleware.ts                     # NextAuth middleware (protects /dashboard, /automations, ...)
├── .env.example
└── README.md
```

## Roadmap / what's stubbed

These are scaffolded but not fully wired — pull requests welcome:

- Real TikTok OAuth flow (the `/api/tiktok/callback` route + the connect button on Settings)
- Image collection uploads (Supabase / S3 SDK is referenced in `.env`, UI is stubbed)
- Real-time analytics sync from TikTok (rows already track per-post metrics)
- Per-slide manual override / regeneration in the slideshow viewer
- Webhook events for finished generations

## Notes on the tech choices

- **NextAuth v5 + JWT sessions** — keeps the middleware edge-compatible and avoids a DB session table.
- **Prisma 6** — Prisma 7 deprecated `datasource.url` in favor of `prisma.config.ts` + driver adapters; we stay on 6.x for a simpler local setup.
- **Tailwind v4** — uses the new `@theme` block for tokens; dark-mode is opt-in via `.dark` class on `<html>` (forced on by default in `layout.tsx`).
- **BullMQ** — repeatable jobs are upserted with a stable id derived from `automationId` + `cron`, so re-saving an automation never double-schedules.
