# 06 — Per-metric threshold overrides

**What to build:** On a DroneProfile, a pilot can override individual Threshold values (wind, gusts, rain probability, UV) instead of accepting the WeightClass defaults, and the Verdict recomputes against the overrides.

**Blocked by:** 01 — App shell + DroneProfile creation & storage

**Status:** ready-for-agent

- [ ] Pilot can edit a DroneProfile's individual thresholds (`windSpeedMax`, `windGustsMax`, `precipitationProbabilityMax`, `uvIndexMax`)
- [ ] Overridden thresholds persist locally with the DroneProfile
- [ ] Verdict computation uses the overridden thresholds, not the WeightClass defaults, once set
- [ ] Pilot can reset a threshold back to its WeightClass default
