import type { DroneKind, VerdictThresholds, WeightClass } from './types';

// Starting defaults in km/h, chosen per weight class's wind tolerance.
// These seed a new DroneProfile; ADR 0002 covers why they live on-device
// only. Expect pilots to tune them per drone via manual override.
export const DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS: Record<WeightClass, VerdictThresholds> = {
  'tiny-whoop': { windSpeedMax: 15, windGustsMax: 20, precipitationProbabilityMax: 20, uvIndexMax: 8 },
  '3-inch': { windSpeedMax: 20, windGustsMax: 28, precipitationProbabilityMax: 25, uvIndexMax: 9 },
  '5-inch': { windSpeedMax: 28, windGustsMax: 38, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  '7-inch-plus': { windSpeedMax: 32, windGustsMax: 42, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  'long-range': { windSpeedMax: 35, windGustsMax: 45, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  // Camera brackets track DJI's typical published wind-resistance ranges
  // (~8-12 m/s / ~29-43 km/h), rising with the airframe's regulatory weight.
  'sub-250g': { windSpeedMax: 29, windGustsMax: 35, precipitationProbabilityMax: 25, uvIndexMax: 9 },
  '250g-900g': { windSpeedMax: 38, windGustsMax: 43, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  '900g-plus': { windSpeedMax: 43, windGustsMax: 48, precipitationProbabilityMax: 30, uvIndexMax: 10 },
};

/** Which WeightClass ladder a DroneKind offers. */
export const WEIGHT_CLASSES_BY_KIND: Record<DroneKind, WeightClass[]> = {
  fpv: ['tiny-whoop', '3-inch', '5-inch', '7-inch-plus', 'long-range'],
  camera: ['sub-250g', '250g-900g', '900g-plus'],
};
