import copy from 'fast-copy';
import _ from 'lodash';
import { queuedAction } from '../inventory/action-queue';
import { SyncService } from '../storage/sync.service';
import { DimItem } from '../inventory/item-types';
import { DimStore, StoreServiceType } from '../inventory/store-types';
import { D2StoresService } from '../inventory/d2-stores';
import { D1StoresService } from '../inventory/d1-stores';
import { dimItemService, MoveReservations } from '../inventory/item-move-service';
import { t } from 'app/i18next-t';
import { default as reduxStore } from '../store/store';
import * as actions from './actions';
import { loadoutsSelector } from './reducer';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification, NotificationType } from '../notifications/notifications';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { Subject } from 'rxjs';
import { loadoutNotification } from 'app/inventory/MoveNotifications';

export enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2
}

export const loadoutClassToClassType = {
  [LoadoutClass.hunter]: DestinyClass.Hunter,
  [LoadoutClass.titan]: DestinyClass.Titan,
  [LoadoutClass.warlock]: DestinyClass.Warlock,
  [LoadoutClass.any]: DestinyClass.Unknown
};

export const classTypeToLoadoutClass = {
  [DestinyClass.Hunter]: LoadoutClass.hunter,
  [DestinyClass.Titan]: LoadoutClass.titan,
  [DestinyClass.Warlock]: LoadoutClass.warlock,
  [DestinyClass.Unknown]: LoadoutClass.any
};

export function getLoadoutClassDisplay(loadoutClass: LoadoutClass) {
  switch (loadoutClass) {
    case 0:
      return 'warlock';
    case 1:
      return 'titan';
    case 2:
      return 'hunter';
  }
  return 'any';
}

export type LoadoutItem = DimItem;

/** In memory loadout structure. */
export interface Loadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: {
    [type: string]: LoadoutItem[];
  };
  /** Platform membership ID this loadout is associated with */
  membershipId?: string;
  destinyVersion?: 1 | 2;
  // TODO: deprecate this
  platform?: string;
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
}

/** The format loadouts are stored in. */
interface DehydratedLoadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: LoadoutItem[];
  destinyVersion?: 1 | 2;
  /** Platform membership ID this loadout is associated with */
  membershipId?: string;
  platform?: string;
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
  version: 'v3.0';
}

export interface LoadoutServiceType {
  editLoadout$: Subject<{
    loadout: Loadout;
    equipAll?: boolean;
    showClass?: boolean;
    isNew?: boolean;
  }>;
  addItem$: Subject<{
    item: DimItem;
    clickEvent: MouseEvent;
  }>;
  dialogOpen: boolean;
  getLoadouts(getLatest?: boolean): Promise<Loadout[]>;
  deleteLoadout(loadout: Loadout): Promise<void>;
  saveLoadout(loadout: Loadout): Promise<Loadout | undefined>;
  addItemToLoadout(item: DimItem, $event);
  applyLoadout(store: DimStore, loadout: Loadout, allowUndo?: boolean): Promise<void>;
  editLoadout(
    loadout: Loadout,
    options: { equipAll?: boolean; showClass?: boolean; isNew?: boolean }
  ): void;
}

// TODO: un-object-ify, this holds no state!
// at least, once dialogOpen is gone

export const dimLoadoutService = LoadoutService();

