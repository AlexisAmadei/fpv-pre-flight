import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { FlyingSpotDetailScreen } from '../FlyingSpotDetailScreen';
import { listDroneProfiles } from '../../droneProfiles/droneProfileRepository';
import { getWeather } from '../../weather/weatherCache';
import { flush } from '../../testUtils/flush';
import type {
  DroneProfile,
  FlyingSpot,
  WeatherForecast,
} from '../../weather/types';

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
  kind: 'fpv',
  weightClass: '5-inch',
  thresholds: {
    windSpeedMax: 28,
    windGustsMax: 38,
    precipitationProbabilityMax: 30,
    uvIndexMax: 10,
  },
};

function point(time: string, windSpeed: number) {
  return {
    time,
    windSpeed,
    windGusts: windSpeed + 3,
    precipitationProbability: 0,
    cloudCover: 10,
    uvIndex: 2,
  };
}

// "Today" is fixed in the past and the screen is given an explicit `now`
// inside that day's daylight window, so the default badge resolves the same
// way regardless of when this test runs — only the breakdown and preview flow
// are under test here, not the default-badge timing.
const forecast: WeatherForecast = {
  unitSystem: 'metric',
  hourly: [
    point('2020-01-01T08:00', 5), // today, within daylight
    point('2020-01-01T12:00', 6), // today, within daylight
    point('2020-01-02T06:00', 40), // day 1 preview: red (over windSpeedMax)
    point('2020-01-03T06:00', 5), // day 2 preview: green
  ],
  daily: [
    {
      date: '2020-01-01',
      windSpeedMax: 6,
      windGustsMax: 9,
      precipitationProbabilityMax: 0,
      uvIndexMax: 2,
      cloudCoverMean: 10,
      sunrise: '2020-01-01T07:00',
      sunset: '2020-01-01T20:00',
    },
    {
      date: '2020-01-02',
      windSpeedMax: 40,
      windGustsMax: 43,
      precipitationProbabilityMax: 0,
      uvIndexMax: 2,
      cloudCoverMean: 10,
      sunrise: '2020-01-02T06:00',
      sunset: '2020-01-02T20:00',
    },
    {
      date: '2020-01-03',
      windSpeedMax: 5,
      windGustsMax: 8,
      precipitationProbabilityMax: 0,
      uvIndexMax: 2,
      cloudCoverMean: 10,
      sunrise: '2020-01-03T06:00',
      sunset: '2020-01-03T20:00',
    },
  ],
};

beforeEach(() => {
  mockListDroneProfiles.mockReset().mockResolvedValue([profile]);
  mockGetWeather.mockReset().mockResolvedValue({ stale: false, forecast });
});

describe('FlyingSpotDetailScreen breakdown + preview', () => {
  it('lists daylight-trimmed hourly points and next-3-day summaries, and previews a future day without touching the default badge', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <FlyingSpotDetailScreen
          spot={spot}
          onCreateDroneProfile={jest.fn()}
          now={new Date('2020-01-01T12:00')}
        />,
      );
    });
    await flush();

    const defaultBadgeText = renderer!.root.findByProps({
      testID: 'verdict-label',
    }).props.children;

    const daylightList = renderer!.root.findByProps({
      testID: 'daylight-hours-list',
    });
    expect(daylightList.props.data).toHaveLength(2); // only today's two points, not day 1/2's

    expect(
      renderer!.root.findByProps({ testID: 'preview-day-1' }),
    ).toBeTruthy();
    expect(
      renderer!.root.findByProps({ testID: 'preview-day-2' }),
    ).toBeTruthy();

    act(() => {
      renderer!.root.findByProps({ testID: 'preview-day-1' }).props.onPress();
    });

    const previewTexts = renderer!.root
      .findByProps({ testID: 'preview-verdict' })
      .findAllByType(Text)
      .map(t => t.props.children)
      .flat()
      .join(' ');
    expect(previewTexts).toContain('NO-GO');

    // Previewing a future day never changes the default badge (ADR-0006).
    expect(
      renderer!.root.findByProps({ testID: 'verdict-label' }).props.children,
    ).toBe(defaultBadgeText);

    act(() => {
      renderer!.root.findByProps({ testID: 'close-preview' }).props.onPress();
    });
    expect(() =>
      renderer!.root.findByProps({ testID: 'preview-verdict' }),
    ).toThrow();
  });
});
