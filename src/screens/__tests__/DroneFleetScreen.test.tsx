import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { DroneFleetScreen } from '../DroneFleetScreen';
import {
  addDroneProfile,
  getActiveDroneProfileId,
} from '../../droneProfiles/droneProfileRepository';
import { flush } from '../../testUtils/flush';
import type { DroneProfile } from '../../weather/types';

const thresholds = {
  windSpeedMax: 28,
  windGustsMax: 38,
  precipitationProbabilityMax: 30,
  uvIndexMax: 10,
};

const first: DroneProfile = {
  id: 'p1',
  name: 'Freestyle',
  weightClass: '5-inch',
  thresholds,
};
const second: DroneProfile = {
  id: 'p2',
  name: 'Long Ranger',
  weightClass: 'long-range',
  thresholds,
};

beforeEach(async () => {
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.clear();
});

async function render(onEditDrone = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <DroneFleetScreen onAddDrone={jest.fn()} onEditDrone={onEditDrone} />,
    );
  });
  await flush();
  return renderer;
}

describe('DroneFleetScreen', () => {
  it('shows an empty state before any drone is added', async () => {
    const renderer = await render();

    expect(
      renderer.root.findAll(
        node =>
          typeof node.props.testID === 'string' &&
          node.props.testID.startsWith('edit-drone-'),
      ),
    ).toHaveLength(0);
  });

  it('lists every saved drone', async () => {
    await addDroneProfile(first);
    await addDroneProfile(second);
    const renderer = await render();

    expect(
      renderer.root.findByProps({ testID: 'edit-drone-p1' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'edit-drone-p2' }),
    ).toBeTruthy();
  });

  it('offers "fly this" only for the drone that is not already flying', async () => {
    await addDroneProfile(first);
    await addDroneProfile(second);
    const renderer = await render();

    // p1 was added first, so it is the one flying.
    expect(renderer.root.findAll(n => n.props.testID === 'fly-drone-p1')).toHaveLength(
      0,
    );
    expect(renderer.root.findByProps({ testID: 'fly-drone-p2' })).toBeTruthy();
  });

  it('switches which drone is flying', async () => {
    await addDroneProfile(first);
    await addDroneProfile(second);
    const renderer = await render();

    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'fly-drone-p2' })
        .props.onPress();
    });
    await flush();

    expect(await getActiveDroneProfileId()).toBe('p2');
  });

  it('opens a drone for editing', async () => {
    await addDroneProfile(first);
    const onEditDrone = jest.fn();
    const renderer = await render(onEditDrone);

    act(() => {
      renderer.root.findByProps({ testID: 'edit-drone-p1' }).props.onPress();
    });

    expect(onEditDrone).toHaveBeenCalledWith(first);
  });
});
