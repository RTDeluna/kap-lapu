# Laot

A Taglish fishing spot map and bangka inquiry app for Mariveles, Bataan. Anglers pin
spots and log catches with real privacy controls; verified boat owners take inquiries.
This is **Stage 1**: no bookings or payments yet (see `docs/decisions/0004-fee-model-and-stages.md`).

## Setup in under 5 minutes

Needs Node 22 and, for the app on a phone, Android Studio or Xcode. MapLibre does not run
in Expo Go, so the app runs as a development build.

```sh
npm install
cp .env.example .env.local     # fill in the two values below
npx expo run:android           # or: npx expo run:ios (first build takes a while)
npm start                      # later runs: start Metro for the dev build
```

### Environment variables

| Name | Where it comes from |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase dashboard, Project settings, API |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, the publishable key. Never a secret or service role key. |

Server secrets (Semaphore, OpenAI, Anthropic, later PayMongo) go in Supabase Edge Function
secrets, never in this repo or the app.

### Local backend (Docker)

```sh
npx supabase start            # applies supabase/migrations
npx supabase test db          # pgTAP suite
```

Local phone sign in: `09170000001`, code `123456` (set in `supabase/config.toml`).

### Database tests without Docker

Needs Postgres 16 with PostGIS 3, pgTAP and `pg_prove`. This is what CI runs.

```sh
PGHOST=/tmp PGPORT=54329 PGUSER=postgres scripts/db/test-local.sh
```

## Checks

| Command | What |
| --- | --- |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (Expo config) |
| `npm test` | Unit tests for the pure helpers in `src/lib` |
| `npm run gen:tokens` | Rebuild `src/theme/tokens.ts` from `design/tokens.json` |

## Where things are

| Path | What |
| --- | --- |
| `src/app/` | Screens (Expo Router) |
| `src/data/` | Supabase client and React Query hooks |
| `src/map/` | MapLibre map and the Laot map style |
| `src/theme/` | Tokens, light and dark themes, fonts |
| `supabase/migrations/` | Schema, RLS and functions |
| `supabase/tests/` | pgTAP tests |
| `docs/api-contract.md` | Everything the app may call |
| `docs/decisions/` | Why the big choices were made |
| `design/` | Design tokens, design system notes and reference screens |
| `CLAUDE.md` | House rules for every Claude Code session |