function LoadoutService(): LoadoutServiceType {
  function getStoresService(destinyVersion) {
    // TODO: this needs to use account, store, or item version
    return destinyVersion === 2 ? D2StoresService : D1StoresService;
  }

  return {
    editLoadout$: new Subject<{
      loadout: Loadout;
      equipAll?: boolean;
      showClass?: boolean;
      isNew?: boolean;
    }>(),
    addItem$: new Subject<{
      item: DimItem;
      clickEvent: MouseEvent;
    }>(),
    dialogOpen: false,
    getLoadouts,
    deleteLoadout,
    saveLoadout,
    addItemToLoadout,
    applyLoadout,
    editLoadout
  };

  function editLoadout(
    loadout: Loadout,
    { equipAll = false, showClass = true, isNew = true } = {}
  ) {
    this.editLoadout$.next({
      loadout,
      equipAll,
      showClass,
      isNew
    });
  }

  function addItemToLoadout(item: DimItem, $event) {
    this.addItem$.next({
      item,
      clickEvent: $event
    });
  }

  function processLoadout(data, version): Loadout[] {
    if (!data) {
      return [];
    }

    let loadouts: Loadout[] = [];
    if (version === 'v3.0') {
      const ids = data['loadouts-v3.0'];
      loadouts = ids.filter((id) => data[id]).map((id) => hydrate(data[id]));
    }

    const objectTest = (item) => _.isObject(item) && !(Array.isArray(item) || _.isFunction(item));
    const hasGuid = (item) => _.has(item, 'id') && isGuid(item.id);
    const loadoutGuids = new Set(loadouts.map((i) => i.id));
    const containsLoadoutGuids = (item) => loadoutGuids.has(item.id);

    const orphanIds = Object.values(data)
      .filter((item) => {
        return objectTest(item) && hasGuid(item) && !containsLoadoutGuids(item);
      })
      .map((i: DehydratedLoadout) => i.id);

    if (orphanIds.length > 0) {
      SyncService.remove(orphanIds);
    }

    return loadouts;
  }

  async function getLoadouts(getLatest = false): Promise<Loadout[]> {
    const loadouts = loadoutsSelector(reduxStore.getState());
    // Avoids the hit going to data store if we have data already.
    if (!getLatest && loadouts.length) {
      return loadouts;
    }

    const data = await SyncService.get();
    const newLoadouts = 'loadouts-v3.0' in data ? processLoadout(data, 'v3.0') : [];
    if (getLatest || newLoadouts.length) {
      reduxStore.dispatch(actions.loaded(newLoadouts));
    }
    return loadoutsSelector(reduxStore.getState());
  }

  async function saveLoadouts(loadouts: Loadout[]): Promise<Loadout[]> {
    const loadoutPrimitives = loadouts.map(dehydrate);

    const data = {
      'loadouts-v3.0': loadoutPrimitives.map((l) => l.id),
      ..._.keyBy(loadoutPrimitives, (l) => l.id)
    };

    await SyncService.set(data);
    return loadouts;
  }

  async function deleteLoadout(loadout: Loadout): Promise<void> {
    await getLoadouts(); // make sure we have loaded all loadouts first!
    reduxStore.dispatch(actions.deleteLoadout(loadout.id));
    await SyncService.remove(loadout.id);
    await saveLoadouts(reduxStore.getState().loadouts.loadouts);
  }

  async function saveLoadout(loadout: Loadout): Promise<Loadout | undefined> {
    const loadouts = await getLoadouts();
    const clashingLoadout = getClashingLoadout(loadouts, loadout);

    if (!clashingLoadout) {
      reduxStore.dispatch(actions.updateLoadout(loadout));
      await saveLoadouts(reduxStore.getState().loadouts.loadouts);
    }

    return clashingLoadout;
  }

  function getClashingLoadout(loadouts: Loadout[], newLoadout: Loadout): Loadout | undefined {
    return loadouts.find(
      (loadout) =>
        loadout.name === newLoadout.name &&
        loadout.id !== newLoadout.id &&
        loadout.classType === newLoadout.classType
    );
  }

  function hydrate(loadoutData: DehydratedLoadout): Loadout {
    const hydration = {
      'v3.0': hydratev3d0
    };

    return hydration[loadoutData.version](loadoutData);
  }

  // A special getItem that takes into account the fact that
  // subclasses have unique IDs, and emblems/shaders/etc are interchangeable.
  function getLoadoutItem(pseudoItem: DimItem, store: DimStore): DimItem | null {
    let item = store.getStoresService().getItemAcrossStores(_.omit(pseudoItem, 'amount'));
    if (!item) {
      return null;
    }
    if (['Class', 'Shader', 'Emblem', 'Emote', 'Ship', 'Horn'].includes(item.type)) {
      // Same character first
      item =
        store.items.find((i) => i.hash === pseudoItem.hash) ||
        // Then other characters
        store.getStoresService().getItemAcrossStores({ hash: item.hash }) ||
        item;
    }
    return item;
  }

  /**
   * Apply a loadout - a collection of items to be moved and possibly equipped all at once.
   * @param allowUndo whether to include this loadout in the "undo loadout" menu stack.
   * @return a promise for the completion of the whole loadout operation.
   */
  async function applyLoadout(store: DimStore, loadout: Loadout, allowUndo = false): Promise<void> {
    if (!store) {
      throw new Error('You need a store!');
    }

    if ($featureFlags.debugMoves) {
      console.log('LoadoutService: Apply loadout', loadout.name, 'to', store.name);
    }

    const applyLoadoutFn = queuedAction(doApplyLoadout);
    const loadoutPromise = applyLoadoutFn(store, loadout, allowUndo);
    loadingTracker.addPromise(loadoutPromise);

    if ($featureFlags.moveNotifications) {
      showNotification(
        loadoutNotification(
          loadout,
          store,
          // TODO: allow for an error view function to be passed in
          // TODO: cancel button!
          loadoutPromise.then((scope) => {
            if (scope.failed > 0) {
              if (scope.failed === scope.total) {
                throw new Error(t('Loadouts.AppliedError'));
              } else {
                throw new Error(
                  t('Loadouts.AppliedWarn', { failed: scope.failed, total: scope.total })
                );
              }
            }
          })
        )
      );
    }

    const scope = await loadoutPromise;

    if (!$featureFlags.moveNotifications) {
      let value: NotificationType = 'success';

      let message = t('Loadouts.Applied', {
        // t('Loadouts.Applied_male')
        // t('Loadouts.Applied_female')
        // t('Loadouts.Applied_male_plural')
        // t('Loadouts.Applied_female_plural')
        count: scope.total,
        store: store.name,
        context: store.gender && store.gender.toLowerCase()
      });

      if (scope.failed > 0) {
        if (scope.failed === scope.total) {
          value = 'error';
          message = t('Loadouts.AppliedError');
        } else {
          value = 'warning';
          message = t('Loadouts.AppliedWarn', { failed: scope.failed, total: scope.total });
        }
      }

      showNotification({ type: value, title: loadout.name, body: message });
    }
  }

  async function doApplyLoadout(store: DimStore, loadout: Loadout, allowUndo = false) {
    const storeService = store.getStoresService();
    if (allowUndo && !store.isVault) {
      reduxStore.dispatch(
        actions.savePreviousLoadout({
          storeId: store.id,
          loadoutId: loadout.id,
          previousLoadout: store.loadoutFromCurrentlyEquipped(
            t('Loadouts.Before', { name: loadout.name })
          )
        })
      );
    }

    let items: DimItem[] = copy(Object.values(loadout.items)).flat();

    const loadoutItemIds = items.map((i) => {
      return {
        id: i.id,
        hash: i.hash
      };
    });

    // Only select stuff that needs to change state
    let totalItems = items.length;
    items = items.filter((pseudoItem) => {
      const item = getLoadoutItem(pseudoItem, store);
      // provide a more accurate count of total items
      if (!item) {
        totalItems--;
        return true;
      }

      const notAlreadyThere =
        item.owner !== store.id ||
        item.location.inPostmaster ||
        // Needs to be equipped. Stuff not marked "equip" doesn't
        // necessarily mean to de-equip it.
        (pseudoItem.equipped && !item.equipped) ||
        pseudoItem.amount > 1;

      return notAlreadyThere;
    });

    // only try to equip subclasses that are equippable, since we allow multiple in a loadout
    items = items.filter((item) => {
      const ok = item.type !== 'Class' || !item.equipped || item.canBeEquippedBy(store);
      if (!ok) {
        totalItems--;
      }
      return ok;
    });

    // vault can't equip
    if (store.isVault) {
      items.forEach((i) => {
        i.equipped = false;
      });
    }

    // We'll equip these all in one go!
    let itemsToEquip = items.filter((i) => i.equipped);
    if (itemsToEquip.length > 1) {
      // we'll use the equipItems function
      itemsToEquip.forEach((i) => {
        i.equipped = false;
      });
    }

    // Stuff that's equipped on another character. We can bulk-dequip these
    const itemsToDequip = items.filter((pseudoItem) => {
      const item = storeService.getItemAcrossStores(pseudoItem);
      return item && item.owner !== store.id && item.equipped;
    });

    const scope = {
      failed: 0,
      total: totalItems,
      successfulItems: [] as DimItem[],
      errors: [] as {
        item: DimItem | null;
        message: string;
        level: string;
      }[]
    };

    if (itemsToDequip.length > 1) {
      const realItemsToDequip = _.compact(
        itemsToDequip.map((i) => storeService.getItemAcrossStores(i))
      );
      const dequips = _.map(_.groupBy(realItemsToDequip, (i) => i.owner), (dequipItems, owner) => {
        const equipItems = _.compact(
          dequipItems.map((i) => dimItemService.getSimilarItem(i, loadoutItemIds))
        );
        return dimItemService.equipItems(storeService.getStore(owner)!, equipItems);
      });
      await Promise.all(dequips);
    }

    await applyLoadoutItems(store, items, loadoutItemIds, scope);

    let equippedItems: DimItem[];
    if (itemsToEquip.length > 1) {
      // Use the bulk equipAll API to equip all at once.
      itemsToEquip = itemsToEquip.filter((i) => scope.successfulItems.find((si) => si.id === i.id));
      const realItemsToEquip = _.compact(itemsToEquip.map((i) => getLoadoutItem(i, store)));
      equippedItems = await dimItemService.equipItems(store, realItemsToEquip);
    } else {
      equippedItems = itemsToEquip;
    }

    if (equippedItems.length < itemsToEquip.length) {
      const failedItems = itemsToEquip.filter((i) => {
        return !equippedItems.find((it) => it.id === i.id);
      });
      failedItems.forEach((item) => {
        scope.failed++;
        scope.errors.push({
          level: 'error',
          item,
          message: t('Loadouts.CouldNotEquip', { itemname: item.name })
        });
        if (!$featureFlags.moveNotifications) {
          showNotification({
            type: 'error',
            title: loadout.name,
            body: t('Loadouts.CouldNotEquip', { itemname: item.name })
          });
        }
      });
    }

    // We need to do this until https://github.com/DestinyItemManager/DIM/issues/323
    // is fixed on Bungie's end. When that happens, just remove this call.
    if (scope.successfulItems.length > 0) {
      await storeService.updateCharacters();
    }

    if (loadout.clearSpace) {
      const allItems = _.compact(
        Object.values(loadout.items)
          .flat()
          .map((i) => getLoadoutItem(i, store))
      );
      await clearSpaceAfterLoadout(storeService.getStore(store.id)!, allItems, storeService);
    }

    return scope;
  }

  // Move one loadout item at a time. Called recursively to move items!
  async function applyLoadoutItems(
    store: DimStore,
    items: DimItem[],
    loadoutItemIds: { id: string; hash: number }[],
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
  ) {
    if (items.length === 0) {
      // We're done!
      return;
    }

    const pseudoItem = items.shift()!;
    const item = getLoadoutItem(pseudoItem, store);

    try {
      if (item) {
        if (item.maxStackSize > 1) {
          // handle consumables!
          const amountAlreadyHave = store.amountOfItem(pseudoItem);
          let amountNeeded = pseudoItem.amount - amountAlreadyHave;
          if (amountNeeded > 0) {
            const otherStores = store
              .getStoresService()
              .getStores()
              .filter((otherStore) => store.id !== otherStore.id);
            const storesByAmount = _.sortBy(
              otherStores.map((store) => {
                return {
                  store,
                  amount: store.amountOfItem(pseudoItem)
                };
              }),
              'amount'
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
                    requested: pseudoItem.amount
                  })
                );
                error.level = 'warn';
                throw error;
              }

              source.amount -= amountToMove;
              amountNeeded -= amountToMove;
              totalAmount += amountToMove;

              await dimItemService.moveTo(sourceItem, store, false, amountToMove, loadoutItemIds);
            }
          }
        } else {
          // Pass in the list of items that shouldn't be moved away
          await dimItemService.moveTo(
            item,
            store,
            pseudoItem.equipped,
            item.amount,
            loadoutItemIds
          );
        }
      }

      if (item) {
        scope.successfulItems.push(item);
      }
    } catch (e) {
      const level = e.level || 'error';
      if (level === 'error') {
        scope.failed++;
      }
      scope.errors.push({
        item,
        level: e.level,
        message: e.message
      });
      if (!$featureFlags.moveNotifications) {
        showNotification({
          type: e.level || 'error',
          title: item ? item.name : 'Unknown',
          body: e.message
        });
      }
    }

    // Keep going
    return applyLoadoutItems(store, items, loadoutItemIds, scope);
  }

  function hydratev3d0(loadoutPrimitive: DehydratedLoadout): Loadout {
    const result: Loadout = {
      id: loadoutPrimitive.id,
      name: loadoutPrimitive.name,
      platform: loadoutPrimitive.platform,
      membershipId: loadoutPrimitive.membershipId,
      destinyVersion: loadoutPrimitive.destinyVersion,
      classType: loadoutPrimitive.classType === undefined ? -1 : loadoutPrimitive.classType,
      items: {
        unknown: []
      },
      clearSpace: loadoutPrimitive.clearSpace
    };

    // Blizzard.net is no more, they're all Steam now
    if (result.platform && result.platform === 'Blizzard') {
      result.platform = 'Steam';
    }

    for (const itemPrimitive of loadoutPrimitive.items) {
      const item = copy(
        getStoresService(result.destinyVersion).getItemAcrossStores({
          id: itemPrimitive.id,
          hash: itemPrimitive.hash
        })
      );

      if (item) {
        const discriminator = item.type.toLowerCase();

        item.equipped = itemPrimitive.equipped;

        item.amount = itemPrimitive.amount;

        result.items[discriminator] = result.items[discriminator] || [];
        result.items[discriminator].push(item);
      } else {
        const loadoutItem = {
          id: itemPrimitive.id,
          hash: itemPrimitive.hash,
          amount: itemPrimitive.amount,
          equipped: itemPrimitive.equipped
        };

        result.items.unknown.push(loadoutItem as DimItem);
      }
    }

    return result;
  }

  function dehydrate(loadout: Loadout): DehydratedLoadout {
    const allItems = Object.values(loadout.items).flat();
    const items = allItems.map((item) => {
      return {
        id: item.id,
        hash: item.hash,
        amount: item.amount,
        equipped: item.equipped
      };
    }) as DimItem[];

    return {
      id: loadout.id,
      name: loadout.name,
      classType: loadout.classType,
      version: 'v3.0',
      platform: loadout.platform,
      destinyVersion: loadout.destinyVersion,
      clearSpace: loadout.clearSpace,
      items
    };
  }
}

