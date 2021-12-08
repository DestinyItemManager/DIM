import { interruptFarming, resumeFarming } from 'app/farming/basic-actions';
import { t } from 'app/i18next-t';
import { canInsertPlug, insertPlug } from 'app/inventory/advanced-write-actions';
import { updateCharacters } from 'app/inventory/d2-stores';
import {
  equipItems,
  executeMoveItem,
  getSimilarItem,
  MoveReservations,
} from 'app/inventory/item-move-service';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { updateManualMoveTimestamp } from 'app/inventory/manual-moves';
import { loadoutNotification } from 'app/inventory/MoveNotifications';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import {
  amountOfItem,
  findItemsByBucket,
  getItemAcrossStores,
  getStore,
  getVault,
  spaceLeftForItem,
} from 'app/inventory/stores-helpers';
import { getCheapestModAssignments } from 'app/loadout/mod-utils';
import { d2ManifestSelector, destiny2CoreSettingsSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { CanceledError, CancelToken, withCancel } from 'app/utils/cancel';
import { DimError } from 'app/utils/dim-error';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog, warnLog } from 'app/utils/log';
import { getSocketByIndex } from 'app/utils/socket-utils';
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
  totalMods: number;
  successfulMods: number;
  // TODO: mod errors?
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
export function applyLoadout(
  store: DimStore,
  loadout: Loadout,
  {
    /** Add this to the stack of loadouts that you can undo */
    allowUndo = false,
    /** Only apply items matching the class of the store we're applying to */
    onlyMatchingClass = false,
  } = {}
): ThunkResult {
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
      return (
        item &&
        (!onlyMatchingClass || store.isVault || !item.equipment || itemCanBeEquippedBy(item, store))
      );
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
        loadout.parameters?.mods?.length ?? 0,
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
          if (scope.successfulMods < scope.totalMods) {
            throw new DimError(
              'Loadouts.AppliedModsWarn',
              t('Loadouts.AppliedModsWarn', {
                successful: scope.successfulMods,
                total: scope.totalMods,
              })
            );
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
    // The store and its items may change as we move things - make sure we're always looking at the latest version
    const getStores = () => storesSelector(getState());
    const getTargetStore = () => getStore(getStores(), store.id)!;
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
      return notAlreadyThere && !item.notransfer;
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
      totalMods: 0,
      successfulMods: 0,
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
            dequipItems.map((i) =>
              getSimilarItem(getStores(), i, { exclusions: excludes, excludeExotic: i.isExotic })
            )
          );
          // TODO: try/catch?
          return dispatch(equipItems(getStore(getStores(), owner)!, itemsToEquip));
        }
      );
      await Promise.all(dequips);
    }

    await dispatch(applyLoadoutItems(store.id, loadoutItemsToMove, excludes, cancelToken, scope));

    // Try/catch around equip?
    // TODO: stop if we can't perform this action (in activity)

    let equippedItems: LoadoutItem[];
    if (itemsToEquip.length > 1) {
      const store = getTargetStore();
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
      const store = getTargetStore();
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

    // Apply any mods in the loadout. These apply to the current equipped items, not just loadout items!
    if (loadout.parameters?.mods) {
      try {
        infoLog('loadout mods', 'Mods to apply', loadout.parameters?.mods);
        scope.totalMods = loadout.parameters.mods.length;
        const successfulMods = await dispatch(applyLoadoutMods(store.id, loadout.parameters?.mods));
        scope.successfulMods = successfulMods.length;
        infoLog('loadout mods', 'Mods applied', scope.successfulMods, scope.totalMods);
      } catch (e) {
        warnLog('loadout mods', 'error applying mods', e);
        // TODO: work on errors
        throw e;
      }
    }

    // If this is marked to clear space (and we're not applying it to the vault), move items not
    // in the loadout off the character
    if (loadout.clearSpace && !store.isVault) {
      await dispatch(
        clearSpaceAfterLoadout(
          getTargetStore(),
          applicableLoadoutItems.map((i) => getLoadoutItem(i, store, getStores())!),
          cancelToken
        )
      );
    }

    // Update the character stats after all the equips
    if (scope.successfulItems.length > 0) {
      dispatch(updateCharacters());
    }

    dispatch(resumeFarming());
    return scope;
  };
}

