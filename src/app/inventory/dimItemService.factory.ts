import { copy as angularCopy, IPromise } from 'angular';
import * as _ from 'underscore';
import { DimError } from '../bungie-api/bungie-service-helper';
import { equip as d1equip, equipItems as d1EquipItems, transfer as d1Transfer } from '../bungie-api/destiny1-api';
import { equip as d2equip, equipItems as d2EquipItems, transfer as d2Transfer } from '../bungie-api/destiny2-api';
import { chainComparator, compareBy, reverseComparator } from '../comparators';
import { StoreServiceType } from './d2-stores.service';
import { createItemIndex as d2CreateItemIndex, DimItem } from './store/d2-item-factory.service';
import { DimStore } from './store/d2-store-factory.service';

export interface ItemServiceType {
  getSimilarItem(item: DimItem, exclusions?: Partial<DimItem>[], excludeExotic?: boolean): DimItem | null;
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
  moveTo(item: DimItem, target: DimStore, equip: boolean, amount: number, excludes?: { id: string; hash: number }[], reservations?: { [storeId: number]: number }): IPromise<DimItem>;
  /**
   * Bulk equip items. Only use for multiple equips at once.
   */
  equipItems(store: DimStore, items: DimItem[]): IPromise<DimItem[]>;
}

/**
 * A service for moving/equipping items. dimItemMoveService should be preferred for most usages.
 */
