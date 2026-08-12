# 04 — Stale caching + Refresh All

**What to build:** Per-spot in-memory weather cache with a freshness window (~15–30 min), a visibly-flagged stale state when serving old data, a "Refresh All" bulk action across saved spots, and graceful fallback to the last-known forecast (labeled stale) on fetch failure — per ADR-0007.

**Blocked by:** 03 — Live Verdict for a FlyingSpot

**Status:** ready-for-agent

- [ ] Weather fetched for a spot is cached in memory (not persisted to disk) for a bounded freshness window
- [ ] Reopening a spot within the freshness window does not re-fetch
- [ ] Data past the freshness window is visibly labeled "stale" rather than hidden or silently treated as current
- [ ] A "Refresh All" action re-fetches weather for every saved spot
- [ ] On fetch failure with a cached forecast available, the last cached forecast is shown labeled stale, and the Verdict is still computed from it
- [ ] On fetch failure with no cached forecast at all, a clear error state is shown instead of a Verdict badge
