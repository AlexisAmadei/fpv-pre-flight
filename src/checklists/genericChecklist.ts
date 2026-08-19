import type { ChecklistItem } from '../weather/types';

/**
 * The GenericChecklist: preflight items that apply regardless of which
 * DroneProfile is flying. These are not stored per profile — they are the
 * fixed base every Checklist is built on, so ids are stable across installs
 * and checked-state can key off them directly.
 */
export const GENERIC_CHECKLIST: ChecklistItem[] = [
  { id: 'generic-props', label: 'Props tight and undamaged' },
  { id: 'generic-battery', label: 'Battery secured and fully charged' },
  { id: 'generic-gps', label: 'GPS lock acquired' },
  { id: 'generic-antennas', label: 'Antennas oriented correctly' },
  { id: 'generic-firmware', label: 'Firmware up to date' },
  { id: 'generic-airspace', label: 'Airspace clear and legal to fly' },
];
