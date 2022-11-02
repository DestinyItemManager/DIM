import { getTestStores } from 'testing/test-utils';

describe('process stores', () => {
  it('can process stores without errors', async () => {
    const stores = await getTestStores();
    expect(stores).toBeDefined();
    expect(stores?.length).toBe(4);
  });
});
