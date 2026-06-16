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
 * and provide small "fixture" mutators for setting up the kinds of edge cases
 * (full buckets, partial stacks, etc.) that item movement has to handle.
 *
 * The Bungie.net transfer/equip/lock APIs must be mocked by the test file itself
 * (via `jest.mock('app/bungie-api/destiny2-api')`), since jest module mocks have
 * to be declared at the top of the test module. See item-move-service.test.ts.
 */

const testAccount = rawTestAccount as unknown as DestinyAccount;
const thunkDispatch = reduxStore.dispatch as DimThunkDispatch;

/**
 * Non-memoized version of findItemsByBucket. `findItemsByBucket` is weakMemoized
 * on the store object, so reading it after mutating `store.items` in place
 * returns stale data. Fixture helpers must use this instead.
 */
export function itemsInBucketUncached(store: DimStore, bucketHash: number): DimItem[] {
  return store.items.filter((i) => i.location.hash === bucketHash && !i.location.inPostmaster);
}

/**
 * Build a *fresh* set of DimStores from the sample profile. Unlike
 * `getTestStores` in test-utils, this is not memoized, so each call returns new
 * mutable store/item objects that fixture helpers are free to modify.
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
  // findItemsByBucket is weakMemoized on store identity. Fixture helpers mutate
  // store.items in place, which can leave a stale cached grouping. Give each
  // store a fresh identity (keeping the same item objects) so the move logic
  // recomputes buckets from the final, post-fixture item lists.
  const freshStores = stores.map((s) => ({ ...s, items: [...s.items] }));

  // setCurrentAccount resets the inventory reducer, so it must come before `update`.
  reduxStore.dispatch(accountsLoaded([testAccount]));
  reduxStore.dispatch(setCurrentAccount(testAccount));
  reduxStore.dispatch(update({ stores: freshStores, currencies: [] }));

  /** The current stores, reflecting any moves that have been applied. */
  const getStores = () => reduxStore.getState().inventory.stores;

  /**
   * Run a smart move of `item` to `target`, returning the resulting item. Throws
   * if the move can't complete (e.g. no space).
   */
  const move = (
    item: DimItem,
    target: DimStore,
    { equip = false, amount }: { equip?: boolean; amount?: number } = {},
  ) => {
    const session = createMoveSession(neverCanceled, [item]);
    return thunkDispatch(
      executeMoveItem(item, target, { equip, amount: amount ?? item.amount }, session),
    );
  };

  return { getStores, move };
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

/** Directly add an item to a store's inventory (bypassing the move logic). */
export function addItemToStore(store: DimStore, item: DimItem) {
  item.owner = store.id;
  store.items = [...store.items, item];
}

/**
 * Make `item` look like a "lost item" sitting in the postmaster (Lost Items
 * bucket), as if it had been sent there because its real bucket was full. The
 * item's real destination `bucket` is preserved, so pulling it should relocate
 * it out of the postmaster.
 *
 * Note: engrams are NOT lost items - the Engrams bucket is itself in the
 * Postmaster category, so engrams always report `location.inPostmaster`. Use a
 * normal weapon/armor item here to model a genuine pull-from-postmaster.
 */
export function placeItemInPostmaster(item: DimItem, buckets: InventoryBuckets) {
  item.location = buckets.byHash[BucketHashes.LostItems];
  item.canPullFromPostmaster = true;
}

/** Remove a specific item from whatever store it's in. */
export function removeItemFromStore(stores: DimStore[], item: DimItem) {
  const store = getStore(stores, item.owner);
  if (store) {
    store.items = store.items.filter((i) => i !== item);
  }
}

/**
 * Adjust a (non-vault) character bucket so that exactly `leaveSlotsFree` slots
 * remain open, by cloning an existing item from that bucket as filler or by
 * removing unequipped items. Returns the items currently in the bucket.
 *
 * This makes it easy to set up "the bucket is full" / "one slot left" scenarios
 * without hand-constructing items.
 */
export function setBucketFreeSlots(
  store: DimStore,
  bucketHash: number,
  leaveSlotsFree: number,
): DimItem[] {
  if (store.isVault) {
    throw new Error('setBucketFreeSlots only supports character buckets');
  }
  const current = itemsInBucketUncached(store, bucketHash);
  const template = current[0];
  if (!template) {
    throw new Error(`No template item found in bucket ${bucketHash} on ${store.name}`);
  }
  const capacity = capacityForItem(store, template);
  const targetOccupied = Math.max(0, capacity - leaveSlotsFree);

  if (current.length < targetOccupied) {
    // Add filler clones
    for (let i = current.length; i < targetOccupied; i++) {
      addItemToStore(store, cloneItem(template));
    }
  } else if (current.length > targetOccupied) {
    // Remove unequipped items until we hit the target
    const removable = current.filter((i) => !i.equipped);
    const toRemove = Math.min(current.length - targetOccupied, removable.length);
    const removeSet = new Set(removable.slice(0, toRemove));
    store.items = store.items.filter((i) => !removeSet.has(i));
  }

  return itemsInBucketUncached(store, bucketHash);
}

/** Convenience re-exports so tests don't have to reach into stores-helpers. */
export { findItemsByBucket, getStore, getVault };
