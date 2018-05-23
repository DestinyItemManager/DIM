import { copy, IPromise, IQService } from 'angular';
import * as _ from 'underscore';
import uuidv4 from 'uuid/v4';
import { queueAction } from '../inventory/action-queue';
import { ItemServiceType } from '../inventory/dimItemService.factory';
import { settings } from '../settings/settings';
import { SyncService } from '../storage/sync.service';
import { DimItem } from '../inventory/item-types';
import { DimStore, StoreServiceType } from '../inventory/store-types';

export const enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2
}

type LoadoutItem = DimItem;

// TODO: move into loadouts service
export interface Loadout {
  id?: string;
  classType: LoadoutClass;
  name: string;
  items: {
    [type: string]: LoadoutItem[];
  };
  destinyVersion?: 1 | 2;
  platform?: string;
}

interface DehydratedLoadout {
  id?: string;
  classType: LoadoutClass;
  name: string;
  items: LoadoutItem[];
  destinyVersion?: 1 | 2;
  platform?: string;
  version: 'v3.0';
}

export interface LoadoutServiceType {
  dialogOpen: boolean;
  previousLoadouts: { [characterId: string]: Loadout[] };
  getLoadouts(getLatest?: boolean): IPromise<Loadout[]>;
  deleteLoadout(loadout: Loadout): IPromise<Loadout[]>;
  saveLoadout(loadout: Loadout): IPromise<Loadout[]>;
  addItemToLoadout(item: DimItem, $event);
  applyLoadout(store: DimStore, loadout: Loadout, allowUndo?: boolean): IPromise<void>;
  getLight(store: DimStore, loadout: Loadout): string;
}