// Pass in full loadout and store objects. loadout should have all types of weapon and armor
// or it won't be accurate. function properly supports guardians w/o artifacts
// returns to tenth decimal place.
export function getLight(store: DimStore, loadout: Loadout): number {
  // https://www.reddit.com/r/DestinyTheGame/comments/6yg4tw/how_overall_power_level_is_calculated/
  let itemWeight = {
    Weapons: 6,
    Armor: 5,
    General: 4
  };
  // 3 Weapons, 4 Armor, 2 General
  let itemWeightDenominator = 46;
  if (store.isDestiny2()) {
    // 3 Weapons, 4 Armor, 1 General
    itemWeight = {
      Weapons: 1,
      Armor: 1,
      General: 1
    };
    itemWeightDenominator = 8;
  } else if (store.level === 40) {
    // 3 Weapons, 4 Armor, 3 General
    itemWeightDenominator = 50;
  }

  const items = Object.values(loadout.items)
    .flat()
    .filter((i) => i.equipped);

  const exactLight =
    items.reduce((memo, item) => {
      return (
        memo +
        item.primStat!.value * itemWeight[item.type === 'ClassItem' ? 'General' : item.bucket.sort!]
      );
    }, 0) / itemWeightDenominator;

  return Math.floor(exactLight * 10) / 10;
}

