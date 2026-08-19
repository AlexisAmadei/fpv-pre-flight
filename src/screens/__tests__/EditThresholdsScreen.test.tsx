import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
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
});
