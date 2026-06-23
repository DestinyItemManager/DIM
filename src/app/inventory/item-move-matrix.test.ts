import { equip, transfer } from 'app/bungie-api/destiny2-api';
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
  setVaultBucketFull,
} from 'testing/move-item-test-utils';
import { setupi18n } from 'testing/test-utils';
import { DimError } from '../utils/dim-error';
import { DimItem } from './item-types';
import { DimStore } from './store-types';
import { amountOfItem } from './stores-helpers';

// Mock the Bungie.net write APIs so moves don't hit the network (see
// item-move-service.test.ts for why resolving is enough).
jest.mock('app/bungie-api/destiny2-api', () => ({
  transfer: jest.fn().mockResolvedValue({}),
  equip: jest.fn().mockResolvedValue({}),
  equipItems: jest.fn(),
  setLockState: jest.fn().mockResolvedValue({}),
  setTrackedState: jest.fn().mockResolvedValue({}),
}));

const transferMock = transfer as jest.Mock;
const equipMock = equip as jest.Mock;

/**
 * A parameterized "movement matrix" for the item-move-service - the
 * auto-generated-ish set of move possibilities the review asked for (PR #11813,
 * comments on #10253). Rather than one giant cartesian product, each axis is its
 * own table-driven block:
 *  - every source -> destination location pair
 *  - destination fullness states (room / make-aside / no-space)
 *  - stack merge/overflow scenarios
 *  - postmaster pulls across destination + fullness states
 */

type Role = 'vault' | 'current' | 'other';

function storeForRole(stores: DimStore[], role: Role): DimStore {
  switch (role) {
    case 'vault':
      return getVault(stores)!;
    case 'current':
      return stores.find((s) => !s.isVault && s.current)!;
    case 'other':
      return stores.find((s) => !s.isVault && !s.current)!;
  }
}

/** A plain transferable weapon: instanced, non-exotic, unequipped, not in postmaster. */
const isPlainWeapon = (i: DimItem) =>
  i.bucket.sort === 'Weapons' &&
  i.instanced &&
  !i.isExotic &&
  !i.notransfer &&
  !i.equipped &&
  !i.location.inPostmaster &&
  Boolean(i.bucket.vaultBucket);

function templateWeapon(stores: DimStore[]): DimItem {
  for (const store of stores) {
    const weapon = store.items.find(isPlainWeapon);
    if (weapon) {
      return weapon;
    }
  }
  throw new Error('No template weapon found in the sample stores');
}

/** Drop a fresh (uniquely-ided) clone of a plain weapon onto the given store. */
function placeWeaponOn(stores: DimStore[], role: Role): [DimStore[], DimItem] {
  const store = storeForRole(stores, role);
  return addItemToStore(stores, store.id, cloneItem(templateWeapon(stores)));
}

/** Guarantee a couple of free slots in a character bucket (vault has ample room). */
function ensureRoom(stores: DimStore[], dest: DimStore, bucketHash: number): DimStore[] {
  return dest.isVault ? stores : setBucketFreeSlots(stores, dest.id, bucketHash, 2);
}

/** The ids of the stores that currently hold an item with this id. */
function locationsOf(stores: DimStore[], id: string): string[] {
  return stores.filter((s) => s.items.some((i) => i.id === id)).map((s) => s.id);
}

/** A non-unique stackable consumable on a character, with room to split off a few. */
function findMovableStack(stores: DimStore[]): { item: DimItem; source: DimStore } {
  for (const source of stores.filter((s) => !s.isVault)) {
    const item = source.items.find(
      (i) =>
        i.maxStackSize > 1 &&
        !i.uniqueStack &&
        i.amount > 5 &&
        !i.notransfer &&
        !i.location.inPostmaster &&
        Boolean(i.bucket.vaultBucket),
    );
    if (item) {
      return { item, source };
    }
  }
  throw new Error('No movable stackable found on any character');
}

/**
 * Replace a store's stacks of `item`'s hash with a single stack of `amount`
 * (0 = none), so a destination can be set to a known starting state.
 */
function setStoreStack(
  stores: DimStore[],
  storeId: string,
  item: DimItem,
  amount: number,
): DimStore[] {
  const store = stores.find((s) => s.id === storeId)!;
  for (const i of store.items.filter((i) => i.hash === item.hash && !i.location.inPostmaster)) {
    stores = removeItemFromStore(stores, i);
  }
  if (amount > 0) {
    [stores] = addItemToStore(stores, storeId, cloneItem(item, { amount }));
  }
  return stores;
}

