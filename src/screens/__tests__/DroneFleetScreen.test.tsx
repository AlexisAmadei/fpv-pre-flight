import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
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
  kind: 'fpv',
  weightClass: '5-inch',
  thresholds,
};
const second: DroneProfile = {
  id: 'p2',
  name: 'Long Ranger',
  kind: 'fpv',
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

  it('shows the DJI model display name for a model-seeded profile instead of the weight-class label', async () => {
    const modelSeeded: DroneProfile = {
      id: 'p3',
      name: 'My Mini',
      kind: 'camera',
      weightClass: 'sub-250g',
      droneModelId: 'dji-mini-4-pro',
      thresholds,
    };
    await addDroneProfile(modelSeeded);
    const renderer = await render();

    const combinedText = renderer.root
      .findByProps({ testID: 'edit-drone-p3' })
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat()
      .join(' ');
    expect(combinedText).toContain('DJI Mini 4 Pro');
    expect(combinedText).not.toContain('Sub-250g');
  });
});
