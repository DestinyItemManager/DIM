import { emptyArray } from 'app/utils/empty';
import { count, weakMemoize } from 'app/utils/util';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
/**
 * Generic helpers for working with whole stores (character inventories) or lists of stores.
 */
import { DimItem } from './item-types';
import { D1Store, DimStore } from './store-types';

/**
 * Get whichever character was last played.
 */
export const getCurrentStore = <Store extends DimStore>(stores: Store[]) =>
  stores.find((s) => s.current);

/**
 * Get a store from a list by ID.
 */
export const getStore = <Store extends DimStore>(stores: Store[], id: string) =>
  stores.find((s) => s.id === id);

/**
 * Get the Vault from a list of stores.
 */
export const getVault = (stores: DimStore[]): DimStore | undefined => stores.find((s) => s.isVault);

/**
 * This is a memoized function that generates a map of items by their bucket
 * location. It could be a redux selector but I didn't want to have to thread it
 * through everywhere, so instead we do our own weak memoization to avoid
 * recalculation and memory leaks. The items by buckets used to be stored
 * directly on DimStore, but that violates the rules that allow Immer to work.
 * An alternative to this would be to have items stored in a map based on their
 * index and then have buckets reference items by index. This is slightly worse
 * than what we had before, because it recreates all buckets for the store whenever
 * the store changes for any reason.
 */
const itemsByBucket = weakMemoize((store: DimStore) =>
  _.groupBy(store.items, (i) => i.location.hash)
);

/**
 * Find items in a specific store bucket, taking into account that there may not be any in that bucket!
 */
export const findItemsByBucket = (store: DimStore, bucketId: number): DimItem[] =>
  itemsByBucket(store)[bucketId] ?? emptyArray();

/**
 * Find an item among all stores that matches the params provided.
 */
export function getItemAcrossStores<Item extends DimItem, Store extends DimStore<Item>>(
  stores: Store[],
  params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
    amount?: number;
  }
) {
  const predicate = (i: DimItem) =>
    (params.id === undefined || params.id === i.id) &&
    (params.hash === undefined || params.hash === i.hash) &&
    (params.notransfer === undefined || params.notransfer === i.notransfer) &&
    (params.amount === undefined || params.amount === i.amount);

  for (const store of stores) {
    for (const item of store.items) {
      if (predicate(item)) {
        return item;
      }
    }
  }
  return undefined;
}

/** Get the bonus power from the Seasonal Artifact */
export function getArtifactBonus(store: DimStore) {
  const artifact = findItemsByBucket(store, BucketHashes.SeasonalArtifact).find((i) => i.equipped);
  return artifact?.primaryStat?.value || 0;
}

/**
 * Get the total amount of this item in the store, across all stacks,
 * excluding stuff in the postmaster.
 */
export function amountOfItem(store: DimStore, item: { hash: number }) {
  return _.sumBy(store.items, (i) =>
    i.hash === item.hash && (!i.location || !i.location.inPostmaster) ? i.amount : 0
  );
}

/**
 * How much of items like this item can fit in this store? For
 * stackables, this is in stacks, not individual pieces.
 */
export function capacityForItem(store: DimStore, item: DimItem) {
  if (!item.bucket) {
    throw new Error("item needs a 'bucket' field");
  }

  if (store.isVault) {
    const vaultBucket = item.bucket.vaultBucket;
    return vaultBucket ? vaultBucket.capacity : 0;
  }
  return item.bucket.capacity;
}

/**
 * How many *more* items like this item can fit in this store?
 * This takes into account stackables, so the answer will be in
 * terms of individual pieces.
 */
export function spaceLeftForItem(store: DimStore, item: DimItem, stores: DimStore[]) {
  if (!item.type) {
    throw new Error("item needs a 'type' field");
  }

  // Calculate how many full stacks (slots, where multiple items in a stack
  // count as 1) are occupied in the bucket this item would go into.
  let occupiedStacks = 0;
  if (store.isVault) {
    if (!item.bucket.vaultBucket) {
      return 0;
    }
    const vaultBucket = item.bucket.vaultBucket;
    occupiedStacks = item.bucket.vaultBucket
      ? count(store.items, (i) => Boolean(i.bucket.vaultBucket?.hash === vaultBucket.hash))
      : 0;
  } else {
    if (!item.bucket) {
      return 0;
    }
    // Account-wide buckets (mods, etc) are only on the first character
    if (item.bucket.accountWide && !store.current) {
      return 0;
    }
    occupiedStacks = findItemsByBucket(store, item.bucket.hash).length;
  }

  // The open stacks are just however many you *could* fit, minus how many are occupied
  const openStacks = Math.max(0, capacityForItem(store, item) - occupiedStacks);

  // Some things can't have multiple stacks (unique stacks) and must be handled
  // specially. This only matters if they're not in the vault (pull from postmaster scenario)
  if (item.uniqueStack) {
    // If the item lives in an account-wide bucket (like modulus reports)
    // we need to check out how much space is left in that bucket, which is
    // only on the current store.
    if (item.bucket.accountWide && !store.isVault) {
      const existingAmount = amountOfItem(getCurrentStore(stores)!, item);

      if (existingAmount === 0) {
        // if this would be the first stack, make sure there's room for a stack
        return openStacks > 0 ? item.maxStackSize : 0;
      } else {
        // return how much can be added to the existing stack
        return Math.max(item.maxStackSize - existingAmount, 0);
      }
    }

    // If there's some already there, we can add enough to fill a stack. Otherwise
    // we can only add if there's an open stack.
    const existingAmount = amountOfItem(store, item);
    return existingAmount > 0
      ? Math.max(item.maxStackSize - amountOfItem(store, item), 0)
      : openStacks > 0
      ? item.maxStackSize
      : 0;
  }

  // Convert back from stacks to individual items, keeping in mind that we may
  // be able to move some amount into an existing stack.
  const maxStackSize = item.maxStackSize || 1;
  if (maxStackSize === 1) {
    // Stacks and individual items are the same, no conversion required
    return openStacks;
  } else {
    // Get the existing amount in individual pieces, not stacks
    let existingAmount = amountOfItem(store, item);
    // This helps us figure out the remainder that gets added back in from a
    // partial stack - it'll end up negative, and when subtracted from the open
    // stacks' worth, it will *add* in the remainder.
    while (existingAmount > 0) {
      existingAmount -= maxStackSize;
    }
    return Math.max(openStacks * maxStackSize - existingAmount, 0);
  }
}

/**
 * Is this store a Destiny 1 store? Use this when you want the store to
 * automatically be typed as D1 store in the "true" branch of a conditional.
 * Otherwise you can just check "destinyVersion === 1".
 */
export function isD1Store(store: DimStore): store is D1Store {
  return store.destinyVersion === 1;
}
