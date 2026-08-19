import type { DroneProfile, FlyingSpot } from '../weather/types';

export type Screen =
  | { name: 'flyingSpots' }
  | { name: 'addFlyingSpot' }
  | { name: 'flyingSpotDetail'; spot: FlyingSpot }
  | { name: 'droneFleet' }
  | { name: 'createDroneProfile' }
  | { name: 'editThresholds'; profile?: DroneProfile }
  | { name: 'checklist' };
