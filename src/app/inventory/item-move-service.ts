import { startSpan } from '@sentry/browser';
import { handleAuthErrors } from 'app/accounts/actions';
import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { isInInGameLoadoutForSelector } from 'app/loadout/selectors';
import { ItemRarityMap } from 'app/search/d2-known-values';
import { RootState, ThunkResult } from 'app/store/types';
import { CancelToken } from 'app/utils/cancel';
import { count, filterMap } from 'app/utils/collections';
import { DimError } from 'app/utils/dim-error';
import { errorMessage } from 'app/utils/errors';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog, timer, warnLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlatformErrorCodes } from 'bungie-api-ts/user';
import { BucketHashes } from 'data/d2/generated-enums';
import { memoize } from 'es-toolkit';
import { Immutable } from 'immer';
import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import {
  equipItems as d1EquipItems,
  setItemState as d1SetItemState,
  transfer as d1Transfer,
  equip as d1equip,
} from '../bungie-api/destiny1-api';
import {
  equipItems as d2EquipItems,
  setLockState as d2SetLockState,
  setTrackedState as d2SetTrackedState,
  transfer as d2Transfer,
  equip as d2equip,
} from '../bungie-api/destiny2-api';
import {
  chainComparator,
  compareBy,
  compareByIndex,
  reverseComparator,
} from '../utils/comparators';
import { itemLockStateChanged, itemMoved } from './actions';
import { notifyOtherTabsItemMoved } from './cross-tab';
import {
  TagValue,
  characterDisplacePriority,
  equipReplacePriority,
  vaultDisplacePriority,
} from './dim-item-info';
import { DimItem } from './item-types';
import { getLastManuallyMoved } from './manual-moves';
import { currentStoreSelector, getTagSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import {
  amountOfItem,
  findItemsByBucket,
  getCurrentStore,
  getStore,
  getVault,
  spaceLeftForItem,
} from './stores-helpers';

const TAG = 'move';

/**
 * An object we can use to track state across a "session" of move operations.
 * That might be just the moves involved in a single move request (including
 * move-asides), or it may encompass an entire loadout application.
 */
export interface MoveSession {
  /** Keep track of which buckets we tried to blindly move to but were actually full */
  bucketsFullOnCurrentStore: Set<number>;
  /** A token that can be checked to see if the whole operation is canceled. */
  readonly cancelToken: CancelToken;
  /**
   * Items explicitly involved in the requested move.
   * Used to distinguish user-intentional moves vs make-space moves.
   * Contains instanceIds, or for uninstanced items, item hashes.
   */
  involvedItems: Set<string | number>;
  // TODO: a record of moves? something to prevent infinite moves loops?
}

export function createMoveSession(
  cancelToken: CancelToken,
  /** Items explicitly involved in the move. */
  items: DimItem[],
): MoveSession {
  const involvedItems = new Set<string | number>();
  for (const item of items) {
    involvedItems.add(item.instanced ? item.id : item.hash);
  }
  return {
    bucketsFullOnCurrentStore: new Set(),
    involvedItems,
    cancelToken,
  };
}

/**
 * You can reserve a number of spaces in each BucketHash in each store.
 */
export interface MoveReservations {
  [storeId: string]: {
    [type: number]: number;
  };
}

/**
 * Minimum specification to identify an item that should be excluded from some consideration.
 */
export interface Exclusion {
  id: string;
  hash: number;
}

/**
 * Lock/unlock or track/untrack an item.
 */
export function setItemLockState(
  item: DimItem,
  state: boolean,
  type: 'lock' | 'track' = 'lock',
): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    // The state APIs require either the ID of the character that owns the item, or
    // the current character ID if the item is in the vault.
    const storeId = item.owner === 'vault' ? currentStoreSelector(getState())!.id : item.owner;

    if (item.destinyVersion === 2) {
      if (type === 'lock') {
        await d2SetLockState(account, storeId, item, state);
      } else {
        await d2SetTrackedState(account, storeId, item, state);
      }
    } else if (item.destinyVersion === 1) {
      await d1SetItemState(account, item, storeId, state, type);
    }

    dispatch(itemLockStateChanged({ item, state, type }));
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
  amount: number = item.amount,
): ThunkAction<DimItem, RootState, undefined, AnyAction> {
  return (dispatch, getState) =>
    startSpan({ name: 'updateItemModel' }, () => {
      const stopTimer = timer(TAG, 'itemMovedUpdate');

      const args = {
        itemId: item.id,
        itemHash: item.hash,
        itemLocation: item.location.hash,
        sourceId: source.id,
        targetId: target.id,
        equip,
        amount,
      };

      try {
        dispatch(itemMoved(args));
        notifyOtherTabsItemMoved(args);
        const stores = storesSelector(getState());
        return getItemAcrossStores(stores, item) || item;
      } finally {
        stopTimer();
      }
    });
}

