# CLAUDE.md

> **Philosophy:** This file holds only what an agent *cannot* discover by reading the code —
> tooling choices, gotchas, and non-obvious conventions. If it can be found in the codebase,
> delete it. Treat this as a living list of landmines, not permanent documentation.

MLMH Shop — Next.js e-commerce app selling guitar tablatures. Prisma/PostgreSQL, Stripe,
Scaleway S3, Clerk auth, Docker.

## Source template

This project follows the patterns of the Next.js template at
`/Users/martinlelong/Code/v2/33tours-templates/nextjs-template`.
Before implementing routing, caching/revalidation, error handling, images or DB access,
**read the equivalent file in the template first** and follow its pattern. Deviate only with a
documented reason.

## ⚠️ Landmines

- **Secrets / env vars:** NEVER read, open, print or otherwise access the developer's
  environment-variable files (`.env*`, `.env.deploy`, …) or their values without explicit
  permission. Ask first, every time.
- **Working directory:** the app lives in `mlmh-shop-app/`, NOT the repo root. Run all
  `npm`/`npx`/`next` commands from `mlmh-shop-app/`. The repo root holds only docs, deploy
  config and data dumps.
- **Prisma client import:** import the singleton from `@/app/prisma` (i.e. `app/prisma.ts`),
  not `@prisma/client` directly.
- **Stack:** Next 16 / React 19 / Clerk 7 — upgraded. **Prisma stays at 6** on purpose:
  Prisma 7's new `prisma-client` generator drops relations from query result types whenever a
  `where`/`orderBy` contains a literal (enum value, sort direction) — a reproducible generator
  type regression (v7.8). Do NOT re-attempt the Prisma 7 upgrade until that's fixed upstream.
  Stay on **npm** (no bun). Check what's actually installed before assuming an API exists.
- **Build/dev use webpack, not Turbopack:** scripts pass `--webpack` to keep the
  `next.config.js` node-polyfill `webpack` config working (Turbopack is the Next 16 default and
  ignores it). Migrating to Turbopack means removing those client-side node polyfills first.
- **ESLint is flat config** (`eslint.config.mjs`, `next lint` removed in Next 16). The
  `react-hooks/set-state-in-effect` rule is set to `warn` (pre-existing patterns to refactor).

## Database — developer-owned (do NOT touch)

- **Never generate the Prisma client yourself** (`prisma generate`) — the developer does it
  every time.
- **Never modify the schema** (`prisma/schema.prisma`) or create/apply migrations without
  asking first — the developer does it himself.
- Production migrations are applied only by the CI/CD (`prisma migrate deploy`).

## Documentation

Use **Context7** for library/API docs and setup steps, without being asked.

| Library | Context7 ID |
| --- | --- |
| Next.js | `/vercel/next.js` |
| Prisma | `/prisma/docs` |
| Stripe | `/stripe/stripe-node` |

## Stripe

See [`mlmh-shop-app/docs/stripe.md`](mlmh-shop-app/docs/stripe.md) before touching anything
payment-related. Key points:
- Follows the t3dotgg "single sync function = source of truth" pattern, adapted to **one-time
  payments** (not subscriptions).
- The webhook lives at `/api/webhook/stripe` (single handler, sync pattern, handles
  logged-in + guest). Checkout/download use the `/api/checkout-v2` + `/api/download-v2` routes.
- Two coexisting modes: **logged-in** (Clerk → `StripeCustomer` → `Purchase`, the target) and
  **guest** (legacy, no customer ID, `DownloadIntent` + email link). Do not extend guest mode.

## Conventions

- **Error logging:** `console.error('Context:', error)` everywhere.
- **Hidden content:** `hidden` boolean on Artist/Tablature controls visibility without deletion.
- **File storage:** new files → Scaleway S3 with unique keys + signed URLs; legacy files may
  still use local `public/uploads/`.
- **Custom types:** `app/types/types.ts` extends Prisma-generated types.
