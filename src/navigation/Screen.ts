import type { FlyingSpot } from '../weather/types';

export type Screen =
  | { name: 'flyingSpots' }
  | { name: 'addFlyingSpot' }
  | { name: 'flyingSpotDetail'; spot: FlyingSpot }
  | { name: 'createDroneProfile' }
  | { name: 'editThresholds' };
