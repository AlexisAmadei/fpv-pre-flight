import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import type { Coordinates } from '../weather/types';

export class LocationPermissionDeniedError extends Error {
  constructor() {
    super('Location permission was denied.');
    this.name = 'LocationPermissionDeniedError';
  }
}

export class LocationUnavailableError extends Error {
  constructor(message = 'Unable to determine the current location.') {
    super(message);
    this.name = 'LocationUnavailableError';
  }
}

// Android API 23+ requires an explicit PermissionsAndroid request before
// calling into Geolocation, or the native call can hard-crash. On iOS the
// native call itself triggers the CoreLocation authorization prompt (backed
// by Info.plist's NSLocationWhenInUseUsageDescription), so no separate
// request is needed there.
async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getCurrentPosition(): Promise<Coordinates> {
  if (!(await ensureAndroidPermission())) {
    throw new LocationPermissionDeniedError();
  }

  return new Promise<Coordinates>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationPermissionDeniedError());
        } else {
          reject(new LocationUnavailableError(error.message));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
