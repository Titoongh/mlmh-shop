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
- **Never set Clerk `prefetchUI={false}`:** the site uses Clerk's prebuilt UI (modal
  `SignUpButton`, `openSignIn`/`openSignUp`, `UserButton`). That prop is only for fully custom
  UIs — it does NOT lazy-load on demand; it throws "Clerk was not loaded with Ui components"
  and silently breaks sign-up/sign-in (broke prod, July 2026, commit 597d735).

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

## SEO — campagne d'indexation en cours

See [`seo-plan.md`](seo-plan.md) (repo root) — the source of truth for the indexing campaign
started 2026-08-10. **Re-read it often, and when a conversation touches the site (pages,
routing, GSC, contenu), check whether a scheduled follow-up is due and offer to run it.**
- Next check: **~2026-08-25** (GSC validations + sitemap + new batch of indexing requests).
- Then: **fin septembre 2026** (résorption des ~55 "Détectée non indexée" ; sinon → backlinks).
- Update the dates here and in `seo-plan.md` after each check.
- Landmine: the root layout wraps `{children}` in a `flex` ROW container — pages must return a
  SINGLE column element, never a multi-child fragment (broke prod 2026-08-10).

## Claude tooling — access vs needs

> **⏰ At the START of EVERY session, remind Martin of the ❌/⚠️ rows below** (his explicit
> request — "tu dois me le rappeler avant chaque session pour pas que j'oublie").
> Update this table as items land; remove it when everything is ✅.

| Capability | Status | Notes |
| --- | --- | --- |
| Library docs (Context7) | ✅ | Use without being asked |
| GitHub (`gh` CLI + MCP) | ✅ | PRs, CI runs (`gh run list/watch`) |
| Browser testing (Playwright / Chrome MCP) | ✅ | Local UI checks |
| Catalog admin API as tools | ✅ | `mlmh-shop-app/docs/admin-api.md` (REST + `x-admin-api-key`); CLI `scripts/tab-uploader.ts`. Never print the key |
| Dev DB reads | ⚠️ | Via `set -a; . ./.env.development; set +a; npx tsx …` — dev ONLY, never prod. A dedicated SELECT-only `scripts/db-query.ts` would be cleaner |
| Stripe inspection | ❌ | Martin creates a **read-only restricted key** in the Stripe dashboard → `.env.development`; then build `scripts/stripe-inspect.ts` (sessions/events/payment intents). Would have made the Charles investigation a 5-min job |
| Prod server logs | ❌ | Today: hand-pasted log files. Needs Martin's input (ssh? Hostinger panel?) for a `scripts/fetch-logs.sh`; long term: Loki/Grafana (see `observabilite-logs-infra.md` at repo root) |
| Error tracking access | ❌ | GlitchTip/Sentry — part of the observability plan (repo root doc) |
| `/test-checkout` skill | ❌ | Codify the manual payment test protocol (stripe listen, test session, DB checks, email) |

## Conventions

- **Error logging:** `console.error('Context:', error)` everywhere.
- **Hidden content:** `hidden` boolean on Artist/Tablature controls visibility without deletion.
- **File storage:** new files → Scaleway S3 with unique keys + signed URLs; legacy files may
  still use local `public/uploads/`.
- **Custom types:** `app/types/types.ts` extends Prisma-generated types.
