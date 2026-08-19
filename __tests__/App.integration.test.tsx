/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { flush } from '../src/testUtils/flush';
import { getCurrentPosition } from '../src/location/deviceLocation';

jest.mock('../src/location/deviceLocation', () => {
  class MockLocationPermissionDeniedError extends Error {}
  class MockLocationUnavailableError extends Error {}
  return {
    getCurrentPosition: jest.fn(),
    LocationPermissionDeniedError: MockLocationPermissionDeniedError,
    LocationUnavailableError: MockLocationUnavailableError,
  };
});
jest.mock('../src/screens/SpotMapView');

const mockGetCurrentPosition = getCurrentPosition as jest.MockedFunction<
  typeof getCurrentPosition
>;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:00`;
}

function buildOpenMeteoResponse() {
  const now = new Date();
  const hourTimes = [-2, -1, 0, 1, 2].map(offset => {
    const d = new Date(now);
    d.setHours(d.getHours() + offset, 0, 0, 0);
    return isoLocal(d);
  });
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 0, 0, 0);

  return {
    hourly: {
      time: hourTimes,
      wind_speed_10m: hourTimes.map(() => 5),
      wind_gusts_10m: hourTimes.map(() => 8),
      precipitation_probability: hourTimes.map(() => 0),
      cloud_cover: hourTimes.map(() => 10),
      uv_index: hourTimes.map(() => 2),
    },
    daily: {
      time: [isoLocal(startOfDay).split('T')[0]],
      wind_speed_10m_max: [5],
      wind_gusts_10m_max: [8],
      precipitation_probability_max: [0],
      uv_index_max: [2],
      cloud_cover_mean: [10],
      sunrise: [isoLocal(startOfDay)],
      sunset: [isoLocal(endOfDay)],
    },
  };
}

beforeEach(() => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => buildOpenMeteoResponse(),
  }) as unknown as typeof fetch;
  mockGetCurrentPosition
    .mockReset()
    .mockResolvedValue({ latitude: 51.5, longitude: -0.1 });
});

describe('Pre-Flight end-to-end flow', () => {
  it('lets a pilot create a drone profile, add a spot, and see a live green Verdict', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    await flush();

    const find = (testID: string) => renderer.root.findByProps({ testID });

    await act(async () => {
      await find('manage-drone-profile').props.onPress();
    });
    await flush();

    act(() => {
      find('drone-name-input').props.onChangeText('Test Quad');
    });
    act(() => {
      find('weight-class-5-inch').props.onPress();
    });
    await act(async () => {
      await find('save-drone-profile').props.onPress();
    });
    await flush();

    act(() => {
      find('add-flying-spot').props.onPress();
    });
    await flush();
    act(() => {
      find('spot-name-input').props.onChangeText('Ridge Launch');
    });
    await act(async () => {
      await find('save-flying-spot').props.onPress();
    });
    await flush();

    const openSpotButtons = renderer.root.findAll(
      node =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('open-spot-'),
    );
    expect(openSpotButtons.length).toBeGreaterThan(0);
    act(() => {
      openSpotButtons[0].props.onPress();
    });
    await flush();

    expect(find('verdict-badge')).toBeTruthy();
    expect(find('verdict-label').props.children).toBe('GO');
    expect(find('wind-speed')).toBeTruthy();
    expect(find('cloud-cover')).toBeTruthy();
  });
});
