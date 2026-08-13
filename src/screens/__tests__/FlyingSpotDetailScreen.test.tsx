import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { FlyingSpotDetailScreen } from '../FlyingSpotDetailScreen';
import { getDroneProfile } from '../../droneProfiles/droneProfileRepository';
import { getWeather } from '../../weather/weatherCache';
import { flush } from '../../testUtils/flush';
import type { DroneProfile, FlyingSpot } from '../../weather/types';

jest.mock('../../droneProfiles/droneProfileRepository', () => ({
  getDroneProfile: jest.fn(),
}));
jest.mock('../../weather/weatherCache', () => ({
  getWeather: jest.fn(),
}));

const mockGetDroneProfile = getDroneProfile as jest.MockedFunction<
  typeof getDroneProfile
>;
const mockGetWeather = getWeather as jest.MockedFunction<typeof getWeather>;

const spot: FlyingSpot = {
  id: 'spot-1',
  name: 'Ridge Launch',
  coordinates: { latitude: 51.5, longitude: -0.1 },
};
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
  mockGetWeather.mockReset();
});

describe('FlyingSpotDetailScreen', () => {
  it('shows a stale label when the cache falls back to an old forecast', async () => {
    mockGetDroneProfile.mockResolvedValue(profile);
    mockGetWeather.mockResolvedValue({
      stale: true,
      forecast: {
        unitSystem: 'metric',
        hourly: [
          {
            time: '2020-01-01T00:00',
            windSpeed: 5,
            windGusts: 8,
            precipitationProbability: 0,
            cloudCover: 10,
            uvIndex: 2,
          },
        ],
        daily: [
          {
            date: '2020-01-01',
            windSpeedMax: 5,
            windGustsMax: 8,
            precipitationProbabilityMax: 0,
            uvIndexMax: 2,
            cloudCoverMean: 10,
            sunrise: '2020-01-01T00:00',
            sunset: '2020-01-01T23:00',
          },
        ],
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen spot={spot} onCreateDroneProfile={jest.fn()} />,
      );
    });
    await flush();

    expect(renderer!.root.findByProps({ testID: 'stale-label' })).toBeTruthy();
    expect(
      renderer!.root.findByProps({ testID: 'verdict-badge' }),
    ).toBeTruthy();
  });

  it('shows an error state with retry when there is no cached forecast and the fetch fails', async () => {
    mockGetDroneProfile.mockResolvedValue(profile);
    mockGetWeather.mockRejectedValue(new Error('offline'));

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen spot={spot} onCreateDroneProfile={jest.fn()} />,
      );
    });
    await flush();

    expect(
      renderer!.root.findByProps({ testID: 'weather-error' }),
    ).toBeTruthy();
    expect(() =>
      renderer!.root.findByProps({ testID: 'verdict-badge' }),
    ).toThrow();
  });

  it('prompts to create a drone profile instead of showing a broken Verdict', async () => {
    mockGetDroneProfile.mockResolvedValue(null);
    mockGetWeather.mockResolvedValue({
      stale: false,
      forecast: { unitSystem: 'metric', hourly: [], daily: [] },
    });

    const onCreateDroneProfile = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={onCreateDroneProfile}
        />,
      );
    });
    await flush();

    expect(() =>
      renderer!.root.findByProps({ testID: 'verdict-badge' }),
    ).toThrow();
    act(() => {
      renderer!.root
        .findByProps({ testID: 'prompt-create-drone-profile' })
        .props.onPress();
    });
    expect(onCreateDroneProfile).toHaveBeenCalled();
  });
});