function isGuid(stringToTest: string) {
  if (!stringToTest || !stringToTest.length) {
    return false;
  }

  if (stringToTest[0] === '{') {
    stringToTest = stringToTest.substring(1, stringToTest.length - 1);
  }

  const regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}$/gi;

  return regexGuid.test(stringToTest);
}

const outOfSpaceWarning = _.throttle((store) => {
  showNotification({
    type: 'info',
    title: t('FarmingMode.OutOfRoomTitle'),
    body: t('FarmingMode.OutOfRoom', { character: store.name })
  });
}, 60000);

function clearSpaceAfterLoadout(
  store: DimStore,
  items: DimItem[],
  storesService: StoreServiceType
) {
  const itemsByType = _.groupBy(items, (i) => i.bucket.id);

  const reservations: MoveReservations = {};
  // reserve one space in the active character
  reservations[store.id] = {};

  const itemsToRemove: DimItem[] = [];

  _.forIn(itemsByType, (loadoutItems, bucketId) => {
    // Blacklist a handful of buckets from being cleared out
    if (['Consumable', 'Consumables', 'Material'].includes(loadoutItems[0].bucket.type!)) {
      return;
    }
    let numUnequippedLoadoutItems = 0;
    for (const existingItem of store.buckets[bucketId]) {
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
    reservations[store.id] = loadoutItems[0].bucket.capacity - numUnequippedLoadoutItems;
  });

  return clearItemsOffCharacter(store, itemsToRemove, reservations, storesService);
}

/**
 * Move a list of items off of a character to the vault (or to other characters if the vault is full).
 *
 * Shows a warning if there isn't any space.
 */
export async function clearItemsOffCharacter(
  store: DimStore,
  items: DimItem[],
  reservations: MoveReservations,
  storesService: StoreServiceType
) {
  for (const item of items) {
    try {
      // Move a single item. We reevaluate each time in case something changed.
      const vault = storesService.getVault()!;
      const vaultSpaceLeft = vault.spaceLeftForItem(item);
      if (vaultSpaceLeft <= 1) {
        // If we're down to one space, try putting it on other characters
        const otherStores = storesService
          .getStores()
          .filter((s) => !s.isVault && s.id !== store.id);
        const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

        if (otherStoresWithSpace.length) {
          if ($featureFlags.debugMoves) {
            console.log(
              'clearItemsOffCharacter initiated move:',
              item.amount,
              item.name,
              item.type,
              'to',
              otherStoresWithSpace[0].name,
              'from',
              storesService.getStore(item.owner)!.name
            );
          }
          await dimItemService.moveTo(
            item,
            otherStoresWithSpace[0],
            false,
            item.amount,
            items,
            reservations
          );
          continue;
        } else if (vaultSpaceLeft === 0) {
          outOfSpaceWarning(store);
          continue;
        }
      }
      if ($featureFlags.debugMoves) {
        console.log(
          'clearItemsOffCharacter initiated move:',
          item.amount,
          item.name,
          item.type,
          'to',
          vault.name,
          'from',
          storesService.getStore(item.owner)!.name
        );
      }
      await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
    } catch (e) {
      if (e.code === 'no-space') {
        outOfSpaceWarning(store);
      } else {
        showNotification({ type: 'error', title: item.name, body: e.message });
      }
    }
  }
}
