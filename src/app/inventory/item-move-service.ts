import { ItemHashTag } from '@destinyitemmanager/dim-api-types';
import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { RootState, ThunkResult } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { count } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import _ from 'lodash';
import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { DimError } from '../bungie-api/bungie-service-helper';
import {
  equip as d1equip,
  equipItems as d1EquipItems,
  setItemState as d1SetItemState,
  transfer as d1Transfer,
} from '../bungie-api/destiny1-api';
import {
  equip as d2equip,
  equipItems as d2EquipItems,
  setLockState as d2SetLockState,
  setTrackedState as d2SetTrackedState,
  transfer as d2Transfer,
} from '../bungie-api/destiny2-api';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { itemMoved, touchItem } from './actions';
import {
  characterDisplacePriority,
  getTag,
  ItemInfos,
  vaultDisplacePriority,
} from './dim-item-info';
import { DimItem } from './item-types';
import { itemHashTagsSelector, itemInfosSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import {
  amountOfItem,
  findItemsByBucket,
  getCurrentStore,
  getItemAcrossStores,
  getStore,
  getVault,
  spaceLeftForItem,
} from './stores-helpers';

/**
 * You can reserve a number of each type of item in each store.
 */
export interface MoveReservations {
  [storeId: string]: {
    [type: string]: number;
  };
}

/**
 * Lock/unlock or track/untrack an item.
 */
export function setItemLockState(
  item: DimItem,
  state: boolean,
  type: 'lock' | 'track' = 'lock'
): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    // The state APIs require either the ID of the character that owns the item, or
    // the current character ID if the item is in the vault.
    const storeId =
      item.owner === 'vault' ? getCurrentStore(storesSelector(getState()))!.id : item.owner;

    if (item.destinyVersion === 2) {
      if (type === 'lock') {
        await d2SetLockState(account, storeId, item, state);
      } else {
        await d2SetTrackedState(account, storeId, item, state);
      }
    } else if (item.destinyVersion === 1) {
      await d1SetItemState(account, item, storeId, state, type);
    }

    if (type === 'lock') {
      item.locked = state;
    } else if (type === 'track') {
      item.tracked = state;
    }

    // TODO: dispatch a better action to mutate the item!
    dispatch(touchItem(item.id));
  };
}

function equipApi(item: DimItem): typeof d2equip {
  return item.destinyVersion === 2 ? d2equip : d1equip;
}

function equipItemsApi(item: DimItem): typeof d2EquipItems {
  return item.destinyVersion === 2 ? d2EquipItems : d1EquipItems;
}

function transferApi(item: DimItem): typeof d2Transfer {
  return item.destinyVersion === 2 ? d2Transfer : d1Transfer;
}

/**
 * Update our item and store models after an item has been moved (or equipped/dequipped).
 * @return the new or updated item (it may create a new item!)
 */
function updateItemModel(
  item: DimItem,
  source: DimStore,
  target: DimStore,
  equip: boolean,
  amount: number = item.amount
): ThunkAction<DimItem, RootState, undefined, AnyAction> {
  return (dispatch, getState) => {
    dispatch(itemMoved({ item, source, target, equip, amount }));
    const stores = storesSelector(getState());
    return getItemAcrossStores(stores, item) || item;
  };
}

export function getSimilarItem(
  stores: DimStore[],
  item: DimItem,
  exclusions?: Pick<DimItem, 'id' | 'hash'>[],
  excludeExotic = false
): DimItem | null {
  const target = getStore(stores, item.owner)!;
  const sortedStores = _.sortBy(stores, (store) => {
    if (target.id === store.id) {
      return 0;
    } else if (store.isVault) {
      return 1;
    } else {
      return 2;
    }
  });

  let result: DimItem | null = null;
  sortedStores.find((store) => {
    result = searchForSimilarItem(item, store, exclusions, target, excludeExotic);
    return result !== null;
  });

  return result;
}

/**
 * Find an item in store like "item", excluding the exclusions, to be equipped
 * on target.
 * @param exclusions a list of {id, hash} objects that won't be considered for equipping.
 * @param excludeExotic exclude any item matching the equippingLabel of item, used when dequipping an exotic so we can equip an exotic in another slot.
 */
