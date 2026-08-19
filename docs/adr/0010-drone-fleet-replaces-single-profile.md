# A fleet of DroneProfiles replaces the one-profile-per-install model

A pilot now keeps several DroneProfiles and marks one as the drone currently being flown; every Verdict is computed against that drone's Thresholds. This supersedes the "One DroneProfile per install" rule recorded in CONTEXT.md and implemented by the original `droneProfile` storage key. The driver is the UI design for the app, which shows a fleet list, a "Fly this" action, and drone chips on the spot detail screen — all of which are meaningless with a single profile. It also matches how pilots actually own equipment: a tiny whoop and a 7" long-range build have genuinely different wind limits, and swapping the active drone is the fastest way to ask "can I fly *this* one right now?" without re-editing Thresholds.

Storage moved from a single `droneProfile` object to a `droneProfiles` array plus an `activeDroneProfileId` key. `getDroneProfile`/`saveDroneProfile` are gone, replaced by `listDroneProfiles`, `getActiveDroneProfile`, `addDroneProfile`, `updateDroneProfile`, `deleteDroneProfile`, and `setActiveDroneProfile`. Reads migrate a pre-fleet `droneProfile` forward on first access rather than requiring a migration step at launch; the legacy key is left in place rather than deleted, since reads should stay side-effect free and a stale key is harmless.

## Consequences

- Deleting the flying drone hands flying status to whichever profile remains, so the app never sits in a "fleet exists but nothing is flying" state. Deleting the last one leaves nothing flying, which the Verdict area renders as its existing no-profile call to action.
- A dangling `activeDroneProfileId` (possible if an older build removed a profile without clearing it) falls back to the first profile rather than reporting no drone.
- Checklists are keyed by DroneProfile id, so deleting a drone must also evict its Checklist or the entries would leak into a future profile that happened to reuse the id.
- The migration path only runs while the legacy key exists. It can be deleted once no install plausibly predates the fleet model.
