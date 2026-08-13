import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDroneProfile, saveDroneProfile } from '../droneProfileRepository';
import type { DroneProfile } from '../../weather/types';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const profile: DroneProfile = {
  id: 'p1',
  name: 'My Freestyle Quad',
  weightClass: '5-inch',
  thresholds: {
    windSpeedMax: 28,
    windGustsMax: 38,
    precipitationProbabilityMax: 30,
    uvIndexMax: 10,
  },
};

describe('droneProfileRepository', () => {
  it('returns null when no profile has been saved', async () => {
    expect(await getDroneProfile()).toBeNull();
  });

  it('persists and reloads a saved profile', async () => {
    await saveDroneProfile(profile);
    expect(await getDroneProfile()).toEqual(profile);
  });

  it('overwrites the previous profile on save', async () => {
    await saveDroneProfile(profile);
    const updated = { ...profile, name: 'Renamed' };
    await saveDroneProfile(updated);
    expect(await getDroneProfile()).toEqual(updated);
  });
});