function searchForSimilarItem(
  item: DimItem,
  store: DimStore,
  exclusions: Pick<DimItem, 'id' | 'hash'>[] | undefined,
  target: DimStore,
  excludeExotic: boolean
): DimItem | null {
  const exclusionsList = exclusions || [];

  let candidates = store.items.filter(
    (i) =>
      itemCanBeEquippedBy(i, target) &&
      i.location.hash === item.location.hash &&
      !i.equipped &&
      // Not the same item
      i.id !== item.id &&
      // Not on the exclusion list
      !exclusionsList.some((item) => item.id === i.id && item.hash === i.hash)
  );

  if (!candidates.length) {
    return null;
  }

  if (excludeExotic) {
    candidates = candidates.filter((c) => c.equippingLabel !== item.equippingLabel);
  }

  // TODO: unify this value function w/ the others!
  const sortedCandidates = _.sortBy(candidates, (i) => {
    let value: number = {
      Legendary: 4,
      Rare: 3,
      Uncommon: 2,
      Common: 1,
      Exotic: 0,
    }[i.tier];
    if (item.isExotic && i.isExotic) {
      value += 5;
    }
    if (i.primStat) {
      value += i.primStat.value / 1000;
    }
    return value;
  }).reverse();

  return (
    sortedCandidates.find((result) => {
      if (result.equippingLabel) {
        const otherExotic = getOtherExoticThatNeedsDequipping(result, store);
        // If there aren't other exotics equipped, or the equipped one is the one we're dequipping, we're good
        if (!otherExotic || otherExotic.id === item.id) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }) || null
  );
}

/**
 * Bulk equip items. Only use for multiple equips at once.
 */
export function equipItems(store: DimStore, items: DimItem[]): ThunkResult<DimItem[]> {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());

    // Check for (and move aside) exotics
    const extraItemsToEquip: Promise<DimItem>[] = _.compact(
      items.map((i) => {
        if (i.equippingLabel) {
          const otherExotic = getOtherExoticThatNeedsDequipping(i, store);
          // If we aren't already equipping into that slot...
          if (otherExotic && !items.find((i) => i.type === otherExotic.type)) {
            const similarItem = getSimilarItem(getStores(), otherExotic);
            if (!similarItem) {
              return Promise.reject(
                new Error(t('ItemService.Deequip', { itemname: otherExotic.name }))
              );
            }
            const target = getStore(getStores(), similarItem.owner)!;

            if (store.id === target.id) {
              return Promise.resolve(similarItem);
            } else {
              // If we need to get the similar item from elsewhere, do that first
              return dispatch(moveItemTo(similarItem, store, true)).then(() => similarItem);
            }
          }
        }
        return undefined;
      })
    );

    const extraItems = await Promise.all(extraItemsToEquip);
    items = items.concat(extraItems);
    if (items.length === 0) {
      return [];
    }
    if (items.length === 1) {
      const equippedItem = await dispatch(equipItem(items[0]));
      return [equippedItem];
    }

    const equippedItems = await equipItemsApi(items[0])(
      currentAccountSelector(getState())!,
      store,
      items
    );
    return equippedItems.map((i) => dispatch(updateItemModel(i, store, store, true)));
  };
}

function equipItem(item: DimItem): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const store = getStore(storesSelector(getState()), item.owner)!;
    if ($featureFlags.debugMoves) {
      console.log('Equip', item.name, item.type, 'to', store.name);
    }
    await equipApi(item)(currentAccountSelector(getState())!, item);
    return dispatch(updateItemModel(item, store, store, true));
  };
}

/** De-equip an item, which really means find another item to equip in its place. */
function dequipItem(item: DimItem, excludeExotic = false): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    const similarItem = getSimilarItem(stores, item, [], excludeExotic);
    if (!similarItem) {
      throw new Error(t('ItemService.Deequip', { itemname: item.name }));
    }

    const ownerStore = getStore(stores, item.owner)!;
    await dispatch(moveItemTo(similarItem, ownerStore, true));
    return item;
  };
}

function moveToVault(item: DimItem, amount: number = item.amount): ThunkResult<DimItem> {
  return async (dispatch, getState) =>
    dispatch(moveToStore(item, getVault(storesSelector(getState()))!, false, amount));
}

