# Pre-Flight

A weather-conditions and equipment-checklist companion for FPV drone pilots, deciding whether it's safe to fly before heading out.

## Language

**FlyingSpot**:
A named location a pilot has saved to check flying conditions for, whether standing there or checking remotely ahead of time.
_Avoid_: Location, Site, Field

**DroneProfile**:
A saved drone the pilot flies, holding its WeightClass and its own Checklist additions and Verdict thresholds.
_Avoid_: Drone, Aircraft, Build, Quad

**DroneKind**:
Which family a DroneProfile belongs to — FPV or camera — selecting which WeightClass ladder applies and which checks are meaningful at all. Orthogonal to WeightClass: kind is a difference in nature, WeightClass a difference in degree.
_Avoid_: Type, DroneType, Category

**WeightClass**:
A size/weight category assigned to a DroneProfile that auto-populates its default Thresholds. The available classes depend on the DroneKind: FPV uses the propeller-size ladder (tiny whoop, 3", 5", 7"+ freestyle, long-range), camera uses regulatory weight brackets (sub-250g, 250g–900g, 900g+) because the 250g line is what changes a camera pilot's legal obligations.
_Avoid_: Size, Category

**DroneModel**:
A known camera airframe (Mini 4 Pro, Air 3S, Mavic 3 Pro…) carrying published specifications, selected when creating a camera DroneProfile to seed Thresholds more precisely than a WeightClass can. Always escapable: a camera drone with no matching model falls back to its WeightClass.
_Avoid_: Airframe, Aircraft, Model

**Verdict**:
The red/yellow/green go/no-go assessment for a FlyingSpot at a specific point in time (never a range or worst-case across a window), computed against a DroneProfile's thresholds. Wind, gusts, and rain probability are hard limits — any one alone past its threshold forces red regardless of the others; short of that, those three plus a light UV index contribution combine into a weighted score deciding yellow vs. green. UV index alone never forces red (heat/battery overheat risk, not a hard stop). Cloud cover is informational only and never affects the level.
_Avoid_: Score, Rating, Status

**Stale** (of cached weather data):
Weather data held past its freshness window and still shown — visibly flagged as outdated — rather than hidden or silently treated as current.
_Avoid_: Outdated, Expired, Cached

**EstimatedCloudBase**:
The height of the cloud base above ground, derived from the temperature/dew-point spread rather than measured. Named for its derivation because the estimate is least reliable for stratus, fog, and marine layers — exactly the conditions where a low base matters most. Informational only: shown alongside low-cloud cover as a corroborating signal, never a Threshold, and never affects the Verdict level.
_Avoid_: Ceiling, CloudBase, CloudHeight

**NearestAirfield**:
The distance to the closest known airfield from a FlyingSpot, with that airfield's name. An advisory proximity signal that escalates visually as distance shrinks — never an airspace clearance, since the underlying data is airfield point locations rather than controlled-airspace boundaries. Derived from the FlyingSpot's coordinates whenever it is shown rather than stored on the spot, so a corrected dataset takes effect everywhere at once. Independent of which DroneProfile is flying: a legal boundary is a property of the place, not the aircraft.
_Avoid_: AirspaceStatus, NoFlyZone, RestrictedZone, Airspace

**Threshold**:
A per-metric limit on a DroneProfile that determines where that metric falls on the Verdict's red/yellow/green scale. Defaults from the DroneProfile's WeightClass, manually overridable per metric.
_Avoid_: Limit, Setting

**GenericChecklist**:
The base set of preflight checklist items a pilot never has to type: a universal core applying to every drone, plus a per-DroneKind set applying to every drone of that kind. Kind-scoped rather than universal because the items that matter most are kind-specific — Return-to-Home altitude for camera drones, video channel for FPV — and a safety item every pilot must rediscover for themselves is one most will miss.
_Avoid_: Default Checklist, Base Checklist

**Checklist**:
The full list of preflight items for a given DroneProfile: the GenericChecklist plus that DroneProfile's own additional items. Resets to unchecked only via a manual action, independent of the Verdict/weather flow.
_Avoid_: Preflight List, Task List

## App Features

Flat, exhaustive list of what the app does. Each entry notes what it **blocks** (features that cannot work until it exists) and what it is **blocked by** (features it needs in place first). Features not yet built are marked _(planned)_.

**Create a FlyingSpot from the current GPS position**:
Requests device location (explicit Android runtime permission, iOS CoreLocation prompt), pre-fills the new spot with those coordinates, and requires a name before saving.
_Blocks_: Save a FlyingSpot, Fine-tune a FlyingSpot's position on a map, all weather and Verdict features.
_Blocked by_: nothing.

**Recover from a denied or failed location fix**:
Shows a permission-denied state with a shortcut into OS settings and auto-retries when the pilot returns to the app; shows a separate retryable error state when the fix simply fails.
_Blocks_: nothing.
_Blocked by_: Create a FlyingSpot from the current GPS position.

**Fine-tune a FlyingSpot's position on a map**:
Draggable pin over an OpenStreetMap raster map, so a GPS fix taken from a car park can be moved to the actual field.
_Blocks_: nothing.
_Blocked by_: Create a FlyingSpot from the current GPS position.

**Save a FlyingSpot**:
Persists the named spot with its coordinates to on-device storage; save stays disabled until both a name and a resolved position exist.
_Blocks_: List saved FlyingSpots, Open a FlyingSpot's detail, every weather and Verdict feature.
_Blocked by_: Create a FlyingSpot from the current GPS position.

**List saved FlyingSpots**:
Home screen listing every saved spot, with an empty state when none exist.
_Blocks_: Open a FlyingSpot's detail, Delete a FlyingSpot, Refresh every FlyingSpot at once.
_Blocked by_: Save a FlyingSpot.

**Delete a FlyingSpot**:
Removes a spot after a confirmation prompt and evicts its cached weather.
_Blocks_: nothing.
_Blocked by_: List saved FlyingSpots, Cache weather per FlyingSpot.

**Open a FlyingSpot's detail**:
Detail screen showing the spot's name, a static map of its position, and all of its weather/Verdict content.
_Blocks_: Show the current Verdict, Browse today's daylight hours, Browse the next 3 days, Preview a future day's Verdict, Flag Stale weather data.
_Blocked by_: List saved FlyingSpots.

**Create a DroneProfile**:
Names a drone and picks its WeightClass; the chosen class's default Thresholds are previewed before saving. A pilot keeps a fleet of DroneProfiles, one of which is the one currently being flown.
_Blocks_: Seed Thresholds from a WeightClass, Manually override a Threshold, Reset a Threshold to its WeightClass default, Compute a Verdict and everything downstream of it.
_Blocked by_: nothing.

**Keep a fleet of DroneProfiles**:
Lists every saved drone, shows which one is being flown, and switches between them; the Verdict everywhere is computed against the flying drone's Thresholds. Deleting a drone hands flying status to another, and removes that drone's Checklist.
_Blocks_: Work through a DroneProfile's Checklist.
_Blocked by_: Create a DroneProfile.

**Seed Thresholds from a WeightClass**:
Each WeightClass (tiny whoop, 3", 5", 7"+ freestyle, long-range) carries default wind, gust, rain-probability, and UV-index limits that populate a new DroneProfile.
_Blocks_: Compute a Verdict, Reset a Threshold to its WeightClass default.
_Blocked by_: Create a DroneProfile.

**Manually override a Threshold**:
Per-metric numeric editing of the DroneProfile's four Thresholds, saved back to the profile.
_Blocks_: nothing.
_Blocked by_: Create a DroneProfile, Seed Thresholds from a WeightClass.

**Reset a Threshold to its WeightClass default**:
Per-metric reset control, disabled while a metric already sits at its default.
_Blocks_: nothing.
_Blocked by_: Manually override a Threshold.

**Reach the DroneProfile from the spot list**:
A header action that opens threshold editing when a DroneProfile exists and profile creation when it doesn't.
_Blocks_: nothing.
_Blocked by_: Create a DroneProfile, List saved FlyingSpots.

**Prompt for a DroneProfile when a Verdict is requested without one**:
The spot detail screen replaces the Verdict with a create-profile call to action when no DroneProfile is saved.
_Blocks_: nothing.
_Blocked by_: Open a FlyingSpot's detail, Create a DroneProfile.

**Fetch a 4-day forecast**:
Pulls hourly wind, gusts, rain probability, cloud cover, and UV index plus daily maxima and sunrise/sunset for today and the next 3 days from Open-Meteo, in the spot's own timezone.
_Blocks_: Cache weather per FlyingSpot, Compute a Verdict, Browse today's daylight hours, Browse the next 3 days.
_Blocked by_: Save a FlyingSpot.

**Cache weather per FlyingSpot**:
In-memory, never-persisted cache with a 20-minute freshness window; a fresh entry is reused instead of re-fetching.
_Blocks_: Flag Stale weather data, Refresh one FlyingSpot's weather, Refresh every FlyingSpot at once, Delete a FlyingSpot (eviction).
_Blocked by_: Fetch a 4-day forecast.

**Flag Stale weather data**:
When a fetch fails but a cached forecast exists, the cached data is still shown and visibly labelled as stale rather than hidden.
_Blocks_: nothing.
_Blocked by_: Cache weather per FlyingSpot, Open a FlyingSpot's detail.

**Recover from an unavailable forecast**:
When no data at all can be resolved, the detail screen shows an error state with a retry action.
_Blocks_: nothing.
_Blocked by_: Fetch a 4-day forecast, Open a FlyingSpot's detail.

**Refresh one FlyingSpot's weather**:
Forces a re-fetch for a single spot regardless of freshness, falling back to the stale cache on failure.
_Blocks_: nothing.
_Blocked by_: Cache weather per FlyingSpot.

**Refresh every FlyingSpot at once**:
Refreshes all saved spots in parallel from the list screen; one spot's failure never blocks the others. Disabled while in flight or when no spots exist.
_Blocks_: nothing.
_Blocked by_: List saved FlyingSpots, Cache weather per FlyingSpot.

**Compute a Verdict**:
Scores one hourly weather point against a DroneProfile's Thresholds into red/yellow/green: wind, gusts, and rain probability are hard limits that alone force red; short of that those three plus a lightly weighted UV index combine into a score deciding yellow vs. green. Cloud cover is carried through but never weighted.
_Blocks_: Show the current Verdict, Preview a future day's Verdict, Report why a Verdict cannot be shown.
_Blocked by_: Fetch a 4-day forecast, Create a DroneProfile, Seed Thresholds from a WeightClass.

**Show the current Verdict**:
Colour-coded badge for the hourly point at or just before now, alongside the current wind speed and cloud cover.
_Blocks_: nothing.
_Blocked by_: Compute a Verdict, Open a FlyingSpot's detail.

**Report why a Verdict cannot be shown**:
Distinguishes fresh, stale, unavailable, and outside-daylight outcomes so the current time falling outside today's sunrise-sunset window never fabricates a Verdict for an hour nobody would fly.
_Blocks_: nothing.
_Blocked by_: Compute a Verdict, Cache weather per FlyingSpot.

**Browse today's daylight hours**:
Horizontal strip of today's hourly points trimmed to the sunrise-sunset window, each with wind speed and rain probability.
_Blocks_: nothing.
_Blocked by_: Fetch a 4-day forecast, Open a FlyingSpot's detail.

**Browse the next 3 days**:
Row per upcoming day with its max wind and max rain probability.
_Blocks_: Preview a future day's Verdict.
_Blocked by_: Fetch a 4-day forecast, Open a FlyingSpot's detail.

**Preview a future day's Verdict**:
Explicit per-day action computing a Verdict for that day's first daylight hour, shown as a dismissable badge.
_Blocks_: nothing.
_Blocked by_: Browse the next 3 days, Compute a Verdict.

**Display wind speed in the pilot's regional unit**:
Formats wind as mph in imperial-wind regions and km/h everywhere else, from the device locale; all data is fetched and computed in metric and converted only for display.
_Blocks_: nothing.
_Blocked by_: nothing.

**Navigate between screens**:
Hand-rolled screen stack with a back action, no navigation library, plus dark/light status-bar handling and safe-area padding.
_Blocks_: every screen-level feature above.
_Blocked by_: nothing.

**Store all data on-device**:
Single JSON-over-AsyncStorage seam that every repository persists through; no backend, no account, no network storage of pilot data.
_Blocks_: Save a FlyingSpot, Create a DroneProfile, Manually override a Threshold.
_Blocked by_: nothing.

**Work through the GenericChecklist**:
The universal preflight core plus the set for the flying DroneProfile's DroneKind.
_Blocks_: Work through a DroneProfile's Checklist.
_Blocked by_: nothing.

**Work through a DroneProfile's Checklist**:
The GenericChecklist plus that DroneProfile's own additional items, checked off before a flight.
_Blocks_: Manually reset a Checklist.
_Blocked by_: Work through the GenericChecklist, Create a DroneProfile.

**Add DroneProfile-specific Checklist items**:
Extra preflight items attached to one DroneProfile on top of the GenericChecklist.
_Blocks_: Work through a DroneProfile's Checklist.
_Blocked by_: Create a DroneProfile.

**Manually reset a Checklist**:
Clears all checked items via an explicit action only, independent of the Verdict and weather flow.
_Blocks_: nothing.
_Blocked by_: Work through a DroneProfile's Checklist.