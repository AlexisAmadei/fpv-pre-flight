# 05 — Hourly/daily breakdown + future-day preview

**What to build:** The FlyingSpot detail view shows today's sunrise-to-sunset hourly metrics and daily summaries for the next 3 days, plus an explicit "preview" CTA that computes a Verdict for a future day's first daylight hour — without changing what the default point-in-time badge means (ADR-0006).

**Blocked by:** 03 — Live Verdict for a FlyingSpot

**Status:** ready-for-agent

- [ ] Detail view lists today's hourly forecast points trimmed to sunrise-sunset (via `currentDaylightHours()`)
- [ ] Detail view lists daily summaries for the next 3 days
- [ ] A "preview" CTA, not shown by default alongside the main badge, computes and displays a Verdict for a future day's first daylight hour
- [ ] Previewing a future day never changes the default Verdict badge — it always reflects the current point in time
