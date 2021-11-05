import { interruptFarming, resumeFarming } from 'app/farming/basic-actions';
import { t } from 'app/i18next-t';
import { updateCharacters } from 'app/inventory/d2-stores';
import {
  equipItems,
  executeMoveItem,
  getSimilarItem,
  MoveReservations,
} from 'app/inventory/item-move-service';
import { DimItem } from 'app/inventory/item-types';
import { updateManualMoveTimestamp } from 'app/inventory/manual-moves';
import { loadoutNotification } from 'app/inventory/MoveNotifications';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import {
  amountOfItem,
  findItemsByBucket,
  getItemAcrossStores,
  getStore,
  getVault,
  spaceLeftForItem,
} from 'app/inventory/stores-helpers';
import { showNotification } from 'app/notifications/notifications';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { CanceledError, CancelToken, withCancel } from 'app/utils/cancel';
import { DimError } from 'app/utils/dim-error';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog } from 'app/utils/log';
import _ from 'lodash';
import { savePreviousLoadout } from './actions';
import { Loadout, LoadoutItem } from './loadout-types';
import { loadoutFromAllItems } from './loadout-utils';

const outOfSpaceWarning = _.throttle((store) => {
  showNotification({
    type: 'info',
    title: t('FarmingMode.OutOfRoomTitle'),
    body: t('FarmingMode.OutOfRoom', { character: store.name }),
  });
}, 60000);

interface Scope {
  failed: number;
  total: number;
  successfulItems: DimItem[];
  errors: {
    item: DimItem | null;
    message: string;
    level: string;
  }[];
}

/**
 * Apply a loadout - a collection of items to be moved and possibly equipped all at once.
 * @param allowUndo whether to include this loadout in the "undo loadout" menu stack.
 * @return a promise for the completion of the whole loadout operation.
 */
export function applyLoadout(store: DimStore, loadout: Loadout, allowUndo = false): ThunkResult {
  return async (dispatch, getState) => {
    if (!store) {
      throw new Error('You need a store!');
    }

    if ($featureFlags.debugMoves) {
      infoLog('loadout', 'Apply loadout', loadout.name, 'to', store.name);
    }

    const stores = storesSelector(getState());

    // Trim down the list of items to only those that could be equipped by the store we're sending to.
    // Shallow copy all items so we can mutate equipped
    const applicableLoadoutItems: LoadoutItem[] = loadout.items.filter((loadoutItem) => {
      const item = getLoadoutItem(loadoutItem, store, stores);
      // Don't filter if they're going to the vault
      return item && (store.isVault || !item.equipment || itemCanBeEquippedBy(item, store));
    });

    const [cancelToken, cancel] = withCancel();

    const loadoutPromise = queueAction(() =>
      dispatch(doApplyLoadout(store, loadout, applicableLoadoutItems, cancelToken, allowUndo))
    );
    loadingTracker.addPromise(loadoutPromise);

    // Start a notification that will show as long as the loadout is equipping
    // TODO: show the items in the notification and tick them down! Will require piping through some sort of event source?
    showNotification(
      loadoutNotification(
        loadout,
        applicableLoadoutItems.length,
        store,
        // TODO: allow for an error view function to be passed in
        loadoutPromise.then((scope) => {
          if (scope.failed > 0) {
            if (scope.failed === scope.total) {
              throw new DimError('Loadouts.AppliedError');
            } else {
              throw new DimError(
                'Loadouts.AppliedWarn',
                t('Loadouts.AppliedWarn', { failed: scope.failed, total: scope.total })
              );
            }
          }
        }),
        cancel
      )
    );

    await loadoutPromise;
  };
}