function moveToStore(
  item: DimItem,
  store: DimStore,
  equip = false,
  amount: number = item.amount
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());
    const ownerStore = getStore(getStores(), item.owner)!;

    if ($featureFlags.debugMoves) {
      item.location.inPostmaster
        ? console.log('Pull', amount, item.name, item.type, 'to', store.name, 'from Postmaster')
        : console.log(
            'Move',
            amount,
            item.name,
            item.type,
            'to',
            store.name,
            'from',
            ownerStore.name
          );
    }

    // Work around https://github.com/Bungie-net/api/issues/764#issuecomment-437614294 by recording lock state for items before moving.
    // Note that this can result in the wrong lock state if DIM is out of date (they've locked/unlocked in game but we haven't refreshed).
    // Only apply this hack if the source bucket contains duplicates of the same item hash.
    const overrideLockState =
      item.lockable &&
      count(findItemsByBucket(ownerStore, item.location.hash), (i) => i.hash === item.hash) > 1
        ? item.locked
        : undefined;

    try {
      await transferApi(item)(currentAccountSelector(getState())!, item, store, amount);
    } catch (e) {
      // Not sure why this happens - maybe out of sync game state?
      if (e.code === PlatformErrorCodes.DestinyCannotPerformActionOnEquippedItem) {
        await dispatch(dequipItem(item));
        await transferApi(item)(currentAccountSelector(getState())!, item, store, amount);
      } else if (e.code === PlatformErrorCodes.DestinyItemNotFound) {
        // If the item wasn't found, it's probably been moved or deleted in-game. We could try to
        // reload the profile or load just that item, but API caching means we aren't guaranteed to
        // get the current view. So instead, we just pretend the move succeeded.
        console.warn('Item', item.name, 'was not found - pretending the move succeeded');
      } else {
        throw e;
      }
    }
    const source = getStore(getStores(), item.owner)!;
    const newItem = dispatch(updateItemModel(item, source, store, false, amount));
    item = newItem.owner !== 'vault' && equip ? await dispatch(equipItem(newItem)) : newItem;

    if (overrideLockState !== undefined) {
      // Run this async, without waiting for the result
      (async () => {
        console.log(
          'Resetting lock status of',
          item.name,
          'to',
          overrideLockState,
          'when moving to',
          store.name,
          'to work around Bungie.net lock state bug'
        );
        try {
          await dispatch(setItemLockState(item, overrideLockState));
        } catch (e) {
          console.error('Lock state override failed', e);
        }
      })();
    }

    return item;
  };
}

/**
 * This returns a promise for true if the exotic can be
 * equipped. In the process it will move aside any existing exotic
 * that would conflict. If it could not move aside, this
 * rejects. It never returns false.
 */
function canEquipExotic(item: DimItem, store: DimStore): ThunkResult<boolean> {
  return async (dispatch) => {
    const otherExotic = getOtherExoticThatNeedsDequipping(item, store);
    if (otherExotic) {
      try {
        await dispatch(dequipItem(otherExotic, true));
        return true;
      } catch (e) {
        throw new Error(
          t('ItemService.ExoticError', {
            itemname: item.name,
            slot: otherExotic.type,
            error: e.message,
          })
        );
      }
    } else {
      return true;
    }
  };
}

/**
 * Identify the other exotic, if any, that needs to be moved
 * aside. This is not a promise, it returns immediately.
 */
function getOtherExoticThatNeedsDequipping(item: DimItem, store: DimStore): DimItem | undefined {
  if (!item.equippingLabel) {
    return undefined;
  }

  // Find an item that's not in the slot we're equipping, but has a matching equipping label
  return store.items.find(
    (i) =>
      i.equipped && i.equippingLabel === item.equippingLabel && i.bucket.hash !== item.bucket.hash
  );
}

interface MoveContext {
  originalItemType: string;
  excludes: Pick<DimItem, 'id' | 'hash'>[];
  spaceLeft(s: DimStore, i: DimItem): number;
}

/**
 * Choose another item that we can move out of "target" in order to
 * make room for "item". We already know when this function is
 * called that store has no room for item.
 *
 * The concept is that DIM is able to make "smart moves" by moving other items
 * out of the way, but it should do so in the least disruptive way possible, and
 * should generally cause your inventory to move towards a state of organization.
 * Especially important is that we avoid moving items back onto the active character
 * unless there's no other option.
 *
 * @param store the store to choose a move aside item from.
 * @param item the item we're making space for.
 * @param moveContext a helper object that can answer questions about how much space is left.
 * @return An object with item and target properties representing both the item and its destination. This won't ever be undefined.
 * @throws {Error} An error if no move aside item could be chosen.
 */