export function ItemService(
  dimStoreService: StoreServiceType,
  D2StoresService: StoreServiceType,
  ItemFactory,
  $q,
  $i18next
): ItemServiceType {
  'ngInject';

  // We'll reload the stores to check if things have been
  // thrown away or moved and we just don't have up to date info. But let's
  // throttle these calls so we don't just keep refreshing over and over.
  // This needs to be up here because of how we return the service object.
  const throttledReloadStores = _.throttle(() => {
    return dimStoreService.reloadStores();
  }, 10000, { trailing: false });

  const throttledD2ReloadStores = _.throttle(() => {
    return D2StoresService.reloadStores();
  }, 10000, { trailing: false });

  return {
    getSimilarItem,
    moveTo,
    equipItems
  };

  function equipApi(item: DimItem): (item: DimItem) => IPromise<any> {
    return item.destinyVersion === 2 ? d2equip : d1equip;
  }

  function equipItemsApi(item: DimItem): (store: DimStore, items: DimItem[]) => IPromise<DimItem[]> {
    return item.destinyVersion === 2 ? d2EquipItems : d1EquipItems;
  }

  function transferApi(item: DimItem): (item: DimItem, store: DimStore, amount: number) => IPromise<any> {
    return item.destinyVersion === 2 ? d2Transfer : d1Transfer;
  }

  function createItemIndex(item: DimItem): string {
    return item.destinyVersion === 2 ? d2CreateItemIndex(item) : ItemFactory.createItemIndex(item);
  }

  function getStoreService(item: DimItem): StoreServiceType {
    return item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  /**
   * Update our item and store models after an item has been moved (or equipped/dequipped).
   * @return the new or updated item (it may create a new item!)
   */
  function updateItemModel(item: DimItem, source: DimStore, target: DimStore, equip: boolean, amount: number = item.amount) {
    // Refresh all the items - they may have been reloaded!
    const storeService = getStoreService(item);
    source = storeService.getStore(source.id)!;
    target = storeService.getStore(target.id)!;
    item = storeService.getItemAcrossStores(item)!;

    // If we've moved to a new place
    if (source.id !== target.id || item.location.inPostmaster) {
      // We handle moving stackable and nonstackable items almost exactly the same!
      const stackable = item.maxStackSize > 1;
      // Items to be decremented
      const sourceItems = stackable
        ? _.sortBy(source.buckets[item.location.id].filter((i) => {
          return i.hash === item.hash &&
                i.id === item.id &&
                !i.notransfer;
        }), 'amount') : [item];
      // Items to be incremented. There's really only ever at most one of these, but
      // it's easier to deal with as a list.
      const targetItems = stackable
        ? _.sortBy(target.buckets[item.bucket.id].filter((i) => {
          return i.hash === item.hash &&
                i.id === item.id &&
                // Don't consider full stacks as targets
                i.amount !== i.maxStackSize &&
                !i.notransfer;
        }), 'amount') : [];
      // moveAmount could be more than maxStackSize if there is more than one stack on a character!
      const moveAmount = amount || item.amount;
      let addAmount = moveAmount;
      let removeAmount = moveAmount;
      let removedSourceItem = false;

      // Remove inventory from the source
      while (removeAmount > 0) {
        let sourceItem = sourceItems.shift();
        if (!sourceItem) {
          throw new Error($i18next.t('ItemService.TooMuch'));
        }

        const amountToRemove = Math.min(removeAmount, sourceItem.amount);
        if (amountToRemove === sourceItem.amount) {
          // Completely remove the source item
          if (source.removeItem(sourceItem)) {
            removedSourceItem = sourceItem.index === item.index;
          }
        } else {
          // Perf hack: by replacing the item entirely with a cloned
          // item that has an adjusted index, we force the ng-repeat
          // to refresh its view of the item, updating the
          // amount. This is because we've switched to bind-once for
          // the amount since it rarely changes.
          source.removeItem(sourceItem);
          sourceItem = angularCopy(sourceItem);
          sourceItem.amount -= amountToRemove;
          sourceItem.index = createItemIndex(sourceItem);
          source.addItem(sourceItem);
        }

        removeAmount -= amountToRemove;
      }

      // Add inventory to the target (destination)
      let targetItem;
      while (addAmount > 0) {
        targetItem = targetItems.shift();

        if (!targetItem) {
          targetItem = item;
          if (!removedSourceItem) {
            targetItem = angularCopy(item);
            targetItem.index = createItemIndex(targetItem);
          }
          removedSourceItem = false; // only move without cloning once
          targetItem.amount = 0; // We'll increment amount below
          if (targetItem.location.inPostmaster) {
            targetItem.location = targetItem.bucket;
          }
          target.addItem(targetItem);
        }

        const amountToAdd = Math.min(addAmount, targetItem.maxStackSize - targetItem.amount);
        // Perf hack: by replacing the item entirely with a cloned
        // item that has an adjusted index, we force the ng-repeat to
        // refresh its view of the item, updating the amount. This is
        // because we've switched to bind-once for the amount since it
        // rarely changes.
        target.removeItem(targetItem);
        targetItem = angularCopy(targetItem);
        targetItem.amount += amountToAdd;
        targetItem.index = createItemIndex(targetItem);
        target.addItem(targetItem);
        addAmount -= amountToAdd;
      }
      item = targetItem; // The item we're operating on switches to the last target
    }

    if (equip) {
      target.buckets[item.bucket.id].forEach((i) => {
        i.equipped = (i.index === item.index);
      });
    }

    return item;
  }

  function getSimilarItem(item: DimItem, exclusions?: DimItem[], excludeExotic = false): DimItem | null {
    const storeService = getStoreService(item);
    const target = storeService.getStore(item.owner)!;
    const sortedStores = _.sortBy(storeService.getStores(), (store) => {
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
  function searchForSimilarItem(item: DimItem, store: DimStore, exclusions: DimItem[] | undefined, target: DimStore, excludeExotic: boolean): DimItem | null {
    const exclusionsList = exclusions || [];

    let candidates = store.items.filter((i) => {
      return i.canBeEquippedBy(target) &&
        i.location.id === item.location.id &&
        !i.equipped &&
        // Not the same item
        i.id !== item.id &&
        // Not on the exclusion list
        !_.any(exclusionsList, { id: i.id, hash: i.hash });
    });

    if (!candidates.length) {
      return null;
    }

    if (excludeExotic) {
      candidates = candidates.filter((c) => c.equippingLabel !== item.equippingLabel);
    }

    // TODO: unify this value function w/ the others!
    const sortedCandidates = _.sortBy(candidates, (i) => {
      let value = {
        Legendary: 4,
        Rare: 3,
        Uncommon: 2,
        Common: 1,
        Exotic: 0
      }[i.tier];
      if (item.isExotic && i.isExotic) {
        value += 5;
      }
      if (i.primStat) {
        value += i.primStat.value / 1000;
      }
      return value;
    }).reverse();

    return sortedCandidates.find((result) => {
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
    }) || null;
  }

  /**
   * Bulk equip items. Only use for multiple equips at once.
   */
  function equipItems(store: DimStore, items: DimItem[]): IPromise<DimItem[]> {
    // Check for (and move aside) exotics
    const extraItemsToEquip: IPromise<DimItem>[] = _.compact(items.map((i) => {
      if (i.equippingLabel) {
        const otherExotic = getOtherExoticThatNeedsDequipping(i, store);
        // If we aren't already equipping into that slot...
        if (otherExotic && !items.find((i) => i.type === otherExotic.type)) {
          const similarItem = getSimilarItem(otherExotic);
          if (!similarItem) {
            return $q.reject(new Error($i18next.t('ItemService.Deequip', { itemname: otherExotic.name })));
          }
          const target = getStoreService(similarItem).getStore(similarItem.owner)!;

          if (store.id === target.id) {
            return similarItem;
          } else {
            // If we need to get the similar item from elsewhere, do that first
            return moveTo(similarItem, store, true).then(() => similarItem);
          }
        }
      }
      return undefined;
    }));

    return $q.all(extraItemsToEquip).then((extraItems: DimItem[]) => {
      items = items.concat(extraItems);

      if (items.length === 0) {
        return $q.when([]);
      }
      if (items.length === 1) {
        return equipItem(items[0]);
      }
      return equipItemsApi(items[0])(store, items)
        .then((equippedItems) => equippedItems.map((i) => updateItemModel(i, store, store, true)));
    });
  }

  function equipItem(item: DimItem) {
    const storeService = getStoreService(item);
    if ($featureFlags.debugMoves) {
      console.log('Equip', item.name, item.type, 'to', storeService.getStore(item.owner)!.name);
    }
    return equipApi(item)(item)
      .then(() => {
        const store = storeService.getStore(item.owner)!;
        return updateItemModel(item, store, store, true);
      });
  }

  function dequipItem(item: DimItem, excludeExotic = false): IPromise<DimItem> {
    const storeService = getStoreService(item);
    const similarItem = getSimilarItem(item, [], excludeExotic);
    if (!similarItem) {
      return $q.reject(new Error($i18next.t('ItemService.Deequip', { itemname: item.name })));
    }
    const source = storeService.getStore(item.owner)!;
    const target = storeService.getStore(similarItem.owner)!;

    let p: IPromise<DimItem> = $q.when();
    if (source.id !== target.id) {
      p = moveTo(similarItem, source, true);
    }

    return p
      .then(() => equipItem(similarItem))
      .then(() => item);
  }

  function moveToVault(item: DimItem, amount: number = item.amount) {
    return moveToStore(item, getStoreService(item).getVault()!, false, amount);
  }

  function moveToStore(item: DimItem, store: DimStore, equip: boolean = false, amount: number = 0) {
    if ($featureFlags.debugMoves) {
      console.log('Move', amount, item.name, item.type, 'to', store.name, 'from', getStoreService(item).getStore(item.owner)!.name);
    }
    return transferApi(item)(item, store, amount)
      .then(() => {
        const source = getStoreService(item).getStore(item.owner)!;
        const newItem = updateItemModel(item, source, store, false, amount);
        if ((newItem.owner !== 'vault') && equip) {
          return equipItem(newItem);
        } else {
          return newItem;
        }
      });
  }

  /**
   * This returns a promise for true if the exotic can be
   * equipped. In the process it will move aside any existing exotic
   * that would conflict. If it could not move aside, this
   * rejects. It never returns false.
   */
  function canEquipExotic(item: DimItem, store: DimStore): IPromise<boolean> {
    const otherExotic = getOtherExoticThatNeedsDequipping(item, store);
    if (otherExotic) {
      return dequipItem(otherExotic, true)
        .then(() => true)
        .catch((e) => {
          throw new Error($i18next.t('ItemService.ExoticError', { itemname: item.name, slot: otherExotic.type, error: e.message }));
        });
    } else {
      return $q.resolve(true);
    }
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
    return store.items.find((i) => i.equipped && i.equippingLabel === item.equippingLabel && i.bucket.id !== item.bucket.id);
  }

  interface MoveContext {
    originalItemType: string;
    excludes: DimItem[];
    spaceLeft(s: DimStore, i: DimItem): number;
  }

  /**
   * Choose another item that we can move out of "store" in order to
   * make room for "item". We already know when this function is
   * called that store has no room for item.
   *
   * @param store the store to choose a move aside item from.
   * @param item the item we're making space for.
   * @param moveContext a helper object that can answer questions about how much space is left.
   * @return An object with item and target properties representing both the item and its destination. This won't ever be undefined.
   * @throws {Error} An error if no move aside item could be chosen.
   */
  function chooseMoveAsideItem(
    store: DimStore,
    item: DimItem,
    moveContext: MoveContext
  ): {
    item: DimItem;
    target: DimStore;
  } {
    // Check whether an item cannot or should not be moved
    function movable(otherItem) {
      return !otherItem.notransfer &&
        !moveContext.excludes.some((i) => i.id === otherItem.id && i.hash === otherItem.hash);
    }

    const stores = getStoreService(item).getStores();
    const otherStores = stores.filter((s) => s.id !== store.id);

    // Start with candidates of the same type (or vault bucket if it's vault)
    const allItems = store.isVault
      ? store.items.filter((i) => i.bucket.vaultBucket!.id === item.bucket.vaultBucket!.id)
      : store.buckets[item.bucket.id];
    const moveAsideCandidates = allItems.filter(movable);

    // if there are no candidates at all, fail
    if (moveAsideCandidates.length === 0) {
      const e: DimError = new Error($i18next.t('ItemService.NotEnoughRoom', { store: store.name, itemname: item.name }));
      e.code = 'no-space';
      throw e;
    }

    // Find any stackable that could be combined with another stack
    // on a different store to form a single stack
    if (item.maxStackSize > 1) {
      let otherStore;
      const stackable = moveAsideCandidates.find((i) => {
        if (i.maxStackSize > 1) {
          // Find another store that has an appropriate stackable
          otherStore = otherStores.find(
            (otherStore) => otherStore.items.some((otherItem) =>
              // Same basic item
              otherItem.hash === i.hash &&
                                  // Enough space to absorb this stack
                                  (i.maxStackSize - otherItem.amount) >= i.amount));
        }
        return otherStore;
      });
      if (stackable) {
        return {
          item: stackable,
          target: otherStore
        };
      }
    }

    const tierValue = {
      Common: 0,
      Uncommon: 1,
      Rare: 2,
      Legendary: 3,
      Exotic: 4
    };

    const tagValue = {
      // Infusion fuel belongs in the vault
      infuse: -1,
      // These are still good
      keep: 1,
      // Junk should probably bubble towards the character so you remember to delete them!
      junk: 2,
      // Favorites you want on your character
      favorite: 3
    };

    // A sort for items to use for ranking which item to move
    // aside. When moving from the vault we'll choose the
    // "largest" item, while moving from a character to the
    // vault (or another character) we'll use the "smallest".
    // Note, in JS "true" is greater than "false".
    const itemValueComparator: (a: DimItem, b: DimItem) => number = chainComparator(
      // prefer same type over everything
      compareBy((i) => i.type === item.typeName),
      // Engrams prefer to be in the vault, so not-engram is larger than engram
      compareBy((i) => !i.isEngram()),
      // Never unequip something
      compareBy((i) => i.equipped),
      // Always prefer keeping something that was manually moved where it is
      compareBy((i) => store.isVault ? (-1 * i.lastManuallyMoved) : (i.lastManuallyMoved)),
      // Prefer things this character can use
      compareBy((i) => !store.isVault && i.canBeEquippedBy(store)),
      // Tagged items sort by the value of their tags
      compareBy((i) => (i.dimInfo && i.dimInfo.tag) ? tagValue[i.dimInfo.tag] : 0),
      // Prefer moving lower-tier
      compareBy((i) => tierValue[i.tier]),
      // Prefer keeping higher-stat items
      compareBy((i) => i.primStat && i.primStat.value)
    );

    // Sort all candidates
    moveAsideCandidates.sort(store.isVault ? reverseComparator(itemValueComparator) : itemValueComparator);

    // A cached version of the space-left function
    const cachedSpaceLeft = _.memoize((store, item) => {
      return moveContext.spaceLeft(store, item);
    }, (store, item) => {
      // cache key
      if (item.maxStackSize > 1) {
        return store.id + item.hash;
      } else {
        return store.id + item.type;
      }
    });

    let moveAsideCandidate: {
      item: DimItem;
      target: DimStore;
    } | undefined;

    const storeService = getStoreService(item);
    const vault = storeService.getVault()!;
    moveAsideCandidates.find((candidate) => {
      // Other, non-vault stores, with the item's current
      // owner ranked last, but otherwise sorted by the
      // available space for the candidate item.
      const otherNonVaultStores = _.sortBy(
        otherStores.filter((s) => !s.isVault && s.id !== item.owner),
        (s) => cachedSpaceLeft(s, candidate)).reverse();
      otherNonVaultStores.push(storeService.getStore(item.owner)!);
      const otherCharacterWithSpace = otherNonVaultStores.find((s) => cachedSpaceLeft(s, candidate));

      if (store.isVault) { // If we're moving from the vault
        // If there's somewhere with space, put it there
        if (otherCharacterWithSpace) {
          moveAsideCandidate = {
            item: candidate,
            target: otherCharacterWithSpace
          };
          return true;
        }
      } else { // If we're moving from a character
        // If there's exactly one *slot* left on the vault, and
        // we're not moving the original item *from* the vault, put
        // the candidate on another character in order to avoid
        // gumming up the vault.
        const openVaultSlots = Math.floor(cachedSpaceLeft(vault, candidate) / candidate.maxStackSize);
        if (openVaultSlots === 1 && otherCharacterWithSpace) {
          moveAsideCandidate = {
            item: candidate,
            target: otherCharacterWithSpace
          };
          return true;
        } else {
          // Otherwise just try to shove it in the vault, and we'll
          // recursively squeeze something else out of the vault.
          moveAsideCandidate = {
            item: candidate,
            target: vault
          };
          return true;
        }
      }

      return false;
    });

    if (!moveAsideCandidate) {
      const e: DimError = new Error($i18next.t('ItemService.NotEnoughRoom', { store: store.name, itemname: item.name }));
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
  function canMoveToStore(item: DimItem, store: DimStore, amount: number, options: {
    triedFallback?: boolean;
    excludes?: DimItem[];
    reservations?: { [storeId: number]: number };
    numRetries?: number;
  } = {}): IPromise<void> {
    const { triedFallback = false, excludes = [], reservations = {}, numRetries = 0 } = options;
    const storeService = getStoreService(item);

    function spaceLeftWithReservations(s, i) {
      let left = s.spaceLeftForItem(i);
      // minus any reservations
      if (reservations[s.id] && reservations[s.id][i.type]) {
        left -= reservations[s.id][i.type];
      }
      // but not counting the original item that's moving
      if (s.id === item.owner && i.type === item.type && !item.location.inPostmaster) {
        left--;
      }
      return Math.max(0, left);
    }

    if (item.owner === store.id && !item.location.inPostmaster) {
      return $q.resolve(true);
    }

    const stores = storeService.getStores();

    // How much space will be needed (in amount, not stacks) in the target store in order to make the transfer?
    const storeReservations: { [storeId: string]: number } = {};
    storeReservations[store.id] = amount;

    // guardian-to-guardian transfer will also need space in the vault
    if (item.owner !== 'vault' && !store.isVault && item.owner !== store.id) {
      storeReservations.vault = amount;
    }

    // How many moves (in amount, not stacks) are needed from each
    const movesNeeded = {};
    stores.forEach((s) => {
      if (storeReservations[s.id]) {
        movesNeeded[s.id] = Math.max(0, storeReservations[s.id] - spaceLeftWithReservations(s, item));
      }
    });

    if (!_.any(movesNeeded)) {
      return $q.resolve(true);
    } else if (store.isVault || triedFallback) {
      // Move aside one of the items that's in the way
      const moveContext: MoveContext = {
        originalItemType: item.type,
        excludes,
        spaceLeft(s, i) {
          let left = spaceLeftWithReservations(s, i);
          if (i.type === this.originalItemType) {
            left = left - storeReservations[s.id];
          }
          return Math.max(0, left);
        }
      };

      // Move starting from the vault (which is always last)
      const moves = _.pairs(movesNeeded)
            .reverse()
            .find(([_, moveAmount]) => moveAmount > 0)!;
      const moveAsideSource = storeService.getStore(moves[0])!;
      const { item: moveAsideItem, target: moveAsideTarget } = chooseMoveAsideItem(moveAsideSource, item, moveContext);

      if (!moveAsideTarget || (!moveAsideTarget.isVault && moveAsideTarget.spaceLeftForItem(moveAsideItem) <= 0)) {
        const itemtype = (moveAsideTarget.isVault
          ? (moveAsideItem.destinyVersion === 1
            ? moveAsideItem.bucket.sort
            : '')
          : moveAsideItem.type);
        const error: DimError = new Error($i18next.t(`ItemService.BucketFull.${moveAsideTarget.isVault ? 'Vault' : 'Guardian'}`,
          { itemtype, store: moveAsideTarget.name, context: moveAsideTarget.gender }));
        error.code = 'no-space';
        return $q.reject(error);
      } else {
        // Make one move and start over!
        return moveTo(moveAsideItem, moveAsideTarget, false, moveAsideItem.amount, excludes)
          .then(() => canMoveToStore(item, store, amount, options))
          .catch((e) => {
            if (numRetries < 3) {
              // Exclude this item and try again so we pick another
              excludes.push(moveAsideItem);
              options.excludes = excludes;
              options.numRetries = numRetries + 1;
              console.error(`Unable to move aside ${moveAsideItem.name} to ${moveAsideTarget.name}. Trying again.`, e);
              return canMoveToStore(item, store, amount, options);
            } else {
              throw e;
            }
          });
      }
    } else {
      // Refresh the stores to see if anything has changed
      const reloadPromise = (item.destinyVersion === 2 ? throttledD2ReloadStores() : throttledReloadStores()) ||
            $q.when(storeService.getStores());
      const storeId = store.id;
      return reloadPromise.then((reloadedStores) => {
        options.triedFallback = true;
        // TODO: undefined reloadedStores means there was an error loading stores. When we return errors here, rethrow.
        if (!reloadedStores) {
          return canMoveToStore(item, store, amount, options);
        }
        const reloadedStore = reloadedStores.find((s) => s.id === storeId);
        if (!reloadedStore) {
          throw new Error("Can't find the store to move to.");
        }
        return canMoveToStore(item, reloadedStore, amount, options);
      });
    }
  }

  /**
   * Returns if possible, or throws an exception if the item can't be equipped.
   */
  function canEquip(item: DimItem, store: DimStore): void {
    if (item.canBeEquippedBy(store)) {
      return;
    } else if (item.classified) {
      throw new Error($i18next.t('ItemService.Classified'));
    } else {
      const message = (item.classTypeName === 'unknown')
          ? $i18next.t('ItemService.OnlyEquippedLevel', { level: item.equipRequiredLevel })
          : $i18next.t('ItemService.OnlyEquippedClassLevel', { class: item.classTypeNameLocalized.toLowerCase(), level: item.equipRequiredLevel });

      const error: DimError = new Error(message);
      error.code = 'wrong-level';
      throw error;
    }
  }

  /**
   * Check whether this transfer can happen. If necessary, make secondary inventory moves
   * in order to make the primary transfer possible, such as making room or dequipping exotics.
   */
  function isValidTransfer(equip: boolean, store: DimStore, item: DimItem, amount: number, excludes?: DimItem[], reservations?: { [storeId: number]: number }): IPromise<any> {
    let promise = $q.when();

    if (equip) {
      promise = promise.then(() => canEquip(item, store));
      if (item.equippingLabel) {
        promise = promise.then(() => canEquipExotic(item, store));
      }
    }

    return promise.then(() => canMoveToStore(item, store, amount, { excludes, reservations }));
  }

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
  function moveTo(item: DimItem, target: DimStore, equip: boolean = false, amount: number = item.amount, excludes?: DimItem[], reservations?: { [storeId: number]: number }): IPromise<DimItem> {
    // Reassign the target store to the active store if we're moving the item to an account-wide bucket
    if (!target.isVault && item.bucket.accountWide) {
      target = getStoreService(item).getActiveStore()!;
    }

    return isValidTransfer(equip, target, item, amount, excludes, reservations)
      .then(() => {
        const storeService = getStoreService(item);
        // Replace the target store - isValidTransfer may have reloaded it
        target = storeService.getStore(target.id)!;
        const source = storeService.getStore(item.owner)!;

        let promise: IPromise<DimItem> = $q.when(item);

        if (!source.isVault && !target.isVault) { // Guardian to Guardian
          if (source.id !== target.id) { // Different Guardian
            if (item.equipped) {
              promise = promise.then(dequipItem);
            }

            promise = promise
              .then((item) => moveToVault(item, amount))
              .then((item) => moveToStore(item, target, equip, amount));
          }

          if (item.location.inPostmaster) {
            promise = promise.then((item) => moveToStore(item, target));
          } else if (equip) {
            promise = promise.then((item) => (item.equipped ? item : equipItem(item)));
          } else if (!equip) {
            promise = promise.then((item) => (item.equipped ? dequipItem(item) : item));
          }
        } else if (source.isVault && target.isVault) { // Vault to Vault
          // Do Nothing.
        } else if (source.isVault || target.isVault) { // Guardian to Vault
          if (item.equipped) {
            promise = promise.then(dequipItem);
          }

          promise = promise.then((item) => moveToStore(item, target, equip, amount));
        }

        return promise;
      });
  }
}
