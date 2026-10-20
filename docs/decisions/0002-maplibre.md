# 0002 MapLibre with OpenFreeMap, not Mapbox

Date: 12 Oct 2026. Status: accepted. Supersedes the blueprint's @rnmapbox/maps choice.

**Decision.** `@maplibre/maplibre-react-native` with OpenFreeMap vector tiles and a Laot
style built from the design tokens. Later, a self hosted Bataan map file on R2 for offline
packs.

**Why.** No per user bill (Mapbox bills per monthly user past 25,000), works offline at sea,
and the style is ours to paint.

**Trade off.** MapLibre needs a development build, not Expo Go, and has no web renderer in
the same package. The owner portal on web gets its own map later.
