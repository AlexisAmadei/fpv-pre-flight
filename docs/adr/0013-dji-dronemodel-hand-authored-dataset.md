# DroneModel is a hand-authored, DJI-only dataset

Pre-Flight lets a pilot seed a camera DroneProfile's wind and gust Thresholds from a known DJI airframe (`DroneModel`) instead of a hand-picked WeightClass bracket. The dataset is a small, hardcoded TypeScript constant, DJI-specific, covering six current and prior-generation models: Neo, Mini 4 Pro, Mini 5 Pro, Air 3S, Mavic 3 Pro, Mavic 4 Pro.

## Why hand-authored, not a bundled third-party dataset

ADR 0012 established the pattern for this kind of question — bundle rather than fetch (ADR 0002, ADR 0004: no backend, no API keys, F-Droid eligible) — and found a suitable open dataset (OurAirports) for airfields. No equivalent exists for drone specs. Wikipedia/Wikidata entries are CC-BY-SA, which carries a share-alike/attribution obligation that doesn't cleanly bundle into an MIT codebase the way OurAirports' public-domain Unlicense did; no dedicated, license-clean, spec-focused open dataset comparable to OurAirports was found. Hand-authoring a small array is the same pattern `weightClasses.ts` already uses for WeightClass defaults, so it introduces no new architecture.

## Why DJI-specific, not brand-agnostic

CONTEXT.md's `DroneModel` glossary entry originally described a brand-neutral concept. This ADR narrows it: the type is named and shaped around DJI specifically, not generalized for a hypothetical future Autel or Skydio entry. If another brand is added later, that is a new decision to make then, not a speculative abstraction now.

## Why six models, current and prior generation

DJI's consumer camera-drone lineup moves fast — by the time this was scoped, Mini 5 Pro and Mavic 4 Pro had already superseded Mini 4 Pro and Mavic 3 Pro as DJI's current mainstream models. Both generations are included because pilots keep flying prior-generation hardware well past its replacement's release. Enterprise, niche, and clearly discontinued variants are out of scope for this pass.

## What each model seeds, and what it doesn't

A DroneModel seeds only the two Threshold fields DJI actually publishes a spec for:

- **Wind speed and gust Thresholds** — from the model's own published max wind-resistance rating, converted to km/h.
- **Rain probability and UV index Thresholds** — DJI doesn't publish these, so they fall back to whichever camera WeightClass bracket (sub-250g / 250g–900g / 900g+) the model's own published weight lands in.

This means picking a DroneModel still resolves to a full `VerdictThresholds` object before save, and per-metric Reset (in threshold editing) restores each field to however it was originally seeded — the model's rating for wind/gust, the bracket default for rain/UV — rather than a single flattened source.

Selecting a DroneModel bypasses the WeightClass step entirely: a real airframe has one real weight, so asking the pilot to also pick a bracket would be redundant and could contradict the model's actual class. The picker is grouped by DJI product line (Neo, Mini, Air, Mavic) and carries an explicit "choose weight class manually" option alongside the models, which is what CONTEXT.md's "always escapable" guarantee for DroneModel actually is in the UI — a camera drone with no matching model, or a pilot who just doesn't want to use one, falls back to picking a WeightClass bracket by hand in the same screen.

## Consequences

- DJI's spec pages don't consistently publish wind resistance in the same units (sometimes a "Level" label, sometimes raw m/s), and takeoff weight can vary by battery variant. One canonical weight and wind figure was picked per model at write time; these should be re-verified against DJI's current spec pages before each figure is relied on, since DJI revises product pages over time.
- No changelog or feed signals a new DJI release — someone has to notice and manually add a new model. This is an accepted, unautomated maintenance burden, mitigated by the fact that a missing or stale model never blocks a pilot: WeightClass fallback and manual Threshold override are both always available.
- This dataset lands alongside `DroneKind` (FPV vs. camera) and the camera WeightClass brackets, neither of which existed in code before this decision — `DroneModel` cannot exist without a camera-kind DroneProfile to attach to.
