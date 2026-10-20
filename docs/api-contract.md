# Stage 1 API contract

What the app may call on Supabase. The app holds only the publishable key, so every
rule below is enforced in Postgres (RLS, triggers and security definer functions), never
in the app. Stage 1 has no money: no trips, bookings or payments exist yet.

## Enums

| Enum | Values |
| --- | --- |
| `spot_visibility` | `private`, `followers`, `public` |
| `follow_status` | `pending`, `accepted` |
| `boat_badge` | `none`, `verified`, `licensed` |
| `moderation_status` | `pending`, `approved`, `rejected` |
| `report_target` | `spot`, `catch`, `comment`, `profile`, `message`, `boat` |

## Functions (call with `supabase.rpc(name, args)`)

### `nearby_spots(p_lat, p_lng, p_radius_m = 20000, p_method = null)`

Spots the caller may see, nearest first, max 200 rows. Works signed out (anon sees public
spots only). Each row:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `name` | text | |
| `author_id` | uuid | |
| `author_handle` | text | |
| `visibility` | spot_visibility | |
| `lat`, `lng` | float8 | The exact pin when `is_exact`, else the fixed area center |
| `is_exact` | bool | True only for the author, or an accepted follower on a `followers` spot |
| `area_radius_m` | int | Draw a circle this size when `is_exact` is false |
| `pinned_on_site` | bool | Phone GPS was within 300 m of the pin when it was made |
| `catch_count` | int | Visible catches at this spot |
| `has_fresh_catch` | bool | A catch taken with the in-app camera in the last 72 hours |
| `methods`, `species` | text[] | Tags such as `shore`, `jigging`, `popping`, `squid` |
| `distance_m` | int | From the query point |
| `created_at` | timestamptz | |

### `get_spot(p_spot_id)`

One row with the same fields as `nearby_spots` (minus `distance_m`) plus `notes text`.
Returns no row when the caller may not see the spot.

### `pin_spot(p_name, p_lat, p_lng, p_visibility, p_methods, p_species, p_notes, p_device_lat, p_device_lng)`

Signed in only. Returns the new spot id. Raises with a Taglish message the app can show as is:

- inside a protected zone (sanctuary, port, Coast Guard area): the zone's reason
- new account over its weekly pin limit (3 a week for the first 30 days)
- name empty or over 80 characters

`p_device_lat` and `p_device_lng` are the phone's GPS fix at the moment of pinning, or null.

### `start_inquiry(p_boat_id)`

Signed in only. Returns a conversation id between the caller and the boat's owner
(and coordinator). Reuses the open one if it exists. Fails if either side blocked the other.

## Tables the app reads and writes directly

Always name the columns you select. `select *` on `profiles` is refused because
`is_admin` is not readable, and naming columns everywhere keeps that habit safe.

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | Everyone, minus people who blocked you or you blocked | Own row: `handle`, `display_name`, `avatar_path`, `bio` only |
| `follows` | Rows you are in | Insert yourself as follower (always `pending`); the followee updates `status` to `accepted`; either side deletes |
| `catches` | Same as the spot (no spot = public), hidden and blocked removed | Insert and delete your own |
| `catch_likes` | Same as the catch | Insert and delete your own |
| `comments` | Same as the catch | Insert and delete your own |
| `saved_spots` | Your own | Your own |
| `blocks` | Your own | Your own |
| `reports` | Your own | Insert your own |
| `boats` | Badge `verified` or `licensed`, or your own | Owner or coordinator edits name, home port, capacity, wave limit |
| `boat_rates` | Only for `licensed` boats (and the owner, coordinator, admins) | Owner or coordinator |
| `conversations` | Members | Through `start_inquiry` only |
| `messages` | Members | Members insert; the server sets `flagged` and `flag_reason` |

## Chat warning

When a message mentions paying outside the app, account numbers, GCash numbers, OTP codes
or links, the server sets `flagged = true` and a `flag_reason`. Show this card above it:

> Ingat po. Hindi kailanman hihingi ang Laot ng OTP, at hindi ka magbabayad bago sumakay.

## Spot privacy, in one line

Nobody but the author (and accepted followers on a `followers` spot) can ever read the exact
point. Public spots show a circle around a fixed offset center chosen once at pin time.
