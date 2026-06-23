import { equip, equipItems, transfer } from 'app/bungie-api/destiny2-api';
import { neverCanceled } from 'app/utils/cancel';
import { DestinyClass, PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import {
  addItemToStore,
  buildFreshStores,
  cloneItem,
  findItemsByBucket,
  getTestBuckets,
  getVault,
  makeBucketUnmovable,
  placeItemInPostmaster,
  removeItemFromStore,
  setBucketFreeSlots,
  setupMoveTestStore,
} from 'testing/move-item-test-utils';
import { setupi18n } from 'testing/test-utils';
import { DimError } from '../utils/dim-error';
import {
  createMoveSession,
  equipItems as equipItemsThunk,
  getSimilarItem,
} from './item-move-service';
import { DimItem } from './item-types';
import { DimStore } from './store-types';
import { amountOfItem } from './stores-helpers';

// Mock the Bungie.net write APIs so moves don't hit the network. Each just
// reports success - the in-memory store model is updated by the reducer, not by
// these responses, so resolving is enough to drive the move logic. (jest hoists
// this above the imports above.)
jest.mock('app/bungie-api/destiny2-api', () => ({
  transfer: jest.fn().mockResolvedValue({}),
  equip: jest.fn().mockResolvedValue({}),
  equipItems: jest.fn(),
  setLockState: jest.fn().mockResolvedValue({}),
  setTrackedState: jest.fn().mockResolvedValue({}),
}));

const transferMock = transfer as jest.Mock;
const equipMock = equip as jest.Mock;
const equipItemsApiMock = equipItems as jest.Mock;

/** An item suitable for transfer tests: instanced, transferable, not exotic. */
const isTransferableWeapon = (i: DimItem) =>
  i.bucket.sort === 'Weapons' &&
  i.instanced &&
  !i.notransfer &&
  !i.location.inPostmaster &&
  !i.equipped &&
  !i.isExotic &&
  Boolean(i.bucket.vaultBucket);

const hasTransferableWeapon = (store: DimStore) => store.items.some(isTransferableWeapon);

/** Find an item suitable for transfer tests: instanced, transferable, not exotic. */
function findTransferableWeapon(store: DimStore): DimItem {
  const item = store.items.find(isTransferableWeapon);
  if (!item) {
    throw new Error(`No transferable weapon found on ${store.name}`);
  }
  return item;
}

/** A non-unique stackable with room to split off a few. */
const isSplittableStackable = (i: DimItem) =>
  i.maxStackSize > 1 &&
  !i.uniqueStack &&
  i.amount > 5 &&
  !i.notransfer &&
  !i.location.inPostmaster &&
  Boolean(i.bucket.vaultBucket);

/** Find a non-unique stackable with room to split off a few. */
function findStackable(store: DimStore): DimItem {
  const item = store.items.find(isSplittableStackable);
  if (!item) {
    throw new Error(`No splittable stackable found on ${store.name}`);
  }
  return item;
}

/**
 * Find a stackable item that exists both on a character and in the vault, so
 * moving the character's copy to the vault will merge stacks.
 */
function findSplitStack(stores: DimStore[]): { item: DimItem; source: DimStore } {
  const vault = stores.find((s) => s.isVault)!;
  for (const source of stores.filter((s) => !s.isVault)) {
    const item = source.items.find(
      (i) =>
        i.maxStackSize > 1 &&
        !i.uniqueStack &&
        !i.notransfer &&
        !i.location.inPostmaster &&
        vault.items.some((v) => v.hash === i.hash && !v.location.inPostmaster),
    );
    if (item) {
      return { item, source };
    }
  }
  throw new Error('No stackable shared between a character and the vault was found');
}

/**
 * Find a large unique-stack consumable on a character with room to grow - e.g.
 * Hymn of Desecration (maxStackSize 999). These are the items that trip up
 * issue #8872.
 */
function findLargeUniqueStackConsumable(stores: DimStore[]): { item: DimItem; source: DimStore } {
  let best: { item: DimItem; source: DimStore } | undefined;
  for (const source of stores.filter((s) => !s.isVault)) {
    for (const item of source.items) {
      if (
        item.uniqueStack &&
        item.bucket.hash === BucketHashes.Consumables &&
        item.maxStackSize >= 99 &&
        !item.notransfer &&
        !item.location.inPostmaster &&
        (!best || item.maxStackSize > best.item.maxStackSize)
      ) {
        best = { item, source };
      }
    }
  }
  if (!best) {
    throw new Error('No large unique-stack consumable found on any character');
  }
  return best;
}

describe('item-move-service', () => {
  /** A fresh copy of the sample stores, rebuilt before each test. */
  let stores: DimStore[];

  beforeAll(async () => {
    await setupi18n();
  });

  beforeEach(async () => {
    transferMock.mockClear();
    equipMock.mockClear();
    transferMock.mockResolvedValue({});
    equipMock.mockResolvedValue({});
    stores = await buildFreshStores();
  });

  it('moves an item from the vault to a character', async () => {
    const vault = getVault(stores)!;
    const character = stores.find((s) => !s.isVault)!;

    const item = findTransferableWeapon(vault);

    // Guarantee there's room on the character for it
    stores = setBucketFreeSlots(stores, character.id, item.bucket.hash, 3);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, character);

    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(moved.owner).toBe(character.id);

    // The item is no longer in the vault and now lives on the character
    const newStores = getStores();
    const newVault = getVault(newStores)!;
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    expect(newVault.items.some((i) => i.id === item.id)).toBe(false);
    expect(newCharacter.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('moves an item from a character to the vault', async () => {
    const character = stores.find((s) => !s.isVault && hasTransferableWeapon(s))!;
    const vault = getVault(stores)!;

    const item = findTransferableWeapon(character);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, vault);

    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(moved.owner).toBe('vault');

    const newStores = getStores();
    expect(getVault(newStores)!.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('moves an item between two characters via the vault', async () => {
    const characters = stores.filter((s) => !s.isVault);
    const source = characters.find(hasTransferableWeapon)!;
    const target = characters.find((s) => s.id !== source.id)!;

    const item = findTransferableWeapon(source);

    stores = setBucketFreeSlots(stores, target.id, item.bucket.hash, 3);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, target);

    // Character-to-character requires two transfers: source->vault, vault->target
    expect(transferMock).toHaveBeenCalledTimes(2);
    expect(moved.owner).toBe(target.id);

    const newStores = getStores();
    const newTarget = newStores.find((s) => s.id === target.id)!;
    expect(newTarget.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('equips an unequipped item already on a character', async () => {
    const character = stores.find((s) => !s.isVault && hasTransferableWeapon(s))!;
    const item = findTransferableWeapon(character);
    expect(item.equipped).toBe(false);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(item, character, { equip: true });

    expect(equipMock).toHaveBeenCalledTimes(1);

    const newStores = getStores();
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    const equippedInBucket = findItemsByBucket(newCharacter, item.bucket.hash).filter(
      (i) => i.equipped,
    );
    // Exactly one item is equipped in that bucket, and it's ours
    expect(equippedInBucket).toHaveLength(1);
    expect(equippedInBucket[0].id).toBe(item.id);
  });

  it('makes room by moving an item aside when the target bucket is full', async () => {
    const vault = getVault(stores)!;
    // Use a non-current character: moving to the *current* character takes a
    // "blind move" fast path that trusts the API instead of pre-clearing space.
    const character = stores.find((s) => !s.isVault && !s.current)!;

    const item = findTransferableWeapon(vault);

    // Completely fill the destination bucket on the character
    stores = setBucketFreeSlots(stores, character.id, item.bucket.hash, 0);
    const capacity = item.bucket.capacity;

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, character);

    expect(moved.owner).toBe(character.id);

    const newStores = getStores();
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    // Our item made it in...
    expect(newCharacter.items.some((i) => i.id === item.id)).toBe(true);
    // ...and the bucket didn't exceed its capacity (something was moved aside)
    expect(findItemsByBucket(newCharacter, item.bucket.hash).length).toBeLessThanOrEqual(capacity);
  });

  it('throws a no-space error when nothing can be moved aside', async () => {
    const vault = getVault(stores)!;
    // Non-current character so the move goes through the make-space path rather
    // than a blind move to the current character.
    const character = stores.find((s) => !s.isVault && !s.current)!;

    const item = findTransferableWeapon(vault);

    // Fill the destination bucket on the character, and make every item in it
    // un-moveable so DIM can't free up a slot.
    stores = setBucketFreeSlots(stores, character.id, item.bucket.hash, 0);
    stores = makeBucketUnmovable(stores, character.id, item.bucket.hash);

    const { move } = setupMoveTestStore(stores);

    await expect(move(item, character)).rejects.toThrow(DimError);
    expect(transferMock).not.toHaveBeenCalled();
  });

  it('moves part of a stack, leaving the remainder behind', async () => {
    const vault = getVault(stores)!;
    const source = stores.find((s) => !s.isVault && s.items.some(isSplittableStackable))!;
    const item = findStackable(source);

    const moveAmount = 3;
    const startSource = amountOfItem(source, item);
    const startVault = amountOfItem(vault, item);
    expect(startSource).toBeGreaterThan(moveAmount);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(item, vault, { amount: moveAmount });

    const newStores = getStores();
    const newSource = newStores.find((s) => s.id === source.id)!;
    // The source keeps the remainder, the vault gains exactly the moved amount.
    expect(amountOfItem(newSource, item)).toBe(startSource - moveAmount);
    expect(amountOfItem(getVault(newStores)!, item)).toBe(startVault + moveAmount);
  });

  it('merges a stack into an existing stack on the destination', async () => {
    const { item, source } = findSplitStack(stores);

    const startSource = amountOfItem(source, item);
    const vault = getVault(stores)!;
    const startVault = amountOfItem(vault, item);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(item, vault, { amount: startSource });

    const newStores = getStores();
    const newSource = newStores.find((s) => s.id === source.id)!;
    // All of it left the source; the vault's total reflects the combined amount
    // (regardless of how many physical stacks it ends up in).
    expect(amountOfItem(newSource, item)).toBe(0);
    expect(amountOfItem(getVault(newStores)!, item)).toBe(startVault + startSource);
  });

  it('pulls a lost item out of the postmaster onto its character', async () => {
    const buckets = await getTestBuckets();
    const owner = stores.find((s) => !s.isVault && s.current)!;

    // Take a normal weapon on the character and send it to the postmaster.
    const original = owner.items.find(
      (i) => i.bucket.sort === 'Weapons' && i.instanced && !i.equipped && !i.location.inPostmaster,
    )!;
    expect(original).toBeDefined();
    const destinationBucket = original.bucket.hash;
    let item: DimItem;
    [stores, item] = placeItemInPostmaster(stores, original, buckets);
    expect(item.location.inPostmaster).toBe(true);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, owner);

    expect(transferMock).toHaveBeenCalled();
    // It left the postmaster and landed in its real destination bucket.
    expect(moved.location.inPostmaster).toBeFalsy();
    expect(moved.location.hash).toBe(destinationBucket);
    const newOwner = getStores().find((s) => s.id === owner.id)!;
    expect(newOwner.items.some((i) => i.id === item.id && !i.location.inPostmaster)).toBe(true);
  });

  it('pulls a lost item out of the postmaster onto another character', async () => {
    const buckets = await getTestBuckets();
    const characters = stores.filter((s) => !s.isVault);
    const source = characters.find((s) => s.current)!;
    const target = characters.find((s) => s.id !== source.id)!;

    // Send one of the source character's weapons to its postmaster.
    const original = source.items.find(
      (i) => i.bucket.sort === 'Weapons' && i.instanced && !i.equipped && !i.location.inPostmaster,
    )!;
    expect(original).toBeDefined();
    const destinationBucket = original.bucket.hash;
    let item: DimItem;
    [stores, item] = placeItemInPostmaster(stores, original, buckets);

    // Make sure the destination character has room for it.
    stores = setBucketFreeSlots(stores, target.id, destinationBucket, 3);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, target);

    // Pull onto source (1) then transfer source->vault->target (2 more).
    expect(transferMock).toHaveBeenCalledTimes(3);
    expect(moved.owner).toBe(target.id);
    expect(moved.location.inPostmaster).toBeFalsy();
    expect(moved.location.hash).toBe(destinationBucket);

    const newStores = getStores();
    const newTarget = newStores.find((s) => s.id === target.id)!;
    const newSource = newStores.find((s) => s.id === source.id)!;
    expect(newTarget.items.some((i) => i.id === item.id && !i.location.inPostmaster)).toBe(true);
    expect(newSource.items.some((i) => i.id === item.id)).toBe(false);
  });

  it('de-equips the existing exotic when equipping another one (one-exotic rule)', async () => {
    const character = stores.find((s) => !s.isVault && s.current)!;

    // The exotic weapon that's currently equipped.
    const equippedExotic = character.items.find(
      (i) => i.equipped && i.isExotic && i.equippingLabel && i.bucket.sort === 'Weapons',
    )!;
    expect(equippedExotic).toBeDefined();

    // A different, unequipped exotic weapon in another bucket but with the same
    // equipping label (so the one-exotic rule applies).
    const newExotic = character.items.find(
      (i) =>
        !i.equipped &&
        i.isExotic &&
        i.equippingLabel === equippedExotic.equippingLabel &&
        i.bucket.hash !== equippedExotic.bucket.hash &&
        !i.location.inPostmaster,
    )!;
    expect(newExotic).toBeDefined();

    const { getStores, move } = setupMoveTestStore(stores);
    await move(newExotic, character, { equip: true });

    // Two equips: a non-exotic to replace the old exotic, then the new exotic.
    expect(equipMock).toHaveBeenCalledTimes(2);

    const newCharacter = getStores().find((s) => s.id === character.id)!;
    const movedNew = newCharacter.items.find((i) => i.id === newExotic.id)!;
    const movedOld = newCharacter.items.find((i) => i.id === equippedExotic.id)!;

    // The new exotic is equipped; the old one was forced off.
    expect(movedNew.equipped).toBe(true);
    expect(movedOld.equipped).toBe(false);

    // Only one exotic weapon is equipped across the character.
    const equippedExoticWeapons = newCharacter.items.filter(
      (i) => i.equipped && i.isExotic && i.bucket.sort === 'Weapons',
    );
    expect(equippedExoticWeapons).toHaveLength(1);
    expect(equippedExoticWeapons[0].id).toBe(newExotic.id);

    // The old exotic's slot now holds a single equipped non-exotic.
    const equippedInOldBucket = findItemsByBucket(newCharacter, equippedExotic.bucket.hash).filter(
      (i) => i.equipped,
    );
    expect(equippedInOldBucket).toHaveLength(1);
    expect(equippedInOldBucket[0].isExotic).toBe(false);
  });

  it('equips an item pulled from the vault', async () => {
    const vault = getVault(stores)!;
    const character = stores.find((s) => !s.isVault && s.current)!;

    // A non-exotic weapon (equippable by any class) sitting in the vault.
    const item = vault.items.find(
      (i) =>
        i.bucket.sort === 'Weapons' &&
        i.instanced &&
        !i.isExotic &&
        !i.notransfer &&
        !i.location.inPostmaster &&
        Boolean(i.bucket.vaultBucket),
    )!;
    expect(item).toBeDefined();
    stores = setBucketFreeSlots(stores, character.id, item.bucket.hash, 2);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, character, { equip: true });

    expect(transferMock).toHaveBeenCalled();
    expect(equipMock).toHaveBeenCalled();
    expect(moved.owner).toBe(character.id);
    expect(moved.equipped).toBe(true);

    const newCharacter = getStores().find((s) => s.id === character.id)!;
    const equippedInBucket = findItemsByBucket(newCharacter, item.bucket.hash).filter(
      (i) => i.equipped,
    );
    expect(equippedInBucket).toHaveLength(1);
    expect(equippedInBucket[0].id).toBe(item.id);
  });

  it('refuses to equip an item the character cannot use', async () => {
    const vault = getVault(stores)!;
    // A non-current character so we go through the equip-validation path rather
    // than a blind move to the current character.
    const character = stores.find((s) => !s.isVault && !s.current)!;

    // Class-specific armor for a *different* class than this character.
    const item = vault.items.find(
      (i) =>
        i.bucket.sort === 'Armor' &&
        i.classType !== DestinyClass.Unknown &&
        i.classType !== character.classType &&
        !i.notransfer &&
        !i.location.inPostmaster &&
        Boolean(i.bucket.vaultBucket),
    )!;
    expect(item).toBeDefined();

    const { move } = setupMoveTestStore(stores);

    await expect(move(item, character, { equip: true })).rejects.toThrow(DimError);
    // Validation fails before anything is transferred.
    expect(transferMock).not.toHaveBeenCalled();
  });

  it('de-equips an equipped item when moving it to the vault', async () => {
    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // An equipped non-exotic weapon (so a similar item can replace it).
    const item = character.items.find(
      (i) => i.equipped && i.bucket.sort === 'Weapons' && !i.isExotic && !i.notransfer,
    )!;
    expect(item).toBeDefined();

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, vault);

    expect(equipMock).toHaveBeenCalled();
    expect(moved.owner).toBe('vault');
    expect(moved.equipped).toBe(false);

    // The character's slot is filled by a single different equipped item.
    const newCharacter = getStores().find((s) => s.id === character.id)!;
    const equippedInBucket = findItemsByBucket(newCharacter, item.bucket.hash).filter(
      (i) => i.equipped,
    );
    expect(equippedInBucket).toHaveLength(1);
    expect(equippedInBucket[0].id).not.toBe(item.id);
  });

  it('refuses to overfill a unique stack', async () => {
    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // A unique-stack consumable that's already at max on the character. It must
    // live in the Consumables bucket - other unique stacks (e.g. subclasses)
    // take a blind-move fast path to the current character that skips the check.
    const maxed = character.items.find(
      (i) =>
        i.uniqueStack &&
        i.maxStackSize > 1 &&
        i.amount === i.maxStackSize &&
        i.bucket.hash === BucketHashes.Consumables &&
        !i.notransfer &&
        !i.location.inPostmaster,
    )!;
    expect(maxed).toBeDefined();
    expect(amountOfItem(character, maxed)).toBe(maxed.maxStackSize);

    // Put another copy in the vault and try to move it onto the full character.
    let extra = cloneItem(maxed, { amount: 1 });
    [stores, extra] = addItemToStore(stores, vault.id, extra);

    const { move } = setupMoveTestStore(stores);

    await expect(move(extra, character, { amount: 1 })).rejects.toThrow(DimError);
    expect(transferMock).not.toHaveBeenCalled();
  });

  // Regression tests for issues #8872 / #8506: bulk-moving consumables via a
  // filtered search (which goes through loadout-apply) broke on unique-stack
  // consumables like Hymn of Desecration and Ghost Fragments.
  it('moves a large unique-stack consumable to the vault in one transfer (#8872)', async () => {
    const { item } = findLargeUniqueStackConsumable(stores);
    const vault = getVault(stores)!;

    const { getStores, move } = setupMoveTestStore(stores);
    // The default involvedItems = [item] models a deliberate, user-requested move.
    const moved = await move(item, vault);

    // A single clean transfer - no cascade of move-asides.
    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(moved.owner).toBe('vault');
    expect(amountOfItem(getVault(getStores())!, item)).toBeGreaterThanOrEqual(item.amount);
  });

  it('cascades move-asides when a moved consumable is left out of the session (#8872 mechanism)', async () => {
    const { item } = findLargeUniqueStackConsumable(stores);
    const vault = getVault(stores)!;

    const { move } = setupMoveTestStore(stores);
    // Reproduce the old loadout-apply bug: the moved item isn't "involved", so
    // the consumables penalty (left -= maxStackSize) makes the vault look full
    // and DIM shuffles many unrelated items out of the vault instead of doing a
    // single clean move (and may ultimately fail). This is why loadout-apply
    // must mark moved items as involved.
    await move(item, vault, { involvedItems: [] }).catch(() => undefined);
    expect(transferMock.mock.calls.length).toBeGreaterThan(1);
  });

  // Regression test for issue #9121: equipping an exotic pulled from the vault
  // must still de-equip the existing exotic, even when the replacement for that
  // exotic's slot has to come from the vault too.
  it('de-equips the existing exotic when equipping a vault exotic that needs a vault replacement (#9121)', async () => {
    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // The exotic armor currently equipped, in slot A.
    const equippedExotic = character.items.find(
      (i) => i.equipped && i.isExotic && i.equippingLabel && i.bucket.sort === 'Armor',
    )!;
    expect(equippedExotic).toBeDefined();
    const slotA = equippedExotic.bucket.hash;

    // Clone a non-exotic slot-A item into the vault as the ONLY possible
    // replacement, then strip every other slot-A item off the character so the
    // replacement has to be pulled from the vault.
    const nonExoticInA = character.items.find(
      (i) => !i.equipped && !i.isExotic && i.bucket.hash === slotA,
    )!;
    expect(nonExoticInA).toBeDefined();
    [stores] = addItemToStore(stores, vault.id, cloneItem(nonExoticInA));
    for (const i of character.items.filter((i) => i.bucket.hash === slotA && !i.equipped)) {
      stores = removeItemFromStore(stores, i);
    }

    // A different exotic armor (slot B, same equipping label) moved into the
    // vault, so equipping it requires a vault pull and an exotic swap.
    let exoticB = character.items.find(
      (i) =>
        !i.equipped &&
        i.isExotic &&
        i.equippingLabel === equippedExotic.equippingLabel &&
        i.bucket.hash !== slotA &&
        !i.location.inPostmaster,
    )!;
    expect(exoticB).toBeDefined();
    stores = removeItemFromStore(stores, exoticB);
    [stores, exoticB] = addItemToStore(stores, vault.id, exoticB);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(exoticB, character, { equip: true });

    const newCharacter = getStores().find((s) => s.id === character.id)!;

    // Exactly one exotic armor is equipped, and it's the new one.
    const equippedExoticArmor = newCharacter.items.filter(
      (i) => i.equipped && i.isExotic && i.bucket.sort === 'Armor',
    );
    expect(equippedExoticArmor).toHaveLength(1);
    expect(equippedExoticArmor[0].id).toBe(exoticB.id);

    // The old exotic's slot now holds a single equipped non-exotic.
    const equippedInSlotA = findItemsByBucket(newCharacter, slotA).filter((i) => i.equipped);
    expect(equippedInSlotA).toHaveLength(1);
    expect(equippedInSlotA[0].isExotic).toBe(false);
  });

  // Regression test for issue #8418 / #9416: when an equipped item is moved, the
  // item picked to replace it must not be one of the items being moved.
  it('does not pick an item being moved as the replacement for a de-equipped item (#8418)', async () => {
    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // An equipped non-exotic weapon whose bucket has at least two unequipped,
    // transferable replacements available.
    const equipped = character.items.find(
      (i) =>
        i.equipped &&
        i.bucket.sort === 'Weapons' &&
        !i.isExotic &&
        !i.notransfer &&
        character.items.filter(
          (c) => c.bucket.hash === i.bucket.hash && !c.equipped && !c.isExotic && !c.notransfer,
        ).length >= 2,
    )!;
    expect(equipped).toBeDefined();

    const { getState, getStores, move } = setupMoveTestStore(stores);

    // The replacement DIM would naturally choose if nothing were excluded.
    const naturalPick = getSimilarItem(getState, getStores(), equipped, {})!;
    expect(naturalPick).toBeDefined();

    // Move the equipped item to the vault, telling the session that the natural
    // replacement is itself part of the move - so it must not be equipped.
    await move(equipped, vault, { involvedItems: [equipped, naturalPick] });

    const newCharacter = getStores().find((s) => s.id === character.id)!;
    const equippedInBucket = findItemsByBucket(newCharacter, equipped.bucket.hash).filter(
      (i) => i.equipped,
    );
    expect(equippedInBucket).toHaveLength(1);
    // The replacement is neither the item being moved nor the de-equipped item.
    expect(equippedInBucket[0].id).not.toBe(naturalPick.id);
    expect(equippedInBucket[0].id).not.toBe(equipped.id);
  });

  // Regression test for #7935: pulling an account-wide consumable from another
  // character's postmaster into the current character must not reserve (and try
  // to clear) space in the vault - account-wide items go straight to the current
  // character without a vault hop.
  it('pulls an account-wide consumable from another character postmaster without clearing the vault', async () => {
    const buckets = await getTestBuckets();
    const currentChar = stores.find((s) => !s.isVault && s.current)!;
    const otherChar = stores.find((s) => !s.isVault && !s.current)!;
    const vault = getVault(stores)!;

    // An account-wide consumable the current character already has a (non-full)
    // stack of, so it has room for more without freeing a slot.
    const existing = currentChar.items.find(
      (i) =>
        i.bucket.accountWide &&
        i.bucket.hash === BucketHashes.Consumables &&
        i.maxStackSize > i.amount &&
        i.bucket.vaultBucket,
    )!;
    expect(existing).toBeDefined();

    // A small stack of the same consumable, sitting in the other character's
    // postmaster, to be pulled to the current character.
    let coin = cloneItem(existing, { amount: 1 });
    [stores, coin] = addItemToStore(stores, otherChar.id, coin);
    [stores, coin] = placeItemInPostmaster(stores, coin, buckets);

    // Completely fill the vault's General section so any (spurious) vault
    // reservation would force move-asides out of the vault.
    const vaultBucketHash = existing.bucket.vaultBucket!.hash;
    const filler = vault.items.find(
      (i) => i.bucket.vaultBucket?.hash === vaultBucketHash && i.hash !== existing.hash,
    )!;
    const occupied = vault.items.filter(
      (i) => i.bucket.vaultBucket?.hash === vaultBucketHash,
    ).length;
    for (let i = occupied; i < existing.bucket.vaultBucket!.capacity; i++) {
      [stores] = addItemToStore(stores, vault.id, cloneItem(filler));
    }

    const { getStores, move } = setupMoveTestStore(stores);
    await move(coin, currentChar, { amount: 1 });

    // A single, direct pull - no move-asides shuffling the full vault.
    expect(transferMock).toHaveBeenCalledTimes(1);

    // The coin landed on the current character (merged into the existing stack)
    // and is gone from the other character's postmaster.
    const newCurrentChar = getStores().find((s) => s.id === currentChar.id)!;
    expect(amountOfItem(newCurrentChar, existing)).toBe(existing.amount + 1);
    const newOtherChar = getStores().find((s) => s.id === otherChar.id)!;
    expect(newOtherChar.items.some((i) => i.hash === coin.hash && i.location.inPostmaster)).toBe(
      false,
    );
  });

  // equipItems requires its items to already be on the store - it can't equip
  // an item that isn't in the character's inventory. Moving off-store de-equip
  // replacements (e.g. chosen from the vault) onto the store is the caller's
  // responsibility; loadout-apply does that before calling equipItems. See
  // #9416 (point 3) and the loadout-apply regression tests.
  it('equips items already on the store and leaves off-store items for the caller', async () => {
    // Model the real bulk-equip API: it only succeeds for items that are
    // actually in the target character's inventory.
    equipItemsApiMock.mockImplementation((_account: unknown, store: DimStore, items: DimItem[]) =>
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

    const character = stores.find((s) => !s.isVault && s.current)!;
    const vault = getVault(stores)!;

    // w1 is already on the character; w2 sits in the vault (a precondition
    // violation - equipItems should not silently move it).
    const w1 = character.items.find(
      (i) =>
        i.bucket.hash === BucketHashes.KineticWeapons && !i.isExotic && !i.equipped && i.instanced,
    )!;
    let w2 = character.items.find(
      (i) =>
        i.bucket.hash === BucketHashes.PowerWeapons && !i.isExotic && !i.equipped && i.instanced,
    )!;
    expect(w1).toBeDefined();
    expect(w2).toBeDefined();
    stores = removeItemFromStore(stores, w2);
    [stores, w2] = addItemToStore(stores, vault.id, w2);

    const { dispatch, getStores } = setupMoveTestStore(stores);
    const session = createMoveSession(neverCanceled, []);
    const result = await dispatch(equipItemsThunk(character, [w1, w2], [], session));

    // The on-store item equips; the vault item is reported not-found and is
    // left in the vault rather than moved by equipItems.
    expect(result[w1.id]).toBe(PlatformErrorCodes.Success);
    expect(result[w2.id]).toBe(PlatformErrorCodes.DestinyItemNotFound);
    expect(transferMock).not.toHaveBeenCalled();
    expect(getVault(getStores())!.items.some((i) => i.id === w2.id)).toBe(true);
  });

  // Regression test for #6895: a character-to-character move of a unique-stack
  // item routes through the vault, but if a same-stack copy already sits in the
  // vault the item can't transit. DIM must stop cleanly (no runaway of
  // move-asides "transferring everything"), not thrash trying to make space.
  it('stops cleanly when a uniqueStack item cannot transit a vault holding a same-stack copy', async () => {
    const charX = stores.find((s) => !s.isVault && s.current)!;
    const charY = stores.find((s) => !s.isVault && !s.current)!;
    const vault = getVault(stores)!;

    // Model a unique-stack item (like 2021 Solstice gear): take a transferable
    // weapon as the template and flag it unique-stack, with one copy on charX
    // and an identical copy in the vault.
    const template = charX.items.find(
      (i) =>
        i.bucket.sort === 'Weapons' &&
        i.instanced &&
        !i.isExotic &&
        !i.equipped &&
        !i.notransfer &&
        i.bucket.vaultBucket,
    )!;
    let a = cloneItem(template, { uniqueStack: true });
    [stores, a] = addItemToStore(stores, charX.id, a);
    [stores] = addItemToStore(stores, vault.id, cloneItem(a, { uniqueStack: true }));

    const { getStores, move } = setupMoveTestStore(stores);

    // The move stops with a clear error rather than running away.
    await expect(move(a, charY)).rejects.toThrow(DimError);
    // No transfers happened - it didn't start shuffling unrelated items.
    expect(transferMock).not.toHaveBeenCalled();
    // The item stayed put.
    expect(
      getStores()
        .find((s) => s.id === charX.id)!
        .items.some((i) => i.id === a.id),
    ).toBe(true);
  });
});
