import { readJson, writeJson } from '../storage/jsonStorage';
import type { DroneProfile } from '../weather/types';

const STORAGE_KEY = 'droneProfile';

// One DroneProfile per install for now — nothing in the spec asks for
// switching between multiple drones yet, so "the" profile is whichever one
// is saved.
export async function getDroneProfile(): Promise<DroneProfile | null> {
  return readJson<DroneProfile>(STORAGE_KEY);
}

export async function saveDroneProfile(profile: DroneProfile): Promise<void> {
  await writeJson(STORAGE_KEY, profile);
}
