import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { EditThresholdsScreen } from '../EditThresholdsScreen';
import {
  getActiveDroneProfile,
  updateDroneProfile,
} from '../../droneProfiles/droneProfileRepository';
import { flush } from '../../testUtils/flush';
import type { DroneProfile } from '../../weather/types';

jest.mock('../../droneProfiles/droneProfileRepository', () => ({
  getActiveDroneProfile: jest.fn(),
  updateDroneProfile: jest.fn().mockResolvedValue(undefined),
  getActiveDroneProfileId: jest.fn().mockResolvedValue(null),
  setActiveDroneProfile: jest.fn().mockResolvedValue(undefined),
  deleteDroneProfile: jest.fn().mockResolvedValue(undefined),
}));

const mockGetDroneProfile = getActiveDroneProfile as jest.MockedFunction<
  typeof getActiveDroneProfile
>;
const mockSaveDroneProfile = updateDroneProfile as jest.MockedFunction<
  typeof updateDroneProfile
>;

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

beforeEach(() => {
  mockGetDroneProfile.mockReset();
  mockSaveDroneProfile.mockReset().mockResolvedValue(undefined);
});

describe('EditThresholdsScreen', () => {
  it('overrides a threshold, persists it on save, and can reset it back to the weight-class default', async () => {
    mockGetDroneProfile.mockResolvedValue(profile);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    const find = (testID: string) => renderer.root.findByProps({ testID });

    act(() => {
      find('threshold-input-windSpeedMax').props.onChangeText('20');
    });
    await act(async () => {
      await find('save-thresholds').props.onPress();
    });

    expect(mockSaveDroneProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        thresholds: expect.objectContaining({ windSpeedMax: 20 }),
      }),
    );

    act(() => {
      find('threshold-reset-windSpeedMax').props.onPress();
    });
    await act(async () => {
      await find('save-thresholds').props.onPress();
    });

    expect(mockSaveDroneProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        thresholds: expect.objectContaining({ windSpeedMax: 28 }),
      }),
    );
  });

  it('lets a pilot clear a field to retype it, without saving a 0 threshold', async () => {
    mockGetDroneProfile.mockResolvedValue(profile);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    const find = (testID: string) => renderer.root.findByProps({ testID });

    act(() => {
      find('threshold-input-windSpeedMax').props.onChangeText('');
    });
    expect(find('threshold-input-windSpeedMax').props.value).toBe('');

    await act(async () => {
      await find('save-thresholds').props.onPress();
    });

    // Saving with the field left empty keeps the previous value rather than
    // committing 0 (which would silently make that metric always green).
    expect(mockSaveDroneProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        thresholds: expect.objectContaining({ windSpeedMax: 28 }),
      }),
    );
  });

  it('prompts to create a profile first when none exists', async () => {
    mockGetDroneProfile.mockResolvedValue(null);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    expect(
      renderer!.root.findByProps({ testID: 'no-profile-message' }),
    ).toBeTruthy();
  });

  const modelSeededProfile: DroneProfile = {
    id: 'p2',
    name: 'My Mini',
    kind: 'camera',
    weightClass: 'sub-250g',
    droneModelId: 'dji-mini-4-pro',
    thresholds: {
      // Deliberately overridden from the model's seed, to prove Reset
      // restores the model rating / implied bracket rather than these.
      windSpeedMax: 20,
      windGustsMax: 25,
      precipitationProbabilityMax: 15,
      uvIndexMax: 5,
    },
  };

  it("shows the DJI model's display name in the header for a model-seeded profile", async () => {
    mockGetDroneProfile.mockResolvedValue(modelSeededProfile);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    const headerText = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat()
      .join(' ');
    expect(headerText).toContain('DJI Mini 4 Pro');
  });

  it('resets wind/gust to the model rating and rain/UV to the implied bracket default for a model-seeded profile', async () => {
    mockGetDroneProfile.mockResolvedValue(modelSeededProfile);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    const find = (testID: string) => renderer.root.findByProps({ testID });

    act(() => {
      find('threshold-reset-windSpeedMax').props.onPress();
      find('threshold-reset-windGustsMax').props.onPress();
      find('threshold-reset-precipitationProbabilityMax').props.onPress();
      find('threshold-reset-uvIndexMax').props.onPress();
    });
    await act(async () => {
      await find('save-thresholds').props.onPress();
    });

    // Mini 4 Pro's own rating (38.5 km/h) for wind/gust; sub-250g bracket
    // default (25%, UV 9) for rain/UV, per ADR 0013.
    expect(mockSaveDroneProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        thresholds: {
          windSpeedMax: 38.5,
          windGustsMax: 38.5,
          precipitationProbabilityMax: 25,
          uvIndexMax: 9,
        },
      }),
    );
  });

  it('leaves reset behavior unchanged for a profile without droneModelId', async () => {
    mockGetDroneProfile.mockResolvedValue(profile);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <EditThresholdsScreen onDone={jest.fn()} />,
      );
    });
    await flush();

    const find = (testID: string) => renderer.root.findByProps({ testID });

    act(() => {
      find('threshold-input-windSpeedMax').props.onChangeText('99');
    });
    act(() => {
      find('threshold-reset-windSpeedMax').props.onPress();
    });
    await act(async () => {
      await find('save-thresholds').props.onPress();
    });

    expect(mockSaveDroneProfile).toHaveBeenLastCalledWith(
      expect.objectContaining({
        thresholds: expect.objectContaining({ windSpeedMax: 28 }),
      }),
    );
  });
});
