import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { isClassCompatible, itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { Loadout } from '../loadout/loadout-types';
import {
  addItem,
  applySocketOverrides,
  clearBucketCategory,
  clearSubclass,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  removeItem,
  removeMod,
  setClassType,
  setLoadoutParameters,
  setLoadoutSubclassFromEquipped,
  toggleEquipped,
  updateMods,
} from './loadout-drawer-reducer';
import { filterLoadoutToAllowedItems, newLoadout } from './loadout-utils';

let defs: D2ManifestDefinitions;
let store: DimStore;
// Items that could be in a Hunter loadout
let items: DimItem[];
// All items, even ones that couldn't be in a Hunter loadout
let allItems: DimItem[];
const emptyLoadout = newLoadout('Test', [], DestinyClass.Hunter);

let artifactUnlocks = {
  unlockedItemHashes: [1, 2, 3],
  seasonNumber: 22,
};

beforeAll(async () => {
  let stores: DimStore[];
  [defs, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
  allItems = stores.flatMap((store) => store.items);
  const isValidItem = (store: DimStore, item: DimItem) =>
    itemCanBeEquippedBy(item, store) &&
    itemCanBeInLoadout(item) &&
    isClassCompatible(item.classType, DestinyClass.Hunter);
  store = stores.find((s) => s.classType === DestinyClass.Hunter)!;
  items = allItems.filter((item) => isValidItem(store, item));
});

describe('addItem', () => {
  it('can add an item to an empty loadout', () => {
    const item = items[0];
    const loadout = addItem(defs, item)(emptyLoadout);

    expect(loadout.items).toMatchObject([
      {
        amount: 1,
        equip: true,
        hash: item.hash,
        id: item.id,
      },
    ]);
  });

  it('saves the crafted date for crafted items', () => {
    const item = items.find((i) => i.crafted)!;
    expect(item).toBeDefined();
    const loadout = addItem(defs, item)(emptyLoadout);

    expect(loadout.items[0].craftedDate).toBeDefined();
  });

  it('can add an item to a loadout that is already there as a noop', () => {
    const item = items[0];
    let loadout = addItem(defs, item)(emptyLoadout);
    loadout = addItem(defs, item)(loadout);

    expect(loadout.items).toStrictEqual(loadout.items);
  });

  it('can add an unequipped item to a loadout', () => {
    const item = items[0];
    const loadoutAdded = addItem(defs, item, false)(emptyLoadout);

    expect(loadoutAdded.items.length).toBe(1);
    expect(loadoutAdded.items[0].equip).toBe(false);
  });

  it('defaults equip when unset', () => {
    const [item, item2] = items.filter((i) => i.bucket.hash === BucketHashes.KineticWeapons);

    // First kinetic weapon added should default to equipped
    let loadout = addItem(defs, item)(emptyLoadout);
    // Second one should default to unequipped
    loadout = addItem(defs, item2)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
      {
        equip: false,
        id: item2.id,
      },
    ]);
  });

  it('can replace the currently equipped item', () => {
    const [item, item2] = items.filter((i) => i.bucket.hash === BucketHashes.KineticWeapons);

    let loadout = addItem(defs, item, true)(emptyLoadout);
    // Second kinetic weapon displaces the first
    loadout = addItem(defs, item2, true)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: item.id,
      },
      {
        equip: true,
        id: item2.id,
      },
    ]);
  });

  it('can switch an equipped item to unequipped if added again with the equip flag set', () => {
    const item = items[0];

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = addItem(defs, item, false)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: item.id,
      },
    ]);
  });

  it('can switch an unequipped item to equipped if added again with the equip flag set', () => {
    const item = items[0];

    let loadout = addItem(defs, item, false)(emptyLoadout);
    loadout = addItem(defs, item, true)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
    ]);
  });

  it('handles duplicates even if the new version is a reshaped version of the one saved in the loadout', () => {
    const item = items.find((i) => i.crafted)!;

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = addItem(defs, { ...item, id: '1234' }, false)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: '1234',
      },
    ]);
  });

  it('fills in socket overrides when adding a subclass', () => {
    const subclass = items.find((i) => i.bucket.hash === BucketHashes.Subclass)!;

    let loadout = addItem(defs, subclass)(emptyLoadout);

    expect(loadout.items[0].socketOverrides).toBeDefined();
  });

  it('replaces the existing subclass when adding a new one', () => {
    const [subclass, subclass2] = items.filter((i) => i.bucket.hash === BucketHashes.Subclass);

    let loadout = addItem(defs, subclass)(emptyLoadout);
    loadout = addItem(defs, subclass2)(loadout);

    expect(loadout.items).toMatchObject([
      {
        id: subclass2.id,
      },
    ]);
  });

  it('does nothing if the item cannot be in a loadout', () => {
    const invalidItem = store.items.find((i) => !itemCanBeInLoadout(i))!;
    expect(invalidItem).toBeDefined();

    let loadout = addItem(defs, invalidItem)(emptyLoadout);

    expect(loadout.items).toEqual([]);
  });

  it('does nothing if the item is for the wrong class', () => {
    const invalidItem = allItems.find((i) => !isClassCompatible(i.classType, DestinyClass.Hunter))!;
    expect(invalidItem).toBeDefined();

    let loadout = addItem(defs, invalidItem)(emptyLoadout);

    expect(loadout.items).toEqual([]);
  });

  it('does nothing when adding class-specific item to any-class loadout', () => {
    const invalidItem = allItems.find((i) => i.classType === DestinyClass.Hunter)!;
    expect(invalidItem).toBeDefined();

    let loadout = setClassType(DestinyClass.Unknown)(emptyLoadout);
    loadout = addItem(defs, invalidItem)(loadout);

    expect(loadout.items).toEqual([]);
  });

  it('removes class-specific items when saving as "any class"', () => {
    const hunterItem = allItems.find((i) => i.classType === DestinyClass.Hunter)!;
    expect(hunterItem).toBeDefined();

    let loadout = addItem(defs, hunterItem)(emptyLoadout);
    loadout = setClassType(DestinyClass.Unknown)(loadout);
    loadout = filterLoadoutToAllowedItems(defs, loadout);

    expect(loadout.items).toEqual([]);
  });

  it('does nothing if the bucket is already at capacity', () => {
    const weapons = items.filter((i) => i.bucket.hash === BucketHashes.KineticWeapons)!;
    expect(weapons.length).toBeGreaterThan(10);

    let loadout: Loadout | undefined;
    for (const item of weapons) {
      loadout = addItem(defs, item)(loadout ?? emptyLoadout);
    }

    expect(loadout!.items.length).toEqual(10);
  });

  it('de-equips an exotic in another bucket when equipping a new exotic', () => {
    const exotics = items.filter((i) => i.isExotic);
    const exotic1 = exotics[0];
    const exotic2 = exotics.find(
      (i) => i.bucket.hash !== exotic1.bucket.hash && i.equippingLabel === exotic1.equippingLabel,
    )!;

    let loadout = addItem(defs, exotic1, true)(emptyLoadout);
    loadout = addItem(defs, exotic2, true)(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: exotic1.id,
      },
      {
        equip: true,
        id: exotic2.id,
      },
    ]);
  });
});

