import { fetchForecast } from './openMeteoClient';
import type { Coordinates, WeatherForecast } from './types';

// ADR-0007: in-memory only (never persisted), ~15-30 min freshness window.
const FRESHNESS_WINDOW_MS = 20 * 60 * 1000;

interface CacheEntry {
  forecast: WeatherForecast;
  fetchedAt: number;
}

interface SpotCoordinates {
  id: string;
  coordinates: Coordinates;
}

export interface WeatherSnapshot {
  forecast: WeatherForecast;
  stale: boolean;
}

const cache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry, now: number): boolean {
  return now - entry.fetchedAt < FRESHNESS_WINDOW_MS;
}

async function fetchAndCache(
  spotId: string,
  coordinates: Coordinates,
  cached: CacheEntry | undefined,
  now: number,
): Promise<WeatherSnapshot> {
  try {
    const forecast = await fetchForecast(coordinates);
    cache.set(spotId, { forecast, fetchedAt: now });
    return { forecast, stale: false };
  } catch (error) {
    if (cached) {
      return { forecast: cached.forecast, stale: true };
    }
    throw error;
  }
}

/** Reuses a fresh cached forecast; otherwise fetches. Falls back to a stale cached forecast on failure. */
export async function getWeather(
  spotId: string,
  coordinates: Coordinates,
  now: number = Date.now(),
): Promise<WeatherSnapshot> {
  const cached = cache.get(spotId);
  if (cached && isFresh(cached, now)) {
    return { forecast: cached.forecast, stale: false };
  }
  return fetchAndCache(spotId, coordinates, cached, now);
}

/** Always re-fetches, regardless of freshness. Falls back to a stale cached forecast on failure. */
export async function refreshWeather(
  spotId: string,
  coordinates: Coordinates,
  now: number = Date.now(),
): Promise<WeatherSnapshot> {
  return fetchAndCache(spotId, coordinates, cache.get(spotId), now);
}

export async function refreshAll(spots: SpotCoordinates[]): Promise<void> {
  await Promise.all(
    spots.map(spot =>
      refreshWeather(spot.id, spot.coordinates).catch(() => undefined),
    ),
  );
}

export function evictWeather(spotId: string): void {
  cache.delete(spotId);
}

export function clearWeatherCache(): void {
  cache.clear();
}
