import { DimError } from 'app/bungie-api/bungie-service-helper';
import { t } from 'app/i18next-t';
import { showItemPicker } from 'app/item-picker/item-picker';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ThunkResult } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/common';
import _ from 'lodash';
import { Subject } from 'rxjs';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { queueAction } from '../utils/action-queue';
import { reportException } from '../utils/exceptions';
import { updateCharacters } from './d2-stores';
import { InventoryBucket } from './inventory-buckets';
import { moveItemTo as moveTo } from './item-move-service';
import { DimItem } from './item-types';
import { updateManualMoveTimestamp } from './manual-moves';
import { moveItemNotification } from './MoveNotifications';
import { storesSelector } from './selectors';
import { DimStore } from './store-types';
import { amountOfItem, getCurrentStore, getStore, getVault } from './stores-helpers';

export interface MoveAmountPopupOptions {
  item: DimItem;
  targetStore: DimStore;
  amount: number;
  maximum: number;
  onAmountSelected(amount: number);
  onCancel(): void;
}

export const showMoveAmountPopup$ = new Subject<MoveAmountPopupOptions>();

function showMoveAmountPopup(
  item: DimItem,
  targetStore: DimStore,
  maximum: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    showMoveAmountPopup$.next({
      item,
      targetStore,
      amount: item.amount,
      maximum,
      onAmountSelected: resolve,
      onCancel: reject,
    });
  });
}

/**
 * Move the item to the currently active store. Used for double-click action.
 */
export function moveItemToCurrentStore(item: DimItem): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const active = getCurrentStore(storesSelector(getState()))!;

    // Equip if it's not equipped or it's on another character
    const equip = !item.equipped || item.owner !== active.id;

    return dispatch(moveItemTo(item, active, itemCanBeEquippedBy(item, active) ? equip : false));
  };
}

/**
 * Show an item picker dialog, and then pull the selected item to the current store.
 */
export function pullItem(storeId: string, bucket: InventoryBucket): ThunkResult {
  return async (dispatch, getState) => {
    const store = getStore(storesSelector(getState()), storeId)!;
    try {
      const { item } = await showItemPicker({
        filterItems: (item) => item.bucket.hash === bucket.hash && itemCanBeEquippedBy(item, store),
        prompt: t('MovePopup.PullItem', {
          bucket: bucket.name,
          store: store.name,
        }),
      });

      await dispatch(moveItemTo(item, store));
    } catch (e) {}
  };
}

/**
 * Drop a dragged item
 */
export function dropItem(
  item: DimItem,
  storeId: string,
  equip = false,
  chooseAmount = false
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    const store = getStore(storesSelector(getState()), storeId)!;
    return dispatch(moveItemTo(item, store, equip, item.amount, chooseAmount));
  };
}

/**
 * Move the item to the specified store. Equip it if equip is true.
 */
export function moveItemTo(
  item: DimItem,
  store: DimStore,
  equip = false,
  amount: number = item.amount,
  chooseAmount = false
): ThunkResult<DimItem> {
  return async (dispatch, getState) => {
    hideItemPopup();
    if (
      item.location.inPostmaster
        ? !item.canPullFromPostmaster
        : item.notransfer && item.owner !== store.id
    ) {
      throw new Error(t('Help.CannotMove'));
    }

    if (item.owner === store.id && !item.location.inPostmaster) {
      if ((item.equipped && equip) || (!item.equipped && !equip)) {
        return item;
      }
    }

    let moveAmount = amount || 1;
    const reload = item.equipped || equip;
    try {
      const stores = storesSelector(getState());

      // Select how much of a stack to move
      if (
        $featureFlags.moveAmounts &&
        chooseAmount &&
        item.maxStackSize > 1 &&
        item.amount > 1 &&
        // https://github.com/DestinyItemManager/DIM/issues/3373
        !item.uniqueStack
      ) {
        const maximum = amountOfItem(getStore(stores, item.owner)!, item);

        try {
          moveAmount = await showMoveAmountPopup(item, store, maximum);
        } catch (e) {
          const error: DimError = new Error('move-canceled');
          error.code = 'move-canceled';
          throw error;
        }
      }

      if ($featureFlags.debugMoves) {
        infoLog(
          'move',
          'User initiated move:',
          moveAmount,
          item.name,
          item.type,
          'to',
          store.name,
          'from',
          getStore(stores, item.owner)!.name
        );
      }

      const movePromise = queueAction(() =>
        loadingTracker.addPromise(dispatch(moveTo(item, store, equip, moveAmount)))
      );
      showNotification(moveItemNotification(item, store, movePromise));

      item = await movePromise;

      if (reload) {
        // TODO: only reload the character that changed?
        // Refresh light levels and such
        dispatch(updateCharacters());
      }

      updateManualMoveTimestamp(item);
    } catch (e) {
      errorLog('move', 'error moving item', item.name, 'to', store.name, e);
      // Some errors aren't worth reporting
      if (
        e.code !== 'wrong-level' &&
        e.code !== 'no-space' &&
        e.code !== PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation
      ) {
        reportException('moveItem', e);
      }
    }

    return item;
  };
}

