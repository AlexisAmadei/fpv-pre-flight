import { readJson, writeJson } from '../storage/jsonStorage';
import { GENERIC_CHECKLIST } from './genericChecklist';
import type { ChecklistEntry, ChecklistItem } from '../weather/types';

const ITEMS_KEY = 'checklistItems';
const DONE_KEY = 'checklistDone';

// Both maps are keyed by DroneProfile id: each profile keeps its own additions
// and its own ticked state, so switching drones doesn't carry either across.
type ItemsByProfile = Record<string, ChecklistItem[]>;
type DoneByProfile = Record<string, string[]>;

async function readItems(): Promise<ItemsByProfile> {
  return (await readJson<ItemsByProfile>(ITEMS_KEY)) ?? {};
}

async function readDone(): Promise<DoneByProfile> {
  return (await readJson<DoneByProfile>(DONE_KEY)) ?? {};
}

/**
 * The full Checklist for one DroneProfile: the GenericChecklist first, then
 * that profile's own additions, each flagged with its current ticked state.
 */
export async function getChecklist(
  profileId: string,
): Promise<ChecklistEntry[]> {
  const [items, done] = await Promise.all([readItems(), readDone()]);
  const ticked = new Set(done[profileId] ?? []);

  const toEntry = (item: ChecklistItem, generic: boolean): ChecklistEntry => ({
    ...item,
    generic,
    done: ticked.has(item.id),
  });

  return [
    ...GENERIC_CHECKLIST.map(item => toEntry(item, true)),
    ...(items[profileId] ?? []).map(item => toEntry(item, false)),
  ];
}

export async function addChecklistItem(
  profileId: string,
  item: ChecklistItem,
): Promise<void> {
  const items = await readItems();
  await writeJson(ITEMS_KEY, {
    ...items,
    [profileId]: [...(items[profileId] ?? []), item],
  });
}

/**
 * Removes one of a profile's own additions. Generic items are shared by every
 * profile, so they are ignored here rather than deleted out from under others.
 */
export async function deleteChecklistItem(
  profileId: string,
  itemId: string,
): Promise<void> {
  if (GENERIC_CHECKLIST.some(item => item.id === itemId)) {
    return;
  }
  const [items, done] = await Promise.all([readItems(), readDone()]);
  await writeJson(ITEMS_KEY, {
    ...items,
    [profileId]: (items[profileId] ?? []).filter(item => item.id !== itemId),
  });
  await writeJson(DONE_KEY, {
    ...done,
    [profileId]: (done[profileId] ?? []).filter(id => id !== itemId),
  });
}

export async function setChecklistItemDone(
  profileId: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  const all = await readDone();
  const ticked = new Set(all[profileId] ?? []);
  if (done) {
    ticked.add(itemId);
  } else {
    ticked.delete(itemId);
  }
  await writeJson(DONE_KEY, { ...all, [profileId]: [...ticked] });
}

/**
 * Clears every ticked item for one profile. Only ever called from an explicit
 * pilot action — a Checklist never resets off the back of the weather or
 * Verdict flow (see CONTEXT.md).
 */
export async function resetChecklist(profileId: string): Promise<void> {
  const done = await readDone();
  await writeJson(DONE_KEY, { ...done, [profileId]: [] });
}

/** Drops a deleted profile's Checklist so its items and ticks don't linger. */
export async function evictChecklist(profileId: string): Promise<void> {
  const [items, done] = await Promise.all([readItems(), readDone()]);
  delete items[profileId];
  delete done[profileId];
  await writeJson(ITEMS_KEY, items);
  await writeJson(DONE_KEY, done);
}
