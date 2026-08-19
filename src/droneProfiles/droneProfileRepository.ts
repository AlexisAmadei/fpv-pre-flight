import { readJson, writeJson } from '../storage/jsonStorage';
import type { DroneProfile } from '../weather/types';

const FLEET_KEY = 'droneProfiles';
const ACTIVE_KEY = 'activeDroneProfileId';

// Superseded single-profile key. Kept only so installs from before the fleet
// migration don't silently lose the pilot's drone on first launch.
const LEGACY_PROFILE_KEY = 'droneProfile';

interface Fleet {
  profiles: DroneProfile[];
  activeId: string | null;
}

/**
 * Reads the saved fleet, migrating a pre-fleet single DroneProfile forward on
 * first read. The legacy key is left in place rather than deleted: reading is
 * expected to be side-effect free, and a stale key costs nothing.
 */
async function readFleet(): Promise<Fleet> {
  const profiles = await readJson<DroneProfile[]>(FLEET_KEY);

  if (profiles === null) {
    const legacy = await readJson<DroneProfile>(LEGACY_PROFILE_KEY);
    return legacy
      ? { profiles: [legacy], activeId: legacy.id }
      : { profiles: [], activeId: null };
  }

  const activeId = await readJson<string>(ACTIVE_KEY);
  return {
    profiles,
    // A saved activeId can dangle if that profile was deleted by an older
    // build; fall back to the first profile so the fleet always has a pilot.
    activeId:
      activeId && profiles.some(profile => profile.id === activeId)
        ? activeId
        : profiles[0]?.id ?? null,
  };
}

async function writeFleet(fleet: Fleet): Promise<void> {
  await writeJson(FLEET_KEY, fleet.profiles);
  await writeJson(ACTIVE_KEY, fleet.activeId);
}

export async function listDroneProfiles(): Promise<DroneProfile[]> {
  return (await readFleet()).profiles;
}

/** The DroneProfile currently being flown — the one Verdicts are computed against. */
export async function getActiveDroneProfile(): Promise<DroneProfile | null> {
  const { profiles, activeId } = await readFleet();
  return profiles.find(profile => profile.id === activeId) ?? null;
}

export async function getActiveDroneProfileId(): Promise<string | null> {
  return (await readFleet()).activeId;
}

/** Adds a profile to the fleet; the first one added becomes the active one. */
export async function addDroneProfile(profile: DroneProfile): Promise<void> {
  const fleet = await readFleet();
  await writeFleet({
    profiles: [...fleet.profiles, profile],
    activeId: fleet.activeId ?? profile.id,
  });
}

export async function updateDroneProfile(profile: DroneProfile): Promise<void> {
  const fleet = await readFleet();
  await writeFleet({
    ...fleet,
    profiles: fleet.profiles.map(existing =>
      existing.id === profile.id ? profile : existing,
    ),
  });
}

export async function deleteDroneProfile(id: string): Promise<void> {
  const fleet = await readFleet();
  const profiles = fleet.profiles.filter(profile => profile.id !== id);
  await writeFleet({
    profiles,
    // Deleting the drone being flown hands active status to whatever is left,
    // so the app never sits in a "fleet exists but nothing is flying" state.
    activeId: fleet.activeId === id ? profiles[0]?.id ?? null : fleet.activeId,
  });
}

export async function setActiveDroneProfile(id: string): Promise<void> {
  const fleet = await readFleet();
  if (!fleet.profiles.some(profile => profile.id === id)) {
    return;
  }
  await writeFleet({ ...fleet, activeId: id });
}
