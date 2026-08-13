import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addFlyingSpot,
  deleteFlyingSpot,
  listFlyingSpots,
} from '../flyingSpotRepository';
import type { FlyingSpot } from '../../weather/types';

beforeEach(async () => {
  await AsyncStorage.clear();
});

function spot(overrides: Partial<FlyingSpot>): FlyingSpot {
  return {
    id: '1',
    name: 'Ridge Launch',
    coordinates: { latitude: 51.5, longitude: -0.1 },
    ...overrides,
  };
}

describe('flyingSpotRepository', () => {
  it('starts empty', async () => {
    expect(await listFlyingSpots()).toEqual([]);
  });

  it('adds a spot and lists it back', async () => {
    await addFlyingSpot(spot({}));
    expect(await listFlyingSpots()).toEqual([spot({})]);
  });

  it('accumulates multiple added spots', async () => {
    await addFlyingSpot(spot({ id: '1', name: 'Ridge' }));
    await addFlyingSpot(spot({ id: '2', name: 'Valley' }));
    const spots = await listFlyingSpots();
    expect(spots.map(s => s.name)).toEqual(['Ridge', 'Valley']);
  });

  it('deletes a spot by id, leaving the others', async () => {
    await addFlyingSpot(spot({ id: '1', name: 'Ridge' }));
    await addFlyingSpot(spot({ id: '2', name: 'Valley' }));
    await deleteFlyingSpot('1');
    const spots = await listFlyingSpots();
    expect(spots.map(s => s.id)).toEqual(['2']);
  });

  it('persists across repository calls as if across app restarts', async () => {
    await addFlyingSpot(spot({}));
    expect(await listFlyingSpots()).toEqual([spot({})]);
  });
});