describe('removeItem', () => {
  it('promotes an unequipped item to equipped when the equipped item is removed', () => {
    const [item, item2] = items.filter((i) => i.bucket.hash === BucketHashes.KineticWeapons);

    let loadout = addItem(defs, item)(emptyLoadout);
    loadout = addItem(defs, item2)(loadout);

    // now the loadout has two items, one equipped, one unequipped

    loadout = removeItem(defs, { item, loadoutItem: loadout.items[0] })(loadout);

    expect(loadout.items).toMatchObject([
      {
        id: item2.id,
        equip: true,
      },
    ]);
  });

  it('does nothing when asked to remove an item that is not in the loadout', () => {
    const item = items[0];

    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = removeItem(defs, {
      item,
      loadoutItem: { id: '1234', hash: item.hash, equip: true, amount: 1 },
    })(loadout);

    expect(loadout.items.length).toBe(1);
  });
});

describe('toggleEquipped', () => {
  it('can toggle an equipped item to unequipped', () => {
    const item = items[0];

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = toggleEquipped(defs, { item, loadoutItem: loadout.items[0] })(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: item.id,
      },
    ]);
  });

  it('can toggle an unequipped item to equipped', () => {
    const item = items[0];

    let loadout = addItem(defs, item, false)(emptyLoadout);
    loadout = toggleEquipped(defs, { item, loadoutItem: loadout.items[0] })(loadout);
    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
    ]);
  });

  it('does nothing when applied to a subclass', () => {
    const item = items.find((i) => i.bucket.hash === BucketHashes.Subclass)!;

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = toggleEquipped(defs, { item, loadoutItem: loadout.items[0] })(loadout);
    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
    ]);
  });

  it('does not lose socket overrides', () => {
    const item = items[0];

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = applySocketOverrides({ item, loadoutItem: loadout.items[0] }, { 1: 42 })(loadout);

    loadout = toggleEquipped(defs, { item, loadoutItem: loadout.items[0] })(loadout);

    expect(loadout.items).toMatchObject([
      {
        equip: false,
        id: item.id,
        socketOverrides: { 1: 42 },
      },
    ]);
  });
});

