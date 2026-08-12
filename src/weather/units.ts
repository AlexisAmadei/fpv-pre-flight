// Countries where wind speed is conventionally reported/understood in mph
// rather than km/h. Region code is injected by the caller (device locale)
// so this stays independent of whichever localization library gets wired
// up when the settings screen is built.
const IMPERIAL_WIND_REGIONS = new Set(['US', 'LR', 'MM']);

export function isImperialRegion(regionCode: string): boolean {
  return IMPERIAL_WIND_REGIONS.has(regionCode.toUpperCase());
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function formatWindSpeed(kmh: number, regionCode: string): string {
  return isImperialRegion(regionCode)
    ? `${Math.round(kmhToMph(kmh))} mph`
    : `${Math.round(kmh)} km/h`;
}
