import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import { AddFlyingSpotScreen } from '../AddFlyingSpotScreen';
import {
  getCurrentPosition,
  LocationPermissionDeniedError,
  LocationUnavailableError,
} from '../../location/deviceLocation';
import { addFlyingSpot } from '../../flyingSpots/flyingSpotRepository';
import { flush } from '../../testUtils/flush';

jest.mock('../../location/deviceLocation', () => {
  class MockLocationPermissionDeniedError extends Error {}
  class MockLocationUnavailableError extends Error {}
  return {
    getCurrentPosition: jest.fn(),
    LocationPermissionDeniedError: MockLocationPermissionDeniedError,
    LocationUnavailableError: MockLocationUnavailableError,
  };
});
jest.mock('../../flyingSpots/flyingSpotRepository', () => ({
  addFlyingSpot: jest.fn(),
}));
jest.mock('../SpotMapView');

const mockGetCurrentPosition = getCurrentPosition as jest.MockedFunction<
  typeof getCurrentPosition
>;
const mockAddFlyingSpot = addFlyingSpot as jest.MockedFunction<
  typeof addFlyingSpot
>;

const fix = { latitude: 51.5, longitude: -0.1 };

beforeEach(() => {
  mockGetCurrentPosition.mockReset();
  mockAddFlyingSpot.mockReset().mockResolvedValue(undefined);
});

async function renderScreen(onAdded = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AddFlyingSpotScreen onAdded={onAdded} />,
    );
  });
  await flush();
  return { renderer, onAdded };
}

describe('AddFlyingSpotScreen', () => {
  it('fetches the GPS fix on mount, shows the pin on the map, and enables Save once named', async () => {
    mockGetCurrentPosition.mockResolvedValue(fix);
    const { renderer } = await renderScreen();

    const map = renderer.root.findByProps({ testID: 'spot-map' });
    expect(map.props.coordinates).toEqual(fix);

    const saveButton = renderer.root.findByProps({
      testID: 'save-flying-spot',
    });
    expect(saveButton.props.disabled).toBe(true);

    act(() => {
      renderer.root
        .findByProps({ testID: 'spot-name-input' })
        .props.onChangeText('Ridge Launch');
    });

    expect(
      renderer.root.findByProps({ testID: 'save-flying-spot' }).props
        .disabled,
    ).toBe(false);
  });

  it('has no manual latitude/longitude inputs', async () => {
    mockGetCurrentPosition.mockResolvedValue(fix);
    const { renderer } = await renderScreen();

    expect(() =>
      renderer.root.findByProps({ testID: 'spot-latitude-input' }),
    ).toThrow();
    expect(() =>
      renderer.root.findByProps({ testID: 'spot-longitude-input' }),
    ).toThrow();
  });

  it('saves the dragged pin position rather than the original GPS fix', async () => {
    mockGetCurrentPosition.mockResolvedValue(fix);
    const onAdded = jest.fn();
    const { renderer } = await renderScreen(onAdded);

    const dragged = { latitude: 51.6, longitude: -0.2 };
    act(() => {
      renderer.root
        .findByProps({ testID: 'spot-map' })
        .props.onCoordinatesChange(dragged);
    });
    act(() => {
      renderer.root
        .findByProps({ testID: 'spot-name-input' })
        .props.onChangeText('Ridge Launch');
    });
    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'save-flying-spot' })
        .props.onPress();
    });

    expect(mockAddFlyingSpot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ridge Launch', coordinates: dragged }),
    );
    expect(onAdded).toHaveBeenCalled();
  });

  it('shows a settings deep-link when location permission is denied', async () => {
    mockGetCurrentPosition.mockRejectedValue(
      new LocationPermissionDeniedError(),
    );
    const { renderer } = await renderScreen();

    expect(
      renderer.root.findByProps({ testID: 'location-permission-denied' }),
    ).toBeTruthy();
    expect(
      renderer.root.findByProps({ testID: 'open-location-settings' }),
    ).toBeTruthy();
  });

  it('re-checks location when the app returns to the foreground after a permission denial', async () => {
    mockGetCurrentPosition.mockRejectedValueOnce(
      new LocationPermissionDeniedError(),
    );
    const { renderer } = await renderScreen();
    expect(
      renderer.root.findByProps({ testID: 'location-permission-denied' }),
    ).toBeTruthy();

    const mockAddEventListener =
      AppState.addEventListener as jest.MockedFunction<
        typeof AppState.addEventListener
      >;
    const [, onAppStateChange] = mockAddEventListener.mock.calls[
      mockAddEventListener.mock.calls.length - 1
    ] as [string, (state: string) => void];

    mockGetCurrentPosition.mockResolvedValueOnce(fix);
    await act(async () => {
      onAppStateChange('active');
    });
    await flush();

    expect(
      renderer.root.findByProps({ testID: 'spot-map' }).props.coordinates,
    ).toEqual(fix);
  });

  it('shows a retry button on a generic location failure, which re-fetches the position', async () => {
    mockGetCurrentPosition.mockRejectedValueOnce(
      new LocationUnavailableError('timeout'),
    );
    const { renderer } = await renderScreen();

    expect(
      renderer.root.findByProps({ testID: 'location-error' }),
    ).toBeTruthy();

    mockGetCurrentPosition.mockResolvedValueOnce(fix);
    await act(async () => {
      await renderer.root
        .findByProps({ testID: 'retry-location' })
        .props.onPress();
    });
    await flush();

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
    expect(
      renderer.root.findByProps({ testID: 'spot-map' }).props.coordinates,
    ).toEqual(fix);
  });
});