function chooseMoveAsideItem(
  getState: () => RootState,
  target: DimStore,
  item: DimItem,
  moveContext: MoveContext
): {
  item: DimItem;
  target: DimStore;
} {
  // Check whether an item cannot or should not be moved
  function movable(otherItem: DimItem) {
    return (
      !otherItem.notransfer &&
      !moveContext.excludes.some((i) => i.id === otherItem.id && i.hash === otherItem.hash)
    );
  }

  const stores = storesSelector(getState());
  const otherStores = stores.filter((s) => s.id !== target.id);

  // Start with candidates of the same type (or vault bucket if it's vault)
  // TODO: This try/catch is to help debug https://sentry.io/destiny-item-manager/dim/issues/484361056/
  let allItems: DimItem[];
  try {
    allItems = target.isVault
      ? target.items.filter(
          (i) =>
            i.bucket.vaultBucket &&
            item.bucket.vaultBucket &&
            i.bucket.vaultBucket.hash === item.bucket.vaultBucket.hash
        )
      : findItemsByBucket(target, item.bucket.hash);
  } catch (e) {
    if (target.isVault && !item.bucket.vaultBucket) {
      console.error(
        'Item',
        item.name,
        "has no vault bucket, but we're trying to move aside room in the vault for it"
      );
    } else if (target.items.some((i) => !i.bucket.vaultBucket)) {
      console.error(
        'The vault has items with no vault bucket: ',
        target.items.filter((i) => !i.bucket.vaultBucket).map((i) => i.name)
      );
    }
    throw e;
  }
  const moveAsideCandidates = allItems.filter(movable);

  // if there are no candidates at all, fail
  if (moveAsideCandidates.length === 0) {
    const e: DimError = new Error(
      t('ItemService.NotEnoughRoom', { store: target.name, itemname: item.name })
    );
    e.code = 'no-space';
    throw e;
  }

  // Find any stackable that could be combined with another stack
  // on a different store to form a single stack
  let otherStore: DimStore | undefined;
  const stackable = moveAsideCandidates.find((i) => {
    if (i.maxStackSize > 1) {
      // Find another store that has an appropriate stackable
      otherStore = otherStores.find((s) =>
        s.items.some(
          (otherItem) =>
            // Same basic item
            otherItem.hash === i.hash &&
            !otherItem.location.inPostmaster &&
            // Enough space to absorb this stack
            i.maxStackSize - otherItem.amount >= i.amount
        )
      );
    }
    return Boolean(otherStore);
  });
  if (stackable && otherStore) {
    return {
      item: stackable,
      target: otherStore,
    };
  }

  const itemInfos = itemInfosSelector(getState());
  const itemHashTags = itemHashTagsSelector(getState());

  // A cached version of the space-left function
  const cachedSpaceLeft = _.memoize(
    (store: DimStore, item: DimItem) => moveContext.spaceLeft(store, item),
    (store, item) => {
      // cache key
      if (item.maxStackSize > 1) {
        return store.id + item.hash;
      } else {
        return store.id + item.type;
      }
    }
  );

  let moveAsideCandidate:
    | {
        item: DimItem;
        target: DimStore;
      }
    | undefined;

  const vault = getVault(stores)!;

  // Iterate through other stores from least recently played to most recently played.
  // The concept is that we prefer filling up the least-recently-played character before even
  // bothering with the others.
  _.sortBy(
    otherStores.filter((s) => !s.isVault),
    (s) => s.lastPlayed.getTime()
  ).find((targetStore) =>
    sortMoveAsideCandidatesForStore(
      moveAsideCandidates,
      target,
      targetStore,
      itemInfos,
      itemHashTags,
      item
    ).find((candidate) => {
      const spaceLeft = cachedSpaceLeft(targetStore, candidate);

      if (target.isVault) {
        // If we're moving from the vault
        // If the target character has any space, put it there
        if (candidate.amount <= spaceLeft) {
          moveAsideCandidate = {
            item: candidate,
            target: targetStore,
          };
          return true;
        }
      } else {
        // If we're moving from a character
        // If there's exactly one *slot* left on the vault, and
        // we're not moving the original item *from* the vault, put
        // the candidate on another character in order to avoid
        // gumming up the vault.
        const openVaultAmount = cachedSpaceLeft(vault, candidate);
        const openVaultSlotsBeforeMove = Math.floor(openVaultAmount / candidate.maxStackSize);
        const openVaultSlotsAfterMove = Math.max(
          0,
          Math.floor((openVaultAmount - candidate.amount) / candidate.maxStackSize)
        );
        if (openVaultSlotsBeforeMove === 1 && openVaultSlotsAfterMove === 0 && spaceLeft) {
          moveAsideCandidate = {
            item: candidate,
            target: targetStore,
          };
          return true;
        }
      }

      return false;
    })
  );

  // If we're moving off a character (into the vault) and we couldn't find a better match,
  // just try to shove it in the vault, and we'll recursively squeeze something else out of the vault.
  if (!moveAsideCandidate && !target.isVault) {
    moveAsideCandidate = {
      item: moveAsideCandidates[0],
      target: vault,
    };
  }

  if (!moveAsideCandidate) {
    const e: DimError = new Error(
      t('ItemService.NotEnoughRoom', { store: target.name, itemname: item.name })
    );
    e.code = 'no-space';
    throw e;
  }

  return moveAsideCandidate;
}

