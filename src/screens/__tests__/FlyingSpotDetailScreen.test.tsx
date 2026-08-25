import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { FlyingSpotDetailScreen } from '../FlyingSpotDetailScreen';
import { listDroneProfiles } from '../../droneProfiles/droneProfileRepository';
import { getWeather } from '../../weather/weatherCache';
import { flush } from '../../testUtils/flush';
import type { DroneProfile, FlyingSpot } from '../../weather/types';

jest.mock('../../droneProfiles/droneProfileRepository', () => ({
  listDroneProfiles: jest.fn(),
  getActiveDroneProfileId: jest.fn().mockResolvedValue(null),
  setActiveDroneProfile: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../weather/weatherCache', () => ({
  getWeather: jest.fn(),
}));
jest.mock('../SpotMapView');

const mockListDroneProfiles = listDroneProfiles as jest.MockedFunction<
  typeof listDroneProfiles
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
  mockListDroneProfiles.mockReset();
  mockGetWeather.mockReset();
});

describe('FlyingSpotDetailScreen', () => {
  it('shows a stale label when the cache falls back to an old forecast', async () => {
    mockListDroneProfiles.mockResolvedValue([profile]);
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
    expect(
      renderer!.root.findByProps({ testID: 'spot-map' }).props.coordinates,
    ).toEqual(spot.coordinates);
    expect(
      renderer!.root.findByProps({ testID: 'spot-map' }).props
        .onCoordinatesChange,
    ).toBeUndefined();
  });

  it('shows an error state with retry when there is no cached forecast and the fetch fails', async () => {
    mockListDroneProfiles.mockResolvedValue([profile]);
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
    mockListDroneProfiles.mockResolvedValue([]);
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

  it('keeps showing weather when there is no drone profile, withholding only the verdict', async () => {
    // The forecast is fetched for the spot regardless of aircraft; only the
    // go/no-go depends on per-drone thresholds.
    mockListDroneProfiles.mockResolvedValue([]);
    mockGetWeather.mockResolvedValue({
      stale: false,
      forecast: {
        unitSystem: 'metric',
        hourly: [
          {
            time: '2026-08-24T14:00',
            windSpeed: 18,
            windGusts: 24,
            precipitationProbability: 10,
            cloudCover: 40,
            uvIndex: 6,
            temperature: 20,
            dewPoint: 12,
            lowCloudCover: 40,
          },
        ],
        daily: [
          {
            date: '2026-08-24',
            windSpeedMax: 22,
            windGustsMax: 30,
            precipitationProbabilityMax: 15,
            uvIndexMax: 7,
            cloudCoverMean: 40,
            sunrise: '2026-08-24T06:14',
            sunset: '2026-08-24T21:38',
          },
        ],
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={jest.fn()}
          now={new Date('2026-08-24T14:30')}
        />,
      );
    });
    await flush();

    expect(
      renderer!.root.findByProps({ testID: 'no-drone-verdict' }),
    ).toBeTruthy();
    expect(() =>
      renderer!.root.findByProps({ testID: 'verdict-badge' }),
    ).toThrow();
    // The weather itself survives the missing profile.
    expect(
      renderer!.root.findByProps({ testID: 'daylight-hours-list' }),
    ).toBeTruthy();
  });

  it('withholds the verdict outside the daylight window and names the window', async () => {
    mockListDroneProfiles.mockResolvedValue([profile]);
    mockGetWeather.mockResolvedValue({
      stale: false,
      forecast: {
        unitSystem: 'metric',
        hourly: [
          {
            time: '2026-08-24T14:00',
            windSpeed: 5,
            windGusts: 8,
            precipitationProbability: 0,
            cloudCover: 10,
            uvIndex: 2,
          },
        ],
        daily: [
          {
            date: '2026-08-24',
            windSpeedMax: 10,
            windGustsMax: 14,
            precipitationProbabilityMax: 5,
            uvIndexMax: 3,
            cloudCoverMean: 20,
            sunrise: '2026-08-24T06:14',
            sunset: '2026-08-24T21:38',
          },
        ],
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={jest.fn()}
          now={new Date('2026-08-24T23:10')}
        />,
      );
    });
    await flush();

    expect(
      renderer!.root.findByProps({ testID: 'outside-daylight' }),
    ).toBeTruthy();
    expect(() =>
      renderer!.root.findByProps({ testID: 'verdict-badge' }),
    ).toThrow();
  });

  it('shows the estimated cloud base only when the forecast carries a dew point', async () => {
    mockListDroneProfiles.mockResolvedValue([profile]);
    const daily = [
      {
        date: '2026-08-24',
        windSpeedMax: 22,
        windGustsMax: 30,
        precipitationProbabilityMax: 15,
        uvIndexMax: 7,
        cloudCoverMean: 40,
        sunrise: '2026-08-24T06:14',
        sunset: '2026-08-24T21:38',
      },
    ];
    const base = {
      time: '2026-08-24T14:00',
      windSpeed: 18,
      windGusts: 24,
      precipitationProbability: 10,
      cloudCover: 40,
      uvIndex: 6,
    };

    mockGetWeather.mockResolvedValue({
      stale: false,
      forecast: {
        unitSystem: 'metric',
        hourly: [{ ...base, temperature: 20, dewPoint: 12, lowCloudCover: 35 }],
        daily,
      },
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={jest.fn()}
          now={new Date('2026-08-24T14:30')}
        />,
      );
    });
    await flush();
    expect(renderer!.root.findByProps({ testID: 'cloud-base' })).toBeTruthy();

    // A forecast cached before dew point was fetched simply omits the section
    // rather than rendering an empty or zeroed estimate.
    mockGetWeather.mockResolvedValue({
      stale: false,
      forecast: { unitSystem: 'metric', hourly: [base], daily },
    });
    let plain: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      plain = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={jest.fn()}
          now={new Date('2026-08-24T14:30')}
        />,
      );
    });
    await flush();
    expect(() => plain!.root.findByProps({ testID: 'cloud-base' })).toThrow();
  });
});
