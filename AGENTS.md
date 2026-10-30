# Agent Guide

## Project overview

Jolt Journal is a public Nuxt application for browsing one curator's energy drink flavor ratings, 1–10 scores, and repeat-buy verdicts. Supabase persistence and owner-only email/password administration are implemented; agent-facing tools are intentionally deferred.

## Stack

- Nuxt 4 and Vue 3 with TypeScript
- Tailwind CSS through `@nuxtjs/tailwindcss`
- `@lucide/vue` for interface icons
- Supabase Auth and Postgres, accessed through token-authenticated Nitro routes
- ExcelJS for the one-way workbook import script

## Commands

- `pnpm dev` starts local development.
- `pnpm build` creates a production build.
- `pnpm typecheck` runs Nuxt/Vue type checking.
- `pnpm import:ratings` regenerates `app/data/drinks.json` from `Energy Drink rating list .xlsx`.
- `pnpm db:push` applies local migrations to the linked Supabase project.
- `pnpm db:migrations` compares local and remote migration history.
- `pnpm seed:supabase` idempotently imports `app/data/drinks.json` into Supabase.
- `pnpm test:db` runs the local pgTAP RLS policy suite against a running Supabase stack.

The `20261030132254_create_drink_tracker` and `20261030140133_add_authenticated_drink_policies` migrations were applied manually in the Supabase SQL Editor. Before the first linked CLI `db:push`, mark both versions as applied so the CLI does not retry them:

`supabase migration repair --linked --status applied 20261030132254 20261030140133`

## Architecture

- `app/app.vue` owns the dashboard, filters, and high-level interactions.
- `app/components/` contains the drink table and add/edit dialog.
- `app/composables/useAuth.ts` owns browser authentication state and Supabase sessions.
- `app/composables/useDrinks.ts` reads the public archive without a session and sends the current access token for writes.
- `app/data/drinks.json` is generated seed data. Do not hand-edit it; update the workbook and run the import command.
- `app/types/drink.ts` defines the shared data model.
- `server/api/drinks/` exposes a public GET endpoint and owner-only write endpoints. `server/utils/` validates access tokens and owner status while RLS remains authoritative.
- `supabase/migrations/` is the source of truth for the database schema and security policies.
- `scripts/seed-supabase.mjs` performs the repeat-safe initial data load and is the only code that needs `SUPABASE_SECRET_KEY`.

## Conventions

- Keep components accessible and fully usable on mobile.
- Preserve the “Digital Viking” visual system: obsidian surfaces, blood-red energy, rune-like geometry, angular cut corners, Norse display type, and technical monospace labels.
- Use the established `ink`, `panel`, `metal`, `acid`, `ember`, `violet`, `cream`, `steel`, and `muted` Tailwind tokens.
- Keep business logic out of presentational components when practical.
- Treat “drinkability” as the percentage of records whose `buyAgain` value is `yes`.
- Rank brands individually only when they have at least four drinks. Combine smaller brands into the bottom-positioned “Other” leaderboard entry without changing their stored brand names.
- Keep leaderboard logo assets local in `app/assets/brand-logos/` and import them through `app/components/BrandMark.vue` so Vite owns their development and production URLs. Preserve the initials fallback for unrecognized brands and the stacked-rune mark for “Other.”
- Preserve the `unknown` buy-again state for workbook rows without a verdict.
- Never load `SUPABASE_SECRET_KEY` into Nuxt runtime config or expose it to client code. It is only for trusted maintenance scripts.
- Keep RLS enabled and privileges explicit on every Data API table. Add per-user policies with authentication rather than granting anonymous writes.
- Ordinary CRUD must use the authenticated client and must never fall back to the secret client.
- Public access is read-only and limited by RLS to the user identified in `public.site_settings`; the wishlist remains private.
- Do not expose account creation in the app. Only the designated site owner may authenticate as a curator or mutate data.
- Run both type checking and a production build before handing off changes.

## Future work

- Expose drink CRUD and summary operations through agent-friendly tools after the authenticated data boundary exists.