/**
 * Find an item among all stores that matches the params provided.
 */
function getItemAcrossStores<Item extends DimItem, Store extends DimStore<Item>>(
  stores: Store[],
  params: DimItem,
) {
  for (const store of stores) {
    for (const item of store.items) {
      if (
        params.id === item.id &&
        params.hash === item.hash &&
        params.notransfer === item.notransfer &&
        params.amount === item.amount
      ) {
        return item;
      }
    }
  }
  return undefined;
}

/**
 * Finds an item similar to "item" which can be equipped on the item's owner in order to move "item".
 */
export function getSimilarItem(
  getState: () => RootState,
  stores: readonly DimStore[],
  item: DimItem,
  {
    exclusions,
    excludeExotic = false,
  }: {
    exclusions?: readonly Exclusion[];
    /** Don't pick an exotic to equip in this item's place (because we're specifically trying to dequip an exotic) */
    excludeExotic?: boolean;
  } = {},
): DimItem | undefined {
  const target = getStore(stores, item.owner)!;

  // Try each store, preferring getting something from the same character, then vault, then any other character
  const sortedStores = stores.toSorted(
    compareBy((store) => {
      if (target.id === store.id) {
        return 0;
      } else if (store.isVault) {
        return 1;
      } else {
        return 2;
      }
    }),
  );

  let result: DimItem | undefined;
  for (const store of sortedStores) {
    result = searchForSimilarItem(getState, item, store, exclusions, target, excludeExotic);
    if (result) {
      break;
    }
  }

  return result;
}

/**
 * Bulk equip items. Only use for multiple equips at once (just loadouts).
 * Returns a map of item ids to their success status (PlatformErrorCodes.Success if it succeeded), which can be less
 * that what was passed in or even more than what was passed in because
 * sometimes we have to de-equip an exotic to equip another exotic.
 */
export function equipItems(
  store: DimStore,
  items: DimItem[],
  /** A list of items to not consider equipping in order to de-equip an exotic */
  exclusions: readonly Exclusion[],
  session: MoveSession,
): ThunkResult<{ [itemInstanceId: string]: PlatformErrorCodes }> {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());

    // Check for (and move aside) exotics
    const extraItemsToEquip: Promise<DimItem>[] = filterMap(items, (i) => {
      if (i.equippingLabel) {
        const otherExotic = getOtherExoticThatNeedsDequipping(i, store);
        // If we aren't already equipping into that slot...
        if (otherExotic && !items.find((i) => i.bucket.hash === otherExotic.bucket.hash)) {
          const similarItem = getSimilarItem(getState, getStores(), otherExotic, {
            excludeExotic: true,
            exclusions,
          });
          if (!similarItem) {
            return Promise.reject(
              new DimError(
                'ItemService.Deequip',
                t('ItemService.Deequip', { itemname: otherExotic.name }),
              ),
            );
          }
          const target = getStore(getStores(), similarItem.owner)!;

          if (store.id === target.id) {
            return Promise.resolve(similarItem);
          } else {
            // If we need to get the similar item from elsewhere, do that first
            return dispatch(executeMoveItem(similarItem, store, { equip: true }, session)).then(
              () => similarItem,
            );
          }
        }
      }
      return undefined;
    });

    const extraItems = await Promise.all(extraItemsToEquip);
    items = items.concat(extraItems);
    if (items.length === 0) {
      return {};
    }

    // It's faster to call equipItem for a single item
    if (items.length === 1) {
      try {
        await dispatch(equipItem(items[0], session.cancelToken));
        return { [items[0].id]: PlatformErrorCodes.Success };
      } catch (e) {
        return {
          [items[0].id]:
            (e instanceof DimError && e.bungieErrorCode()) || PlatformErrorCodes.UnhandledException,
        };
      }
    }

    session.cancelToken.checkCanceled();

    try {
      const results = await equipItemsApi(items[0])(
        currentAccountSelector(getState())!,
        store,
        items,
      );
      // Update our view of each successful item
      for (const [itemInstanceId, resultCode] of Object.entries(results)) {
        if (resultCode === PlatformErrorCodes.Success) {
          const item = items.find((i) => i.id === itemInstanceId);
          if (item) {
            dispatch(updateItemModel(item, store, store, true));
          }
        }
      }
      return results;
    } catch (e) {
      dispatch(handleAuthErrors(e));
      throw e;
    }
  };
}

