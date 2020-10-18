import { settingsSelector } from 'app/dim-api/selectors';
import {
  bucketsSelector,
  itemHashTagsSelector,
  itemInfosSelector,
  storesSelector,
} from 'app/inventory/selectors';
import {
  capacityForItem,
  findItemsByBucket,
  getVault,
  isD1Store,
} from 'app/inventory/stores-helpers';
import { pullablePostmasterEquipment, pullEquipmentFromPostmaster } from 'app/loadout/postmaster';
import { refresh } from 'app/shell/refresh';
import { ThunkResult } from 'app/store/types';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { MoveReservations, sortMoveAsideCandidatesForStore } from '../inventory/item-move-service';
import { DimItem } from '../inventory/item-types';
import { D1Store, DimStore } from '../inventory/store-types';
import { clearItemsOffCharacter } from '../loadout/loadout-apply';
import * as actions from './basic-actions';
import { farmingInterruptedSelector, farmingStoreSelector } from './selectors';

// D1 Glimmer items
const glimmerHashes = new Set([
  269776572, // -house-banners
  3632619276, // -silken-codex
  2904517731, // -axiomatic-beads
  1932910919, // -network-keys
]);

// These are things you may pick up frequently out in the wild
const makeRoomTypes = [
  1498876634, // Primary
  2465295065, // Special
  953998645, // Heavy
  3448274439, // Helmet
  3551918588, // Gauntlets
  14239492, // Chest
  20886954, // Legs
  1585787867, // ClassItem
  434908299, // Artifact
  4023194814, // Ghost
  1469714392, // Consumable
  3865314626, // Material
];

const FARMING_REFRESH_RATE = 10_000; // Bungie.net caches results for 30 seconds - this may be too fast

let intervalId = 0;

/**
 * Start the farming process for a given store. This causes stores to auto refresh
 * and makes space for new drops. In D1 it can also move some other items around.
 */
export function startFarming(storeId: string): ThunkResult {
  return async (dispatch, getState) => {
    dispatch(actions.start(storeId));

    const storeSelector = farmingStoreSelector();
    const farmingStore = storeSelector(getState());

    if (!farmingStore || farmingStore.id !== storeId) {
      return;
    }

    infoLog('farming', 'Started farming', farmingStore.name);

    let unsubscribe = _.noop;

    unsubscribe = observeStore(storeSelector, (_, farmingStore) => {
      if (!farmingStore || farmingStore.id !== storeId) {
        unsubscribe();
        return;
      }

      if (farmingInterruptedSelector(getState())) {
        infoLog('farming', 'Farming interrupted, will resume when tasks are complete');
      } else {
        if (isD1Store(farmingStore)) {
          dispatch(farmD1(farmingStore));
        } else {
          // In D2 we just make room
          const itemsToBePulledFromPostmaster = pullablePostmasterEquipment(
            farmingStore,
            storesSelector(getState())
          );
          if (itemsToBePulledFromPostmaster.length > 0) {
            dispatch(pullEquipmentFromPostmaster(farmingStore));
          }
          dispatch(makeRoomForItems(farmingStore));
        }
      }
    });

    intervalId = window.setInterval(refresh, FARMING_REFRESH_RATE);
  };
}

/**
 * Stop farming. This cancels the faster refresh
 */
export function stopFarming(): ThunkResult {
  return async (dispatch) => {
    dispatch(actions.stop());
    window.clearInterval(intervalId);
  };
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
function makeRoomForItems(store: DimStore): ThunkResult {
  return (dispatch, getState) => {
    const buckets = bucketsSelector(getState())!;
    const makeRoomBuckets = Object.values(buckets.byHash).filter(
      (b) => b.category === BucketCategory.Equippable && b.type
    );
    return dispatch(makeRoomForItemsInBuckets(storesSelector(getState()), store, makeRoomBuckets));
  };
}

/// D1 Stuff ///

function farmD1(store: D1Store): ThunkResult {
  return async (dispatch, getState) => {
    await dispatch(farmItems(store));
    if (settingsSelector(getState()).farmingMakeRoomForItems) {
      await dispatch(makeRoomForD1Items(store));
    }
  };
}

function farmItems(store: D1Store): ThunkResult {
  const toMove = store.items.filter(
    (i) =>
      !i.notransfer &&
      (i.isEngram || (i.equipment && i.type === 'Uncommon') || glimmerHashes.has(i.hash))
  );

  if (toMove.length === 0) {
    return () => Promise.resolve();
  }

  return moveItemsToVault(store, toMove, []);
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
function makeRoomForD1Items(store: D1Store): ThunkResult {
  return async (dispatch, getState) => {
    const buckets = bucketsSelector(getState())!;
    const makeRoomBuckets = makeRoomTypes.map((type) => buckets.byHash[type]);
    return dispatch(makeRoomForItemsInBuckets(storesSelector(getState()), store, makeRoomBuckets));
  };
}

// Ensure that there's one open space in each category that could
// hold an item, so they don't go to the postmaster.
export function makeRoomForItemsInBuckets(
  stores: DimStore[],
  store: DimStore,
  makeRoomBuckets: InventoryBucket[]
): ThunkResult {
  return async (dispatch, getState) => {
    // If any category is full, we'll move one aside
    const itemsToMove: DimItem[] = [];
    const itemInfos = itemInfosSelector(getState());
    const itemHashTags = itemHashTagsSelector(getState());
    makeRoomBuckets.forEach((bucket) => {
      const items = findItemsByBucket(store, bucket.hash);
      if (items.length > 0 && items.length >= capacityForItem(store, items[0])) {
        const moveAsideCandidates = items.filter((i) => !i.equipped && !i.notransfer);
        const prioritizedMoveAsideCandidates = sortMoveAsideCandidatesForStore(
          moveAsideCandidates,
          store,
          getVault(stores)!,
          itemInfos,
          itemHashTags
        );
        // We'll move the first one to the vault
        const itemToMove = prioritizedMoveAsideCandidates[0];
        if (itemToMove) {
          itemsToMove.push(itemToMove);
        }
      }
    });

    if (itemsToMove.length === 0) {
      return;
    }

    return dispatch(moveItemsToVault(store, itemsToMove, makeRoomBuckets));
  };
}

function moveItemsToVault(
  store: DimStore,
  items: DimItem[],
  makeRoomBuckets: InventoryBucket[]
): ThunkResult {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  makeRoomBuckets.forEach((bucket) => {
    reservations[store.id][bucket.type!] = 1;
  });

  return clearItemsOffCharacter(store, items, reservations);
}
