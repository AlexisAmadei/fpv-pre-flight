import {
  DJI_DRONE_MODELS,
  findDroneModel,
  seededThresholdsFor,
  thresholdsFromDroneModel,
  weightClassForDroneModel,
} from '../droneModels';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weightClasses';
import type { DroneProfile, WeightClass } from '../types';

const EXPECTED_BRACKETS: Record<string, WeightClass> = {
  'dji-neo': 'sub-250g',
  'dji-mini-4-pro': 'sub-250g',
  'dji-mini-5-pro': 'sub-250g',
  'dji-air-3s': '250g-900g',
  'dji-mavic-3-pro': '900g-plus',
  'dji-mavic-4-pro': '900g-plus',
};

describe('DJI_DRONE_MODELS', () => {
  it('has exactly the six documented models', () => {
    expect(DJI_DRONE_MODELS.map(model => model.id).sort()).toEqual(
      Object.keys(EXPECTED_BRACKETS).sort(),
    );
  });

  it.each(DJI_DRONE_MODELS)(
    '$id resolves to its implied WeightClass bracket and a complete VerdictThresholds',
    model => {
      const bracket = weightClassForDroneModel(model);
      expect(bracket).toBe(EXPECTED_BRACKETS[model.id]);

      const bracketDefaults = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[bracket];
      expect(thresholdsFromDroneModel(model)).toEqual({
        windSpeedMax: model.windResistanceMax,
        windGustsMax: model.windResistanceMax,
        precipitationProbabilityMax: bracketDefaults.precipitationProbabilityMax,
        uvIndexMax: bracketDefaults.uvIndexMax,
      });
    },
  );

  it('finds a model by id', () => {
    expect(findDroneModel('dji-mini-5-pro')?.displayName).toBe(
      'DJI Mini 5 Pro',
    );
  });

  it('returns undefined for an unknown id', () => {
    expect(findDroneModel('not-a-model')).toBeUndefined();
  });
});

describe('seededThresholdsFor', () => {
  const baseProfile: DroneProfile = {
    id: 'p1',
    name: 'Test',
    kind: 'camera',
    weightClass: 'sub-250g',
    thresholds: {
      windSpeedMax: 999, // deliberately different from any seed, to prove
      windGustsMax: 999, // seededThresholdsFor ignores the current override
      precipitationProbabilityMax: 999,
      uvIndexMax: 999,
    },
  };

  it('resolves to the model rating and implied bracket for a model-seeded profile', () => {
    const model = findDroneModel('dji-mini-4-pro')!;
    const profile: DroneProfile = { ...baseProfile, droneModelId: model.id };

    expect(seededThresholdsFor(profile)).toEqual(thresholdsFromDroneModel(model));
  });

  it('resolves to the generic bracket default for a profile with no droneModelId', () => {
    const profile: DroneProfile = { ...baseProfile, weightClass: '250g-900g' };

    expect(seededThresholdsFor(profile)).toEqual(
      DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS['250g-900g'],
    );
  });
});
