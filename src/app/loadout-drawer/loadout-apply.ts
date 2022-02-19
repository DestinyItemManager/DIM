import { LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
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
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { updateManualMoveTimestamp } from 'app/inventory/manual-moves';
import { loadoutNotification } from 'app/inventory/MoveNotifications';
import { storesSelector, unlockedPlugSetItemsSelector } from 'app/inventory/selectors';
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
import { LockableBucketHashes } from 'app/loadout-builder/types';
import {
  createPluggingStrategy,
  fitMostMods,
  pickPlugPositions,
} from 'app/loadout/mod-assignment-utils';
import { getDefaultPlugHash } from 'app/loadout/mod-utils';
import { d2ManifestSelector, destiny2CoreSettingsSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { DEFAULT_ORNAMENTS, DEFAULT_SHADER } from 'app/search/d2-known-values';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { CanceledError, CancelToken, withCancel } from 'app/utils/cancel';
import { DimError } from 'app/utils/dim-error';
import { emptyArray } from 'app/utils/empty';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog, infoLog, timer, warnLog } from 'app/utils/log';
import { getSocketByIndex, getSocketsByIndexes, plugFitsIntoSocket } from 'app/utils/socket-utils';
import { count } from 'app/utils/util';
import { DestinyClass, PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import { savePreviousLoadout } from './actions';
import {
  anyActionFailed,
  LoadoutApplyPhase,
  LoadoutItemState,
  LoadoutModState,
  LoadoutSocketOverrideState,
  LoadoutStateGetter,
  LoadoutStateUpdater,
  makeLoadoutApplyState,
  setLoadoutApplyPhase,
  setModResult,
  setSocketOverrideResult,
} from './loadout-apply-state';
import { Assignment, Loadout, LoadoutItem } from './loadout-types';
import { backupLoadout } from './loadout-utils';

// TODO: move this whole file to "loadouts" folder

const outOfSpaceWarning = _.throttle((store) => {
  showNotification({
    type: 'info',
    title: t('FarmingMode.OutOfRoomTitle'),
    body: t('FarmingMode.OutOfRoom', { character: store.name }),
  });
}, 60000);

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
  return async (dispatch) => {
    if (!store) {
      throw new Error('You need a store!');
    }

    if ($featureFlags.debugMoves) {
      infoLog('loadout', 'Apply loadout', loadout.name, 'to', store.name);
    }
    const stopTimer = timer('Loadout Application');

    const [cancelToken, cancel] = withCancel();

    const [getLoadoutState, setLoadoutState, stateObservable] = makeLoadoutApplyState();

    // This will run after other moves/loadouts are done
    const loadoutPromise = queueAction(() =>
      dispatch(
        doApplyLoadout(
          store,
          loadout,
          getLoadoutState,
          setLoadoutState,
          onlyMatchingClass,
          cancelToken,
          allowUndo
        )
      )
    );
    loadingTracker.addPromise(loadoutPromise);

    // Start a notification that will show as long as the loadout is equipping
    showNotification(loadoutNotification(loadout, stateObservable, loadoutPromise, cancel));

    try {
      await loadoutPromise;
    } catch (e) {
      errorLog('loadout', 'failed loadout', getLoadoutState(), e);
    } finally {
      stopTimer();
    }
  };
}

/**
 * This is the task in the action queue that actually performs the loadout application. It is responsible for
 * making all the various moves, equips, and item reconfiguration that the loadout requested. It does not
 * notify errors or progress - that is handled by LoadoutApplyState and the caller.
 */
function doApplyLoadout(
  store: DimStore,
  loadout: Loadout,
  getLoadoutState: LoadoutStateGetter,
  setLoadoutState: LoadoutStateUpdater,
  onlyMatchingClass: boolean,
  cancelToken: CancelToken,
  allowUndo = false
): ThunkResult {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;
    // Stop farming mode while we're applying the loadout
    dispatch(interruptFarming());

    // The store and its items may change as we move things - make sure we're always looking at the latest version
    const getStores = () => storesSelector(getState());
    const getTargetStore = () => getStore(getStores(), store.id)!;

    try {
      // Back up the current state as an "undo" loadout
      if (allowUndo && !store.isVault) {
        dispatch(
          savePreviousLoadout({
            storeId: store.id,
            loadoutId: loadout.id,
            previousLoadout: backupLoadout(store, t('Loadouts.Before', { name: loadout.name })),
          })
        );
      }

      // TODO: would be great to avoid all these getLoadoutItems?

      // Trim down the list of items to only those that could be equipped by the store we're sending to.
      const applicableLoadoutItems = loadout.items.filter((loadoutItem) => {
        const item = getLoadoutItem(loadoutItem, store, getStores());
        // Don't filter if they're going to the vault
        return (
          item &&
          (!onlyMatchingClass ||
            store.isVault ||
            !item.equipment ||
            itemCanBeEquippedBy(item, store))
        );
      });

      // Figure out which items have specific socket overrides that will need to be applied.
      // TODO: remove socket-overrides from the mods to apply list!
      const itemsWithOverrides = loadout.items.filter((loadoutItem) => {
        const item = getLoadoutItem(loadoutItem, store, getStores());
        return (
          loadoutItem.socketOverrides &&
          item &&
          // Don't apply perks/mods/subclass configs when moving items to the vault
          !store.isVault &&
          // Only apply perks/mods/subclass configs if the item is usable by the store we're applying to
          (item.classType === DestinyClass.Unknown || item.classType === store.classType)
        );
      });

      // Filter out mods that no longer exist or that aren't unlocked on this character
      const unlockedPlugSetItems = _.once(() => unlockedPlugSetItemsSelector(getState(), store.id));
      const checkMod = (h: number) =>
        Boolean(defs.InventoryItem.get(h)) &&
        (unlockedPlugSetItems().has(h) || h === DEFAULT_SHADER || DEFAULT_ORNAMENTS.includes(h));

      // Don't apply mods when moving to the vault
      const modsToApply = ((!store.isVault && loadout.parameters?.mods) || []).filter(checkMod);
      // Mods specific to a bucket but not an item - fashion mods (shader/ornament)
      const modsByBucketToApply: {
        [bucketHash: number]: number[];
      } = {};
      if (!store.isVault && loadout.parameters?.modsByBucket) {
        for (const [bucketHash, mods] of Object.entries(loadout.parameters.modsByBucket)) {
          const filteredMods = mods.filter(checkMod);
          if (filteredMods.length) {
            modsByBucketToApply[parseInt(bucketHash, 10)] = filteredMods;
          }
        }
      }

      // Initialize items/mods/etc in the LoadoutApplyState, for the notification
      setLoadoutState(
        produce((state) => {
          state.phase = LoadoutApplyPhase.Deequip;

          // Fill out pending state for all items
          for (const loadoutItem of applicableLoadoutItems) {
            const item = getLoadoutItem(loadoutItem, store, getStores())!;
            state.itemStates[item.index] = {
              item,
              equip: loadoutItem.equipped,
              state: LoadoutItemState.Pending,
            };
          }
          // Fill out pending state for all socket overrides
          for (const loadoutItem of itemsWithOverrides) {
            const item = getLoadoutItem(loadoutItem, store, getStores())!;
            if (item) {
              state.socketOverrideStates[item.index] = {
                item,
                results: _.mapValues(loadoutItem.socketOverrides, (plugHash) => ({
                  plugHash,
                  state: LoadoutSocketOverrideState.Pending,
                })),
              };
            }
          }
          // Fill out pending state for all mods
          state.modStates = modsToApply
            .map((modHash) => ({
              modHash,
              state: LoadoutModState.Pending,
            }))
            .concat(
              Object.values(modsByBucketToApply)
                .flat()
                .map((modHash) => ({
                  modHash,
                  state: LoadoutModState.Pending,
                }))
            );
        })
      );

      // Filter out items that don't need to move
      const loadoutItemsToMove: LoadoutItem[] = Array.from(
        applicableLoadoutItems.filter((loadoutItem) => {
          const item = getLoadoutItem(loadoutItem, store, getStores());
          // Ignore any items that are already in the correct state
          const requiresAction =
            item &&
            // We need to move to another location - but exclude items that can't be transferred
            ((item.owner !== store.id && !item.notransfer) ||
              // Items in the postmaster should be moved even if they're on the same character
              item.location.inPostmaster ||
              // Needs to be equipped. Stuff not marked "equip" doesn't
              // necessarily mean to de-equip it.
              (loadoutItem.equipped && !item.equipped) ||
              // We always try to move consumable stacks because their logic is complicated
              (loadoutItem.amount && loadoutItem.amount > 1));

          if (item && !requiresAction) {
            setLoadoutState(
              produce((state) => {
                state.itemStates[item.index].state = LoadoutItemState.AlreadyThere;
              })
            );
          }

          return requiresAction;
        }),
        // Shallow copy all LoadoutItems so we can mutate the equipped flag later
        (i) => ({ ...i })
      );

      // The vault can't equip items, so set equipped to false
      if (store.isVault) {
        for (const loadoutItem of loadoutItemsToMove) {
          loadoutItem.equipped = false;
        }
      }

      let itemsToEquip = loadoutItemsToMove.filter((i) => i.equipped);
      // If we need to equip many items at once, we'll use a single bulk-equip later
      if (itemsToEquip.length > 1) {
        // TODO: just set a bulkEquip flag
        itemsToEquip.forEach((i) => {
          i.equipped = false;
        });
      }

      // Dequip items from the loadout off of other characters so they can be moved.
      // TODO: break out into its own action
      const stores = getStores();
      const itemsToDequip = loadoutItemsToMove.filter((loadoutItem) => {
        const item = getLoadoutItem(loadoutItem, store, stores);
        return item?.equipped && item.owner !== store.id;
      });

      const realItemsToDequip = _.compact(
        itemsToDequip.map((i) => getLoadoutItem(i, store, stores))
      );
      // Group dequips per character
      const dequips = _.map(
        _.groupBy(realItemsToDequip, (i) => i.owner),
        async (dequipItems, owner) => {
          // If there's only one item to remove, we don't need to bulk dequip, it'll be handled
          // automatically when we try to move the item.
          if (dequipItems.length === 1) {
            return;
          }
          // You can't directly dequip things, you have to equip something
          // else - so choose an appropriate replacement for each item.
          const itemsToEquip = _.compact(
            dequipItems.map((i) =>
              getSimilarItem(getStores(), i, {
                exclusions: applicableLoadoutItems,
                excludeExotic: i.isExotic,
              })
            )
          );
          try {
            const result = await dispatch(
              equipItems(getStore(getStores(), owner)!, itemsToEquip, cancelToken)
            );
            // Bulk equip can partially fail
            setLoadoutState(
              produce((state) => {
                for (const item of dequipItems) {
                  const errorCode = result[item.id];
                  state.itemStates[item.index].state =
                    errorCode === PlatformErrorCodes.Success
                      ? LoadoutItemState.DequippedPendingMove
                      : LoadoutItemState.FailedDequip;

                  // TODO how to set the error code here?
                  // state.itemStates[item.index].error = new DimError().withCause(BungieError(errorCode))
                }
              })
            );
          } catch (e) {
            if (e instanceof CanceledError) {
              throw e;
            }
            errorLog('loadout dequip', 'Failed to dequip items from', owner, e);
            setLoadoutState(
              produce((state) => {
                for (const item of dequipItems) {
                  state.itemStates[item.index].state = LoadoutItemState.FailedDequip;
                  state.itemStates[item.index].error = e;
                }
              })
            );
          }
        }
      );
      // Run each character's bulk dequip in parallel
      await Promise.all(dequips);

      // Move all items to the right location
      setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.MoveItems));
      for (const loadoutItem of loadoutItemsToMove) {
        // TODO: try parallelizing these too?
        // TODO: respect flag for equip not allowed
        try {
          const initialItem = getLoadoutItem(loadoutItem, getTargetStore(), getStores())!;
          await dispatch(
            applyLoadoutItem(store.id, loadoutItem, applicableLoadoutItems, cancelToken)
          );
          const updatedItem = getLoadoutItem(loadoutItem, getTargetStore(), getStores());
          if (updatedItem) {
            setLoadoutState(
              produce((state) => {
                // TODO: doing things based on item index is kind of tough for consumables!
                if (state.itemStates[initialItem.index]) {
                  state.itemStates[initialItem.index].state =
                    // If we're doing a bulk equip later, set to MovedPendingEquip
                    itemsToEquip.length > 1 &&
                    itemsToEquip.some((loadoutItem) => loadoutItem.id === updatedItem.id)
                      ? LoadoutItemState.MovedPendingEquip
                      : LoadoutItemState.Succeeded;
                }
              })
            );
          }
        } catch (e) {
          if (e instanceof CanceledError) {
            throw e;
          }
          const updatedItem = getLoadoutItem(loadoutItem, getTargetStore(), getStores());
          if (updatedItem) {
            errorLog('loadout', 'Failed to apply loadout item', updatedItem.name, e);
            setLoadoutState(
              produce((state) => {
                // If it made it to the right store, the failure was in equipping, not moving
                const isOnCorrectStore = updatedItem.owner === store.id;
                state.itemStates[updatedItem.index].state = isOnCorrectStore
                  ? LoadoutItemState.FailedEquip
                  : LoadoutItemState.FailedMove;
                state.itemStates[updatedItem.index].error = e;
                state.equipNotPossible ||=
                  isOnCorrectStore &&
                  e instanceof DimError &&
                  checkEquipNotPossible(e.bungieErrorCode());
              })
            );
          }
        }
      }

      // After moving all items into the right place, do a single bulk-equip to the selected store.
      // If only one item needed to be equipped we will have handled it as part of applyLoadoutItem.
      setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.EquipItems));
      if (itemsToEquip.length > 1) {
        const store = getTargetStore();
        const stores = getStores();
        const successfulItems = Object.values(getLoadoutState().itemStates).filter(
          (s) => s.equip && s.state === LoadoutItemState.MovedPendingEquip
        );
        // Use the bulk equipAll API to equip all at once.
        itemsToEquip = itemsToEquip.filter((i) =>
          successfulItems.some((si) => si.item.id === i.id)
        );
        const realItemsToEquip = _.compact(
          itemsToEquip.map((i) => getLoadoutItem(i, store, stores))
        );
        try {
          const result = await dispatch(equipItems(store, realItemsToEquip, cancelToken));
          // Bulk equip can partially fail
          setLoadoutState(
            produce((state) => {
              for (const item of realItemsToEquip) {
                const errorCode = result[item.id];
                state.itemStates[item.index].state =
                  errorCode === PlatformErrorCodes.Success
                    ? LoadoutItemState.Succeeded
                    : LoadoutItemState.FailedEquip;

                // TODO how to set the error code here?
                // state.itemStates[item.index].error = new DimError().withCause(BungieError(errorCode))

                state.equipNotPossible ||= checkEquipNotPossible(errorCode);
              }
            })
          );
        } catch (e) {
          if (e instanceof CanceledError) {
            throw e;
          }
          errorLog('loadout equip', 'Failed to equip items', e);
          setLoadoutState(
            produce((state) => {
              for (const item of realItemsToEquip) {
                state.itemStates[item.index].state = LoadoutItemState.FailedEquip;
                state.itemStates[item.index].error = e;
              }
            })
          );
        }
      }

      // Apply socket overrides to items that have them, to set specific mods and perks
      if (itemsWithOverrides.length) {
        setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.SocketOverrides));

        // TODO (ryan) the items with overrides here don't have the default plugs included in them
        infoLog('loadout socket overrides', 'Socket overrides to apply', itemsWithOverrides);
        await dispatch(applySocketOverrides(itemsWithOverrides, setLoadoutState, cancelToken));
        const overrideResults = Object.values(getLoadoutState().socketOverrideStates).flatMap((r) =>
          Object.values(r.results)
        );
        const successfulItemOverrides = count(
          overrideResults,
          (r) => r.state === LoadoutSocketOverrideState.Applied
        );
        infoLog(
          'loadout socket overrides',
          'Socket overrides applied',
          successfulItemOverrides,
          overrideResults.length
        );
      }

      const clearMods = Boolean(loadout.parameters?.clearMods);
      // Apply any mods in the loadout. These apply to the current equipped items, not just loadout items!
      if (modsToApply.length || !_.isEmpty(modsByBucketToApply) || clearMods) {
        setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.ApplyMods));
        infoLog('loadout mods', 'Mods to apply', modsToApply);
        await dispatch(
          applyLoadoutMods(
            applicableLoadoutItems,
            store.id,
            modsToApply,
            modsByBucketToApply,
            setLoadoutState,
            cancelToken,
            Boolean(loadout.parameters?.clearMods)
          )
        );
        const { modStates } = getLoadoutState();
        infoLog(
          'loadout mods',
          'Mods applied',
          count(modStates, (s) => s.state === LoadoutModState.Applied),
          modStates.length
        );
      }

      // If this is marked to clear space (and we're not applying it to the vault), move items not
      // in the loadout off the character
      if (loadout.clearSpace && !store.isVault) {
        setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.ClearSpace));
        await dispatch(
          clearSpaceAfterLoadout(
            getTargetStore(),
            applicableLoadoutItems.map((i) => getLoadoutItem(i, store, getStores())!),
            cancelToken
          )
        );
      }

      if (anyActionFailed(getLoadoutState())) {
        setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.Failed));
        // This message isn't used, it just triggers the failure state in the notification
        throw new Error('loadout-failed');
      }
      setLoadoutState(setLoadoutApplyPhase(LoadoutApplyPhase.Succeeded));
    } finally {
      // Update the characters to get the latest stats
      dispatch(updateCharacters());
      dispatch(resumeFarming());
    }
  };
}

