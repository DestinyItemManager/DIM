import { accountsLoaded, setCurrentAccount } from 'app/accounts/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { update } from 'app/inventory/actions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { createMoveSession, executeMoveItem } from 'app/inventory/item-move-service';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { createItemIndex } from 'app/inventory/store/item-index';
import {
  capacityForItem,
  findItemsByBucket,
  getStore,
  getVault,
} from 'app/inventory/stores-helpers';
import { BucketHashes } from 'data/d2/generated-enums';
// Use the app's real Redux store singleton. Importing it (rather than building our
// own from app/store/reducers) sidesteps a circular module-init dependency
// (reducers -> shell/reducer -> media-queries -> store/store -> reducers).
import reduxStore from 'app/store/store';
import { DimThunkDispatch } from 'app/store/types';
import { neverCanceled } from 'app/utils/cancel';
import { getTestDefinitions, getTestProfile, testAccount as rawTestAccount } from './test-utils';

/**
 * Test helpers for exercising the item movement logic (item-move-service).
 *
 * These seed the Redux store with a fresh copy of the sample profile's stores,
 * and provide small "fixture" helpers that immutably set up the kinds of edge
 * cases (full buckets, partial stacks, etc.) that item movement has to handle.
 *
 * The Bungie.net transfer/equip/lock APIs must be mocked by the test file itself
 * (via `jest.mock('app/bungie-api/destiny2-api')`), since jest module mocks have
 * to be declared at the top of the test module. See item-move-service.test.ts.
 */

const testAccount = rawTestAccount as unknown as DestinyAccount;
const thunkDispatch = reduxStore.dispatch as DimThunkDispatch;

/** The non-postmaster items currently in a store's bucket. */
function bucketItems(store: DimStore, bucketHash: number): DimItem[] {
  return store.items.filter((i) => i.location.hash === bucketHash && !i.location.inPostmaster);
}

/**
 * Return a new stores array with the store identified by `storeId` replaced by
 * `update(store)`. All other stores (and untouched item objects) keep their
 * identity, so anything captured before the update stays valid.
 */
function replaceStore(
  stores: DimStore[],
  storeId: string,
  update: (store: DimStore) => DimStore,
): DimStore[] {
  return stores.map((s) => (s.id === storeId ? update(s) : s));
}

/**
 * Build a *fresh* set of DimStores from the sample profile. Unlike
 * `getTestStores` in test-utils, this is not memoized, so each call returns a
 * new set of store/item objects to seed a test with.
 *
 * Fixture helpers update these immutably (returning new stores) rather than
 * mutating in place, which matches how the inventory reducer treats state and
 * keeps `findItemsByBucket`'s per-store memo valid.
 */
export async function buildFreshStores(): Promise<DimStore[]> {
  const defs = await getTestDefinitions();
  return buildStores({
    defs,
    buckets: getBuckets(defs),
    profileResponse: getTestProfile(),
    customStats: [],
  });
}

/** The inventory bucket definitions for the sample manifest. */
export async function getTestBuckets(): Promise<InventoryBuckets> {
  return getBuckets(await getTestDefinitions());
}

/**
 * Seed the Redux store with the given DimStores and the sample account, ready for
 * dispatching move thunks. Each test fully overwrites the inventory and account
 * slices, so tests are isolated from each other.
 */
export function setupMoveTestStore(stores: DimStore[]) {
  // setCurrentAccount resets the inventory reducer, so it must come before `update`.
  reduxStore.dispatch(accountsLoaded([testAccount]));
  reduxStore.dispatch(setCurrentAccount(testAccount));
  reduxStore.dispatch(update({ stores, currencies: [] }));

  /** The current stores, reflecting any moves that have been applied. */
  const getStores = () => reduxStore.getState().inventory.stores;

  /** The full Redux state, for selectors that need it (e.g. getSimilarItem). */
  const getState = () => reduxStore.getState();

  /**
   * Run a smart move of `item` to `target`, returning the resulting item. Throws
   * if the move can't complete (e.g. no space).
   *
   * The target is re-resolved from current state by id, so callers can pass a
   * store reference captured before fixtures were applied.
   *
   * `involvedItems` controls the move session's "explicitly requested" item set
   * (defaults to just `item`). Pass a different set to model bulk moves /
   * loadout applies, where the session is shared across many items.
   */
  const move = (
    item: DimItem,
    target: DimStore,
    {
      equip = false,
      amount,
      involvedItems = [item],
    }: { equip?: boolean; amount?: number; involvedItems?: DimItem[] } = {},
  ) => {
    const liveTarget = getStore(getStores(), target.id) ?? target;
    const session = createMoveSession(neverCanceled, involvedItems);
    return thunkDispatch(
      executeMoveItem(item, liveTarget, { equip, amount: amount ?? item.amount }, session),
    );
  };

  return { dispatch: thunkDispatch, getState, getStores, move };
}

