import type { HourlyWeatherPoint } from './types';

/**
 * EstimatedCloudBase — height of the cloud base above ground, derived from the
 * temperature/dew-point spread rather than measured.
 *
 * The spread method (Espy's equation) is the only cloud base available to us:
 * Open-Meteo publishes no ceiling. It is deliberately named "estimated"
 * everywhere it surfaces because it is least reliable for stratus, fog and
 * marine layers — exactly the conditions where a low base matters most. It is
 * informational only: never a Threshold, never an input to the Verdict level.
 */

/**
 * Espy's coefficient: the base rises ~125 m per °C of spread. An approximation
 * of the dry adiabatic vs dew-point lapse rates, standard in aviation weather.
 */
const METRES_PER_DEGREE_SPREAD = 125;

/**
 * The estimate is reported as a range, not a point, so it cannot be read as a
 * measurement. ±18% brackets the spread method's typical error without
 * implying more precision than Espy's equation carries.
 */
const RANGE_FRACTION = 0.18;

/** Rounded to the nearest 50 m — finer figures would overstate the precision. */
const ROUND_TO_METRES = 50;

export interface EstimatedCloudBase {
  /** Height above ground in metres, rounded to the nearest 50 m. */
  heightAgl: number;
  /** Lower bound of the plausible range, in metres. */
  rangeLow: number;
  /** Upper bound of the plausible range, in metres. */
  rangeHigh: number;
  /**
   * Low-cloud cover at the same hour, in percent. Carried alongside as the
   * corroborating signal: a low base with little low cloud is far less
   * consequential than the same base under overcast.
   */
  lowCloudCover: number;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Derives the EstimatedCloudBase for an hourly point, or undefined when the
 * point carries no temperature/dew-point pair to derive it from — a forecast
 * cached before those fields were fetched, rather than an error.
 */
export function estimateCloudBase(
  point: HourlyWeatherPoint,
): EstimatedCloudBase | undefined {
  const { temperature, dewPoint } = point;
  if (temperature === undefined || dewPoint === undefined) {
    return undefined;
  }

  // A negative spread (dew point above temperature) is physically saturated
  // air; clamp to zero rather than reporting a base below the ground.
  const spread = Math.max(0, temperature - dewPoint);
  const raw = spread * METRES_PER_DEGREE_SPREAD;

  return {
    heightAgl: roundTo(raw, ROUND_TO_METRES),
    rangeLow: roundTo(raw * (1 - RANGE_FRACTION), ROUND_TO_METRES),
    rangeHigh: roundTo(raw * (1 + RANGE_FRACTION), ROUND_TO_METRES),
    lowCloudCover: point.lowCloudCover ?? point.cloudCover,
  };
}
