# 03 — Live Verdict for a FlyingSpot

**What to build:** Opening a saved FlyingSpot fetches current weather via the Open-Meteo client, computes a Verdict against the pilot's DroneProfile thresholds, and displays it as a red/yellow/green badge alongside cloud cover. This is the core "is it safe to fly" moment the whole app exists for.

**Blocked by:** 01 — App shell + DroneProfile creation & storage, 02 — Add and store a FlyingSpot

**Status:** ready-for-agent

- [ ] Opening a FlyingSpot triggers a weather fetch — no auto-fetch on launch or in the list view (ADR-0007)
- [ ] Verdict is computed via `computeVerdict()` against the active DroneProfile's thresholds for the current point in time (ADR-0006)
- [ ] Verdict level (green/yellow/red) is displayed as a badge
- [ ] Cloud cover is shown but never affects the badge level
- [ ] Wind speed is displayed via `formatWindSpeed()` (regional km/h vs mph)
- [ ] If the pilot has no DroneProfile yet, they're prompted to create one rather than seeing a broken or blank Verdict
