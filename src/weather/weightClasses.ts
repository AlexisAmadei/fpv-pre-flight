import type { VerdictThresholds, WeightClass } from './types';

// Starting defaults in km/h, chosen per weight class's wind tolerance.
// These seed a new DroneProfile; ADR 0002 covers why they live on-device
// only. Expect pilots to tune them per drone via manual override.
export const DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS: Record<WeightClass, VerdictThresholds> = {
  'tiny-whoop': { windSpeedMax: 15, windGustsMax: 20, precipitationProbabilityMax: 20, uvIndexMax: 8 },
  '3-inch': { windSpeedMax: 20, windGustsMax: 28, precipitationProbabilityMax: 25, uvIndexMax: 9 },
  '5-inch': { windSpeedMax: 28, windGustsMax: 38, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  '7-inch-plus': { windSpeedMax: 32, windGustsMax: 42, precipitationProbabilityMax: 30, uvIndexMax: 10 },
  'long-range': { windSpeedMax: 35, windGustsMax: 45, precipitationProbabilityMax: 30, uvIndexMax: 10 },
};