function equipItem(item: DimItem, cancelToken: CancelToken): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    try {
      const store = getStore(storesSelector(getState()), item.owner)!;
      if ($featureFlags.debugMoves) {
        infoLog('equip', 'Equip', item.name, item.typeName, 'to', store.name);
      }
      cancelToken.checkCanceled();
      await equipApi(item)(currentAccountSelector(getState())!, item);
      return dispatch(updateItemModel(item, store, store, true));
    } catch (e) {
      dispatch(handleAuthErrors(e));
      throw e;
    }
  };
}

/** De-equip an item, which really means find another item to equip in its place. */
function dequipItem(
  item: DimItem,
  session: MoveSession,
  {
    excludeExotic = false,
  }: {
    /** Don't pick an exotic to equip in this item's place (because we're specifically trying to dequip an exotic) */
    excludeExotic?: boolean;
  } = { excludeExotic: false },
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    const similarItem = getSimilarItem(getState, stores, item, { excludeExotic });
    if (!similarItem) {
      throw new DimError('ItemService.Deequip', t('ItemService.Deequip', { itemname: item.name }));
    }

    const ownerStore = getStore(stores, item.owner)!;
    await dispatch(executeMoveItem(similarItem, ownerStore, { equip: true }, session));
    return item;
  };
}

function moveToVault(item: DimItem, amount: number, session: MoveSession): ThunkResult<DimItem> {
  return async (dispatch, getState) =>
    dispatch(moveToStore(item, getVault(storesSelector(getState()))!, false, amount, session));
}

