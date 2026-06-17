import { transfer } from 'app/bungie-api/destiny2-api';
import { itemMoveLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { setD2Manifest } from 'app/manifest/actions';
import { BucketHashes } from 'data/d2/generated-enums';
import {
  addItemToStore,
  buildFreshStores,
  cloneItem,
  findItemsByBucket,
  getVault,
  removeItemFromStore,
  setupMoveTestStore,
} from 'testing/move-item-test-utils';
import { getTestDefinitions, setupi18n } from 'testing/test-utils';

// Mock the Bungie.net write APIs (and the post-apply character refresh) so
// applying a loadout doesn't hit the network. The in-memory model is updated by
// the reducer, so resolving is enough. (jest hoists this above the imports.)
jest.mock('app/bungie-api/destiny2-api', () => ({
  transfer: jest.fn().mockResolvedValue({}),
  equip: jest.fn().mockResolvedValue({}),
  equipItems: jest.fn().mockResolvedValue({}),
  setLockState: jest.fn().mockResolvedValue({}),
  setTrackedState: jest.fn().mockResolvedValue({}),
  getCharacters: jest.fn().mockResolvedValue({ characters: { data: {} } }),
}));

const transferMock = transfer as jest.Mock;

describe('applyLoadout', () => {
  beforeAll(async () => {
    await setupi18n();
  });

  beforeEach(() => {
    transferMock.mockClear();
    transferMock.mockResolvedValue({});
  });

  // Regression test for #8872 / #8506: bulk-moving consumables via a filtered
  // search uses a "move loadout". Unique-stack consumables like Hymn of
  // Desecration used to make the vault look full and cascade move-asides.
  it('bulk-moves unique-stack consumables to the vault without cascading', async () => {
    const defs = await getTestDefinitions();
    const stores = await buildFreshStores();
    const character = stores.find(
      (s) => !s.isVault && s.items.some((i) => i.name === 'Hymn of Desecration'),
    )!;
    const vault = getVault(stores)!;

    const consumables = character.items.filter(
      (i) =>
        i.bucket.hash === BucketHashes.Consumables && !i.notransfer && !i.location.inPostmaster,
    );
    const hymn = consumables.find((i) => i.name === 'Hymn of Desecration')!;
    expect(hymn.uniqueStack).toBe(true);

    const { dispatch, getStores } = setupMoveTestStore(stores);
    dispatch(setD2Manifest(defs));

    await dispatch(applyLoadout(vault, itemMoveLoadout(consumables, vault)));

    const newVault = getVault(getStores())!;
    const newCharacter = getStores().find((s) => s.id === character.id)!;

    // Hymn moved to the vault and left the character.
    expect(newVault.items.some((i) => i.hash === hymn.hash)).toBe(true);
    expect(newCharacter.items.some((i) => i.hash === hymn.hash)).toBe(false);

    // No move-aside cascade: at most one transfer per moved consumable.
    expect(transferMock.mock.calls.length).toBeLessThanOrEqual(consumables.length);
  });

  // Regression test for #3573 / #9416: when bulk-moving search results to the
  // vault de-equips an item and must pull a replacement from the vault, it must
  // not pick a search-matched item (one that's part of the move) as the
  // replacement.
  it('does not equip a matched vault item as a de-equip replacement', async () => {
    const defs = await getTestDefinitions();
    const stores = await buildFreshStores();
    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // An equipped (non-exotic) weapon - it matches the search, so it's part of
    // the move to the vault.
    const equipped = character.items.find(
      (i) => i.equipped && i.bucket.sort === 'Weapons' && !i.isExotic,
    )!;
    expect(equipped).toBeDefined();
    const bucketHash = equipped.bucket.hash;

    // Remove every other weapon in that bucket from the character so the
    // replacement for the de-equipped weapon has to come from the vault.
    for (const i of character.items.filter((i) => i.bucket.hash === bucketHash && !i.equipped)) {
      removeItemFromStore(stores, i);
    }
    // Clear that bucket in the vault too, so the only replacement candidates are
    // the two we add below.
    for (const i of vault.items.filter((i) => i.bucket.hash === bucketHash)) {
      removeItemFromStore(stores, i);
    }

    // Two non-exotic weapons in the vault: a "matched" one that ranks highest
    // (so it would be chosen first), and an "unmatched" one.
    const matchedDupe = cloneItem(equipped, {
      primaryStat: { statHash: equipped.primaryStat!.statHash, value: 9999 },
    });
    const unmatchedReplacement = cloneItem(equipped, {
      primaryStat: { statHash: equipped.primaryStat!.statHash, value: 1 },
    });
    addItemToStore(vault, matchedDupe);
    addItemToStore(vault, unmatchedReplacement);

    const { dispatch, getStores } = setupMoveTestStore(stores);
    dispatch(setD2Manifest(defs));

    // The move loadout contains the equipped weapon and the matched dupe (which
    // is already in the vault) - but NOT the unmatched replacement.
    await dispatch(applyLoadout(vault, itemMoveLoadout([equipped, matchedDupe], vault)));

    const newCharacter = getStores().find((s) => s.id === character.id)!;
    const newVault = getVault(getStores())!;

    const equippedInBucket = findItemsByBucket(newCharacter, bucketHash).filter((i) => i.equipped);
    expect(equippedInBucket).toHaveLength(1);
    // The replacement is the unmatched weapon, NOT the matched dupe.
    expect(equippedInBucket[0].id).toBe(unmatchedReplacement.id);
    // The matched dupe stayed in the vault, unequipped.
    expect(newVault.items.some((i) => i.id === matchedDupe.id)).toBe(true);
  });
});
