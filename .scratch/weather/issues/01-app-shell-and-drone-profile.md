# 01 — App shell + DroneProfile creation & storage

**What to build:** Replace the default React Native template screen with a minimal navigable app shell, and let a pilot create a DroneProfile: pick a WeightClass, see its default VerdictThresholds populate immediately, save it, and have it persist across app restarts. This is the foundation ticket — it stands up the local-only persistence utility (ADR-0002) and the app's first real screen, which every later ticket builds on.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] App launches into a real screen, not the default `NewAppScreen` RN template
- [ ] A local JSON storage utility exists (read/write/delete) with a round-trip persistence test
- [ ] Pilot can create a DroneProfile by naming it and picking a WeightClass
- [ ] Picking a WeightClass immediately populates its default VerdictThresholds (`DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS`)
- [ ] DroneProfile persists locally and is still present after an app restart
- [ ] No network/backend calls are introduced for persistence (ADR-0002)
