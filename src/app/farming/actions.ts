import { settingSelector, settingsSelector } from 'app/dim-api/selectors';
import { bucketsSelector, getTagSelector, storesSelector } from 'app/inventory/selectors';
import {
  capacityForItem,
  findItemsByBucket,
  getVault,
  isD1Store,
} from 'app/inventory/stores-helpers';
import { isInInGameLoadoutForSelector } from 'app/loadout/selectors';
import { D1BucketHashes, supplies } from 'app/search/d1-known-values';
import { refresh } from 'app/shell/refresh-events';
import { observe, unobserve } from 'app/store/observerMiddleware';
import { ThunkResult } from 'app/store/types';
import { CancelToken, withCancel } from 'app/utils/cancel';
import { infoLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import { BucketCategory } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { InventoryBucket } from '../inventory/inventory-buckets';
import {
  MoveReservations,
  createMoveSession,
  sortMoveAsideCandidatesForStore,
} from '../inventory/item-move-service';
import { DimItem } from '../inventory/item-types';
import { D1Store, DimStore } from '../inventory/store-types';
import { clearItemsOffCharacter } from '../loadout-drawer/loadout-apply';
import * as actions from './basic-actions';
import { farmingInterruptedSelector, farmingStoreSelector } from './selectors';

const FARMING_OBSERVER_ID = 'farming-observer';

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
  D1BucketHashes.Artifact,
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
    const farmingStore = farmingStoreSelector(getState());

    if (!farmingStore || farmingStore.id !== storeId) {
      return;
    }

    infoLog('farming', 'Started farming', farmingStore.name);

    // Use a deduped promise for actually performing the farming operations. Since the store
    // observer will fire every time an item is moved, we'd schedule duplicate moves if we didn't
    // do this deduping.
    const doFarm = dedupePromise(async (farmingStore: DimStore, cancelToken: CancelToken) => {
      if (farmingInterruptedSelector(getState())) {
        infoLog('farming', 'Farming interrupted, will resume when tasks are complete');
      } else if (isD1Store(farmingStore)) {
        return dispatch(farmD1(farmingStore, cancelToken));
      } else {
        // In D2 we just make room
        return dispatch(makeRoomForItems(farmingStore, cancelToken));
      }
    });

    dispatch(
      observe({
        id: FARMING_OBSERVER_ID,
        runInitially: true,
        getObserved: (rootState) => farmingStoreSelector(rootState),
        sideEffect: ({ current: farmingStore }) => {
          const [cancelToken, cancel] = withCancel();

          if (!farmingStore || farmingStore.id !== storeId) {
            dispatch(unobserve(FARMING_OBSERVER_ID));
            cancel();
            return;
          }
          doFarm(farmingStore, cancelToken);
        },
      }),
    );

    window.clearInterval(intervalId);
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
      (b) => b.category === BucketCategory.Equippable && b.vaultBucket,
    );
    return dispatch(makeRoomForItemsInBuckets(store, makeRoomBuckets, cancelToken));
  };
}

// D1 Stuff

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
      !i.equipped &&
      !i.notransfer &&
      (i.isEngram ||
        (i.equipment && i.bucket.hash !== BucketHashes.Emblems && i.rarity === 'Uncommon') ||
        supplies.includes(i.hash)),
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
    return dispatch(makeRoomForItemsInBuckets(store, makeRoomBuckets, cancelToken));
  };
}

// Ensure that there's {{inventoryClearSpaces}} number of open space(s) in each category that could
// hold an item, so they don't go to the postmaster.
function makeRoomForItemsInBuckets(
  store: DimStore,
  makeRoomBuckets: InventoryBucket[],
  cancelToken: CancelToken,
): ThunkResult {
  return async (dispatch, getState) => {
    const stores = storesSelector(getState());
    // If any category is full, we'll move one aside
    const itemsToMove: DimItem[] = [];
    const getTag = getTagSelector(getState());
    const isInInGameLoadoutFor = isInInGameLoadoutForSelector(getState());
    const inventoryClearSpaces = settingSelector('inventoryClearSpaces')(getState());
    for (const bucket of makeRoomBuckets) {
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
            getTag,
            isInInGameLoadoutFor,
          );
          // We'll move the first one to the vault
          const itemToMove = prioritizedMoveAsideCandidates[0];
          if (itemToMove) {
            itemsToMove.push(itemToMove);
          }
        }
      }
    }

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
  cancelToken: CancelToken,
): ThunkResult {
  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};
  for (const bucket of makeRoomBuckets) {
    reservations[store.id][bucket.hash] = 1;
  }

  return clearItemsOffCharacter(store, items, createMoveSession(cancelToken, items), reservations);
}
