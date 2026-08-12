# Verdict reflects a single point in time, not a worst-case window

We compute Verdict for one specific hourly forecast point — the current hour when "now" falls inside today's daylight window, or (surfaced via an explicit "preview" CTA rather than shown by default) the first daylight hour of a future day. We rejected aggregating across remaining daylight hours or a fixed lookahead window, even though this is a flight-safety tool, because a single time-bound meaning keeps "Verdict" unambiguous everywhere it's displayed, rather than splitting into a "live" verdict in some views and a "worst case ahead" verdict in others.

## Consequences

- The Verdict badge does not proactively warn about conditions worsening later in the day — a pilot checking mid-morning and seeing green won't be told that afternoon gusts will turn it red. They need to check the hourly forecast breakdown for that, not rely on the badge alone.