describe('removeMod', () => {
  it('removes a mod by inventory item hash', () => {
    let loadout = updateMods([193878019, 837201397])(emptyLoadout);
    expect(loadout.parameters!.mods).toStrictEqual([193878019, 837201397]);
    loadout = removeMod({
      originalModHash: 193878019,
      resolvedMod: defs.InventoryItem.get(193878019) as PluggableInventoryItemDefinition,
    })(loadout);
    expect(loadout.parameters!.mods).toStrictEqual([837201397]);
  });
});

describe('clearSubclass', () => {
  it('removes the subclass', () => {
    const item = items.find((i) => i.bucket.hash === BucketHashes.Subclass)!;

    let loadout = addItem(defs, item, true)(emptyLoadout);
    loadout = clearSubclass(defs)(loadout);
    expect(loadout.items).toStrictEqual([]);
  });
});

describe('setLoadoutSubclassFromEquipped', () => {
  it('correctly populates the subclass and its overrides', () => {
    let loadout = setLoadoutSubclassFromEquipped(defs, store)(emptyLoadout);
    expect(loadout.items.length).toBe(1);
    expect(defs.InventoryItem.get(loadout.items[0].hash).inventory!.bucketTypeHash).toBe(
      BucketHashes.Subclass,
    );
    // TODO: would be good to assert more about the socket overrides
    expect(loadout.items[0].socketOverrides).not.toBeUndefined();
  });
});

describe('fillLoadoutFromEquipped', () => {
  it('can fill in weapons', () => {
    // Add a single item that's not equipped to the loadout
    const item = items.find((i) => i.bucket.hash === BucketHashes.KineticWeapons && !i.equipped)!;
    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks, 'Weapons')(loadout);

    // Three equipped items, and the original item was left in place
    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
      { equip: true },
      { equip: true },
    ]);
    expect(loadout.parameters?.mods).toBeUndefined();
    expect(loadout.parameters?.artifactUnlocks).toBeUndefined();
    expect(loadout.parameters?.modsByBucket).toBeUndefined();
  });

  it('can fill in armor', () => {
    // Add a single item that's not equipped to the loadout
    const item = items.find((i) => i.bucket.hash === BucketHashes.Helmet && !i.equipped)!;
    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks, 'Armor')(loadout);

    // Five equipped items, and the original item was left in place
    expect(loadout.items).toMatchObject([
      {
        equip: true,
        id: item.id,
      },
      { equip: true },
      { equip: true },
      { equip: true },
      { equip: true },
    ]);
    // Mods don't get saved when just filling in a category
    expect(loadout.parameters?.mods).toBeUndefined();
    // Artifact unlocks don't get saved when just filling in a category
    expect(loadout.parameters?.artifactUnlocks).toBeUndefined();
    // Adding armor saves its fashion
    expect(loadout.parameters?.modsByBucket).not.toBeUndefined();
  });

  it('can fill in everything', () => {
    // Add a single item that's not equipped to the loadout
    const item = items.find((i) => i.bucket.hash === BucketHashes.Helmet && !i.equipped)!;
    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks)(loadout);

    // Five equipped items, and the original item was left in place
    expect(loadout.items.length).toBe(13); // Subclass, weapons, armor, emblem, ship, ghost, sparrow
    expect(loadout.items[0]).toMatchObject({ equip: true, id: item.id });
    // Mods get saved when everything is filled in, if they weren't defined before
    expect(loadout.parameters?.mods).not.toBeUndefined();
    // Artifact unlocks are filled in too, if they weren't defined before
    expect(loadout.parameters?.artifactUnlocks).not.toBeUndefined();
    // As is fashion, if it wasn't defined before
    expect(loadout.parameters?.modsByBucket).not.toBeUndefined();
  });

  it('will not overwrite mods if they are already there', () => {
    let loadout = updateMods([1, 2, 3])(emptyLoadout);

    loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks)(loadout);

    expect(loadout.parameters?.mods).toEqual([1, 2, 3]);
  });

  it('will not overwrite artifact unlocks if they are already there', () => {
    let loadout = setLoadoutParameters({
      artifactUnlocks: { unlockedItemHashes: [1], seasonNumber: 1 },
    })(emptyLoadout);

    loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks)(loadout);

    expect(loadout.parameters?.artifactUnlocks).toEqual({
      unlockedItemHashes: [1],
      seasonNumber: 1,
    });
  });
});