/**
 * Move one loadout item to its destination. May also equip the item unless we're waiting to equip it later.
 */
function applyLoadoutItem(
  storeId: string,
  loadoutItem: LoadoutItem,
  excludes: { id: string; hash: number }[],
  cancelToken: CancelToken
): ThunkResult {
  return async (dispatch, getState) => {
    // The store and its items may change as we move things - make sure we're always looking at the latest version
    const stores = storesSelector(getState());
    const store = getStore(stores, storeId)!;
    const item = getLoadoutItem(loadoutItem, store, stores);

    if (!item) {
      return;
    }

    // We mark this *first*, because otherwise things observing state (like farming) may not see this
    // in time.
    updateManualMoveTimestamp(item);

    if (item.maxStackSize > 1) {
      // handle consumables!
      const amountAlreadyHave = amountOfItem(store, loadoutItem);
      let amountNeeded = loadoutItem.amount - amountAlreadyHave;
      if (amountNeeded > 0) {
        const otherStores = stores.filter((otherStore) => store.id !== otherStore.id);
        const storesByAmount = _.sortBy(
          otherStores.map((store) => ({
            store,
            amount: amountOfItem(store, loadoutItem),
          })),
          (v) => v.amount
        ).reverse();

        let totalAmount = amountAlreadyHave;
        // Keep moving from stacks until we get enough
        while (amountNeeded > 0) {
          const source = _.maxBy(storesByAmount, (s) => s.amount)!;
          const amountToMove = Math.min(source.amount, amountNeeded);
          const sourceItem = source.store.items.find((i) => i.hash === loadoutItem.hash);

          if (amountToMove === 0 || !sourceItem) {
            const error: DimError & { level?: string } = new DimError(
              'Loadouts.TooManyRequested',
              t('Loadouts.TooManyRequested', {
                total: totalAmount,
                itemname: item.name,
                requested: loadoutItem.amount,
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
      // Normal items get a straightforward move
      await dispatch(
        executeMoveItem(item, store, {
          equip: loadoutItem.equipped,
          amount: item.amount,
          excludes,
          cancelToken,
        })
      );
    }
  };
}

/**
 * A special getItem that takes into account the fact that
 * subclasses have unique IDs, and emblems/shaders/etc are interchangeable.
 */
function getLoadoutItem(
  loadoutItem: LoadoutItem,
  store: DimStore,
  stores: DimStore[]
): DimItem | null {
  let item = getItemAcrossStores(stores, _.omit(loadoutItem, 'amount'));
  if (!item) {
    return null;
  }
  if (
    [
      BucketHashes.Subclass,
      BucketHashes.Shaders,
      BucketHashes.Emblems,
      BucketHashes.Emotes_Invisible,
      BucketHashes.Emotes_Equippable,
      D1BucketHashes.Horn,
    ].includes(item.bucket.hash)
  ) {
    // Same character first
    item =
      store.items.find((i) => i.hash === loadoutItem.hash) ||
      // Then other characters
      getItemAcrossStores(stores, { hash: item.hash }) ||
      item;
  }
  return item;
}

/**
 * Clear out non-loadout items from a character. "items" are the items from the loadout.
 */
function clearSpaceAfterLoadout(
  store: DimStore,
  items: DimItem[],
  cancelToken: CancelToken
): ThunkResult {
  const itemsByType = _.groupBy(items, (i) => i.bucket.hash);

  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};

  const itemsToRemove: DimItem[] = [];

  for (const [bucketId, loadoutItems] of Object.entries(itemsByType)) {
    // Exclude a handful of buckets from being cleared out
    if ([BucketHashes.Consumables, BucketHashes.Materials].includes(loadoutItems[0].bucket.hash)) {
      continue;
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
    reservations[store.id][loadoutItems[0].bucket.hash] =
      loadoutItems[0].bucket.capacity - numUnequippedLoadoutItems;
  }

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
 * Applies the socket overrides for the passed in loadout items.
 *
 * This gets all the sockets for an item and either applies the override plug in the items
 * socket overrides, or applies the default item plug. If the plug is already in the socket
 * we don't actually make an API call, it is just counted as a success.
 */
// TODO: Leave unmentioned sockets alone!
function applySocketOverrides(
  itemsWithOverrides: LoadoutItem[],
  setLoadoutState: LoadoutStateUpdater,
  cancelToken: CancelToken
): ThunkResult {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;

    for (const loadoutItem of itemsWithOverrides) {
      const dimItem = getItemAcrossStores(storesSelector(getState()), { id: loadoutItem.id })!;
      if (!dimItem) {
        continue;
      }

      if (loadoutItem.socketOverrides) {
        // We build up an array of mods to socket in order
        const modsForItem: Assignment[] = [];
        const categories = dimItem.sockets?.categories || [];

        for (const category of categories) {
          const sockets = getSocketsByIndexes(dimItem.sockets!, category.socketIndexes);

          for (const socket of sockets) {
            const socketIndex = socket.socketIndex;
            let modHash: number | undefined = loadoutItem.socketOverrides[socketIndex];

            // So far only subclass abilities are known to be able to socket the initial item
            // aspects and fragments return a 500
            if (
              modHash === undefined &&
              (category.category.hash === SocketCategoryHashes.Abilities ||
                category.category.hash === SocketCategoryHashes.Super)
            ) {
              modHash = getDefaultPlugHash(socket, defs);
            }
            if (modHash) {
              const mod = defs.InventoryItem.get(modHash) as PluggableInventoryItemDefinition;
              // We explicitly set sockets that aren't in socketOverrides to the default plug for subclasses
              modsForItem.push({ socketIndex, mod, requested: true });
            }
          }
        }

        const handleSuccess = ({ socketIndex, requested }: Assignment) => {
          requested &&
            setLoadoutState(
              setSocketOverrideResult(dimItem, socketIndex, LoadoutSocketOverrideState.Applied)
            );
        };
        const handleFailure = (
          { socketIndex, requested }: Assignment,
          error?: Error,
          equipNotPossible?: boolean
        ) =>
          requested
            ? setLoadoutState(
                setSocketOverrideResult(
                  dimItem,
                  socketIndex,
                  LoadoutSocketOverrideState.Failed,
                  error,
                  equipNotPossible
                )
              )
            : setLoadoutState((state) => ({
                ...state,
                equipNotPossible: state.equipNotPossible || Boolean(equipNotPossible),
              }));

        await dispatch(
          equipModsToItem(dimItem.id, modsForItem, handleSuccess, handleFailure, cancelToken)
        );
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
 */
function applyLoadoutMods(
  loadoutItems: LoadoutItem[],
  storeId: string,
  /** A list of inventory item hashes for plugs */
  modHashes: number[],
  /** Extra mods to apply that are specifically per bucket */
  modsByBucket: {
    [bucketHash: number]: number[];
  },
  setLoadoutState: LoadoutStateUpdater,
  cancelToken: CancelToken,
  /** if an item has mods applied, this will "clear" all other sockets to empty/their default */
  clearUnassignedSocketsPerItem = false
): ThunkResult {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;
    const stores = storesSelector(getState());
    const store = getStore(stores, storeId)!;

    // Apply mods to the armor items in the loadout that were marked "equipped"
    // even if they failed to equip. For each slot that doesn't have an equipped
    // item in the loadout, use the current equipped item (whatever it is)
    // instead.
    const currentEquippedArmor = store.items.filter((i) => i.bucket.inArmor && i.equipped);
    const equippedLoadoutItems = loadoutItems.filter((item) => item.equipped);
    const loadoutDimItems: DimItem[] = [];
    for (const loadoutItem of loadoutItems) {
      const item = getLoadoutItem(loadoutItem, store, stores);
      if (
        item?.bucket.inArmor &&
        equippedLoadoutItems.some((loadoutItem) => loadoutItem.id === item.id)
      ) {
        loadoutDimItems.push(item);
      }
    }
    const armor = _.compact(
      LockableBucketHashes.map(
        (bucketHash) =>
          loadoutDimItems.find((item) => item.bucket.hash === bucketHash) ||
          currentEquippedArmor.find((item) => item.bucket.hash === bucketHash)
      )
    );

    const mods = modHashes.map((h) => defs.InventoryItem.get(h)).filter(isPluggableItem);

    // Early exit - if all the mods are already there, nothing to do
    if (
      !clearUnassignedSocketsPerItem &&
      allModsAreAlreadyApplied(armor, modHashes, modsByBucket)
    ) {
      infoLog('loadout mods', 'all mods are already there. loadout already applied');
      setLoadoutState((state) => ({
        ...state,
        modStates: modHashes
          .concat(Object.values(modsByBucket).flat())
          .map((modHash) => ({ modHash, state: LoadoutModState.Applied })),
      }));
      return;
    }

    // TODO: prefer equipping to armor that *is* part of the loadout
    const { itemModAssignments, unassignedMods } = fitMostMods({
      items: armor,
      plannedMods: mods,
      assumeArmorMasterwork: undefined,
      lockArmorEnergyType: LockArmorEnergyType.All,
      minItemEnergy: 1,
    });

    for (const mod of unassignedMods) {
      setLoadoutState(
        setModResult({
          modHash: mod.hash,
          state: LoadoutModState.Unassigned,
          error: new DimError('Loadouts.UnassignedModError'),
        })
      );
    }

    const applyModsPromises: Promise<void>[] = [];

    const handleSuccess = ({ mod, requested }: Assignment) =>
      requested &&
      setLoadoutState(setModResult({ modHash: mod.hash, state: LoadoutModState.Applied }));
    const handleFailure = (
      { mod, requested }: Assignment,
      error?: Error,
      equipNotPossible?: boolean
    ) =>
      requested
        ? setLoadoutState(
            setModResult(
              { modHash: mod.hash, state: LoadoutModState.Failed, error },
              equipNotPossible
            )
          )
        : setLoadoutState((state) => ({
            ...state,
            equipNotPossible: state.equipNotPossible || Boolean(equipNotPossible),
          }));

    for (const item of armor) {
      const assignments = pickPlugPositions(
        defs,
        item,
        itemModAssignments[item.id],
        clearUnassignedSocketsPerItem
      );

      // Patch in assignments for mods by bucket (shaders/ornaments)
      for (const modHash of modsByBucket[item.bucket.hash] ?? []) {
        const modDef = defs.InventoryItem.get(modHash);
        const socket = item.sockets?.allSockets.find((s) => plugFitsIntoSocket(s, modHash));
        if (socket && isPluggableItem(modDef)) {
          assignments.push({ mod: modDef, socketIndex: socket.socketIndex, requested: true });
        } else {
          // I guess technically these are unassigned
          setLoadoutState(
            setModResult({
              modHash: modHash,
              state: LoadoutModState.Unassigned,
              error: new DimError('Loadouts.UnassignedModError'),
            })
          );
        }
      }

      const pluggingSteps = createPluggingStrategy(item, assignments, defs);
      const assignmentSequence = pluggingSteps.filter((assignment) => assignment.required);
      infoLog('loadout mods', 'Applying', assignmentSequence, 'to', item.name);
      if (assignmentSequence) {
        applyModsPromises.push(
          dispatch(
            equipModsToItem(item.id, assignmentSequence, handleSuccess, handleFailure, cancelToken)
          )
        );
      }
    }

    await Promise.all(applyModsPromises);
  };
}

/**
 * Check whether all the mods in modHashes are already applied to the items in armor.
 */
function allModsAreAlreadyApplied(
  armor: DimItem[],
  modHashes: number[],
  modsByBucket: {
    [bucketHash: number]: number[];
  }
) {
  // Copy this - we'll be deleting from it
  modsByBucket = { ...modsByBucket };

  // What mods are already on the equipped armor set?
  const existingMods: number[] = [];
  for (const item of armor) {
    if (item.sockets) {
      let modsForBucket: readonly number[] = modsByBucket[item.bucket.hash] ?? emptyArray();
      for (const socket of item.sockets.allSockets) {
        if (socket.plugged) {
          const pluggedHash = socket.plugged.plugDef.hash;
          existingMods.push(pluggedHash);
          modsForBucket = modsForBucket.filter((h) => h !== pluggedHash);
        }
      }
      if (modsForBucket.length === 0) {
        delete modsByBucket[item.bucket.hash];
      }
    }
  }

  if (!_.isEmpty(modsByBucket)) {
    return false;
  }

  // Early exit - if all the mods are already there, nothing to do
  return modHashes.every((h) => {
    const foundAt = existingMods.indexOf(h);
    if (foundAt === -1) {
      // a mod was missing
      return false;
    } else {
      // the mod was found, but we have consumed this copy of it
      delete existingMods[foundAt];
      return true;
    }
  });
}

/**
 * Equip the specified mods on the item, in the order provided. This applies
 * each assignment, and does not account for item energy, which should be
 * pre-calculated.
 */
function equipModsToItem(
  itemId: string,
  modsForItem: Assignment[],
  /** Callback for state reporting while applying. Mods are applied in parallel so we want to report ASAP. */
  onSuccess: (assignment: Assignment) => void,
  /** Callback for state reporting while applying. Mods are applied in parallel so we want to report ASAP. */
  onFailure: (assignment: Assignment, error?: Error, equipNotPossible?: boolean) => void,
  cancelToken: CancelToken
): ThunkResult {
  return async (dispatch, getState) => {
    const defs = d2ManifestSelector(getState())!;
    const item = getItemAcrossStores(storesSelector(getState()), { id: itemId })!;
    const destiny2CoreSettings = destiny2CoreSettingsSelector(getState())!;

    if (!item.sockets) {
      return;
    }

    const modsToApply = [...modsForItem];

    // TODO: we tried to do these applies in parallel, but you can get into trouble
    // if you need to remove a mod before applying another.

    for (const assignment of modsToApply) {
      const { socketIndex } = assignment;
      let { mod } = assignment;
      // Use this socket
      const socket = getSocketByIndex(item.sockets, socketIndex)!;

      // This is a special case for transmog ornaments - you can't apply a
      // transmog ornament to the same item it was created with. So instead we
      // swap at the last minute to applying the default ornament which should
      // match the appearance that the user wanted. We'll still report as if we
      // applied the ornament.
      if (mod.hash === item.hash) {
        const defaultPlugHash = getDefaultPlugHash(socket, defs);
        if (defaultPlugHash) {
          mod = (defs.InventoryItem.get(defaultPlugHash) ??
            mod) as PluggableInventoryItemDefinition;
        }
      }

      // If the plug is already inserted we can skip this
      if (socket.plugged?.plugDef.hash === mod.hash) {
        onSuccess(assignment);
        continue;
      }
      if (canInsertPlug(socket, mod.hash, destiny2CoreSettings, defs)) {
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

        // TODO: short circuit if equipping is not possible
        cancelToken.checkCanceled();
        try {
          await dispatch(applyMod(item, socket, mod));
          onSuccess(assignment);
        } catch (e) {
          const equipNotPossible =
            e instanceof DimError && checkEquipNotPossible(e.bungieErrorCode());
          onFailure(assignment, e, equipNotPossible);
        }
      } else {
        warnLog(
          'loadout mods',
          'cannot equip mod',
          mod.displayProperties.name,
          'into',
          item.name,
          'socket',
          defs.SocketType.get(socket.socketDefinition.socketTypeHash)?.displayProperties.name ||
            socket.socketIndex
        );
        // TODO: error here explaining why
        onFailure(assignment);
      }
    }
  };
}

function applyMod(
  item: DimItem,
  socket: DimSocket,
  mod: PluggableInventoryItemDefinition
): ThunkResult {
  return async (dispatch) => {
    try {
      await dispatch(insertPlug(item, socket, mod.hash));
    } catch (e) {
      errorLog(
        'loadout mods',
        'failed to equip mod',
        mod.displayProperties.name,
        'into',
        item.name,
        'socket',
        socket.socketIndex,
        e
      );
      const plugName = mod.displayProperties.name ?? 'Unknown Plug';
      throw new DimError(
        'AWA.ErrorMessage',
        t('AWA.ErrorMessage', {
          error: e.message,
          item: item.name,
          plug: plugName,
        })
      ).withError(e);
    }
  };
}

/**
 * Check error code to see if it indicates one of the known conditions where no
 * equips or mod changes will succeed for the active character.
 */
function checkEquipNotPossible(errorCode?: PlatformErrorCodes) {
  return (
    // Player is in an activity
    errorCode === PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation ||
    // This happens when you log out while still in a locked equipment activity
    errorCode === PlatformErrorCodes.DestinyItemUnequippable
  );
}
