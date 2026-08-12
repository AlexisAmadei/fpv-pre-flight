# Weather data is fetched on-demand, cached briefly in memory, and served stale rather than blocked

FlyingSpots don't auto-fetch weather on app launch or in the list view; each spot's forecast loads only when opened, or in bulk via a "Refresh All" action, and is cached in memory (not persisted to disk) for roughly 15-30 minutes before being considered stale. This was checked against Open-Meteo's free tier (600 requests/minute, 10,000/day, per ADR 0003) — even a "Refresh All" across a personal-sized list of saved spots uses a negligible fraction of that budget, so no request throttling or sequencing is needed. On a failed fetch, we still show the last cached forecast — clearly labeled stale — rather than blocking the Verdict entirely; a hard error only appears when there's no cached data at all. We chose stale-but-visible over hiding old data or refusing to show anything, since a pilot in the field with no signal is better served by clearly-labeled last-known conditions than by nothing.

## Consequences

- A pilot could act on data that's up to ~30 minutes old (or older, if offline since the last successful fetch) if they don't notice the stale label.