/**
 * Is there anough space to move the given item into store? This will refresh
 * data and/or move items aside in an attempt to make a move possible.
 * @param item The item we're trying to move.
 * @param store The destination store.
 * @param options.triedFallback True if we've already tried reloading stores
 * @param options.excludes A list of items that should not be moved in
 *                         order to make space for this move.
 * @param options.reservations A map from store => type => number of spaces to leave open.
 * @param options.numRetries A count of how many alternate items we've tried.
 * @return a promise that's either resolved if the move can proceed or rejected with an error.
 */
function canMoveToStore(
  item: DimItem,
  store: DimStore,
  amount: number,
  options: {
    excludes?: Pick<DimItem, 'id' | 'hash'>[];
    reservations?: MoveReservations;
    numRetries?: number;
  } = {}
): ThunkResult<boolean> {
  return async (dispatch, getState) => {
    const { excludes = [], reservations = {}, numRetries = 0 } = options;

    function spaceLeftWithReservations(s: DimStore, i: DimItem) {
      let left = spaceLeftForItem(s, i, storesSelector(getState()));
      // minus any reservations
      if (reservations[s.id]?.[i.type]) {
        left -= reservations[s.id][i.type];
      }
      // but not counting the original item that's moving
      if (s.id === item.owner && i.type === item.type && !item.location.inPostmaster) {
        left--;
      }
      return Math.max(0, left);
    }

    if (item.owner === store.id && !item.location.inPostmaster) {
      return true;
    }

    // You can't move more than the max stack of a unique stack item.
    if (item.uniqueStack && amountOfItem(store, item) + amount > item.maxStackSize) {
      const error: DimError = new Error(t('ItemService.StackFull', { name: item.name }));
      error.code = 'no-space';
      throw error;
    }

    const stores = storesSelector(getState());

    // How much space will be needed (in amount, not stacks) in the target store in order to make the transfer?
    const storeReservations: { [storeId: string]: number } = {};
    storeReservations[store.id] = amount;

    // guardian-to-guardian transfer will also need space in the vault
    if (item.owner !== 'vault' && !store.isVault && item.owner !== store.id) {
      storeReservations.vault = amount;
    }

    // How many items need to be moved away from each store (in amount, not stacks)
    const movesNeeded: { [storeId: string]: number } = {};
    stores.forEach((s) => {
      if (storeReservations[s.id]) {
        movesNeeded[s.id] = Math.max(
          0,
          storeReservations[s.id] - spaceLeftWithReservations(s, item)
        );
      }
    });

    if (Object.values(movesNeeded).every((m) => m === 0)) {
      // If there are no moves needed, we're clear to go
      return true;
    } else {
      // Move aside one of the items that's in the way
      const moveContext: MoveContext = {
        originalItemType: item.type,
        excludes,
        spaceLeft(s, i) {
          let left = spaceLeftWithReservations(s, i);
          if (i.type === this.originalItemType && storeReservations[s.id]) {
            left = left - storeReservations[s.id];
          }
          return Math.max(0, left);
        },
      };

      // Move starting from the vault (which is always last)
      const moves = Object.entries(movesNeeded)
        .reverse()
        .find(([_, moveAmount]) => moveAmount > 0)!;
      const moveAsideSource = getStore(stores, moves[0])!;
      const { item: moveAsideItem, target: moveAsideTarget } = chooseMoveAsideItem(
        getState,
        moveAsideSource,
        item,
        moveContext
      );

      if (
        !moveAsideTarget ||
        (!moveAsideTarget.isVault && spaceLeftForItem(moveAsideTarget, moveAsideItem, stores) <= 0)
      ) {
        const itemtype = moveAsideTarget.isVault
          ? moveAsideItem.destinyVersion === 1
            ? moveAsideItem.bucket.sort
            : ''
          : moveAsideItem.type;

        const errorData = {
          itemtype,
          store: moveAsideTarget.name,
          context: moveAsideTarget.genderName,
        };

        const error: DimError = new Error(
          // t('ItemService.BucketFull.Guardian_male')
          // t('ItemService.BucketFull.Guardian_female')
          moveAsideTarget.isVault
            ? t('ItemService.BucketFull.Vault', errorData)
            : t('ItemService.BucketFull.Guardian', errorData)
        );
        error.code = 'no-space';
        throw error;
      } else {
        // Make one move and start over!
        try {
          await dispatch(
            moveItemTo(moveAsideItem, moveAsideTarget, false, moveAsideItem.amount, excludes)
          );
          return dispatch(canMoveToStore(item, store, amount, options));
        } catch (e) {
          if (numRetries < 3) {
            // Exclude this item and try again so we pick another
            excludes.push(moveAsideItem);
            options.excludes = excludes;
            options.numRetries = numRetries + 1;
            console.error(
              `Unable to move aside ${moveAsideItem.name} to ${moveAsideTarget.name}. Trying again.`,
              e
            );
            return dispatch(canMoveToStore(item, store, amount, options));
          } else {
            throw e;
          }
        }
      }
    }
  };
}

