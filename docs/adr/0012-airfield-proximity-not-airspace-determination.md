# Airfield proximity is advisory, not an airspace determination

Pre-Flight tells a pilot how far the nearest known airfield is from a FlyingSpot and escalates that warning visually as the distance shrinks. It deliberately does **not** claim to determine whether a spot lies inside controlled or restricted airspace, and it links out to the pilot's national authority map instead.

This is a data-availability decision, not a scope decision. We wanted the airspace check. No open dataset supports it.

## Why not OpenAIP

OpenAIP has what we actually want — worldwide airspace polygons, crowd-sourced and well maintained. We rejected it on two independent grounds, either of which alone is disqualifying:

- **The licence is CC BY-NC 4.0.** The NonCommercial clause means it is not a free-culture licence (both the FSF and OSI reject NC terms), so bundling it in an MIT-licensed app is a licence conflict and contradicts ADR 0004's F-Droid eligibility.
- **The API requires a key**, which ADR 0004 rules out for anything the pilot does not supply themselves.

Recording this because a future contributor will find OpenAIP, see that it is plainly better data than what we ship, and needs to know it was already considered and ruled out on licence grounds rather than oversight.

Official national sources were also rejected, on fragmentation rather than licensing: EU geo-zone publication under ED-269/ED-318 is per-member-state with mostly unstated redistribution licences, and France's official DGAC layer is not openly downloadable. The FAA's UAS Facility Map is genuinely free, keyless and bundleable, but US-only.

## What we ship instead

A build-time-trimmed extract of **OurAirports** — public domain under the Unlicense, so no attribution or share-alike obligation — bundled as an app asset. Closed airports and balloonports are filtered out; heliports too, being numerous and mostly irrelevant to field flying. Filtering closed airfields is a correctness concern before it is a size one: warning a pilot about a disused strip trains them to ignore the warning.

Bundled rather than fetched because a pilot standing in a field with no signal is precisely the person who needs the check. Airfields move slowly enough that a dataset stale by an app release is acceptable, unlike weather.

`NearestAirfield` is derived from the FlyingSpot's coordinates each time it is shown rather than stored on the spot, so a corrected dataset takes effect for every saved spot at once. It is a property of the place, not the aircraft, so it does not vary by DroneProfile.

## Why partial coverage was rejected outright

We considered bundling whatever per-country airspace data does exist and accepting fragmented coverage. We rejected it because **silence reads as clearance**. A pilot in an unsupported country would get no warning and reasonably infer there was nothing to warn about — a worse outcome than never having promised the check. A partial airspace dataset presented as an airspace check is more dangerous than no check at all.

## Consequences

- The UI must carry an explicit "this is not an airspace clearance" caveat wherever `NearestAirfield` appears. This caveat is load-bearing, not boilerplate: without it the feature makes a claim the data cannot support.
- A spot can sit inside a CTR and still show a comfortable airfield distance, because control zones are irregular polygons and not circles around a runway. The deep link to the national authority map is the mitigation and cannot be dropped.
- The `generic-airspace` checklist item ("Airspace clear and legal to fly") remains the pilot's actual airspace assurance. `NearestAirfield` informs that item; it does not replace it.
- APK size grows by the trimmed dataset (order 1-3 MB).