export function LoadoutService(
  $q: IQService,
  $rootScope: angular.IRootScopeService,
  $i18next,
  dimItemService: ItemServiceType,
  dimStoreService: StoreServiceType,
  D2StoresService: StoreServiceType,
  toaster,
  loadingTracker
): LoadoutServiceType {
  'ngInject';

  function getStoreService(destinyVersion = settings.destinyVersion) {
    // TODO: this needs to use account, store, or item version
    return destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  let _loadouts: Loadout[] = [];
  const _previousLoadouts: { [characterId: string]: Loadout[] } = {}; // by character ID

  return {
    dialogOpen: false,
    getLoadouts,
    deleteLoadout,
    saveLoadout,
    addItemToLoadout,
    applyLoadout,
    getLight,
    previousLoadouts: _previousLoadouts
  };

  function addItemToLoadout(item: DimItem, $event) {
    $rootScope.$broadcast('dim-store-item-clicked', {
      item,
      clickEvent: $event
    });
  }

  function isGuid(stringToTest: string) {
    if (stringToTest[0] === "{") {
      stringToTest = stringToTest.substring(1, stringToTest.length - 1);
    }

    const regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}$/gi;

    return regexGuid.test(stringToTest);
  }

  function processLoadout(data, version): Loadout[] {
    if (!data) {
      return [];
    }

    let loadouts: Loadout[] = [];
    if (version === 'v3.0') {
      const ids = data['loadouts-v3.0'];
      loadouts = ids.map((id) => {
        // Mark all the items as being in loadouts
        data[id].items.forEach((item) => {
          const itemFromStore = getStoreService().getItemAcrossStores({
            id: item.id,
            hash: item.hash
          });
          if (itemFromStore) {
            itemFromStore.isInLoadout = true;
          }
        });
        return hydrate(data[id]);
      });
    }

    const objectTest = (item) => _.isObject(item) && !(_.isArray(item) || _.isFunction(item));
    const hasGuid = (item) => _.has(item, 'id') && isGuid(item.id);
    const loadoutGuids = new Set(loadouts.map((i) => i.id));
    const containsLoadoutGuids = (item) => loadoutGuids.has(item.id);

    const orphanIds = Object.values(data).filter((item) => {
      return objectTest(item) &&
        hasGuid(item) &&
        !containsLoadoutGuids(item);
    }).map((i: any) => i.id);

    if (orphanIds.length > 0) {
      SyncService.remove(orphanIds);
    }

    return loadouts;
  }

  function getLoadouts(getLatest = false): IPromise<Loadout[]> {
    // Avoids the hit going to data store if we have data already.
    if (getLatest || !_loadouts.length) {
      return $q.when(SyncService.get()
        .then((data) => {
          if (_.has(data, 'loadouts-v3.0')) {
            return processLoadout(data, 'v3.0');
          } else {
            return [];
          }
        })
        .then((newLoadouts) => {
          _loadouts = newLoadouts;
          return _loadouts;
        }));
    } else {
      return $q.when(_loadouts);
    }
  }

  function saveLoadouts(loadouts: Loadout[]): IPromise<Loadout[]> {
    return $q.when(loadouts || getLoadouts())
      .then((loadouts) => {
        _loadouts = loadouts;

        const loadoutPrimitives = _.map(loadouts, dehydrate);

        const data = {
          'loadouts-v3.0': [] as string[]
        };

        _.each(loadoutPrimitives, (l) => {
          data['loadouts-v3.0'].push(l.id!);
          data[l.id!] = l;
        });

        return SyncService.set(data).then(() => loadouts) as IPromise<Loadout[]>;
      });
  }

  function deleteLoadout(loadout: Loadout): IPromise<Loadout[]> {
    return getLoadouts()
      .then((loadouts) => {
        const index = _.findIndex(loadouts, { id: loadout.id });
        if (index >= 0) {
          loadouts.splice(index, 1);
        }

        return SyncService.remove(loadout.id!.toString()).then(() => loadouts) as IPromise<Loadout[]>;
      })
      .then(saveLoadouts)
      .then((loadouts) => {
        $rootScope.$broadcast('dim-delete-loadout', {
          loadout
        });

        return loadouts;
      });
  }

  function saveLoadout(loadout: Loadout): IPromise<Loadout[]> {
    return getLoadouts()
      .then((loadouts) => {
        if (!_.has(loadout, 'id')) {
          loadout.id = uuidv4();
        }

        // Handle overwriting an old loadout
        const existingLoadoutIndex = _.findIndex(loadouts, { id: loadout.id });
        if (existingLoadoutIndex > -1) {
          loadouts[existingLoadoutIndex] = loadout;
        } else {
          loadouts.push(loadout);
        }

        return saveLoadouts(loadouts);
      })
      .then((loadouts) => {
        $rootScope.$broadcast('dim-filter-invalidate');
        $rootScope.$broadcast('dim-save-loadout', {
          loadout
        });

        return loadouts;
      });
  }

  function hydrate(loadoutData: DehydratedLoadout): Loadout {
    const hydration = {
      'v3.0': hydratev3d0
    };

    return (hydration[(loadoutData.version)])(loadoutData);
  }

  // A special getItem that takes into account the fact that
  // subclasses have unique IDs, and emblems/shaders/etc are interchangeable.
  function getLoadoutItem(pseudoItem: DimItem, store: DimStore): DimItem | null {
    let item = getStoreService(store.destinyVersion).getItemAcrossStores(pseudoItem);
    if (!item) {
      return null;
    }
    if (_.contains(['Class', 'Shader', 'Emblem', 'Emote', 'Ship', 'Horn'], item.type)) {
      item = _.find(store.items, {
        hash: pseudoItem.hash
      }) || item;
    }
    return item;
  }

  // Pass in full loadout and store objects. loadout should have all types of weapon and armor
  // or it won't be accurate. function properly supports guardians w/o artifacts
  // returns to tenth decimal place.
  function getLight(store: DimStore, loadout: Loadout): string {
    // https://www.reddit.com/r/DestinyTheGame/comments/6yg4tw/how_overall_power_level_is_calculated/
    const itemWeight = {
      Weapons: 6,
      Armor: 5,
      General: 4
    };
    // 3 Weapons, 4 Armor, 2 General
    let itemWeightDenominator = 46;
    if (store.destinyVersion === 2) {
      // 3 Weapons, 4 Armor, 1 General
      itemWeightDenominator = 42;
    } else if (store.level === 40) {
      // 3 Weapons, 4 Armor, 3 General
      itemWeightDenominator = 50;
    }

    const items = _.flatten(Object.values(loadout.items)).filter((i) => i.equipped);

    const exactLight = _.reduce(items, (memo, item) => {
      return memo + (item.primStat.value * itemWeight[item.type === 'ClassItem' ? 'General' : item.location.sort]);
    }, 0) / itemWeightDenominator;

    // Floor-truncate to one significant digit since the game doesn't round
    return (Math.floor(exactLight * 10) / 10).toFixed(1);
  }

  /**
   * Apply a loadout - a collection of items to be moved and possibly equipped all at once.
   * @param allowUndo whether to include this loadout in the "undo loadout" menu stack.
   * @return a promise for the completion of the whole loadout operation.
   */
  function applyLoadout(store: DimStore, loadout: Loadout, allowUndo = false): IPromise<void> {
    if (!store) {
      throw new Error("You need a store!");
    }
    const storeService = getStoreService(store.destinyVersion);

    if ($featureFlags.debugMoves) {
      console.log("LoadoutService: Apply loadout", loadout.name, "to", store.name);
    }

    return queueAction(() => {
      if (allowUndo) {
        if (!_previousLoadouts[store.id]) {
          _previousLoadouts[store.id] = [];
        }

        if (!store.isVault) {
          const lastPreviousLoadout = _.last(_previousLoadouts[store.id]);
          if (lastPreviousLoadout && loadout.id === lastPreviousLoadout.id) {
            _previousLoadouts[store.id].pop();
          } else {
            const previousLoadout = store.loadoutFromCurrentlyEquipped($i18next.t('Loadouts.Before', { name: loadout.name }));
            _previousLoadouts[store.id].push(previousLoadout);
          }
        }
      }

      let items: DimItem[] = copy(_.flatten(Object.values(loadout.items)));

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

        const notAlreadyThere = item.owner !== store.id ||
              item.location.inPostmaster ||
              // Needs to be equipped. Stuff not marked "equip" doesn't
              // necessarily mean to de-equip it.
              (pseudoItem.equipped && !item.equipped);

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
        items.forEach((i) => { i.equipped = false; });
      }

      // We'll equip these all in one go!
      let itemsToEquip = items.filter((i) => i.equipped);
      if (itemsToEquip.length > 1) {
        // we'll use the equipItems function
        itemsToEquip.forEach((i) => { i.equipped = false; });
      }

      // Stuff that's equipped on another character. We can bulk-dequip these
      const itemsToDequip = items.filter((pseudoItem) => {
        const item = storeService.getItemAcrossStores(pseudoItem);
        return item && item.owner !== store.id && item.equipped;
      });

      const scope = {
        failed: 0,
        total: totalItems,
        successfulItems: [] as DimItem[]
      };

      let promise: IPromise<any> = $q.when();

      if (itemsToDequip.length > 1) {
        const realItemsToDequip = _.compact(itemsToDequip.map((i) => storeService.getItemAcrossStores(i)));
        const dequips = _.map(_.groupBy(realItemsToDequip, 'owner'), (dequipItems, owner) => {
          const equipItems = _.compact(dequipItems.map((i) => dimItemService.getSimilarItem(i, loadoutItemIds)));
          return dimItemService.equipItems(storeService.getStore(owner)!, equipItems);
        });
        promise = $q.all(dequips);
      }

      promise = promise
        .then(() => applyLoadoutItems(store, items, loadoutItemIds, scope))
        .then(() => {
          if (itemsToEquip.length > 1) {
            // Use the bulk equipAll API to equip all at once.
            itemsToEquip = itemsToEquip.filter((i) => scope.successfulItems.find((si) => si.id === i.id));
            const realItemsToEquip = _.compact(itemsToEquip.map((i) => getLoadoutItem(i, store)));
            return dimItemService.equipItems(store, realItemsToEquip);
          } else {
            return itemsToEquip;
          }
        })
        .then((equippedItems) => {
          if (equippedItems.length < itemsToEquip.length) {
            const failedItems = _.filter(itemsToEquip, (i) => {
              return !_.find(equippedItems, { id: i.id });
            });
            failedItems.forEach((item) => {
              scope.failed++;
              toaster.pop('error', loadout.name, $i18next.t('Loadouts.CouldNotEquip', { itemname: item.name }));
            });
          }
        })
        .then(() => {
          // We need to do this until https://github.com/DestinyItemManager/DIM/issues/323
          // is fixed on Bungie's end. When that happens, just remove this call.
          if (scope.successfulItems.length > 0) {
            return storeService.updateCharacters();
          }
          return [];
        })
        .then(() => {
          let value = 'success';

          let message = $i18next.t('Loadouts.Applied', { count: scope.total, store: store.name, gender: store.gender });

          if (scope.failed > 0) {
            if (scope.failed === scope.total) {
              value = 'error';
              message = $i18next.t('Loadouts.AppliedError');
            } else {
              value = 'warning';
              message = $i18next.t('Loadouts.AppliedWarn', { failed: scope.failed, total: scope.total });
            }
          }

          toaster.pop(value, loadout.name, message);
        });

      loadingTracker.addPromise(promise);
      return promise;
    });
  }

  // Move one loadout item at a time. Called recursively to move items!
  function applyLoadoutItems(
    store: DimStore,
    items: DimItem[],
    loadoutItemIds: { id: string; hash: number }[],
    scope: {
      failed: number;
      total: number;
      successfulItems: DimItem[];
    }
) {
    if (items.length === 0) {
      // We're done!
      return $q.when();
    }

    let promise: IPromise<any> = $q.when();
    const pseudoItem = items.shift()!;
    const item = getLoadoutItem(pseudoItem, store);

    if (item) {
      if (item.maxStackSize > 1) {
        // handle consumables!
        const amountAlreadyHave = store.amountOfItem(pseudoItem);
        let amountNeeded = pseudoItem.amount - amountAlreadyHave;
        if (amountNeeded > 0) {
          const otherStores = getStoreService(store.destinyVersion).getStores()
            .filter((otherStore) => store.id !== otherStore.id);
          const storesByAmount = _.sortBy(otherStores.map((store) => {
            return {
              store,
              amount: store.amountOfItem(pseudoItem)
            };
          }), 'amount').reverse();

          let totalAmount = amountAlreadyHave;
          while (amountNeeded > 0) {
            const source = _.max(storesByAmount, (s) => s.amount);
            const amountToMove = Math.min(source.amount, amountNeeded);
            const sourceItem = _.find(source.store.items, { hash: pseudoItem.hash });

            if (amountToMove === 0 || !sourceItem) {
              promise = promise.then(() => {
                const error: Error & { level?: string } = new Error($i18next.t('Loadouts.TooManyRequested', { total: totalAmount, itemname: item.name, requested: pseudoItem.amount }));
                error.level = 'warn';
                return $q.reject(error);
              });
              break;
            }

            source.amount -= amountToMove;
            amountNeeded -= amountToMove;
            totalAmount += amountToMove;

            promise = promise.then(() => dimItemService.moveTo(sourceItem, store, false, amountToMove, loadoutItemIds));
          }
        }
      } else {
        // Pass in the list of items that shouldn't be moved away
        promise = dimItemService.moveTo(item, store, pseudoItem.equipped, item.amount, loadoutItemIds);
      }
    }

    promise = promise
      .then(() => {
        if (item) {
          scope.successfulItems.push(item);
        }
      })
      .catch((e) => {
        const level = e.level || 'error';
        if (level === 'error') {
          scope.failed++;
        }
        toaster.pop(e.level || 'error', item ? item.name : 'Unknown', e.message);
      })
      // Keep going
      .finally(() => applyLoadoutItems(store, items, loadoutItemIds, scope));

    return promise;
  }

  function hydratev3d0(loadoutPrimitive: DehydratedLoadout): Loadout {
    const result: Loadout = {
      id: loadoutPrimitive.id,
      name: loadoutPrimitive.name,
      platform: loadoutPrimitive.platform,
      destinyVersion: loadoutPrimitive.destinyVersion,
      classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
      items: {
        unknown: []
      }
    };

    for (const itemPrimitive of loadoutPrimitive.items) {
      const item = copy(getStoreService().getItemAcrossStores({
        id: itemPrimitive.id,
        hash: itemPrimitive.hash
      }));

      if (item) {
        const discriminator = item.type.toLowerCase();

        item.equipped = itemPrimitive.equipped;

        item.amount = itemPrimitive.amount;

        result.items[discriminator] = (result.items[discriminator] || []);
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
    const allItems = _.flatten(Object.values(loadout.items));
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
      items
    };
  }
}