/**
 * Returns if possible, or throws an exception if the item can't be equipped.
 */
function canEquip(item: DimItem, store: DimStore): void {
  if (itemCanBeEquippedBy(item, store)) {
    return;
  } else if (item.classified) {
    throw new Error(t('ItemService.Classified'));
  } else {
    const message =
      item.classType === DestinyClass.Unknown
        ? t('ItemService.OnlyEquippedLevel', { level: item.equipRequiredLevel })
        : t('ItemService.OnlyEquippedClassLevel', {
            class: item.classTypeNameLocalized.toLowerCase(),
            level: item.equipRequiredLevel,
          });

    const error: DimError = new Error(message);
    error.code = 'wrong-level';
    throw error;
  }
}

/**
 * Check whether this transfer can happen. If necessary, make secondary inventory moves
 * in order to make the primary transfer possible, such as making room or dequipping exotics.
 */
function isValidTransfer(
  equip: boolean,
  store: DimStore,
  item: DimItem,
  amount: number,
  excludes?: Pick<DimItem, 'id' | 'hash'>[],
  reservations?: MoveReservations
): ThunkResult<boolean> {
  return async (dispatch) => {
    if (equip) {
      canEquip(item, store); // throws
      if (item.equippingLabel) {
        await dispatch(canEquipExotic(item, store)); // throws
      }
    }
    return dispatch(canMoveToStore(item, store, amount, { excludes, reservations }));
  };
}

let lastTimeCurrentStoreWasReallyFull = 0;

/**
 * Move item to target store, optionally equipping it.
 * @param item the item to move.
 * @param target the store to move it to.
 * @param equip true to equip the item, false to leave it unequipped.
 * @param amount how much of the item to move (for stacks). Can span more than one stack's worth.
 * @param excludes A list of {id, hash} objects representing items that should not be moved aside to make the move happen.
 * @param reservations A map of store id to the amount of space to reserve in it for items like "item".
 * @return A promise for the completion of the whole sequence of moves, or a rejection if the move cannot complete.
 */
