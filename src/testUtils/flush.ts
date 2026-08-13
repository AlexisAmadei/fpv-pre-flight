import { act } from 'react-test-renderer';

// Drains chained promise microtasks (repository reads, cache lookups, fetch
// mocks) queued by an effect so assertions run after state has settled.
export async function flush(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  });
}
