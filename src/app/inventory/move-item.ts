import { startSpan } from '@sentry/browser';
import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { ShowItemPickerFn } from 'app/item-picker/item-picker';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ThunkResult } from 'app/store/types';
import { CanceledError, neverCanceled, withCancel } from 'app/utils/cancel';
import { DimError } from 'app/utils/dim-error';
import { errorMessage } from 'app/utils/errors';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog } from 'app/utils/log';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import _, { noop } from 'lodash';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { queueAction } from '../utils/action-queue';
import { reportException } from '../utils/sentry';
import { moveItemNotification } from './MoveNotifications';
import { updateCharacters } from './d2-stores';
import { InventoryBucket } from './inventory-buckets';
import { createMoveSession, executeMoveItem } from './item-move-service';
import { DimItem } from './item-types';
import { updateManualMoveTimestamp } from './manual-moves';
import { currentStoreSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import { amountOfItem, getCurrentStore, getStore, getVault } from './stores-helpers';

const TAG = 'move';

/**
 * Move the item to the currently active store. Used for double-click action.
 */
export function moveItemToCurrentStore(item: DimItem, e?: React.MouseEvent): ThunkResult {
  return async (dispatch, getState) => {
    e?.stopPropagation();

    const active = getCurrentStore(storesSelector(getState()))!;

    // Equip if it's not equipped or it's on another character
    const equip = !item.equipped || item.owner !== active.id;

    return dispatch(moveItemTo(item, active, itemCanBeEquippedBy(item, active) ? equip : false));
  };
}

/**
 * Show an item picker dialog, and then pull the selected item to the current store.
 */
export function pullItem(
  storeId: string,
  bucket: InventoryBucket,
  showItemPicker: ShowItemPickerFn,
): ThunkResult {
  return async (dispatch, getState) => {
    const store = getStore(storesSelector(getState()), storeId)!;

    const item = await showItemPicker({
      filterItems: (item) => item.bucket.hash === bucket.hash && itemCanBeEquippedBy(item, store),
      prompt: t('MovePopup.PullItem', {
        bucket: bucket.name,
        store: store.name,
      }),
    });

    if (item) {
      await dispatch(moveItemTo(item, store));
    }
  };
}

/**
 * Drop a dragged item.
 */
export function dropItem(item: DimItem, storeId: string, equip = false): ThunkResult {
  return async (dispatch, getState) => {
    const store = getStore(storesSelector(getState()), storeId)!;
    return dispatch(moveItemTo(item, store, equip, item.amount));
  };
}

/**
 * Move the item to the specified store. Equip it if equip is true.
 * This function needs to handle displaying any errors itself - it should not reject.
 */
export function moveItemTo(
  item: DimItem,
  store: DimStore,
  equip = false,
  amount: number = item.amount,
): ThunkResult {
  return async (dispatch, getState) => {
    const currentStore = currentStoreSelector(getState())!;
    const singleCharacterSetting = settingSelector('singleCharacter')(getState());
    return startSpan({ name: 'moveItemTo' }, async () => {
      hideItemPopup();
      if (
        item.location.inPostmaster
          ? !item.canPullFromPostmaster
          : item.notransfer && item.owner !== store.id
      ) {
        // Show an error immediately
        showNotification(
          moveItemNotification(item, store, Promise.reject(new DimError('Help.CannotMove')), noop),
        );
        return;
      }

      if (item.owner === store.id && !item.location.inPostmaster && item.equipped === equip) {
        // Nothing to do!
        return;
      }

      // In single character mode dropping something from the "vault" back on the "vault" shouldn't move anything
      if (singleCharacterSetting && store.isVault && item.owner !== currentStore.id) {
        return;
      }

      const moveAmount = amount || 1;
      const reload = item.equipped || equip;
      try {
        const stores = storesSelector(getState());

        if ($featureFlags.debugMoves) {
          infoLog(
            TAG,
            'User initiated move:',
            moveAmount,
            item.name,
            item.type,
            'to',
            store.name,
            'from',
            getStore(stores, item.owner)!.name,
          );
        }

        // We mark this *first*, because otherwise things observing state (like farming) may not see this
        // in time.
        updateManualMoveTimestamp(item);

        const [cancelToken, cancel] = withCancel();
        const moveSession = createMoveSession(cancelToken, [item]);

        const movePromise = queueAction(() =>
          loadingTracker.addPromise(
            dispatch(executeMoveItem(item, store, { equip, amount: moveAmount }, moveSession)),
          ),
        );
        showNotification(moveItemNotification(item, store, movePromise, cancel));

        await movePromise;

        if (reload) {
          // TODO: only reload the character that changed?
          // Refresh light levels and such
          dispatch(updateCharacters());
        }
      } catch (e) {
        if (e instanceof CanceledError) {
          return;
        }

        errorLog(TAG, 'error moving item', item.name, 'to', store.name, e);
        // Some errors aren't worth reporting
        if (
          e instanceof DimError &&
          (e.code === 'wrong-level' ||
            e.code === 'no-space' ||
            e.bungieErrorCode() === PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation ||
            e.bungieErrorCode() === PlatformErrorCodes.DestinyNoRoomInDestination ||
            e.bungieErrorCode() === PlatformErrorCodes.DestinyItemNotFound)
        ) {
          // don't report
        } else {
          reportException('moveItem', e);
        }
      }
    });
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
          const moveSession = createMoveSession(neverCanceled, [actionableItem]);

          try {
            for (const s of characters) {
              // First move everything into the vault
              const item = s.items.find(
                (i) =>
                  store.id !== i.owner &&
                  i.hash === actionableItem.hash &&
                  !i.location.inPostmaster,
              );
              if (item) {
                const amount = amountOfItem(s, actionableItem);
                await dispatch(executeMoveItem(item, vault, { equip: false, amount }, moveSession));
              }
            }

            // Then move from the vault to the character
            if (!store.isVault) {
              const vault = getVault(storesSelector(getState()))!;
              const item = vault.items.find(
                (i) => i.hash === actionableItem.hash && !i.location.inPostmaster,
              );
              if (item) {
                const amount = amountOfItem(vault, actionableItem);
                await dispatch(executeMoveItem(item, store, { equip: false, amount }, moveSession));
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
          } catch (e) {
            showNotification({ type: 'error', title: actionableItem.name, body: errorMessage(e) });
            errorLog(TAG, 'error consolidating', actionableItem, e);
          }
        })(),
      ),
    );
}