export function moveItemTo(
  item: DimItem,
  target: DimStore,
  equip = false,
  amount: number = item.amount || 1,
  excludes?: Pick<DimItem, 'id' | 'hash'>[],
  reservations?: MoveReservations
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());

    let source = getStore(getStores(), item.owner)!;
    // Reassign the target store to the active store if we're moving the item to an account-wide bucket
    if (!target.isVault && item.bucket.accountWide) {
      target = getCurrentStore(getStores())!;
    }

    // We're moving from the vault to the current character. Maybe they're
    // playing the game and deleting stuff? Try just jamming it in there, and
    // catch any errors. If we find out that the store is full through this
    // probe, don't try again for a while.
    const timeSinceCurrentStoreWasReallyFull = Date.now() - lastTimeCurrentStoreWasReallyFull;
    if (source.isVault && target.current && timeSinceCurrentStoreWasReallyFull > 5000) {
      try {
        console.log('Try blind move of', item.name, 'to', target.name);
        return await dispatch(moveToStore(item, target, equip, amount));
      } catch (e) {
        console.warn(
          'Tried blindly moving',
          item.name,
          'to',
          target.name,
          'but the bucket is really full',
          e.code
        );
        lastTimeCurrentStoreWasReallyFull = Date.now();
      }
    }

    await dispatch(isValidTransfer(equip, target, item, amount, excludes, reservations));

    // Replace the target store - isValidTransfer may have reloaded it
    target = getStore(getStores(), target.id)!;
    source = getStore(getStores(), item.owner)!;

    // Get from postmaster first
    if (item.location.inPostmaster) {
      if (source.id === target.id || item.bucket.accountWide) {
        item = await dispatch(moveToStore(item, target, equip, amount));
      } else {
        item = await dispatch(moveItemTo(item, source, equip, amount, excludes, reservations));
        target = getStore(getStores(), target.id)!;
        source = getStore(getStores(), item.owner)!;
      }
    }

    if (!source.isVault && !target.isVault) {
      // Guardian to Guardian
      if (source.id !== target.id && !item.bucket.accountWide) {
        // Different Guardian
        if (item.equipped) {
          item = await dispatch(dequipItem(item));
        }
        item = await dispatch(moveToVault(item, amount));
        item = await dispatch(moveToStore(item, target, equip, amount));
      }
      if (equip && !item.equipped) {
        item = await dispatch(equipItem(item));
      } else if (!equip && item.equipped) {
        item = await dispatch(dequipItem(item));
      }
    } else if (source.isVault && target.isVault) {
      // Vault to Vault
      // Do Nothing.
    } else if (source.isVault || target.isVault) {
      // Guardian to Vault or Vault to Guardian
      if (item.equipped) {
        item = await dispatch(dequipItem(item));
      }
      item = await dispatch(moveToStore(item, target, equip, amount));
    }
    return item;
  };
}

/**
 * Sort a list of items to determine a prioritized order for which should be moved from fromStore
 * assuming they'll end up in targetStore.
 */
export function sortMoveAsideCandidatesForStore(
  moveAsideCandidates: DimItem[],
  fromStore: DimStore,
  targetStore: DimStore,
  itemInfos: ItemInfos,
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  },
  /** The item we're trying to make space for. May be missing. */
  item?: DimItem
) {
  const tierValue = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    Legendary: 4,
    Exotic: 3,
  };

  // A sort for items to use for ranking *which item to move*
  // aside. The highest ranked items are the most likely to be moved.
  // Note that this is reversed, so higher values (including true over false)
  // come first in the list.
  const itemValueComparator: (a: DimItem, b: DimItem) => number = reverseComparator(
    chainComparator(
      // Try our hardest never to unequip something
      compareBy((i) => !i.equipped),
      // prefer same type over everything
      compareBy((i) => item && i.type === item.type),
      // or at least same category
      compareBy((i) => item && i.bucket.sort === item.bucket.sort),
      // Always prefer keeping something that was manually moved where it is
      compareBy((i) => -i.lastManuallyMoved),
      // Engrams prefer to be in the vault, so not-engram is larger than engram
      compareBy((i) => (fromStore.isVault ? !i.isEngram : i.isEngram)),
      // Prefer moving things the target store can use
      compareBy((i) => !targetStore.isVault && itemCanBeEquippedBy(i, targetStore)),
      // Prefer moving things this character can't use
      compareBy((i) => !fromStore.isVault && !itemCanBeEquippedBy(i, fromStore)),
      // Tagged items sort by orders defined in dim-item-info
      compareBy((i) => {
        const tag = getTag(i, itemInfos, itemHashTags);
        return -(fromStore.isVault ? vaultDisplacePriority : characterDisplacePriority).indexOf(
          tag || 'none'
        );
      }),
      // Prefer moving lower-tier into the vault and higher tier out
      compareBy((i) => (fromStore.isVault ? tierValue[i.tier] : -tierValue[i.tier])),
      // Prefer keeping higher-stat items on characters
      compareBy((i) => i.primStat && (fromStore.isVault ? i.primStat.value : -i.primStat.value))
    )
  );

  // Sort all candidates
  moveAsideCandidates.sort(itemValueComparator);
  return moveAsideCandidates;
}
