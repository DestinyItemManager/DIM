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
import { supplies } from 'app/search/d1-known-values';
import { refresh } from 'app/shell/refresh-events';
import { ThunkResult } from 'app/store/types';
import { CancelToken, withCancel } from 'app/utils/cancel';
import { infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { InventoryBucket } from '../inventory/inventory-buckets';
import { MoveReservations, sortMoveAsideCandidatesForStore } from '../inventory/item-move-service';
import { DimItem } from '../inventory/item-types';
import { D1Store, DimStore } from '../inventory/store-types';
import { clearItemsOffCharacter } from '../loadout-drawer/loadout-apply';
import * as actions from './basic-actions';
import { farmingInterruptedSelector, farmingStoreSelector } from './selectors';

// These are things you may pick up frequently out in the wild
const makeRoomTypes = [
  BucketHashes.KineticWeapons, // Primary
  BucketHashes.EnergyWeapons, // Special
  BucketHashes.PowerWeapons, // Heavy
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
  434908299, // Artifact
  BucketHashes.Ghost,
  BucketHashes.Consumables,
  BucketHashes.Materials,
];

const FARMING_REFRESH_RATE = 30_000; // Bungie.net caches results for 30 seconds - this may be too fast

let intervalId = 0;

/**
 * Start the farming process for a given store. This causes stores to auto refresh
 * and makes space(s) for new drops. In D1 it can also move some other items around.
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

    unsubscribe = observeStore(storeSelector, (_prev, farmingStore) => {
      const [cancelToken, cancel] = withCancel();

      if (!farmingStore || farmingStore.id !== storeId) {
        unsubscribe();
        cancel();
        return;
      }

      if (farmingInterruptedSelector(getState())) {
        infoLog('farming', 'Farming interrupted, will resume when tasks are complete');
      } else {
        if (isD1Store(farmingStore)) {
          dispatch(farmD1(farmingStore, cancelToken));
        } else {
          // In D2 we just make room
          dispatch(makeRoomForItems(farmingStore, cancelToken));
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

// Ensure that there's {{inventoryClearSpaces}} number open space(s) in each category that could
// hold an item, so they don't go to the postmaster.
function makeRoomForItems(store: DimStore, cancelToken: CancelToken): ThunkResult {
  return (dispatch, getState) => {
    const buckets = bucketsSelector(getState())!;
    const makeRoomBuckets = Object.values(buckets.byHash).filter(
      (b) => b.category === BucketCategory.Equippable && b.type
    );
    return dispatch(
      makeRoomForItemsInBuckets(storesSelector(getState()), store, makeRoomBuckets, cancelToken)
    );
  };
}

/// D1 Stuff ///

function farmD1(store: D1Store, cancelToken: CancelToken): ThunkResult {
  return async (dispatch, getState) => {
    await dispatch(farmItems(store, cancelToken));
    if (settingsSelector(getState()).farmingMakeRoomForItems) {
      await dispatch(makeRoomForD1Items(store, cancelToken));
    }
  };
}

function farmItems(store: D1Store, cancelToken: CancelToken): ThunkResult {
  const toMove = store.items.filter(
    (i) =>
      !i.notransfer &&
      (i.isEngram || (i.equipment && i.tier === 'Uncommon') || supplies.includes(i.hash))
  );

  if (toMove.length === 0) {
    return () => Promise.resolve();
  }

  return moveItemsToVault(store, toMove, [], cancelToken);
}

// Ensure that there's {{inventoryClearSpaces}} number open space(s) in each category that could
// hold an item, so they don't go to the postmaster.
function makeRoomForD1Items(store: D1Store, cancelToken: CancelToken): ThunkResult {
  return async (dispatch, getState) => {
    const buckets = bucketsSelector(getState())!;
    const makeRoomBuckets = makeRoomTypes.map((type) => buckets.byHash[type]);
    return dispatch(
      makeRoomForItemsInBuckets(storesSelector(getState()), store, makeRoomBuckets, cancelToken)
    );
  };
}

// Ensure that there's {{inventoryClearSpaces}} number of open space(s) in each category that could
// hold an item, so they don't go to the postmaster.
export function makeRoomForItemsInBuckets(
  stores: DimStore[],
  store: DimStore,
  makeRoomBuckets: InventoryBucket[],
  cancelToken: CancelToken
): ThunkResult {
  return async (dispatch, getState) => {
    // If any category is full, we'll move one aside
    const itemsToMove: DimItem[] = [];
    const itemInfos = itemInfosSelector(getState());
    const itemHashTags = itemHashTagsSelector(getState());
    const inventoryClearSpaces = settingsSelector(getState()).inventoryClearSpaces;
    makeRoomBuckets.forEach((bucket) => {
      const items = findItemsByBucket(store, bucket.hash);
      if (items.length > 0) {
        const capacityIncludingClearSpacesSetting =
          capacityForItem(store, items[0]) - inventoryClearSpaces + 1;
        if (items.length >= capacityIncludingClearSpacesSetting) {
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
      }
    });

    if (itemsToMove.length === 0) {
      return;
    }

    return dispatch(moveItemsToVault(store, itemsToMove, makeRoomBuckets, cancelToken));
  };
}

function moveItemsToVault(
  store: DimStore,
  items: DimItem[],
  makeRoomBuckets: InventoryBucket[],
  cancelToken: CancelToken
): ThunkResult {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  makeRoomBuckets.forEach((bucket) => {
    reservations[store.id][bucket.type!] = 1;
  });

  return clearItemsOffCharacter(store, items, cancelToken, reservations);
}
