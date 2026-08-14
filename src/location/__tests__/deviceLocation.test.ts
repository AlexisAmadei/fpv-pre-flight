import Geolocation from '@react-native-community/geolocation';
import type { GeolocationError } from '@react-native-community/geolocation';
import {
  getCurrentPosition,
  LocationPermissionDeniedError,
  LocationUnavailableError,
} from '../deviceLocation';

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

const mockGetCurrentPosition = Geolocation.getCurrentPosition as jest.Mock;

function nativeError(overrides: Partial<GeolocationError>): GeolocationError {
  return {
    code: 0,
    message: '',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
    ...overrides,
  };
}

beforeEach(() => {
  mockGetCurrentPosition.mockReset();
});

describe('getCurrentPosition', () => {
  it('resolves coordinates from a successful GPS fix', async () => {
    mockGetCurrentPosition.mockImplementation(success => {
      success({
        coords: {
          latitude: 51.5,
          longitude: -0.1,
          altitude: null,
          accuracy: 5,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 0,
      });
    });

    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 51.5,
      longitude: -0.1,
    });
  });

  it('throws LocationPermissionDeniedError when the native error is a permission denial', async () => {
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error(nativeError({ code: 1, message: 'denied' }));
    });

    await expect(getCurrentPosition()).rejects.toBeInstanceOf(
      LocationPermissionDeniedError,
    );
  });

  it('throws LocationUnavailableError for any other native error', async () => {
    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error(nativeError({ code: 3, message: 'timed out' }));
    });

    await expect(getCurrentPosition()).rejects.toBeInstanceOf(
      LocationUnavailableError,
    );
  });
});
