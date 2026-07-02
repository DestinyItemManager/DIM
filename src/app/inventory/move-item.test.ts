import { setD2Manifest } from 'app/manifest/actions';
import { buildFreshStores, getVault, setupMoveTestStore } from 'testing/move-item-test-utils';
import { getTestDefinitions, setupi18n } from 'testing/test-utils';
import { moveItemTo } from './move-item';

rs.mock('app/bungie-api/destiny2-api', () => ({
  transfer: jest.fn().mockResolvedValue({}),
  equip: jest.fn().mockResolvedValue({}),
  equipItems: jest.fn().mockResolvedValue({}),
  setLockState: jest.fn().mockResolvedValue({}),
  setTrackedState: jest.fn().mockResolvedValue({}),
  getCharacters: jest.fn().mockResolvedValue({ characters: { data: {} } }),
}));

import { transfer } from 'app/bungie-api/destiny2-api';
import { DimStore } from './store-types';

const transferMock = transfer as jest.Mock;

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
    transferMock.mockClear();
    transferMock.mockResolvedValue({});
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
