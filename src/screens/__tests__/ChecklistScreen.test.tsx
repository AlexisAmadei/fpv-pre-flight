import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { ChecklistScreen } from '../ChecklistScreen';
import { getActiveDroneProfile } from '../../droneProfiles/droneProfileRepository';
import { GENERIC_CHECKLIST } from '../../checklists/genericChecklist';
import { flush } from '../../testUtils/flush';
import type { DroneProfile } from '../../weather/types';

jest.mock('../../droneProfiles/droneProfileRepository', () => ({
  getActiveDroneProfile: jest.fn(),
}));

const mockGetActiveDroneProfile =
  getActiveDroneProfile as jest.MockedFunction<typeof getActiveDroneProfile>;

const profile: DroneProfile = {
  id: 'p1',
  name: 'Test Quad',
  kind: 'fpv',
  weightClass: '5-inch',
  thresholds: {
    windSpeedMax: 28,
    windGustsMax: 38,
    precipitationProbabilityMax: 30,
    uvIndexMax: 10,
  },
};

beforeEach(async () => {
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  await AsyncStorage.clear();
  mockGetActiveDroneProfile.mockReset().mockResolvedValue(profile);
});

async function render() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <ChecklistScreen onCreateDroneProfile={jest.fn()} />,
    );
  });
  await flush();
  return renderer;
}

describe('ChecklistScreen', () => {
  it('prompts for a drone when none is flying', async () => {
    mockGetActiveDroneProfile.mockResolvedValue(null);
    const renderer = await render();

    expect(
      renderer.root.findByProps({ testID: 'checklist-no-profile' }),
    ).toBeTruthy();
  });

  it('shows the GenericChecklist with nothing ticked', async () => {
    const renderer = await render();

    expect(
      renderer.root.findByProps({ testID: 'checklist-progress' }).props
        .children,
    ).toEqual([0, '/', GENERIC_CHECKLIST.length]);
  });

  it('ticks an item and advances progress', async () => {
    const renderer = await render();
    const first = GENERIC_CHECKLIST[0];

    await act(async () => {
      await renderer.root
        .findByProps({ testID: `checklist-toggle-${first.id}` })
        .props.onPress();
    });
    await flush();

    expect(
      renderer.root.findByProps({ testID: 'checklist-progress' }).props
        .children,
    ).toEqual([1, '/', GENERIC_CHECKLIST.length]);
  });

  it('adds a pilot’s own item to the checklist', async () => {
    const renderer = await render();

    act(() => {
      renderer.root
        .findByProps({ testID: 'checklist-new-item' })
        .props.onChangeText('Pack spare props');
    });
    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'checklist-add-item' })
        .props.onPress();
    });
    await flush();

    expect(
      renderer.root.findByProps({ testID: 'checklist-progress' }).props
        .children,
    ).toEqual([0, '/', GENERIC_CHECKLIST.length + 1]);
  });

  it('clears every tick on reset', async () => {
    const renderer = await render();
    const first = GENERIC_CHECKLIST[0];

    await act(async () => {
      await renderer.root
        .findByProps({ testID: `checklist-toggle-${first.id}` })
        .props.onPress();
    });
    await flush();

    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'checklist-reset' })
        .props.onPress();
    });
    await flush();

    expect(
      renderer.root.findByProps({ testID: 'checklist-progress' }).props
        .children,
    ).toEqual([0, '/', GENERIC_CHECKLIST.length]);
  });
});
