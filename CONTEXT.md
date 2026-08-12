# Pre-Flight

A weather-conditions and equipment-checklist companion for FPV drone pilots, deciding whether it's safe to fly before heading out.

## Language

**FlyingSpot**:
A named location a pilot has saved to check flying conditions for, whether standing there or checking remotely ahead of time.
_Avoid_: Location, Site, Field

**DroneProfile**:
A saved drone the pilot flies, holding its WeightClass and its own Checklist additions and Verdict thresholds.
_Avoid_: Drone, Aircraft, Build, Quad

**WeightClass**:
A size/weight category (tiny whoop, 3", 5", 7"+ freestyle, long-range) assigned to a DroneProfile that auto-populates its default Verdict thresholds.
_Avoid_: Size, Category

**Verdict**:
The red/yellow/green go/no-go assessment for a FlyingSpot at a specific point in time (never a range or worst-case across a window), computed against a DroneProfile's thresholds. Wind, gusts, and rain probability are hard limits — any one alone past its threshold forces red regardless of the others; short of that, those three plus a light UV index contribution combine into a weighted score deciding yellow vs. green. UV index alone never forces red (heat/battery overheat risk, not a hard stop). Cloud cover is informational only and never affects the level.
_Avoid_: Score, Rating, Status

**Stale** (of cached weather data):
Weather data held past its freshness window and still shown — visibly flagged as outdated — rather than hidden or silently treated as current.
_Avoid_: Outdated, Expired, Cached

**Threshold**:
A per-metric limit on a DroneProfile that determines where that metric falls on the Verdict's red/yellow/green scale. Defaults from the DroneProfile's WeightClass, manually overridable per metric.
_Avoid_: Limit, Setting

**GenericChecklist**:
The base set of preflight checklist items that apply regardless of which DroneProfile is flying.
_Avoid_: Default Checklist, Base Checklist

**Checklist**:
The full list of preflight items for a given DroneProfile: the GenericChecklist plus that DroneProfile's own additional items. Resets to unchecked only via a manual action, independent of the Verdict/weather flow.
_Avoid_: Preflight List, Task List