let cloneCounter = 0;

/**
 * Clone an item, giving it a fresh instance id and index so it can coexist with
 * the original in the same store.
 */
export function cloneItem(item: DimItem, overrides: Partial<DimItem> = {}): DimItem {
  cloneCounter++;
  const id = item.instanced ? `test-clone-${cloneCounter}` : item.id;
  const clone: DimItem = {
    ...item,
    id,
    equipped: false,
    location: item.bucket,
    ...overrides,
  };
  clone.index = createItemIndex(clone);
  return clone;
}

/**
 * Add an item to a store's inventory (bypassing the move logic). Returns the new
 * stores array and the placed item, which is a copy stamped with its new owner -
 * use it (not the item you passed in) for subsequent moves and assertions.
 */
export function addItemToStore(
  stores: DimStore[],
  storeId: string,
  item: DimItem,
): [DimStore[], DimItem] {
  const placed: DimItem = { ...item, owner: storeId };
  return [replaceStore(stores, storeId, (s) => ({ ...s, items: [...s.items, placed] })), placed];
}

/**
 * Make `item` look like a "lost item" sitting in the postmaster (Lost Items
 * bucket), as if it had been sent there because its real bucket was full. The
 * item's real destination `bucket` is preserved, so pulling it should relocate
 * it out of the postmaster. Returns the new stores and the relocated item copy.
 *
 * Note: engrams are NOT lost items - the Engrams bucket is itself in the
 * Postmaster category, so engrams always report `location.inPostmaster`. Use a
 * normal weapon/armor item here to model a genuine pull-from-postmaster.
 */
export function placeItemInPostmaster(
  stores: DimStore[],
  item: DimItem,
  buckets: InventoryBuckets,
): [DimStore[], DimItem] {
  const relocated: DimItem = {
    ...item,
    location: buckets.byHash[BucketHashes.LostItems],
    canPullFromPostmaster: true,
  };
  return [
    replaceStore(stores, item.owner, (s) => ({
      ...s,
      items: s.items.map((i) => (i === item ? relocated : i)),
    })),
    relocated,
  ];
}

/** Return new stores with `item` removed from whatever store it's in. */
export function removeItemFromStore(stores: DimStore[], item: DimItem): DimStore[] {
  return replaceStore(stores, item.owner, (s) => ({
    ...s,
    items: s.items.filter((i) => i !== item),
  }));
}

/** Return new stores with every (non-postmaster) item in a bucket made un-moveable. */
export function makeBucketUnmovable(
  stores: DimStore[],
  storeId: string,
  bucketHash: number,
): DimStore[] {
  return replaceStore(stores, storeId, (s) => ({
    ...s,
    items: s.items.map((i) =>
      i.location.hash === bucketHash && !i.location.inPostmaster ? { ...i, notransfer: true } : i,
    ),
  }));
}

/**
 * Adjust a (non-vault) character bucket so that exactly `leaveSlotsFree` slots
 * remain open, by cloning an existing item from that bucket as filler or by
 * removing unequipped items. Returns the new stores array.
 *
 * This makes it easy to set up "the bucket is full" / "one slot left" scenarios
 * without hand-constructing items.
 */
export function setBucketFreeSlots(
  stores: DimStore[],
  storeId: string,
  bucketHash: number,
  leaveSlotsFree: number,
): DimStore[] {
  return replaceStore(stores, storeId, (store) => {
    if (store.isVault) {
      throw new Error('setBucketFreeSlots only supports character buckets');
    }
    const current = bucketItems(store, bucketHash);
    const template = current[0];
    if (!template) {
      throw new Error(`No template item found in bucket ${bucketHash} on ${store.name}`);
    }
    const capacity = capacityForItem(store, template);
    const targetOccupied = Math.max(0, capacity - leaveSlotsFree);

    if (current.length < targetOccupied) {
      // Add filler clones
      const fillers: DimItem[] = [];
      for (let i = current.length; i < targetOccupied; i++) {
        fillers.push(cloneItem(template, { owner: storeId }));
      }
      return { ...store, items: [...store.items, ...fillers] };
    } else if (current.length > targetOccupied) {
      // Remove unequipped items until we hit the target
      const removable = current.filter((i) => !i.equipped);
      const toRemove = Math.min(current.length - targetOccupied, removable.length);
      const removeSet = new Set(removable.slice(0, toRemove));
      return { ...store, items: store.items.filter((i) => !removeSet.has(i)) };
    }
    return store;
  });
}

/** Convenience re-exports so tests don't have to reach into stores-helpers. */
export { findItemsByBucket, getStore, getVault };