function moveToStore(
  item: DimItem,
  store: DimStore,
  equip: boolean,
  amount: number,
  session: MoveSession,
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());
    const ownerStore = getStore(getStores(), item.owner)!;

    if ($featureFlags.debugMoves) {
      item.location.inPostmaster
        ? infoLog(
            TAG,
            'Pull',
            amount,
            item.name,
            item.typeName,
            'to',
            store.name,
            'from Postmaster',
          )
        : infoLog(
            'move',
            'Move',
            amount,
            item.name,
            item.typeName,
            'to',
            store.name,
            'from',
            ownerStore.name,
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

    session.cancelToken.checkCanceled();

    try {
      await transferApi(item)(currentAccountSelector(getState())!, item, store, amount);
    } catch (e) {
      dispatch(handleAuthErrors(e));
      // Not sure why this happens - maybe out of sync game state?
      if (
        e instanceof DimError &&
        e.bungieErrorCode() === PlatformErrorCodes.DestinyCannotPerformActionOnEquippedItem
      ) {
        await dispatch(dequipItem(item, session));
        await transferApi(item)(currentAccountSelector(getState())!, item, store, amount);
      } else {
        throw e;
      }
    }
    const source = getStore(getStores(), item.owner)!;
    const newItem = dispatch(updateItemModel(item, source, store, false, amount));
    item =
      newItem.owner !== 'vault' && equip
        ? await dispatch(equipItem(newItem, session.cancelToken))
        : newItem;

    if (overrideLockState !== undefined) {
      // Run this async, without waiting for the result
      (async () => {
        infoLog(
          'move',
          'Resetting lock status of',
          item.name,
          'to',
          overrideLockState,
          'when moving to',
          store.name,
          'to work around Bungie.net lock state bug',
        );
        try {
          await dispatch(setItemLockState(item, overrideLockState));
        } catch (e) {
          errorLog(TAG, 'Lock state override failed', e);
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
function canEquipExotic(
  item: DimItem,
  store: DimStore,
  session: MoveSession,
): ThunkResult<boolean> {
  return async (dispatch) => {
    const otherExotic = getOtherExoticThatNeedsDequipping(item, store);
    if (otherExotic) {
      try {
        await dispatch(dequipItem(otherExotic, session, { excludeExotic: true }));
        return true;
      } catch (e) {
        throw new Error(
          t('ItemService.ExoticError', {
            itemname: item.name,
            slot: otherExotic.typeName,
            error: errorMessage(e),
          }),
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
      i.equipped && i.equippingLabel === item.equippingLabel && i.bucket.hash !== item.bucket.hash,
  );
}

interface MoveContext {
  /** Bucket hash */
  originalItemType: number;
  excludes: readonly Exclusion[];
  spaceLeft: (s: DimStore, i: DimItem) => number;
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
 * @param target the store to choose a move aside item from.
 * @param item the item we're making space for.
 * @param moveContext a helper object that can answer questions about how much space is left.
 * @return An object with item and target properties representing both the item and its destination. This won't ever be undefined.
 * @throws {Error} An error if no move aside item could be chosen.
 */
function chooseMoveAsideItem(
  getState: () => RootState,
  target: DimStore,
  item: DimItem,
  moveContext: MoveContext,
): {
  item: DimItem;
  target: DimStore;
} {
  // Check whether an item cannot or should not be moved
  function isMovable(otherItem: DimItem) {
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
            i.bucket.vaultBucket.hash === item.bucket.vaultBucket.hash,
        )
      : findItemsByBucket(target, item.bucket.hash);
  } catch (e) {
    if (target.isVault && !item.bucket.vaultBucket) {
      errorLog(
        'move',
        'Item',
        item.name,
        "has no vault bucket, but we're trying to move aside room in the vault for it",
      );
    } else if (target.items.some((i) => !i.bucket.vaultBucket)) {
      errorLog(
        'move',
        'The vault has items with no vault bucket: ',
        target.items.filter((i) => !i.bucket.vaultBucket).map((i) => i.name),
      );
    }
    throw e;
  }
  const moveAsideCandidates = allItems.filter(isMovable);

  // if there are no candidates at all, fail
  if (moveAsideCandidates.length === 0) {
    throw new DimError(
      'no-space',
      t('ItemService.NotEnoughRoom', { store: target.name, itemname: item.name }),
    ).withError(new DimError('ItemService.NotEnoughRoomGeneral'));
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
            i.maxStackSize - otherItem.amount >= i.amount,
        ),
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

  const getTag = getTagSelector(getState());
  const isInInGameLoadoutFor = isInInGameLoadoutForSelector(getState());

  // A cached version of the space-left function
  const cachedSpaceLeft = memoize(
    ([store, item]: [store: DimStore, item: DimItem]) => moveContext.spaceLeft(store, item),
    {
      getCacheKey: ([store, item]) => {
        // cache key
        if (item.maxStackSize > 1) {
          return store.id + item.hash;
        } else {
          return store.id + item.bucket.hash;
        }
      },
    },
  );

  const vault = getVault(stores)!;

  // Iterate through other stores from least recently played to most recently played.
  // The concept is that we prefer filling up the least-recently-played character before even
  // bothering with the others.
  let moveAsideCandidate = (() => {
    const otherCharacters = otherStores
      .filter((s) => !s.isVault)
      .sort(compareBy((s) => s.lastPlayed.getTime()));
    for (const targetStore of otherCharacters) {
      const sortedCandidates = sortMoveAsideCandidatesForStore(
        moveAsideCandidates,
        target,
        targetStore,
        getTag,
        isInInGameLoadoutFor,
        item,
      );
      for (const candidate of sortedCandidates) {
        const spaceLeft = cachedSpaceLeft([targetStore, candidate]);

        if (target.isVault) {
          // If we're moving from the vault
          // If the target character has any space, put it there
          if (candidate.amount <= spaceLeft) {
            return {
              item: candidate,
              target: targetStore,
            };
          }
        } else {
          // If we're moving from a character
          // If there's exactly one *slot* left on the vault, and
          // we're not moving the original item *from* the vault, put
          // the candidate on another character in order to avoid
          // gumming up the vault.
          const openVaultAmount = cachedSpaceLeft([vault, candidate]);
          const openVaultSlotsBeforeMove = Math.floor(openVaultAmount / candidate.maxStackSize);
          const openVaultSlotsAfterMove = Math.max(
            0,
            Math.floor((openVaultAmount - candidate.amount) / candidate.maxStackSize),
          );
          if (openVaultSlotsBeforeMove === 1 && openVaultSlotsAfterMove === 0 && spaceLeft) {
            return {
              item: candidate,
              target: targetStore,
            };
          }
        }
      }
    }
  })();

  // If we're moving off a character (into the vault) and we couldn't find a better match,
  // just try to shove it in the vault, and we'll recursively squeeze something else out of the vault.
  if (!moveAsideCandidate && !target.isVault) {
    moveAsideCandidate = {
      item: moveAsideCandidates[0],
      target: vault,
    };
  }

  if (!moveAsideCandidate) {
    throw new DimError(
      'no-space',
      t('ItemService.NotEnoughRoom', { store: target.name, itemname: item.name }),
    ).withError(new DimError('ItemService.NotEnoughRoomGeneral'));
  }

  return moveAsideCandidate;
}

/**
 * Ensures there is enough space to move the given item into store.
 * This will refresh data and/or move items aside in an attempt to make a move possible.
 *
 * This recursively calls itself to accommodate multi-step moves.
 * Returns `true` if you're good to go (or if the item's already there).
 *
 * @param item The item we're trying to move.
 * @param store The destination store.
 * @param options.triedFallback True if we've already tried reloading stores
 * @param options.excludes A list of items that should not be moved in
 *                         order to make space for this move.
 * @param options.reservations A map from store => type => number of spaces to leave open.
 * @param options.numRetries A count of how many alternate items we've tried.
 * @return a promise that's either resolved if the move can proceed or rejected with an error.
 */
function ensureCanMoveToStore(
  item: DimItem,
  store: DimStore,
  amount: number,
  options: {
    excludes: Exclusion[];
    reservations: Immutable<MoveReservations>;
    numRetries?: number;
  },
  session: MoveSession,
): ThunkResult<boolean> {
  return async (dispatch, getState) => {
    const { excludes = [], reservations = {}, numRetries = 0 } = options;

    function spaceLeftWithReservations(s: DimStore, i: DimItem) {
      let left = spaceLeftForItem(s, i, storesSelector(getState()));
      // minus any reservations
      if (reservations[s.id]?.[i.bucket.hash]) {
        left -= reservations[s.id][i.bucket.hash];
      }

      // but not counting the original item that's moving
      if (
        s.id === item.owner &&
        i.bucket.hash === item.bucket.hash &&
        !item.location.inPostmaster
      ) {
        left--;
      }

      // if this is a consumable, and wasn't an explicitly requested move,
      // pretend the consumables bucket is 1 stack smaller, so we don't automatically max it out
      if (i.bucket.hash === BucketHashes.Consumables && !session.involvedItems.has(i.hash)) {
        left -= i.maxStackSize;
      }

      return Math.max(0, left);
    }

    if (item.owner === store.id && !item.location.inPostmaster) {
      return true;
    }

    // You can't move more than the max stack of a unique stack item.
    if (item.uniqueStack && amountOfItem(store, item) + amount > item.maxStackSize) {
      throw new DimError('no-space', t('ItemService.StackFull', { name: item.name }));
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
    for (const s of stores) {
      if (storeReservations[s.id]) {
        movesNeeded[s.id] = Math.max(
          0,
          storeReservations[s.id] - spaceLeftWithReservations(s, item),
        );
      }
    }

    if (Object.values(movesNeeded).every((m) => m === 0)) {
      // If there are no moves needed, we're clear to go
      return true;
    } else {
      // Move aside one of the items that's in the way
      const moveContext: MoveContext = {
        originalItemType: item.bucket.hash,
        excludes,
        spaceLeft(s, i) {
          let left = spaceLeftWithReservations(s, i);
          if (i.bucket.hash === this.originalItemType && storeReservations[s.id]) {
            left -= storeReservations[s.id];
          }
          return Math.max(0, left);
        },
      };

      // Move starting from the vault (which is always last)
      const [sourceStoreId] = Object.entries(movesNeeded).findLast(
        ([_storeId, moveAmount]) => moveAmount > 0,
      )!;
      const moveAsideSource = getStore(stores, sourceStoreId)!;
      const { item: moveAsideItem, target: moveAsideTarget } = chooseMoveAsideItem(
        getState,
        moveAsideSource,
        item,
        moveContext,
      );

      if (
        !moveAsideTarget ||
        (!moveAsideTarget.isVault && spaceLeftForItem(moveAsideTarget, moveAsideItem, stores) <= 0)
      ) {
        const itemtype = moveAsideTarget.isVault
          ? moveAsideItem.destinyVersion === 1
            ? moveAsideItem.bucket.sort!
            : ''
          : moveAsideItem.typeName;

        throw new DimError(
          'no-space',
          moveAsideTarget.isVault
            ? t('ItemService.BucketFull.Vault', {
                itemtype,
                store: moveAsideTarget.name,
              })
            : t('ItemService.BucketFull.Guardian', {
                itemtype,
                store: moveAsideTarget.name,
                context: moveAsideTarget.genderName,
              }),
        );
      } else {
        // Make one move and start over!
        try {
          const moveAsideOpts = {
            equip: false,
            amount: moveAsideItem.amount,
            excludes,
            reservations,
          };
          await dispatch(executeMoveItem(moveAsideItem, moveAsideTarget, moveAsideOpts, session));
          return await dispatch(ensureCanMoveToStore(item, store, amount, options, session));
        } catch (e) {
          if (numRetries < 3) {
            // Exclude this item and try again so we pick another
            excludes.push(moveAsideItem);
            options.excludes = excludes;
            options.numRetries = numRetries + 1;
            errorLog(
              'move',
              `Unable to move aside ${moveAsideItem.name} to ${moveAsideTarget.name}. Trying again.`,
              e,
            );
            return dispatch(ensureCanMoveToStore(item, store, amount, options, session));
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
    throw new DimError('ItemService.Classified');
  } else {
    const message =
      item.classType === DestinyClass.Unknown
        ? t('ItemService.OnlyEquippedLevel', { level: item.equipRequiredLevel })
        : t('ItemService.OnlyEquippedClassLevel', {
            class: item.classTypeNameLocalized.toLowerCase(),
            level: item.equipRequiredLevel,
          });

    throw new DimError('wrong-level', message);
  }
}

/**
 * Ensures there is enough space to move the given item into store.
 * This will refresh data/move items aside/de-equip exotics,
 * in an attempt to make a move possible.
 *
 * This is functionally just ensureCanMoveToStore, with an
 * additional accommodation for equips and the one-exotic rule.
 */
function ensureValidTransfer(
  equip: boolean,
  store: DimStore,
  item: DimItem,
  amount: number,
  excludes: Exclusion[],
  reservations: Immutable<MoveReservations>,
  session: MoveSession,
): ThunkResult<boolean> {
  return async (dispatch) => {
    if (equip) {
      canEquip(item, store); // may throw
      if (item.equippingLabel) {
        await dispatch(canEquipExotic(item, store, session)); // may throw
      }
    }
    return dispatch(ensureCanMoveToStore(item, store, amount, { excludes, reservations }, session));
  };
}

/**
 * Move item to target store, optionally equipping it. This is the "low level" smart move, which will move items out of
 * the way if necessary, but it doesn't have error/progress notification or any of that. Use the functions in `move-item.ts` for
 * user-initiated moves, while this function is meant for implementing things that move items such as those user-initiated functions,
 * loadout apply, etc.
 *
 * @param item the item to move.
 * @param target the store to move it to.
 * @param equip true to equip the item, false to leave it unequipped.
 * @param amount how much of the item to move (for stacks). Can span more than one stack's worth.
 * @param excludes A list of {id, hash} objects representing items that should not be moved aside to make the move happen.
 * @param reservations A map of store id to the amount of space to reserve in it for items like "item".
 * @param session An object used to track properties such as cancellation or stores filling up for a whole sequence of moves.
 * @return A promise for the completion of the whole sequence of moves, or a rejection if the move cannot complete.
 */
export function executeMoveItem(
  item: DimItem,
  target: DimStore,
  {
    equip = false,
    amount = item.amount || 1,
    excludes = [],
    reservations = {},
  }: {
    equip?: boolean;
    amount?: number;
    excludes?: Exclusion[];
    reservations?: Immutable<MoveReservations>;
  },
  session: MoveSession,
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
    // probe, don't try again for the rest of this move session.
    if (
      // Either pulling from the vault,
      (source.isVault ||
        // or pulling from the postmaster
        (item.location.inPostmaster && (source.id === target.id || item.bucket.accountWide))) &&
      // To the current character
      target.current &&
      // don't blind move if this destination bucket already had a blind move failure
      !session.bucketsFullOnCurrentStore.has(item.bucket.hash) &&
      // don't blind move consumables to character,
      // because we don't want to unintentionally max out consumables
      item.bucket.hash !== BucketHashes.Consumables
    ) {
      try {
        infoLog(TAG, 'Try blind move of', item.name, 'to', target.name);
        return await dispatch(moveToStore(item, target, equip, amount, session));
      } catch (e) {
        if (
          e instanceof DimError &&
          // TODO: does this fire for pull from postmaster?
          e.bungieErrorCode() === PlatformErrorCodes.DestinyNoRoomInDestination
        ) {
          warnLog(
            'move',
            'Tried blindly moving',
            item.name,
            'to',
            target.name,
            'but the bucket is really full',
          );
          session.bucketsFullOnCurrentStore.add(item.bucket.hash);
        } else {
          throw e;
        }
      }
    }

    // for any case that's not char-to-char, we can free up space ahead of time
    if (source.isVault || target.isVault || source.id === target.id || item.bucket.accountWide) {
      await dispatch(
        ensureValidTransfer(equip, target, item, amount, excludes, reservations, session),
      );
      // Replace the target store - ensureValidTransfer may have reloaded it
      target = getStore(getStores(), target.id)!;
      source = getStore(getStores(), item.owner)!;
    }

    // Get from postmaster first
    if (item.location.inPostmaster) {
      if (source.id === target.id || item.bucket.accountWide) {
        item = await dispatch(moveToStore(item, target, equip, amount, session));
      } else {
        item = await dispatch(
          executeMoveItem(item, source, { equip, amount, excludes, reservations }, session),
        );
        target = getStore(getStores(), target.id)!;
        source = getStore(getStores(), item.owner)!;
      }
    }

    if (!source.isVault && !target.isVault) {
      // Guardian to Guardian
      if (source.id !== target.id && !item.bucket.accountWide) {
        // Different Guardian
        if (item.equipped) {
          item = await dispatch(dequipItem(item, session));
        }
        // for char to char, two moves are required: char to vault then vault to char
        // make sure the vault has space before trying to vault the item
        await dispatch(
          ensureValidTransfer(
            false,
            getVault(getStores())!,
            item,
            amount,
            excludes,
            reservations,
            session,
          ),
        );
        target = getStore(getStores(), target.id)!;
        source = getStore(getStores(), item.owner)!;
        item = await dispatch(moveToVault(item, amount, session));

        // now make sure the target char has space before trying to unvault the item
        await dispatch(
          ensureValidTransfer(equip, target, item, amount, excludes, reservations, session),
        );
        target = getStore(getStores(), target.id)!;
        source = getStore(getStores(), item.owner)!;
        item = await dispatch(moveToStore(item, target, equip, amount, session));
      }
      if (equip && !item.equipped) {
        item = await dispatch(equipItem(item, session.cancelToken));
      } else if (!equip && item.equipped) {
        item = await dispatch(dequipItem(item, session));
      }
    } else if (source.isVault && target.isVault) {
      // Vault to Vault
      // Do Nothing.
    } else if (source.isVault || target.isVault) {
      // Guardian to Vault or Vault to Guardian
      if (item.equipped) {
        item = await dispatch(dequipItem(item, session));
      }
      item = await dispatch(moveToStore(item, target, equip, amount, session));
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
  getTag: (item: DimItem) => TagValue | undefined,
  isInInGameLoadoutFor: (item: DimItem, ownerId: string) => boolean,
  /** The item we're trying to make space for. May be missing. */
  displacer?: DimItem,
) {
  // A sort for items to use for ranking *which item to move*
  // aside. The highest ranked items are the most likely to be moved.
  // Note that this is reversed, so higher values (including true over false)
  // come first in the list.
  const itemValueComparator: (a: DimItem, b: DimItem) => number = reverseComparator(
    chainComparator(
      // MECHANICAL CONSIDERATIONS RELATED TO MOVING ITEMS

      // Try our hardest never to unequip something
      compareBy((displaced) => !displaced.equipped),
      // prefer same bucket over everything, because that makes space in the correct "pocket"
      compareBy(
        (displaced) => !fromStore.isVault && displaced.bucket.hash === displacer?.bucket.hash,
      ),

      // TODO: Prefer moving from vault into Inventory (consumables)
      // TODO: Prefer moving from vault into the bucket with the most free space

      // D1 HAD ENGRAMS MIXED IN WITH INVENTORY

      // Engrams prefer to be in the vault, so not-engram is larger than engram
      compareBy((displaced) => (fromStore.isVault ? !displaced.isEngram : displaced.isEngram)),

      // DON'T ANNOY PEOPLE

      // Always prefer keeping something that was manually moved where it is
      compareBy((displaced) => -getLastManuallyMoved(displaced)),

      // CONVENIENCES RELATED TO WHETHER ITEMS ARE USEFUL, AND TO WHICH CHARACTER

      // Prefer displacing on-char items that AREN'T in their owner's in-game loadouts
      compareBy(
        (displaced) => !fromStore.isVault && !isInInGameLoadoutFor(displaced, fromStore.id),
      ),
      // prefer displacing a vaulted item to a char with the item in a loadout
      compareBy(
        (displaced) => !targetStore.isVault && isInInGameLoadoutFor(displaced, targetStore.id),
      ),
      // Prefer moving an item if the owner can't use it
      compareBy((displaced) => !fromStore.isVault && !itemCanBeEquippedBy(displaced, fromStore)),
      // Prefer moving things the target store can use
      compareBy((displaced) => !targetStore.isVault && itemCanBeEquippedBy(displaced, targetStore)),

      // TRYING TO ESTIMATE USER INTENTION AND ITEM VALUE

      // Tagged items sort by orders defined in dim-item-info
      reverseComparator(
        compareByIndex(
          fromStore.isVault ? vaultDisplacePriority : characterDisplacePriority,
          (displaced) => getTag(displaced) ?? 'none',
        ),
      ),
      // Prefer moving lower-tier into the vault and higher tier out
      compareBy((i) => (fromStore.isVault ? ItemRarityMap[i.rarity] : -ItemRarityMap[i.rarity])),
      // Prefer keeping higher-stat items on characters
      compareBy(
        (i) =>
          (i.primaryStat && (fromStore.isVault ? i.primaryStat.value : -i.primaryStat.value)) || 0,
      ),
    ),
  );

  // Sort all candidates
  moveAsideCandidates.sort(itemValueComparator);
  return moveAsideCandidates;
}

/**
 * Find an item in store like "item", excluding the exclusions, to be equipped
 * on target. Generally used to help with de-equipping item.
 * @param exclusions a list of {id, hash} objects that won't be considered for equipping.
 * @param excludeExotic exclude any item matching the equippingLabel of item, used when dequipping an exotic so we can equip an exotic in another slot.
 */
function searchForSimilarItem(
  getState: () => RootState,
  item: DimItem,
  store: DimStore,
  exclusions: readonly Exclusion[] = [],
  target: DimStore,
  excludeExotic: boolean,
): DimItem | undefined {
  const candidates = store.items.filter(
    (i) =>
      i.location.hash === item.location.hash &&
      !i.equipped &&
      // Not the same item
      i.id !== item.id &&
      itemCanBeEquippedBy(i, target) &&
      // Not on the exclusion list
      !exclusions.some((item) => item.id === i.id && item.hash === i.hash) &&
      (!excludeExotic || i.equippingLabel !== item.equippingLabel),
  );

  if (!candidates.length) {
    return undefined;
  }

  const getTag = getTagSelector(getState());

  // A sort for items to use for ranking which item to use to replace the
  // already equipped item. The highest ranked items are the most likely to be
  // used. Note that this is reversed, so higher values (including true over
  // false) come first in the list.
  const itemValueComparator: (a: DimItem, b: DimItem) => number = reverseComparator(
    chainComparator(
      // Try hard not to choose exotics - it's weird to replace an exotic with another random exotic.
      // But we might have to if there's no other option.
      compareBy((i) => !i.equippingLabel),
      // try to match type (e.g. scout rifle). TODO: look into using ItemSubType instead
      compareBy((i) => i.typeName === item.typeName),
      reverseComparator(compareByIndex(equipReplacePriority, (i) => getTag(i) ?? 'none')),
      // Prefer rarer items
      compareBy((i) => ItemRarityMap[i.rarity]),
      // Prefer higher-stat items
      compareBy((i) => i.primaryStat?.value ?? 0),
    ),
  );

  const sortedCandidates = candidates.sort(itemValueComparator);

  return (
    sortedCandidates.find((result) => {
      if (result.equippingLabel) {
        const otherExotic = getOtherExoticThatNeedsDequipping(result, store);
        // If there aren't other exotics equipped, or the equipped one is the one we're dequipping, we're good
        return !otherExotic || otherExotic.id === item.id;
      } else {
        return true;
      }
    }) || undefined
  );
}
