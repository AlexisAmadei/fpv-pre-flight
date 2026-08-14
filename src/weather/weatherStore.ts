import { computeVerdict } from './verdict';
import { currentHourPoint, firstDaylightHourOnDay } from './verdictTiming';
import { getWeather, refreshAll as refreshAllCached, refreshWeather } from './weatherCache';
import type { WeatherSnapshot } from './weatherCache';
import type { FlyingSpot, HourlyWeatherPoint, Verdict, VerdictThresholds, WeatherForecast } from './types';

export type VerdictStatus =
  | { status: 'fresh'; verdict: Verdict }
  | { status: 'stale'; verdict: Verdict }
  | { status: 'unavailable' }
  | { status: 'outside-daylight' };

function timeOfDayMinutes(iso: string): number {
  const [hours, minutes] = iso.split('T')[1].split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Whether `now`'s time-of-day falls within daylight hours. Compares time-of-day
 * only (not the full timestamp) so a stale forecast — whose `daily[0]` may be a
 * prior calendar day — still yields a sensible answer instead of every stale,
 * multi-day-old cache reading as permanently "outside daylight" (ADR-0007: stale
 * data stays visible, never silently hidden).
 */
function isWithinDaylightHours(daily: { sunrise: string; sunset: string }[], now: Date): boolean {
  const today = daily[0];
  if (!today) {
    return false;
  }
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= timeOfDayMinutes(today.sunrise) && nowMinutes <= timeOfDayMinutes(today.sunset);
}

type PointResolution = HourlyWeatherPoint | 'outside-daylight' | undefined;

async function resolveVerdictStatus(
  thresholds: VerdictThresholds,
  fetchSnapshot: () => Promise<WeatherSnapshot>,
  resolvePoint: (forecast: WeatherForecast) => PointResolution,
): Promise<VerdictStatus> {
  let snapshot: WeatherSnapshot;
  try {
    snapshot = await fetchSnapshot();
  } catch {
    return { status: 'unavailable' };
  }

  const resolved = resolvePoint(snapshot.forecast);
  if (resolved === 'outside-daylight') {
    return { status: 'outside-daylight' };
  }
  if (!resolved) {
    return { status: 'unavailable' };
  }

  return {
    status: snapshot.stale ? 'stale' : 'fresh',
    verdict: computeVerdict(resolved, thresholds),
  };
}

/**
 * Resolves the current-hour Verdict for a spot, when `now` falls inside today's
 * daylight window; otherwise reports `outside-daylight` rather than fabricating
 * a Verdict for a time nobody would be flying (ADR-0006).
 */
export async function getVerdictStatus(
  spot: FlyingSpot,
  thresholds: VerdictThresholds,
  now: Date = new Date(),
): Promise<VerdictStatus> {
  return resolveVerdictStatus(
    thresholds,
    () => getWeather(spot.id, spot.coordinates, now.getTime()),
    forecast => (isWithinDaylightHours(forecast.daily, now) ? currentHourPoint(forecast, now) : 'outside-daylight'),
  );
}

/**
 * Resolves the Verdict for the first daylight hour of the given day — the same
 * resolution rule for both the night-time preview CTA and the 4-day forecast
 * browse (ADR-0006); `date` matches a `WeatherForecast.daily[].date` entry.
 */
export async function getVerdictForDay(
  spot: FlyingSpot,
  thresholds: VerdictThresholds,
  date: string,
): Promise<VerdictStatus> {
  return resolveVerdictStatus(
    thresholds,
    () => getWeather(spot.id, spot.coordinates),
    forecast => {
      const dayIndex = forecast.daily.findIndex(day => day.date === date);
      return dayIndex === -1 ? undefined : firstDaylightHourOnDay(forecast, dayIndex);
    },
  );
}

/** Forces a fetch for one spot, replacing its cache entry on success. Never rejects. */
export async function refreshSpot(spot: FlyingSpot): Promise<void> {
  await refreshWeather(spot.id, spot.coordinates).catch(() => undefined);
}

/** Refreshes every given spot in parallel; one spot's failure never blocks the others (ADR-0007). */
export async function refreshAll(spots: FlyingSpot[]): Promise<void> {
  await refreshAllCached(spots.map(spot => ({ id: spot.id, coordinates: spot.coordinates })));
}
