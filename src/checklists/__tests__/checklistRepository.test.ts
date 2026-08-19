import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addChecklistItem,
  deleteChecklistItem,
  evictChecklist,
  getChecklist,
  resetChecklist,
  setChecklistItemDone,
} from '../checklistRepository';
import { GENERIC_CHECKLIST } from '../genericChecklist';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const PROFILE = 'p1';
const OTHER = 'p2';

describe('checklistRepository', () => {
  it('starts as the GenericChecklist with nothing ticked', async () => {
    const checklist = await getChecklist(PROFILE);
    expect(checklist.map(item => item.label)).toEqual(
      GENERIC_CHECKLIST.map(item => item.label),
    );
    expect(checklist.every(item => !item.done)).toBe(true);
    expect(checklist.every(item => item.generic)).toBe(true);
  });

  it('appends a profile’s own items after the generic ones', async () => {
    await addChecklistItem(PROFILE, { id: 'c1', label: 'Pack spare props' });
    const checklist = await getChecklist(PROFILE);
    expect(checklist).toHaveLength(GENERIC_CHECKLIST.length + 1);
    expect(checklist[checklist.length - 1]).toEqual({
      id: 'c1',
      label: 'Pack spare props',
      done: false,
      generic: false,
    });
  });

  it('keeps each profile’s additions separate', async () => {
    await addChecklistItem(PROFILE, { id: 'c1', label: 'Pack spare props' });
    const other = await getChecklist(OTHER);
    expect(other).toHaveLength(GENERIC_CHECKLIST.length);
  });

  it('ticks and unticks an item', async () => {
    const [first] = GENERIC_CHECKLIST;
    await setChecklistItemDone(PROFILE, first.id, true);
    expect((await getChecklist(PROFILE))[0].done).toBe(true);

    await setChecklistItemDone(PROFILE, first.id, false);
    expect((await getChecklist(PROFILE))[0].done).toBe(false);
  });

  it('keeps ticked state per profile', async () => {
    const [first] = GENERIC_CHECKLIST;
    await setChecklistItemDone(PROFILE, first.id, true);
    expect((await getChecklist(OTHER))[0].done).toBe(false);
  });

  it('deletes a profile’s own item along with its ticked state', async () => {
    await addChecklistItem(PROFILE, { id: 'c1', label: 'Pack spare props' });
    await setChecklistItemDone(PROFILE, 'c1', true);
    await deleteChecklistItem(PROFILE, 'c1');
    expect(await getChecklist(PROFILE)).toHaveLength(GENERIC_CHECKLIST.length);
  });

  it('refuses to delete a generic item, which every profile shares', async () => {
    const [first] = GENERIC_CHECKLIST;
    await deleteChecklistItem(PROFILE, first.id);
    expect(await getChecklist(PROFILE)).toHaveLength(GENERIC_CHECKLIST.length);
  });

  it('clears every tick on reset but keeps the items', async () => {
    await addChecklistItem(PROFILE, { id: 'c1', label: 'Pack spare props' });
    await setChecklistItemDone(PROFILE, GENERIC_CHECKLIST[0].id, true);
    await setChecklistItemDone(PROFILE, 'c1', true);

    await resetChecklist(PROFILE);

    const checklist = await getChecklist(PROFILE);
    expect(checklist).toHaveLength(GENERIC_CHECKLIST.length + 1);
    expect(checklist.every(item => !item.done)).toBe(true);
  });

  it('evicts a deleted profile’s checklist', async () => {
    await addChecklistItem(PROFILE, { id: 'c1', label: 'Pack spare props' });
    await setChecklistItemDone(PROFILE, 'c1', true);

    await evictChecklist(PROFILE);

    expect(await getChecklist(PROFILE)).toHaveLength(GENERIC_CHECKLIST.length);
  });
});
