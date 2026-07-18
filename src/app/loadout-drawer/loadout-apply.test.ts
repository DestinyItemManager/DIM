import type { DimItem } from 'app/inventory/item-types';
import type { DimStore } from 'app/inventory/store-types';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import type { Destiny2ApiMocks } from 'testing/destiny2-api-mocks';
import { mockDestiny2Api } from 'testing/destiny2-api-mocks';

// Native ESM: mock the Bungie.net APIs, then dynamically import everything that
// transitively depends on them (see testing/destiny2-api-mocks).
let transferMock: Destiny2ApiMocks['transferMock'];
let equipItemsMock: Destiny2ApiMocks['equipItemsMock'];
let resetMocks: Destiny2ApiMocks['resetMocks'];

let itemMoveLoadout: typeof import('app/loadout-drawer/auto-loadouts').itemMoveLoadout;
let applyLoadout: typeof import('app/loadout-drawer/loadout-apply').applyLoadout;
let setD2Manifest: typeof import('app/manifest/actions').setD2Manifest;
let addItemToStore: typeof import('testing/move-item-test-utils').addItemToStore;
let buildFreshStores: typeof import('testing/move-item-test-utils').buildFreshStores;
let cloneItem: typeof import('testing/move-item-test-utils').cloneItem;
let findItemsByBucket: typeof import('testing/move-item-test-utils').findItemsByBucket;
let getVault: typeof import('testing/move-item-test-utils').getVault;
let removeItemFromStore: typeof import('testing/move-item-test-utils').removeItemFromStore;
let setupMoveTestStore: typeof import('testing/move-item-test-utils').setupMoveTestStore;
let getTestDefinitions: typeof import('testing/test-utils').getTestDefinitions;
let setupi18n: typeof import('testing/test-utils').setupi18n;

beforeAll(async () => {
  ({ transferMock, equipItemsMock, resetMocks } = await mockDestiny2Api());

  ({ itemMoveLoadout } = await import('app/loadout-drawer/auto-loadouts'));
  ({ applyLoadout } = await import('app/loadout-drawer/loadout-apply'));
  ({ setD2Manifest } = await import('app/manifest/actions'));
  ({
    addItemToStore,
    buildFreshStores,
    cloneItem,
    findItemsByBucket,
    getVault,
    removeItemFromStore,
    setupMoveTestStore,
  } = await import('testing/move-item-test-utils'));
  ({ getTestDefinitions, setupi18n } = await import('testing/test-utils'));
});

describe('applyLoadout', () => {
  beforeAll(async () => {
    await setupi18n();
  });

  beforeEach(() => {
    resetMocks();
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
    let stores = await buildFreshStores();
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
      stores = removeItemFromStore(stores, i);
    }
    // Clear that bucket in the vault too, so the only replacement candidates are
    // the two we add below.
    for (const i of vault.items.filter((i) => i.bucket.hash === bucketHash)) {
      stores = removeItemFromStore(stores, i);
    }

    // Two non-exotic weapons in the vault: a "matched" one that ranks highest
    // (so it would be chosen first), and an "unmatched" one.
    const matchedDupe = cloneItem(equipped, {
      primaryStat: { statHash: equipped.primaryStat!.statHash, value: 9999 },
    });
    const unmatchedReplacement = cloneItem(equipped, {
      primaryStat: { statHash: equipped.primaryStat!.statHash, value: 1 },
    });
    [stores] = addItemToStore(stores, vault.id, matchedDupe);
    [stores] = addItemToStore(stores, vault.id, unmatchedReplacement);

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

  // Regression test for #9416 (point 4): a crafted loadout item resolves to a
  // different id than the loadout stores (crafting reassigns ids, matched back
  // by craftedDate). The de-equip replacement search must exclude it by its
  // resolved id, not the stale loadout-item id.
  it('excludes a crafted loadout item from de-equip replacements by its resolved id', async () => {
    // Bulk-equip API succeeds only for items actually in the target's inventory.
    equipItemsMock.mockImplementation((_account: unknown, store: DimStore, items: DimItem[]) =>
      Promise.resolve(
        Object.fromEntries(
          items.map((i) => [
            i.id,
            i.owner === store.id
              ? PlatformErrorCodes.Success
              : PlatformErrorCodes.DestinyItemNotFound,
          ]),
        ),
      ),
    );

    const defs = await getTestDefinitions();
    let stores = await buildFreshStores();
    const vault = getVault(stores)!;
    // A non-current character with two equipped non-exotic weapons (forces the
    // bulk-dequip path, which is where the raw-exclusion bug lives).
    const otherChar = stores.find(
      (s) =>
        !s.isVault &&
        !s.current &&
        s.items.filter((i) => i.equipped && i.bucket.sort === 'Weapons' && !i.isExotic).length >= 2,
    )!;
    expect(otherChar).toBeDefined();
    const equippedWeapons = otherChar.items.filter(
      (i) => i.equipped && i.bucket.sort === 'Weapons' && !i.isExotic,
    );
    const e1 = equippedWeapons[0];
    const e2 = equippedWeapons[1];
    const bucket1 = e1.bucket.hash;

    // Force e1's replacement to come from the vault, and make our two clones the
    // only candidates there.
    for (const i of otherChar.items.filter((i) => i.bucket.hash === bucket1 && !i.equipped)) {
      stores = removeItemFromStore(stores, i);
    }
    for (const i of vault.items.filter((i) => i.bucket.hash === bucket1)) {
      stores = removeItemFromStore(stores, i);
    }

    const craftedDate = 999_999_999;
    // A crafted "matched" weapon that ranks highest - it's in the loadout, so it
    // must not be chosen as a replacement.
    const matchedDupe = cloneItem(e1, {
      primaryStat: { statHash: e1.primaryStat!.statHash, value: 9999 },
      crafted: 'crafted',
      craftedInfo: { level: 1, progress: 0, craftedDate, enhancementTier: 0 },
    });
    const unmatchedReplacement = cloneItem(e1, {
      primaryStat: { statHash: e1.primaryStat!.statHash, value: 1 },
    });
    [stores] = addItemToStore(stores, vault.id, matchedDupe);
    [stores] = addItemToStore(stores, vault.id, unmatchedReplacement);

    const loadout = itemMoveLoadout([e1, e2, matchedDupe], vault);
    // Simulate a loadout saved with the crafted item's OLD id - it now resolves
    // by craftedDate to the live item, which has a different id.
    loadout.items = loadout.items.map((li) =>
      li.id === matchedDupe.id ? { ...li, id: 'stale-crafted-id' } : li,
    );

    const { dispatch, getStores } = setupMoveTestStore(stores);
    dispatch(setD2Manifest(defs));
    await dispatch(applyLoadout(vault, loadout));

    const newOther = getStores().find((s) => s.id === otherChar.id)!;
    const equippedInBucket1 = findItemsByBucket(newOther, bucket1).filter((i) => i.equipped);
    expect(equippedInBucket1).toHaveLength(1);
    // The replacement is the unmatched item, not the crafted loadout item.
    expect(equippedInBucket1[0].id).toBe(unmatchedReplacement.id);
  });
});
