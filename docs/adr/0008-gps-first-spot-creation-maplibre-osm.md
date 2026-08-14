# GPS-first FlyingSpot creation, using MapLibre + OpenStreetMap for maps

Adding a FlyingSpot no longer asks the pilot to type latitude/longitude by hand. The Add Flying Spot screen fetches the device's current GPS position automatically (via a new `src/location/deviceLocation.ts` seam wrapping `@react-native-community/geolocation`) and shows it as a draggable pin on a map, so the pilot can confirm or nudge the exact location before saving; the same map, non-interactive, appears on the FlyingSpot detail screen. This resolves the "maps for the V2 flying-spot search" open question left in ADR 0004.

For the map itself we picked MapLibre Native (via `@maplibre/maplibre-react-native`) rendering plain OpenStreetMap raster tiles, over Mapbox or the Google Maps SDK, because ADR 0004 already commits this app to being F-Droid-eligible and free of Google-Play-Services dependencies — Mapbox's SDK and Google Maps both fail that bar. `@react-native-community/geolocation` was chosen for the same reason: it talks to CoreLocation/Android `LocationManager` directly rather than Google Play Services' fused location provider.

Placing a spot while away from it (trip planning, address search/geocoding) is out of scope — creation is assumed to happen while standing at or very near the spot. Editing an existing spot's location, offline/cached map tiles, and map style/zoom customization are all out of scope too.

## Consequences

- The map has no offline tile cache; adding or viewing a spot's map requires network access to `tile.openstreetmap.org`. Unlike the weather data (ADR 0007), a missing map tile isn't flagged stale or degraded gracefully — it just doesn't load.
- `getCurrentPosition()` requests OS location permission as part of the call; Android additionally requires an explicit `PermissionsAndroid` request before invoking the native module, or the call can hard-crash on API 23+.
- If Mapbox is ever revisited instead of MapLibre, it should come with an ADR explicitly superseding this one and ADR 0004's "no proprietary map SDK" stance, not as an incidental dependency bump.