function doApplyLoadout(
  store: DimStore,
  loadout: Loadout,
  applicableLoadoutItems: LoadoutItem[],
  cancelToken: CancelToken,
  allowUndo = false
): ThunkResult<Scope> {
  return async (dispatch, getState) => {
    dispatch(interruptFarming());
    const getStores = () => storesSelector(getState());
    if (allowUndo && !store.isVault) {
      dispatch(
        savePreviousLoadout({
          storeId: store.id,
          loadoutId: loadout.id,
          previousLoadout: loadoutFromAllItems(store, t('Loadouts.Before', { name: loadout.name })),
        })
      );
    }

    // These will be passed to the move item excludes list to prevent them from
    // being moved when moving other items.
    const excludes = applicableLoadoutItems.map((i) => ({
      id: i.id,
      hash: i.hash,
    }));

    // Shallow copy all items so we can mutate equipped, and filter out items
    // that don't need to move
    const loadoutItemsToMove: LoadoutItem[] = Array.from(applicableLoadoutItems, (i) => ({
      ...i,
    })).filter((loadoutItem) => {
      const item = getLoadoutItem(loadoutItem, store, getStores());
      const notAlreadyThere =
        item &&
        (item.owner !== store.id ||
          item.location.inPostmaster ||
          // Needs to be equipped. Stuff not marked "equip" doesn't
          // necessarily mean to de-equip it.
          (loadoutItem.equipped && !item.equipped) ||
          // We always try to move consumable stacks because their logic is complicated
          (loadoutItem.amount && loadoutItem.amount > 1));
      return notAlreadyThere;
    });

    // vault can't equip
    if (store.isVault) {
      loadoutItemsToMove.forEach((i) => {
        i.equipped = false;
      });
    }

    // We'll equip these all in one go!
    let itemsToEquip = loadoutItemsToMove.filter((i) => i.equipped);
    if (itemsToEquip.length > 1) {
      // we'll use the equipItems function
      itemsToEquip.forEach((i) => {
        i.equipped = false;
      });
    }

    // Stuff that's equipped on another character. We can bulk-dequip these
    const itemsToDequip = loadoutItemsToMove.filter((pseudoItem) => {
      const item = getItemAcrossStores(getStores(), pseudoItem);
      return item?.equipped && item.owner !== store.id;
    });

    const scope: Scope = {
      failed: 0,
      total: applicableLoadoutItems.length,
      successfulItems: [] as DimItem[],
      errors: [] as {
        item: DimItem | null;
        message: string;
        level: string;
      }[],
    };

    if (itemsToDequip.length > 1) {
      const stores = getStores();
      const realItemsToDequip = _.compact(itemsToDequip.map((i) => getItemAcrossStores(stores, i)));
      const dequips = _.map(
        _.groupBy(realItemsToDequip, (i) => i.owner),
        (dequipItems, owner) => {
          const itemsToEquip = _.compact(
            dequipItems.map((i) => getSimilarItem(getStores(), i, excludes))
          );
          return dispatch(equipItems(getStore(getStores(), owner)!, itemsToEquip));
        }
      );
      await Promise.all(dequips);
    }

    await dispatch(applyLoadoutItems(store, loadoutItemsToMove, excludes, cancelToken, scope));

    let equippedItems: LoadoutItem[];
    if (itemsToEquip.length > 1) {
      // Use the bulk equipAll API to equip all at once.
      itemsToEquip = itemsToEquip.filter((i) => scope.successfulItems.find((si) => si.id === i.id));
      const realItemsToEquip = _.compact(
        itemsToEquip.map((i) => getLoadoutItem(i, store, getStores()))
      );
      equippedItems = await dispatch(equipItems(store, realItemsToEquip));
    } else {
      equippedItems = itemsToEquip;
    }

    if (equippedItems.length < itemsToEquip.length) {
      const failedItems = _.compact(
        itemsToEquip
          .filter((i) => !equippedItems.find((it) => it.id === i.id))
          .map((i) => getLoadoutItem(i, store, getStores()))
      );
      failedItems.forEach((item) => {
        scope.failed++;
        scope.errors.push({
          level: 'error',
          item,
          message: t('Loadouts.CouldNotEquip', { itemname: item.name }),
        });
      });
    }

    // We need to do this until https://github.com/DestinyItemManager/DIM/issues/323
    // is fixed on Bungie's end. When that happens, just remove this call.
    if (scope.successfulItems.length > 0) {
      dispatch(updateCharacters());
    }

    // If this is marked to clear space (and we're not applying it to the vault), move items not
    // in the loadout off the character
    if (loadout.clearSpace && !store.isVault) {
      await dispatch(
        clearSpaceAfterLoadout(
          getStore(getStores(), store.id)!,
          applicableLoadoutItems.map((i) => getLoadoutItem(i, store, getStores())!),
          cancelToken
        )
      );
    }

    dispatch(resumeFarming());
    return scope;
  };
}