// Move one loadout item at a time. Called recursively to move items!
function applyLoadoutItems(
  storeId: string,
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

    // The store and its items may change as we move things - make sure we're always looking at the latest version
    const stores = storesSelector(getState());
    const store = getStore(stores, storeId)!;

    const pseudoItem = items.shift()!;
    const item = getLoadoutItem(pseudoItem, store, stores);

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
            const otherStores = stores.filter((otherStore) => store.id !== otherStore.id);
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

              /*const movedItem =*/ await dispatch(
                executeMoveItem(sourceItem, store, {
                  equip: false,
                  amount: amountToMove,
                  excludes,
                  cancelToken,
                })
              );

              // TODO: apply socket overrides
              /*
              if (pseudoItem.socketOverrides) {
                const defs = d2ManifestSelector(getState())!;
                await saveSocketOverrides(defs, movedItem, pseudoItem.socketOverrides);
              }
              */
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
    return dispatch(applyLoadoutItems(storeId, items, excludes, cancelToken, scope));
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

/**
 * Apply all the mods in the loadout to the equipped armor.
 *
 * This uses our mod assignment algorithm to choose which armor gets which mod. It will socket
 * mods into any equipped armor, not just armor in the loadout - this allows for loadouts that
 * are *only* mods to be applied to current armor.
 *
 * Right now this will try to apply mods if they'll fit, but if they won't it'll blindly remove
 * all mods on the piece before adding the new ones. We don't yet take into consideration which
 * mods are already on the items.
 */
// TODO: If we fail to move/equip armor, should we still equip mods to it?
function applyLoadoutMods(
  storeId: string,
  /** A list of inventory item hashes for plugs */
  modHashes: number[],
  /** if an item would be wiped to default in all sockets, don't do anything to that item */
  skipArmorsWithNoAssignments = true
): ThunkResult<number[]> {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;
    const stores = storesSelector(getState());
    const store = getStore(stores, storeId)!;

    // TODO: find cases where the loadout specified armor for a slot to be equipped and it's not equipped, bail if so
    const armor = store.items.filter((i) => i.bucket.inArmor && i.equipped);
    //const loadoutArmor = loadout.items.filter((i) => i.equipped)

    const mods = modHashes.map((h) => defs.InventoryItem.get(h)).filter(isPluggableItem);

    // What mods are already on the equipped armor set?
    const existingMods: number[] = [];
    for (const item of armor) {
      if (item.sockets) {
        for (const socket of item.sockets.allSockets) {
          if (socket.plugged) {
            existingMods.push(socket.plugged.plugDef.hash);
          }
        }
      }
    }

    // Early exit - if all the mods are already there, nothing to do
    if (
      modHashes.every((h) => {
        const foundAt = existingMods.indexOf(h);
        if (foundAt === -1) {
          // a mod was missing
          return false;
        } else {
          // the mod was found, but we have consumed this copy of it
          delete existingMods[foundAt];
          return true;
        }
      })
    ) {
      infoLog('loadout mods', 'all mods are already there. loadout already applied');
      return modHashes;
    }

    // TODO: stop if the API doesn't exist
    // TODO: stop if we can't perform this action (in activity)
    // TODO: prefer equipping to armor that *is* part of the loadout
    // TODO: compute assigments should consider which mods are already on the item!
    const modAssignments = getCheapestModAssignments(armor, mods, defs).itemModAssignments;

    const successfulMods: number[] = [];

    for (const item of armor) {
      const assignmentSequence = modAssignments[item.id];
      if (assignmentSequence) {
        if (
          skipArmorsWithNoAssignments &&
          // if this assignmentSequence would return all sockets to their default
          assignmentSequence.every(
            (assignment) =>
              assignment.mod.hash ===
              item.sockets?.allSockets[assignment.socketIndex].socketDefinition
                .singleInitialItemHash
          )
        ) {
          continue;
        }
        successfulMods.push(...(await dispatch(equipMods(item.id, assignmentSequence))));
      }
    }

    // TODO: better mod assignment (for this problem):
    // Pass 1: Find out which of the mods are already there
    // Pass 2: Slot specific mods just go right away
    // Pass 3: Figure out if we can slot mods into existing spaces
    // Pass 4: Figure out the minimum mods to remove to get the new mods in

    // Return the mods that were successfully assigned (even if they didn't have to move)
    return successfulMods;
  };
}

/**
 * Equip the specified mods on the item, in the order provided.
 * Strips off existing mods if needed.
 */
function equipMods(
  itemId: string,
  modsForItem: { socketIndex: number; mod: PluggableInventoryItemDefinition }[]
): ThunkResult<number[]> {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;
    const item = getItemAcrossStores(storesSelector(getState()), { id: itemId })!;
    const destiny2CoreSettings = destiny2CoreSettingsSelector(getState())!;

    if (!item.sockets || !item.energy) {
      return [];
    }

    /*
    // TODO: trying to figure out minimum assignments. Should really do this all at once in the
    // mod assignment algorithm and return both equips and de-equips
    const {energyCapacity} = item.energy
    const energyNeeded = _.sumBy(modsForItem, (m) => m.plug.energyCost?.energyCost || 0)
    const existingMods = _.compact(item.sockets.allSockets.map((s) => s.plugged))
    const modsToAdd = modsForItem.filter((m) => existingMods.some((em) => em.plugDef.hash === m.hash))

    const modsBySocketType = new Map<DimSocket, PluggableInventoryItemDefinition[]>()
    const existingModsBySocketType = new Map<DimSocket, DimPlug[]>()
    */

    const modsToApply = [...modsForItem];
    const successfulMods: number[] = [];

    for (const { socketIndex, mod } of modsToApply) {
      if (socketIndex >= 0 && mod) {
        // Use this socket
        const socket = getSocketByIndex(item.sockets, socketIndex)!;
        // If the plug is already inserted we can skip this
        if (socket.plugged?.plugDef.hash === mod.hash) {
          continue;
        }
        if (
          canInsertPlug(
            socket,
            socket.socketDefinition.singleInitialItemHash,
            destiny2CoreSettings,
            defs
          )
        ) {
          infoLog(
            'loadout mods',
            'equipping mod',
            mod.displayProperties.name,
            'into',
            item.name,
            'socket',
            defs.SocketType.get(socket.socketDefinition.socketTypeHash)?.displayProperties.name ||
              socket.socketIndex
          );
          await dispatch(insertPlug(item, socket, mod.hash));
          successfulMods.push(mod.hash);
        } else {
          warnLog(
            'loadout mods',
            'cannot equip mod',
            item.name,
            'to socket',
            defs.SocketType.get(socket.socketDefinition.socketTypeHash)?.displayProperties.name ||
              socket.socketIndex
          );
        }
      } else {
        throw new DimError('Loadouts.SocketError'); // TODO: do this for real
      }
    }

    return successfulMods;
  };
}