/**
 * Consolidate all copies of a stackable item into a single stack in store.
 */
export function consolidate(actionableItem: DimItem, store: DimStore): ThunkResult {
  return (dispatch, getState) =>
    queueAction(() =>
      loadingTracker.addPromise(
        (async () => {
          const stores = storesSelector(getState());
          const characters = stores.filter((s) => !s.isVault);
          const vault = getVault(stores)!;

          try {
            for (const s of characters) {
              // First move everything into the vault
              const item = s.items.find(
                (i) =>
                  store.id !== i.owner && i.hash === actionableItem.hash && !i.location.inPostmaster
              );
              if (item) {
                const amount = amountOfItem(s, actionableItem);
                await dispatch(moveTo(item, vault, false, amount));
              }
            }

            // Then move from the vault to the character
            if (!store.isVault) {
              const vault = getVault(storesSelector(getState()))!;
              const item = vault.items.find(
                (i) => i.hash === actionableItem.hash && !i.location.inPostmaster
              );
              if (item) {
                const amount = amountOfItem(vault, actionableItem);
                await dispatch(moveTo(item, store, false, amount));
              }
            }
            const data = { name: actionableItem.name, store: store.name };
            const message = store.isVault
              ? t('ItemMove.ToVault', data)
              : t('ItemMove.ToStore', data);
            showNotification({
              type: 'success',
              title: t('ItemMove.Consolidate', data),
              body: message,
            });
          } catch (a) {
            showNotification({ type: 'error', title: actionableItem.name, body: a.message });
            errorLog('move', 'error consolidating', actionableItem, a);
          }
        })()
      )
    );
}

interface Move {
  source: DimStore;
  target: DimStore;
  amount: number;
}

/**
 * Distribute a stackable item evently across characters.
 */
export function distribute(actionableItem: DimItem): ThunkResult {
  return (dispatch, getState) =>
    queueAction(() =>
      loadingTracker.addPromise(
        (async () => {
          // Sort vault to the end
          const stores = _.sortBy(storesSelector(getState()), (s) => (s.id === 'vault' ? 2 : 1));

          let total = 0;
          const amounts = stores.map((store) => {
            const amount = amountOfItem(store, actionableItem);
            total += amount;
            return amount;
          });

          const numTargets = stores.length - 1; // exclude the vault
          let remainder = total % numTargets;
          const targets = stores.map((_store, index) => {
            if (index >= numTargets) {
              return 0; // don't want any in the vault
            }
            const result =
              remainder > 0 ? Math.ceil(total / numTargets) : Math.floor(total / numTargets);
            remainder--;
            return result;
          });
          const deltas = _.zip(amounts, targets).map(([amount, target]) => target! - amount!);

          const vaultMoves: Move[] = [];
          const targetMoves: Move[] = [];
          const vaultIndex = stores.length - 1;
          const vault = stores[vaultIndex];

          deltas.forEach((delta, index) => {
            if (delta < 0 && index !== vaultIndex) {
              vaultMoves.push({
                source: stores[index],
                target: vault,
                amount: -delta,
              });
            } else if (delta > 0) {
              targetMoves.push({
                source: vault,
                target: stores[index],
                amount: delta,
              });
            }
          });

          // All moves to vault in parallel, then all moves to targets in parallel
          async function applyMoves(moves: Move[]) {
            for (const move of moves) {
              const item = move.source.items.find((i) => i.hash === actionableItem.hash)!;
              await dispatch(moveTo(item, move.target, false, move.amount));
            }
          }

          try {
            await applyMoves(vaultMoves);
            await applyMoves(targetMoves);
            showNotification({
              type: 'success',
              title: t('ItemMove.Distributed', { name: actionableItem.name }),
            });
          } catch (a) {
            showNotification({ type: 'error', title: actionableItem.name, body: a.message });
            errorLog('move', 'error distributing', actionableItem, a);
          }
        })()
      )
    );
}
