import { jest } from '@jest/globals';
import { PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/destiny2';
import type { DimStore } from './store-types';

// Native ESM: use unstable_mockModule + dynamic import for mocking ES modules.
let transferMock: jest.MockedFunction<typeof import('app/bungie-api/destiny2-api').transfer>;

/** A successful Bungie.net write response - the move logic just awaits these, it ignores the body. */
const successResponse: ServerResponse<number> = {
  Response: 0,
  ErrorCode: PlatformErrorCodes.Success,
  ThrottleSeconds: 0,
  ErrorStatus: 'Success',
  Message: '',
  MessageData: {},
};

let setD2Manifest: typeof import('app/manifest/actions').setD2Manifest;
let buildFreshStores: typeof import('testing/move-item-test-utils').buildFreshStores;
let getVault: typeof import('testing/move-item-test-utils').getVault;
let setupMoveTestStore: typeof import('testing/move-item-test-utils').setupMoveTestStore;
let getTestDefinitions: typeof import('testing/test-utils').getTestDefinitions;
let setupi18n: typeof import('testing/test-utils').setupi18n;
let moveItemTo: typeof import('./move-item').moveItemTo;

beforeAll(async () => {
  jest.unstable_mockModule('app/bungie-api/destiny2-api', () => {
    // Spread the real module so every export is present for ESM link-time
    // binding; only the write APIs the tests exercise are mocked.
    const actual = jest.requireActual<typeof import('app/bungie-api/destiny2-api')>(
      'app/bungie-api/destiny2-api',
    );
    return {
      ...actual,
      transfer: jest.fn(() => Promise.resolve(successResponse)),
      equip: jest.fn(() => Promise.resolve(successResponse)),
      equipItems: jest.fn(() => Promise.resolve({})),
      setLockState: jest.fn(() => Promise.resolve(successResponse)),
      setTrackedState: jest.fn(() => Promise.resolve(successResponse)),
      getCharacters: jest.fn(() => Promise.resolve({ characters: { data: {} } })),
    };
  });

  const destiny2Api = await import('app/bungie-api/destiny2-api');
  transferMock = destiny2Api.transfer as jest.MockedFunction<typeof destiny2Api.transfer>;

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
    transferMock.mockClear();
    transferMock.mockResolvedValue(successResponse);
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
