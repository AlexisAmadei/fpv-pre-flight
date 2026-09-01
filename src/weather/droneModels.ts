import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from './weightClasses';
import type { DroneProfile, VerdictThresholds, WeightClass } from './types';

export type DroneModelLine = 'Neo' | 'Mini' | 'Air' | 'Mavic';

export interface DroneModel {
  id: string;
  displayName: string;
  line: DroneModelLine;
  takeoffWeightGrams: number;
  windResistanceMax: number; // km/h, converted from DJI's published rating
}

// Hand-authored per ADR 0013: DJI-specific, not a generalized multi-brand
// dataset. Re-verify weight/wind figures against DJI's spec pages before
// relying on them — DJI revises product pages over time.
export const DJI_DRONE_MODELS: DroneModel[] = [
  {
    id: 'dji-neo',
    displayName: 'DJI Neo',
    line: 'Neo',
    takeoffWeightGrams: 135,
    windResistanceMax: 29,
  },
  {
    id: 'dji-mini-4-pro',
    displayName: 'DJI Mini 4 Pro',
    line: 'Mini',
    takeoffWeightGrams: 249,
    windResistanceMax: 38.5,
  },
  {
    id: 'dji-mini-5-pro',
    displayName: 'DJI Mini 5 Pro',
    line: 'Mini',
    takeoffWeightGrams: 249.9,
    windResistanceMax: 43,
  },
  {
    id: 'dji-air-3s',
    displayName: 'DJI Air 3S',
    line: 'Air',
    takeoffWeightGrams: 724,
    windResistanceMax: 43,
  },
  {
    id: 'dji-mavic-3-pro',
    displayName: 'DJI Mavic 3 Pro',
    line: 'Mavic',
    takeoffWeightGrams: 958,
    windResistanceMax: 43,
  },
  {
    id: 'dji-mavic-4-pro',
    displayName: 'DJI Mavic 4 Pro',
    line: 'Mavic',
    takeoffWeightGrams: 1063,
    // Verified against DJI's published spec: max wind resistance 12 m/s (~43 km/h).
    windResistanceMax: 43,
  },
];

/** The camera WeightClass bracket a DroneModel's own published weight falls into. */
export function weightClassForDroneModel(model: DroneModel): WeightClass {
  if (model.takeoffWeightGrams < 250) {
    return 'sub-250g';
  }
  if (model.takeoffWeightGrams <= 900) {
    return '250g-900g';
  }
  return '900g-plus';
}

/**
 * Wind and gust come from the model's own published rating; rain probability
 * and UV index fall back to the bracket DJI doesn't publish a spec for
 * (ADR 0013).
 */
export function thresholdsFromDroneModel(model: DroneModel): VerdictThresholds {
  const bracketDefaults =
    DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[weightClassForDroneModel(model)];
  return {
    windSpeedMax: model.windResistanceMax,
    windGustsMax: model.windResistanceMax,
    precipitationProbabilityMax: bracketDefaults.precipitationProbabilityMax,
    uvIndexMax: bracketDefaults.uvIndexMax,
  };
}

export function findDroneModel(id: string): DroneModel | undefined {
  return DJI_DRONE_MODELS.find(model => model.id === id);
}

/**
 * The Thresholds a DroneProfile was originally seeded with — a model's own
 * rating for wind/gust plus its implied bracket for rain/UV when
 * `droneModelId` is set, otherwise the generic bracket default. This is what
 * per-metric Reset restores to, as distinct from the profile's current
 * (possibly overridden) `thresholds`.
 */
export function seededThresholdsFor(profile: DroneProfile): VerdictThresholds {
  const model = profile.droneModelId
    ? findDroneModel(profile.droneModelId)
    : undefined;
  return model
    ? thresholdsFromDroneModel(model)
    : DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[profile.weightClass];
}
