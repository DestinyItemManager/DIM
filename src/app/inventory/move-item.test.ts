import type { Destiny2ApiMocks } from 'testing/destiny2-api-mocks';
import { mockDestiny2Api } from 'testing/destiny2-api-mocks';
import type { DimStore } from './store-types';

// Native ESM: mock the Bungie.net APIs, then dynamically import everything that
// transitively depends on them (see testing/destiny2-api-mocks).
let transferMock: Destiny2ApiMocks['transferMock'];
let resetMocks: Destiny2ApiMocks['resetMocks'];

let setD2Manifest: typeof import('app/manifest/actions').setD2Manifest;
let buildFreshStores: typeof import('testing/move-item-test-utils').buildFreshStores;
let getVault: typeof import('testing/move-item-test-utils').getVault;
let setupMoveTestStore: typeof import('testing/move-item-test-utils').setupMoveTestStore;
let getTestDefinitions: typeof import('testing/test-utils').getTestDefinitions;
let setupi18n: typeof import('testing/test-utils').setupi18n;
let moveItemTo: typeof import('./move-item').moveItemTo;

beforeAll(async () => {
  ({ transferMock, resetMocks } = await mockDestiny2Api());

  ({ setD2Manifest } = await import('app/manifest/actions'));
  ({ buildFreshStores, getVault, setupMoveTestStore } =
    await import('testing/move-item-test-utils'));
  ({ getTestDefinitions, setupi18n } = await import('testing/test-utils'));
  ({ moveItemTo } = await import('./move-item'));
});

function findTransferableWeapon(store: DimStore) {
  return store.items.find(
    (i) =>
      i.bucket.sort === 'Weapons' &&
      i.instanced &&
      !i.notransfer &&
      !i.equipped &&
      !i.location.inPostmaster &&
      Boolean(i.bucket.vaultBucket),
  )!;
}

describe('moveItemTo', () => {
  beforeAll(async () => {
    await setupi18n();
  });

  beforeEach(() => {
    resetMocks();
  });

  // Regression test for #10046: requesting the same move twice (e.g. the user
  // clicks again while Bungie.net is slow) should finish the second one as a
  // no-op rather than failing on a now-stale item.
  it('treats a repeated move of an already-moved item as a no-op', async () => {
    const defs = await getTestDefinitions();
    const stores = await buildFreshStores();
    const character = stores.find((s) => !s.isVault && findTransferableWeapon(s))!;
    const vault = getVault(stores)!;
    const item = findTransferableWeapon(character);

    const { dispatch, getStores } = setupMoveTestStore(stores);
    dispatch(setD2Manifest(defs));

    // First move: the item goes to the vault.
    await dispatch(moveItemTo(item, vault));
    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(getVault(getStores())!.items.some((i) => i.id === item.id)).toBe(true);

    // Second move: same (now stale) item reference, already in the vault.
    transferMock.mockClear();
    await dispatch(moveItemTo(item, vault));

    // No transfer happened - it was a no-op - and the item is still in the vault.
    expect(transferMock).not.toHaveBeenCalled();
    expect(getVault(getStores())!.items.some((i) => i.id === item.id)).toBe(true);
  });
});