// Move one loadout item at a time. Called recursively to move items!
function applyLoadoutItems(
  store: DimStore,
  items: LoadoutItem[],
  excludes: { id: string; hash: number }[],
  cancelToken: CancelToken,
  scope: {
    failed: number;
    total: number;
    successfulItems: DimItem[];
    errors: {
      item: DimItem | null;
      message: string;
      level: string;
    }[];
  }
): ThunkResult {
  return async (dispatch, getState) => {
    if (items.length === 0) {
      // We're done!
      return;
    }

    const getStores = () => storesSelector(getState());

    const pseudoItem = items.shift()!;
    const item = getLoadoutItem(pseudoItem, store, getStores());

    try {
      if (item) {
        // We mark this *first*, because otherwise things observing state (like farming) may not see this
        // in time.
        updateManualMoveTimestamp(item);

        if (item.maxStackSize > 1) {
          // handle consumables!
          const amountAlreadyHave = amountOfItem(store, pseudoItem);
          let amountNeeded = pseudoItem.amount - amountAlreadyHave;
          if (amountNeeded > 0) {
            const otherStores = getStores().filter((otherStore) => store.id !== otherStore.id);
            const storesByAmount = _.sortBy(
              otherStores.map((store) => ({
                store,
                amount: amountOfItem(store, pseudoItem),
              })),
              (v) => v.amount
            ).reverse();

            let totalAmount = amountAlreadyHave;
            while (amountNeeded > 0) {
              const source = _.maxBy(storesByAmount, (s) => s.amount)!;
              const amountToMove = Math.min(source.amount, amountNeeded);
              const sourceItem = source.store.items.find((i) => i.hash === pseudoItem.hash);

              if (amountToMove === 0 || !sourceItem) {
                const error: Error & { level?: string } = new Error(
                  t('Loadouts.TooManyRequested', {
                    total: totalAmount,
                    itemname: item.name,
                    requested: pseudoItem.amount,
                  })
                );
                error.level = 'warn';
                throw error;
              }

              source.amount -= amountToMove;
              amountNeeded -= amountToMove;
              totalAmount += amountToMove;

              await dispatch(
                executeMoveItem(sourceItem, store, {
                  equip: false,
                  amount: amountToMove,
                  excludes,
                  cancelToken,
                })
              );
            }
          }
        } else {
          // Pass in the list of items that shouldn't be moved away
          await dispatch(
            executeMoveItem(item, store, {
              equip: pseudoItem.equipped,
              amount: item.amount,
              excludes,
              cancelToken,
            })
          );
        }

        scope.successfulItems.push(item);
      }
    } catch (e) {
      if (e instanceof CanceledError) {
        throw e;
      }
      const level = e.level || 'error';
      if (level === 'error') {
        errorLog('loadout', 'Failed to apply loadout item', item?.name, e);
        scope.failed++;
      }
      scope.errors.push({
        item,
        level: e.level,
        message: e.message,
      });
    }

    // Keep going
    return dispatch(applyLoadoutItems(store, items, excludes, cancelToken, scope));
  };
}

// A special getItem that takes into account the fact that
// subclasses have unique IDs, and emblems/shaders/etc are interchangeable.
function getLoadoutItem(
  pseudoItem: LoadoutItem,
  store: DimStore,
  stores: DimStore[]
): DimItem | null {
  let item = getItemAcrossStores(stores, _.omit(pseudoItem, 'amount'));
  if (!item) {
    return null;
  }
  if (['Class', 'Shader', 'Emblem', 'Emote', 'Ship', 'Horn'].includes(item.type)) {
    // Same character first
    item =
      store.items.find((i) => i.hash === pseudoItem.hash) ||
      // Then other characters
      getItemAcrossStores(stores, { hash: item.hash }) ||
      item;
  }
  return item;
}

