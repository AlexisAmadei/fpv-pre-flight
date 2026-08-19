import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDroneProfile,
  deleteDroneProfile,
  getActiveDroneProfile,
  getActiveDroneProfileId,
  listDroneProfiles,
  setActiveDroneProfile,
  updateDroneProfile,
} from '../droneProfileRepository';
import type { DroneProfile } from '../../weather/types';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const thresholds = {
  windSpeedMax: 28,
  windGustsMax: 38,
  precipitationProbabilityMax: 30,
  uvIndexMax: 10,
};

const profile: DroneProfile = {
  id: 'p1',
  name: 'My Freestyle Quad',
  weightClass: '5-inch',
  thresholds,
};

const second: DroneProfile = {
  id: 'p2',
  name: 'Long Ranger',
  weightClass: 'long-range',
  thresholds,
};

describe('droneProfileRepository', () => {
  it('starts with an empty fleet and nothing flying', async () => {
    expect(await listDroneProfiles()).toEqual([]);
    expect(await getActiveDroneProfile()).toBeNull();
  });

  it('persists and reloads added profiles', async () => {
    await addDroneProfile(profile);
    await addDroneProfile(second);
    expect(await listDroneProfiles()).toEqual([profile, second]);
  });

  it('makes the first added profile the active one', async () => {
    await addDroneProfile(profile);
    await addDroneProfile(second);
    expect(await getActiveDroneProfile()).toEqual(profile);
  });

  it('switches the active profile', async () => {
    await addDroneProfile(profile);
    await addDroneProfile(second);
    await setActiveDroneProfile(second.id);
    expect(await getActiveDroneProfile()).toEqual(second);
  });

  it('ignores a request to fly a profile that is not in the fleet', async () => {
    await addDroneProfile(profile);
    await setActiveDroneProfile('missing');
    expect(await getActiveDroneProfileId()).toBe(profile.id);
  });

  it('updates a profile in place', async () => {
    await addDroneProfile(profile);
    const renamed = { ...profile, name: 'Renamed' };
    await updateDroneProfile(renamed);
    expect(await listDroneProfiles()).toEqual([renamed]);
  });

  it('hands active status to a remaining profile when the active one is deleted', async () => {
    await addDroneProfile(profile);
    await addDroneProfile(second);
    await deleteDroneProfile(profile.id);
    expect(await listDroneProfiles()).toEqual([second]);
    expect(await getActiveDroneProfileId()).toBe(second.id);
  });

  it('leaves nothing flying once the last profile is deleted', async () => {
    await addDroneProfile(profile);
    await deleteDroneProfile(profile.id);
    expect(await getActiveDroneProfileId()).toBeNull();
  });

  it('migrates a pre-fleet single saved profile into the fleet', async () => {
    await AsyncStorage.setItem('droneProfile', JSON.stringify(profile));
    expect(await listDroneProfiles()).toEqual([profile]);
    expect(await getActiveDroneProfile()).toEqual(profile);
  });
});