describe('fillLoadoutFromUnequipped', () => {
  it('fills in unequipped items but does not change an existing item', () => {
    const bucketHash = BucketHashes.KineticWeapons;

    // Add a single item that's not equipped to the loadout
    const item = items.find(
      (i) => i.bucket.hash === bucketHash && !i.equipped && i.owner === store.id,
    )!;
    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = fillLoadoutFromUnequipped(defs, store)(loadout);

    const itemsInLoadout = loadout.items.filter(
      (i) => defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash === bucketHash,
    );

    // Make sure that previously equipped item is still equipped
    expect(itemsInLoadout[0]).toMatchObject({
      equip: true,
      id: item.id,
    });
    // Only 9 items because one of them was already in the loadout
    expect(itemsInLoadout.length).toBe(9);
  });

  it('fills in unequipped items for a single category', () => {
    const bucketHash = BucketHashes.KineticWeapons;

    // Add a single item that's not equipped to the loadout
    const item = items.find((i) => i.bucket.hash === bucketHash && !i.equipped)!;
    let loadout = addItem(defs, item)(emptyLoadout);

    loadout = fillLoadoutFromUnequipped(defs, store, 'Weapons')(loadout);

    const itemsInLoadout = loadout.items.filter(
      (i) => defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash === bucketHash,
    );

    // Make sure that previously equipped item is still equipped
    expect(itemsInLoadout[0]).toMatchObject({
      equip: true,
      id: item.id,
    });
    expect(itemsInLoadout.length).toBe(9);
  });

  it('fills in unequipped items for a single category without overflow', () => {
    // Add some items from the vault
    const vaultedItems = _.take(
      items.filter((i) => i.bucket.hash === BucketHashes.EnergyWeapons && i.owner === 'vault'),
      5,
    );
    let loadout = emptyLoadout;
    for (const item of vaultedItems) {
      loadout = addItem(defs, item)(loadout);
    }

    loadout = fillLoadoutFromUnequipped(defs, store, 'Weapons')(loadout);

    for (const item of vaultedItems) {
      // Each of the items we added is still there
      expect(loadout.items.some((i) => i.id === item.id)).toBe(true);
    }

    const energyWeaponsInLoadout = loadout.items.filter(
      (i) =>
        defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash === BucketHashes.EnergyWeapons,
    );
    expect(energyWeaponsInLoadout.length).toBe(10);
    expect(energyWeaponsInLoadout.some((i) => i.equip)).toBe(true);
  });
});

describe('clearBucketCategory', () => {
  it('clears the weapons category', () => {
    let loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks)(emptyLoadout);
    loadout = clearBucketCategory(defs, 'Weapons')(loadout);

    expect(
      loadout.items.some((i) =>
        [
          BucketHashes.KineticWeapons,
          BucketHashes.EnergyWeapons,
          BucketHashes.PowerWeapons,
        ].includes(defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash ?? 0),
      ),
    ).toBe(false);
  });

  it('clears the general category without clearing subclass', () => {
    let loadout = fillLoadoutFromEquipped(defs, store, artifactUnlocks)(emptyLoadout);
    loadout = clearBucketCategory(defs, 'General')(loadout);

    expect(
      loadout.items.some((i) =>
        [
          BucketHashes.Ghost,
          BucketHashes.Emblems,
          BucketHashes.Ships,
          BucketHashes.Vehicle,
        ].includes(defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash ?? 0),
      ),
    ).toBe(false);
    expect(
      loadout.items.some((i) =>
        [BucketHashes.Subclass].includes(
          defs.InventoryItem.get(i.hash).inventory?.bucketTypeHash ?? 0,
        ),
      ),
    ).toBe(true);
  });
});
