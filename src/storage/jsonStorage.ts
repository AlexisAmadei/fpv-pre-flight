import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin JSON wrapper over AsyncStorage. All app data is local-only (ADR-0002);
// this is the one seam every repository (DroneProfile, FlyingSpot, ...) persists through.
export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function deleteJson(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
