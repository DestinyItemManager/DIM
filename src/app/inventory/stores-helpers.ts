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
    i.hash === item.hash && !i.location?.inPostmaster ? i.amount : 0
  );
}

/**
 * How much of items like this item can fit in this store? For
 * stackables, this is in stacks, not individual pieces.
 */
export function capacityForItem(store: DimStore, item: DimItem) {
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
  return potentialSpaceLeftForItem(store, item, stores).guaranteed;
}

export interface SpaceLeft {
  /** The space definitely available. For stackables this is in individual pieces, not stacks. */
  guaranteed: number;
  /** Whether there's maybe a way space could be made for more than the guaranteed. */
  couldMakeSpace: boolean;
}

/**
 * Determine how much space there may be for an item being moved into a target
 * store - this figures out both how much open space there is, and whether we
 * could make space by moving things to the vault.
 */
export function potentialSpaceLeftForItem(
  store: DimStore,
  item: DimItem,
  stores: DimStore[]
): SpaceLeft {
  // Calculate how many full stacks (slots, where multiple items in a stack
  // count as 1) are occupied in the bucket this item would go into.
  let occupiedStacks = 0;
  if (store.isVault) {
    if (!item.bucket.vaultBucket) {
      return { guaranteed: 0, couldMakeSpace: false };
    }
    const vaultBucket = item.bucket.vaultBucket;
    // In the vault, all items are together in one big bucket, so we look at how much space that bucket has open
    occupiedStacks = item.bucket.vaultBucket
      ? count(store.items, (i) => Boolean(i.bucket.vaultBucket?.hash === vaultBucket.hash))
      : 0;
  } else {
    // Account-wide buckets (mods, etc) are only on the first character
    if (item.bucket.accountWide && !store.current) {
      return { guaranteed: 0, couldMakeSpace: false };
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
    const checkStore = item.bucket.accountWide && !store.isVault ? getCurrentStore(stores)! : store;
    const existingAmount = amountOfItem(checkStore, item);
    if (existingAmount === 0) {
      // This is the first stack. If we have no open stacks, we don't have space, but could make more space
      // by moving other items from that bucket to the vault. Otherwise, the only way to circumvent
      // the uniqueStack rule is to move the items themselves to a different bucket.
      return openStacks > 0
        ? { guaranteed: item.maxStackSize, couldMakeSpace: !item.notransfer }
        : { guaranteed: 0, couldMakeSpace: Boolean(item.bucket.vaultBucket) };
    } else {
      // We have a stack, so we can fill that stack up, and may be able to store even more
      // by moving the items themselves to a different bucket.
      return {
        guaranteed: Math.max(item.maxStackSize - existingAmount, 0),
        couldMakeSpace: !item.notransfer,
      };
    }
  }

  // Convert back from stacks to individual items, keeping in mind that we may
  // be able to move some amount into an existing stack.
  const maxStackSize = item.maxStackSize || 1;
  if (maxStackSize === 1) {
    // Stacks and individual items are the same, no conversion required
    return { guaranteed: openStacks, couldMakeSpace: Boolean(item.bucket.vaultBucket) };
  } else {
    // Get the existing amount in individual pieces, not stacks
    let existingAmount = amountOfItem(store, item);
    // This helps us figure out the remainder that gets added back in from a
    // partial stack - it'll end up negative, and when subtracted from the open
    // stacks' worth, it will *add* in the remainder.
    while (existingAmount > 0) {
      existingAmount -= maxStackSize;
    }
    return {
      guaranteed: Math.max(openStacks * maxStackSize - existingAmount, 0),
      couldMakeSpace: Boolean(item.bucket.vaultBucket),
    };
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
