Laot is a Taglish fishing and boat booking app for Bataan, starting in Mariveles. Anglers pin spots and log catches; verified bangka owners and coordinators take bookings for day trips and shared group trips. It should feel like planning a weekend trip with the barkada: sunny, warm, a little playful, and always safe.

## Voice

Write the way anglers already talk in Bataan fishing groups: casual Taglish, short sentences, ikaw and tayo.

- Use sentence case everywhere. Never all caps.
- Lead with the action or the answer: "Booked na", "Pwede pumalaot", "3 seats left".
- Say what a price covers: "₱2,500 per boat, day trip", "₱350 per seat".
- Safety copy is plain and direct, never cute: "Bawal pumalaot. May gale warning sa Bataan."
- Use po in messages to boat owners and coordinators, and in every support reply.
- No emoji in the interface. Kap Lapu carries the feeling.
- One exclamation mark at most, and only in a Kap Lapu celebration line.
- Formats: ₱2,500 (peso sign, comma), 5:00 AM, Sabado 14 Nov, 4.2 km, 0.4 m waves, 12 km/h wind.

| Moment | Copy |
| --- | --- |
| Empty map area | Wala pang spot dito. Ikaw na ang mauna. |
| Pin a spot | Pin this spot |
| Privacy picker | Sino ang makakakita? Only you, followers, or everyone (approximate area) |
| Booking confirmed | Booked na! Kita kits sa Porto, 5:00 AM. |
| Weather cancel | Malakas ang alon bukas, kaya auto cancel muna. Libre ang reschedule. |
| Owner verification | Para panatag ang lahat, verify muna natin ang ID mo. Mga 2 minuto lang po. |
| Payment failed | Hindi pumasok ang bayad. Walang nabawas. Subukan ulit? |
| No signal at sea | Walang signal. Naka save ang catch mo, ipapadala pag may signal na. |

## Color

- Day is `surface` (buhangin sand) with `ink` text. Night is the dark theme: deep sea `surface` with sand `ink`. Follow the phone's setting; anglers fish at night, so the dark theme is a first class theme, not an afterthought.
- `mango` is the one primary action per screen and the selected chip. Text on it is `on-mango`. Never use mango for decoration.
- `dagat` means the sea and trust: links, secondary actions, the Licensed badge, go weather, followers pins and the focus ring.
- `lapu` belongs to Kap Lapu and hot spot pins only. Never put text on a `lapu` fill; use `lapu-ink` on `lapu-soft` for the Fresh catch tag.
- `danger` is for errors and no go weather, always with an icon and words. Success and Licensed use `dagat`, so red and green are never told apart by hue alone.
- Cards sit on `surface-raised`; inputs, tags and photo placeholders on `surface-sunk`. Dividers are `line`; control edges are `line-strong`.
- The custom Mapbox style paints water `map-water` and land `map-land`, so pins in `mango`, `dagat`, `ink` and `lapu` stay readable.

## Type

- `display`, `title-lg` and `title` use Bricolage Grotesque: spot names, boat names, screen titles and big moments. At most one `display` per screen.
- Everything else uses Figtree: `headline` for prices and row titles, `body` for reading, `body-sm` for metadata, `label` for badges and tabs, `caption` for sources and footnotes.
- Prices, distances and weather numbers use tabular figures so columns line up.
- Never set paragraphs smaller than `body`. Older boat owners use the owner tools.

## Space, shape, depth

- Use the 4px steps: `space-4` is the screen gutter and card padding, `space-6` separates sections, `space-8` surrounds Kap Lapu.
- Every tappable thing is at least `tap-min` tall. People tap with wet hands on a moving boat.
- Corners are friendly: `radius-lg` for cards, sheets and photos, `radius-md` for buttons, `radius-pill` for chips and badges, `radius-sm` for inputs.
- Shadows only for things that float over the map: `shadow-card` for cards and pins, `shadow-sheet` for bottom sheets and the sticky booking bar. Flat everywhere else.
- Focus is a 2px solid `focus-ring` offset 2px, on every control.

## Imagery

- Real photos only: the angler's own catch, the owner's own boat. No stock boats, no stock fish, no AI made boats or catches presented as real.
- Strip location data from every uploaded photo before it is stored.
- No photo yet: use the sun and sea placeholder from `SpotCard` and `BoatCard`, with a hook or banca icon.
- Faces only when the person posted them. Never show plate numbers, house fronts or ID images anywhere in the app.

## Motion

- Short and springy: 120 to 240ms with ease out; bottom sheets use a spring. Build with Reanimated.
- Pins drop in with a small bounce; a booking confirmation lets Kap Lapu celebrate once.
- Respect reduce motion: turn off the bob, the blink and the pin bounce.

## Iconography

- Use Phosphor (phosphor-react-native): duotone weight for tab bar and feature icons, regular weight for inline icons. Size 20 inline, 24 in the tab bar.
- Phosphor has no fish hook or outrigger boat, so use the custom set in the Icons asset group: `banca.svg`, `kawil.svg`, `salbabida.svg`, `spot-pin.svg`. They are drawn on a 24 grid with a 1.75 stroke and round ends to sit beside Phosphor.
- Icons in these previews come from `Laot.Icon`, simple stand ins drawn the same way; the app uses Phosphor plus the custom set.
- Never use emoji as icons.

## Trust patterns

- Two badges, two meanings. `verified` (ID verified) means the owner passed the automatic ID and selfie check: they can chat and receive inquiries. `licensed` (Licensed) means their MARINA papers passed review: only Licensed boats show prices and take paid bookings.
- Every spot shows its privacy line: Exact pin, Followers only, Only you, or Approximate area. Public pins default to an approximate area.
- Phone numbers stay hidden until a booking is confirmed; before that, people talk in app chat.
- Reviews go both ways after a trip: renters rate the boat, owners rate the group.
- Weather status comes from the server rules and always carries the line that PAGASA and Coast Guard advisories win.

## Building with this system

- In the Expo app, load the fonts with expo-font from the `fonts/` files and map `tokens.json` into a Unistyles theme with `light` and `dark`.
- The components here are web references for look and behavior. Rebuild them as React Native components with the same props and names.
- Kap Lapu ships as a Rive file; see the Kap Lapu section.
