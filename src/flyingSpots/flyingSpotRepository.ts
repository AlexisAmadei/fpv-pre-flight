import { readJson, writeJson } from '../storage/jsonStorage';
import type { FlyingSpot } from '../weather/types';

const STORAGE_KEY = 'flyingSpots';

export async function listFlyingSpots(): Promise<FlyingSpot[]> {
  return (await readJson<FlyingSpot[]>(STORAGE_KEY)) ?? [];
}

export async function addFlyingSpot(spot: FlyingSpot): Promise<void> {
  const spots = await listFlyingSpots();
  await writeJson(STORAGE_KEY, [...spots, spot]);
}

export async function deleteFlyingSpot(id: string): Promise<void> {
  const spots = await listFlyingSpots();
  await writeJson(
    STORAGE_KEY,
    spots.filter(spot => spot.id !== id),
  );
}
