# 0005 Spot privacy model

Date: 12 Oct 2026. Status: accepted.

**Decision.**

| Visibility | Who sees the spot | Who gets the exact point |
| --- | --- | --- |
| Only you (`private`) | The author | The author |
| Followers (`followers`) | The author and accepted followers | The author and accepted followers |
| Everyone (`public`) | Everyone, signed in or not | The author only; everyone else gets a 1 km circle |

- The exact point lives in its own table, `spot_locations`, so RLS can hide it. Postgres RLS
  works on rows, not columns, so a single spots table could not hide just the point.
- **Follows need approval.** Without it, "followers only" would mean "anyone who taps
  Follow". A follow starts `pending`; only the followee can accept.
- A followers spot is invisible to non followers, not shown as an area. The privacy picker
  says "Your barkada sees the exact pin", and showing an area to strangers would surprise
  the person who picked it. This is stricter than the blueprint's data model.
- The public circle has a 500 m radius. Its center sits 100 to 400 m from the real point in
  a random direction, chosen once at pin time and never re-randomized, so averaging repeated
  reads reveals nothing and the real point is always inside the circle.
- The exact point cannot be moved. To move a pin, delete it and pin again.
- Admins never receive exact points. They see public spots and reported spots as areas.
- Blocking ends any follow both ways, so unblocking does not restore exact points.
- "Pinned on site" is true when the phone's GPS fix was within 300 m of the pin. The fix
  itself is never stored. It can be spoofed; it is one free signal, not proof.
- New accounts (under 30 days) get 3 pins a week; everyone gets at most 20 a day.
- A pin inside a protected zone is refused with the zone's reason. Zone boundaries must
  come from an official source and none are seeded yet.

**Catches** follow their spot. A catch with no spot carries no location, so it is public.
Deleting a spot keeps its catches but drops the link.

**Changed from the app screens.** The Spot screen mockup says "Approximate area. Exact pin
is for @kuyajun's followers." on a public spot. Under this model followers of a public spot
also see only the area; the copy becomes "Approximate area."