interface Move {
  source: DimStore;
  target: DimStore;
  amount: number;
}

/**
 * Distribute a stackable item evenly across characters.
 */
export function distribute(actionableItem: DimItem): ThunkResult {
  return (dispatch, getState) =>
    queueAction(() =>
      loadingTracker.addPromise(
        (async () => {
          // Sort vault to the end
          const stores = _.sortBy(storesSelector(getState()), (s) => (s.id === 'vault' ? 2 : 1));
          const moveSession = createMoveSession(neverCanceled, [actionableItem]);

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

          for (const [index, delta] of deltas.entries()) {
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
          }

          // All moves to vault in parallel, then all moves to targets in parallel
          async function applyMoves(moves: Move[]) {
            for (const move of moves) {
              const item = move.source.items.find((i) => i.hash === actionableItem.hash)!;
              await dispatch(
                executeMoveItem(
                  item,
                  move.target,
                  { equip: false, amount: move.amount },
                  moveSession,
                ),
              );
            }
          }

          try {
            await applyMoves(vaultMoves);
            await applyMoves(targetMoves);
            showNotification({
              type: 'success',
              title: t('ItemMove.Distributed', { name: actionableItem.name }),
            });
          } catch (e) {
            showNotification({ type: 'error', title: actionableItem.name, body: errorMessage(e) });
            errorLog(TAG, 'error distributing', actionableItem, e);
          }
        })(),
      ),
    );
}
