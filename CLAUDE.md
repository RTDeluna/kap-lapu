# Laot (repo: kap-lapu)

Taglish fishing spot map and bangka inquiry app for Mariveles, Bataan. Solo build.
Read `docs/api-contract.md` before touching data code and `design/design-system.md`
before touching UI.

## Where we are

**Stage 1 only: no money.** Spots, catches, follows, reports, boat listings and inquiry
chat. Trips, bookings, payments, weather auto cancel and refunds are Stage 2 and wait for:
the concierge pilot hitting its numbers, an OPC, a lawyer's review of the owner agreement
and terms, and insurance quotes. Do not add booking or payment code without being asked.

## Stack

- Expo SDK 57, Expo Router, TypeScript strict, development builds. One codebase for
  Android, iOS and (later) the owner portal on web.
- MapLibre with OpenFreeMap tiles painted in Laot tokens. Not Mapbox.
- Supabase in Singapore: Auth (phone OTP, Google, Apple), Postgres with PostGIS, RLS,
  Edge Functions, Realtime, pg_cron.
- Icons: phosphor-react-native plus the custom banca, kawil, salbabida and spot pin set.
- Fonts: Bricolage Grotesque (display, titles) and Figtree (everything else).

## House rules

1. **RLS on every table.** `supabase/tests/01_house_rules.test.sql` fails if a table lacks
   RLS or a policy, and `tables_are` fails on any new table until you add it and its tests.
2. **No secret keys in the app.** The app ships only `EXPO_PUBLIC_SUPABASE_URL` and the
   publishable key. Semaphore, OpenAI, Anthropic, PayMongo keys live in Edge Function secrets.
3. **No ID images, ever.** Owners are checked in person at Porto with the National ID QR
   check; store only the result, the ID kind, the date and who checked.
4. **The server decides who sees what.** Privacy lives in Postgres, not in app code.
   The exact point of a spot is in `spot_locations`; only the author and accepted followers
   of a followers spot can read it. Admins cannot.
5. **Helpers go in the `private` schema** (not exposed by the API). Every security definer
   function sets `search_path = ''` and qualifies every name, including `extensions.st_*`.
6. **Writes that set trust go through functions:** `pin_spot`, `start_inquiry`, `admin_*`.
   Column level grants stop clients from setting badges, flags, `fresh_capture`, `is_admin`.
7. **Never edit a user's post.** Hide or remove on a valid report. Three reports from three
   people auto hide until an admin decides.
8. **Laot never holds owner money.** Renters pay the trip price on the boat.
9. Write the database test first for anything that protects money or privacy.

## Voice (Taglish, sentence case, no emoji)

| Moment | Copy |
| --- | --- |
| Empty map area | Wala pang spot dito. Ikaw na ang mauna. |
| Pin a spot | Pin this spot |
| Privacy picker | Sino ang makakakita? |
| Weather cancel | Malakas ang alon bukas, kaya auto cancel muna. Libre ang reschedule. |
| No signal at sea | Walang signal. Naka save ang catch mo, ipapadala pag may signal na. |
| Pay warning | Huwag magbayad bago sumakay. Hindi kailanman hihingi ang Laot ng OTP. |

Use po with owners and in support replies. One exclamation mark at most, only in a Kap Lapu
celebration. Formats: ₱2,500, 5:00 AM, Sabado 14 Nov, 4.2 km, 0.4 m waves, 12 km/h wind.

## Design tokens

Source of truth: `design/tokens.json` (copied from the Laot Design System). mango is the one
primary action per screen; dagat is links, trust and go weather; lapu is Kap Lapu and hot
spot pins only, never behind text; danger always with an icon and words. Every tappable
thing is at least 48 px. Owner screens use 17 to 18 px body and 56 px buttons. Map labels
at least 14 px with a halo.

## Commands

| Task | Command |
| --- | --- |
| Database tests (local Postgres 16 + PostGIS + pgTAP) | `PGHOST=/tmp PGPORT=54329 PGUSER=postgres scripts/db/test-local.sh` |
| Database tests (Docker) | `npx supabase start && npx supabase test db` |
| App checks | `npm run typecheck && npm run lint && npm test` |
| App on a phone | `npx expo run:android` (development build, not Expo Go) |

## Before you merge

Ask a second session to review the change for: RLS, secrets, input checks, rate limits.