function clearSpaceAfterLoadout(store: DimStore, items: DimItem[], cancelToken: CancelToken) {
  const itemsByType = _.groupBy(items, (i) => i.bucket.hash);

  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};

  const itemsToRemove: DimItem[] = [];

  _.forIn(itemsByType, (loadoutItems, bucketId) => {
    // Exclude a handful of buckets from being cleared out
    if (['Consumable', 'Consumables', 'Material'].includes(loadoutItems[0].bucket.type!)) {
      return;
    }
    let numUnequippedLoadoutItems = 0;
    const bucketHash = parseInt(bucketId, 10);
    for (const existingItem of findItemsByBucket(store, bucketHash)) {
      if (existingItem.equipped) {
        // ignore equipped items
        continue;
      }

      if (
        existingItem.notransfer ||
        loadoutItems.some(
          (i) =>
            i.id === existingItem.id &&
            i.hash === existingItem.hash &&
            i.amount <= existingItem.amount
        )
      ) {
        // This was one of our loadout items (or it can't be moved)
        numUnequippedLoadoutItems++;
      } else {
        // Otherwise ee should move it to the vault
        itemsToRemove.push(existingItem);
      }
    }

    // Reserve enough space to only leave the loadout items
    reservations[store.id][loadoutItems[0].bucket.type!] =
      loadoutItems[0].bucket.capacity - numUnequippedLoadoutItems;
  });

  return clearItemsOffCharacter(store, itemsToRemove, cancelToken, reservations);
}

/**
 * Move a list of items off of a character to the vault (or to other characters if the vault is full).
 *
 * Shows a warning if there isn't any space.
 */
export function clearItemsOffCharacter(
  store: DimStore,
  items: DimItem[],
  cancelToken: CancelToken,
  reservations: MoveReservations
): ThunkResult {
  return async (dispatch, getState) => {
    const getStores = () => storesSelector(getState());
    for (const item of items) {
      try {
        const stores = getStores();
        // Move a single item. We reevaluate each time in case something changed.
        const vault = getVault(stores)!;
        const vaultSpaceLeft = spaceLeftForItem(vault, item, stores);
        if (vaultSpaceLeft <= 1) {
          // If we're down to one space, try putting it on other characters
          const otherStores = stores.filter((s) => !s.isVault && s.id !== store.id);
          const otherStoresWithSpace = otherStores.filter((store) =>
            spaceLeftForItem(store, item, stores)
          );

          if (otherStoresWithSpace.length) {
            if ($featureFlags.debugMoves) {
              infoLog(
                'loadout',
                'clearItemsOffCharacter initiated move:',
                item.amount,
                item.name,
                item.type,
                'to',
                otherStoresWithSpace[0].name,
                'from',
                getStore(stores, item.owner)!.name
              );
            }
            await dispatch(
              executeMoveItem(item, otherStoresWithSpace[0], {
                equip: false,
                amount: item.amount,
                excludes: items,
                reservations,
                cancelToken,
              })
            );
            continue;
          } else if (vaultSpaceLeft === 0) {
            outOfSpaceWarning(store);
            continue;
          }
        }
        if ($featureFlags.debugMoves) {
          infoLog(
            'loadout',
            'clearItemsOffCharacter initiated move:',
            item.amount,
            item.name,
            item.type,
            'to',
            vault.name,
            'from',
            getStore(stores, item.owner)!.name
          );
        }
        await dispatch(
          executeMoveItem(item, vault, {
            equip: false,
            amount: item.amount,
            excludes: items,
            reservations,
            cancelToken,
          })
        );
      } catch (e) {
        if (e instanceof CanceledError) {
          throw e;
        }
        if (e instanceof DimError && e.code === 'no-space') {
          outOfSpaceWarning(store);
        } else {
          showNotification({ type: 'error', title: item.name, body: e.message });
        }
      }
    }
  };
}
