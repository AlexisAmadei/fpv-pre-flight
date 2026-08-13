import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteJson, readJson, writeJson } from '../jsonStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('jsonStorage', () => {
  it('returns null for a key that was never written', async () => {
    expect(await readJson('missing')).toBeNull();
  });

  it('round-trips a written value', async () => {
    await writeJson('spot', { id: '1', name: 'Ridge' });
    expect(await readJson('spot')).toEqual({ id: '1', name: 'Ridge' });
  });

  it('overwrites a previously written value', async () => {
    await writeJson('spot', { name: 'Ridge' });
    await writeJson('spot', { name: 'Valley' });
    expect(await readJson('spot')).toEqual({ name: 'Valley' });
  });

  it('deletes a written value', async () => {
    await writeJson('spot', { name: 'Ridge' });
    await deleteJson('spot');
    expect(await readJson('spot')).toBeNull();
  });
});