describe('item-move matrix', () => {
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

  // --- Source x destination -------------------------------------------------
  // Every ordered pair of distinct locations. A fresh weapon is seeded on the
  // source, the destination is given room, and we assert the item ends up at
  // exactly the destination.
  const roles: Role[] = ['vault', 'current', 'other'];
  const pairs = roles.flatMap((from) =>
    roles.filter((to) => to !== from).map((to) => ({ from, to })),
  );

  describe.each(pairs)('transfer a weapon from $from to $to', ({ from, to }) => {
    it('lands at the destination and leaves the source', async () => {
      let item: DimItem;
      [stores, item] = placeWeaponOn(stores, from);
      const dest = storeForRole(stores, to);
      stores = ensureRoom(stores, dest, item.bucket.hash);

      const { getStores, move } = setupMoveTestStore(stores);
      const moved = await move(item, dest);

      expect(moved.owner).toBe(dest.id);
      expect(transferMock).toHaveBeenCalled();
      // The item lives at exactly the destination - not duplicated, not stranded.
      expect(locationsOf(getStores(), item.id)).toEqual([dest.id]);
    });
  });

  // --- Destination fullness -------------------------------------------------
  // Move a vault weapon onto a *non-current* character (so we exercise the
  // make-space path, not the blind move to the current character) under a range
  // of destination-fullness states.
  const fullnessCases: {
    name: string;
    prepare: (stores: DimStore[], destId: string, bucketHash: number) => DimStore[];
    outcome: 'success' | 'no-space';
  }[] = [
    {
      name: 'destination bucket has room',
      prepare: (stores, destId, bucketHash) => setBucketFreeSlots(stores, destId, bucketHash, 2),
      outcome: 'success',
    },
    {
      name: 'destination bucket full but its items can move aside',
      prepare: (stores, destId, bucketHash) => setBucketFreeSlots(stores, destId, bucketHash, 0),
      outcome: 'success',
    },
    {
      name: 'destination bucket full and nothing can move aside',
      prepare: (stores, destId, bucketHash) =>
        makeBucketUnmovable(setBucketFreeSlots(stores, destId, bucketHash, 0), destId, bucketHash),
      outcome: 'no-space',
    },
  ];

  describe.each(fullnessCases)('moving onto a character when $name', ({ prepare, outcome }) => {
    it(outcome === 'success' ? 'completes the move' : 'fails with a no-space error', async () => {
      let item: DimItem;
      [stores, item] = placeWeaponOn(stores, 'vault');
      const dest = storeForRole(stores, 'other');
      const bucketHash = item.bucket.hash;
      stores = prepare(stores, dest.id, bucketHash);

      const { getStores, move } = setupMoveTestStore(stores);

      if (outcome === 'success') {
        const moved = await move(item, dest);
        expect(moved.owner).toBe(dest.id);
        const newDest = getStores().find((s) => s.id === dest.id)!;
        expect(newDest.items.some((i) => i.id === item.id)).toBe(true);
        // The bucket never exceeds its capacity - something was moved aside.
        expect(findItemsByBucket(newDest, bucketHash).length).toBeLessThanOrEqual(
          item.bucket.capacity,
        );
      } else {
        await expect(move(item, dest)).rejects.toThrow(DimError);
        expect(transferMock).not.toHaveBeenCalled();
      }
    });
  });

  // --- Stack merge / overflow ----------------------------------------------
  // Move part of a stack to a destination that already holds varying amounts of
  // the same item (#543). The invariant in every case is conservation: the
  // destination gains exactly what the source loses, however many physical
  // stacks that ends up spanning. Run for both a vault and a character
  // destination (the two kinds of stack target).
  const moveAmount = 3;
  const stackCases: {
    name: string;
    destStart: (maxStackSize: number) => number;
    // How many physical stacks of the item the destination should end up with.
    destStacks: number;
  }[] = [
    { name: 'has none of that item', destStart: () => 0, destStacks: 1 },
    { name: 'has a partial stack with room', destStart: () => 1, destStacks: 1 },
    {
      name: 'has a stack that overflows into a second',
      destStart: (maxStackSize) => maxStackSize - 1,
      destStacks: 2,
    },
  ];

  /** The number of physical (non-postmaster) stacks of an item hash in a store. */
  const physicalStacks = (store: DimStore, hash: number) =>
    store.items.filter((i) => i.hash === hash && !i.location.inPostmaster).length;

  describe.each(stackCases)(
    'moving a stack to the vault when it $name',
    ({ destStart, destStacks }) => {
      it('conserves the total amount', async () => {
        const { item, source } = findMovableStack(stores);
        const vaultId = getVault(stores)!.id;
        stores = setStoreStack(stores, vaultId, item, destStart(item.maxStackSize));

        const startSource = amountOfItem(source, item);
        const startDest = amountOfItem(getVault(stores)!, item);
        expect(startSource).toBeGreaterThan(moveAmount);

        const { getStores, move } = setupMoveTestStore(stores);
        await move(item, getVault(stores)!, { amount: moveAmount });

        const after = getStores();
        const newSource = after.find((s) => s.id === source.id)!;
        expect(amountOfItem(newSource, item)).toBe(startSource - moveAmount);
        expect(amountOfItem(getVault(after)!, item)).toBe(startDest + moveAmount);
        expect(physicalStacks(getVault(after)!, item.hash)).toBe(destStacks);
      });
    },
  );

  // The same, to the current character. The source is a stack seeded in the
  // vault: consumables are always account-wide, so moving a stack to a
  // *non-current* character just redirects to the current one - vault -> current
  // is the only meaningful character-destination axis for stacks.
  describe.each(stackCases)(
    'moving a stack onto the current character when it $name',
    ({ destStart, destStacks }) => {
      it('conserves the total amount', async () => {
        const template = findMovableStack(stores).item;
        const current = storeForRole(stores, 'current');

        // Seed the source stack in the vault and the destination state on the
        // character.
        let source: DimItem;
        [stores, source] = addItemToStore(
          stores,
          getVault(stores)!.id,
          cloneItem(template, { amount: moveAmount + 5 }),
        );
        stores = setStoreStack(stores, current.id, template, destStart(template.maxStackSize));

        const startDest = amountOfItem(storeForRole(stores, 'current'), template);

        const { getStores, move } = setupMoveTestStore(stores);
        await move(source, storeForRole(stores, 'current'), { amount: moveAmount });

        const after = getStores();
        expect(amountOfItem(storeForRole(after, 'current'), template)).toBe(startDest + moveAmount);
        expect(physicalStacks(storeForRole(after, 'current'), template.hash)).toBe(destStacks);
      });
    },
  );

  it('refuses to move a unique stack onto a destination already at max', async () => {
    // A unique stack can only ever be a single item, so a full destination has
    // nowhere to overflow to.
    const character = storeForRole(stores, 'current');
    // Must be a Consumables-bucket unique stack: other unique stacks (e.g.
    // subclasses) take a blind-move fast path to the current character that
    // skips the stack-overflow check.
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

    let extra: DimItem;
    [stores, extra] = addItemToStore(stores, getVault(stores)!.id, cloneItem(maxed, { amount: 1 }));

    const { move } = setupMoveTestStore(stores);
    await expect(move(extra, character, { amount: 1 })).rejects.toThrow(DimError);
  });

  // --- Postmaster pulls x destination ---------------------------------------
  // Pull a lost item out of the current character's postmaster to a range of
  // destinations and fullness states.
  const postmasterCases: {
    name: string;
    to: Role;
    fill: 'room' | 'bucketFull';
  }[] = [
    { name: 'onto its own character with room', to: 'current', fill: 'room' },
    { name: 'onto its own character whose bucket is full', to: 'current', fill: 'bucketFull' },
    { name: 'onto another character with room', to: 'other', fill: 'room' },
    { name: 'onto another character whose bucket is full', to: 'other', fill: 'bucketFull' },
  ];

  describe.each(postmasterCases)('pulling a lost item $name', ({ to, fill }) => {
    it('relocates it out of the postmaster to the destination', async () => {
      const buckets = await getTestBuckets();
      const current = storeForRole(stores, 'current');

      const original = current.items.find(
        (i) =>
          i.bucket.sort === 'Weapons' && i.instanced && !i.equipped && !i.location.inPostmaster,
      )!;
      expect(original).toBeDefined();
      const destinationBucket = original.bucket.hash;

      let item: DimItem;
      [stores, item] = placeItemInPostmaster(stores, original, buckets);

      const dest = storeForRole(stores, to);
      stores =
        fill === 'room'
          ? setBucketFreeSlots(stores, dest.id, destinationBucket, 3)
          : setBucketFreeSlots(stores, dest.id, destinationBucket, 0);

      const { getStores, move } = setupMoveTestStore(stores);
      const moved = await move(item, dest);

      expect(moved.owner).toBe(dest.id);
      expect(moved.location.inPostmaster).toBeFalsy();
      expect(moved.location.hash).toBe(destinationBucket);
      const newDest = getStores().find((s) => s.id === dest.id)!;
      expect(newDest.items.some((i) => i.id === item.id && !i.location.inPostmaster)).toBe(true);
    });
  });

  // --- Cascade when the vault is full ---------------------------------------
  // Moving onto a character whose bucket is full normally bumps an item into the
  // vault. When the vault is *also* full, the move-aside has to cascade onto
  // another character (it recursively squeezes a vault item out). This is the
  // "vault full but another character has room" combo from review.
  it('cascades a move-aside onto another character when the vault is full', async () => {
    const dest = storeForRole(stores, 'other');
    const current = storeForRole(stores, 'current');
    const bucketHash = templateWeapon(stores).bucket.hash;

    // Give the current character room to absorb the squeezed-out vault item,
    // then seed the item to move there.
    stores = setBucketFreeSlots(stores, current.id, bucketHash, 4);
    let item: DimItem;
    [stores, item] = addItemToStore(stores, current.id, cloneItem(templateWeapon(stores)));
    // The destination bucket is full of movable items, and the vault has no room
    // of its own, so the only way to make space is to push onto another character.
    stores = setBucketFreeSlots(stores, dest.id, bucketHash, 0);
    stores = setVaultBucketFull(stores, item);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, dest);

    // The move still completes onto the destination despite the full vault...
    expect(moved.owner).toBe(dest.id);
    expect(locationsOf(getStores(), item.id)).toEqual([dest.id]);
    // ...and it took more than one transfer (the bump cascaded).
    expect(transferMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('fails with a no-space error when the destination and vault are both full', async () => {
    const dest = storeForRole(stores, 'other');
    const bucketHash = templateWeapon(stores).bucket.hash;

    // The item to move starts in the vault (so blocking the characters' buckets
    // below doesn't touch it).
    let item: DimItem;
    [stores, item] = addItemToStore(
      stores,
      getVault(stores)!.id,
      cloneItem(templateWeapon(stores)),
    );
    // The whole account is packed: the destination bucket is full and can't move
    // anything aside, every character's bucket is likewise full and unmovable,
    // and the vault has no room either - so there is nowhere for the item to go.
    // (A movable-but-cascading deep-fail isn't asserted here: with a reserved
    // slot on the destination the engine can shuffle bumps around indefinitely,
    // which isn't deterministic. The cascade *success* test covers the positive
    // path; this locks in the clean failure when nothing can move.)
    for (const s of stores.filter((s) => !s.isVault)) {
      stores = makeBucketUnmovable(
        setBucketFreeSlots(stores, s.id, bucketHash, 0),
        s.id,
        bucketHash,
      );
    }
    stores = setVaultBucketFull(stores, item);

    const { move } = setupMoveTestStore(stores);
    await expect(move(item, dest)).rejects.toThrow(DimError);
  });

  // --- Stacked vs. unstacked across destinations ----------------------------
  // The source x destination matrix above uses an instanced weapon; stacks
  // behave differently and are covered here. The dedicated stack-merge blocks
  // cover vault and current destinations; this documents the remaining axes: a
  // character -> vault stack move, and the account-wide redirect when a stack is
  // sent to a non-current character.
  it('moves a stack from a character to the vault', async () => {
    const { item, source } = findMovableStack(stores);
    const startSource = amountOfItem(source, item);
    const startVault = amountOfItem(getVault(stores)!, item);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(item, getVault(stores)!, { amount: 2 });

    const after = getStores();
    expect(amountOfItem(after.find((s) => s.id === source.id)!, item)).toBe(startSource - 2);
    expect(amountOfItem(getVault(after)!, item)).toBe(startVault + 2);
  });

  it('redirects a stack sent to a non-current character onto the current one', async () => {
    // Account-wide consumables resolve onto the current character no matter
    // which character you target, so a move to a non-current character never
    // lands there.
    const { item } = findMovableStack(stores);
    expect(item.bucket.accountWide).toBe(true);
    const other = storeForRole(stores, 'other');

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, other, { amount: 2 });

    expect(moved.owner).toBe(storeForRole(getStores(), 'current').id);
  });

  // --- Postmaster pulls to the vault ----------------------------------------
  it('pulls a lost item from the postmaster into the vault', async () => {
    const buckets = await getTestBuckets();
    const current = storeForRole(stores, 'current');
    const original = current.items.find(
      (i) => i.bucket.sort === 'Weapons' && i.instanced && !i.equipped && !i.location.inPostmaster,
    )!;
    const destinationBucket = original.bucket.hash;

    let item: DimItem;
    [stores, item] = placeItemInPostmaster(stores, original, buckets);
    const vault = getVault(stores)!;

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, vault);

    expect(moved.owner).toBe(vault.id);
    expect(moved.location.inPostmaster).toBeFalsy();
    expect(moved.location.hash).toBe(destinationBucket);
    expect(getVault(getStores())!.items.some((i) => i.id === item.id)).toBe(true);
  });
});
