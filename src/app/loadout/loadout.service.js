import angular from 'angular';
import uuidv4 from 'uuid/v4';
import _ from 'underscore';

export function LoadoutService($q, $rootScope, $i18next, dimItemService, dimStoreService, toaster, loadingTracker, SyncService, dimActionQueue) {
  'ngInject';

  let _loadouts = [];
  const _previousLoadouts = {}; // by character ID

  // TODO: load this on demand!
  $rootScope.$on('dim-stores-updated', () => {
    getLoadouts(true);
  });

  return {
    dialogOpen: false,
    getLoadouts: getLoadouts,
    deleteLoadout: deleteLoadout,
    saveLoadout: saveLoadout,
    addItemToLoadout: addItemToLoadout,
    applyLoadout: applyLoadout,
    getLight: getLight,
    previousLoadouts: _previousLoadouts
  };

  function addItemToLoadout(item, $event) {
    $rootScope.$broadcast('dim-store-item-clicked', {
      item: item,
      clickEvent: $event
    });
  }

  function isGuid(stringToTest) {
    if (stringToTest[0] === "{") {
      stringToTest = stringToTest.substring(1, stringToTest.length - 1);
    }

    const regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}$/gi;

    return regexGuid.test(stringToTest);
  }

  function processLoadout(data, version) {
    if (!data) {
      return [];
    }

    let loadouts = [];
    if (version === 'v3.0') {
      const ids = data['loadouts-v3.0'];
      loadouts = ids.map((id) => {
        // Mark all the items as being in loadouts
        data[id].items.forEach((item) => {
          const itemFromStore = dimStoreService.getItemAcrossStores({
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
    const loadoutGuids = new Set(_.pluck(loadouts, 'id'));
    const containsLoadoutGuids = (item) => loadoutGuids.has(item.id);

    const orphanIds = _.pluck(Object.values(data).filter((item) => {
      return objectTest(item) &&
        hasGuid(item) &&
        !containsLoadoutGuids(item);
    }), 'id');

    if (orphanIds.length > 0) {
      return SyncService.remove(orphanIds).then(() => loadouts);
    }

    return loadouts;
  }

  function getLoadouts(getLatest) {
    // Avoids the hit going to data store if we have data already.
    if (getLatest || !_loadouts.length) {
      return SyncService.get()
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
        });
    } else {
      return $q.when(_loadouts);
    }
  }

  function saveLoadouts(loadouts) {
    return $q.when(loadouts || getLoadouts())
      .then((loadouts) => {
        _loadouts = loadouts;

        const loadoutPrimitives = _.map(loadouts, dehydrate);

        const data = {
          'loadouts-v3.0': []
        };

        _.each(loadoutPrimitives, (l) => {
          data['loadouts-v3.0'].push(l.id);
          data[l.id] = l;
        });

        return SyncService.set(data).then(() => loadoutPrimitives);
      });
  }

  function deleteLoadout(loadout) {
    return getLoadouts()
      .then((loadouts) => {
        const index = _.findIndex(loadouts, { id: loadout.id });
        if (index >= 0) {
          loadouts.splice(index, 1);
        }

        return SyncService.remove(loadout.id.toString()).then(() => {
          return loadouts;
        });
      })
      .then((loadouts) => {
        return saveLoadouts(loadouts);
      })
      .then((loadouts) => {
        $rootScope.$broadcast('dim-delete-loadout', {
          loadout: loadout
        });

        return loadouts;
      });
  }

  function saveLoadout(loadout) {
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
          loadout: loadout
        });

        return loadouts;
      });
  }

  function hydrate(loadout) {
    const hydration = {
      'v3.0': hydratev3d0
    };

    return (hydration[(loadout.version)])(loadout);
  }

  // A special getItem that takes into account the fact that
  // subclasses have unique IDs, and emblems/shaders/etc are interchangeable.
  function getLoadoutItem(pseudoItem, store) {
    let item = dimStoreService.getItemAcrossStores(pseudoItem);
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
  function getLight(store, loadout) {
    const itemWeight = {
      Weapons: store.level === 40 ? .12 : .1304,
      Armor: store.level === 40 ? .10 : .1087,
      General: store.level === 40 ? .08 : .087
    };
    return (Math.floor(10 * _.reduce(loadout.items, (memo, items) => {
      const item = _.find(items, { equipped: true });

      return memo + (item.primStat.value * itemWeight[item.location.id === 'BUCKET_CLASS_ITEMS' ? 'General' : item.location.sort]);
    }, 0)) / 10).toFixed(1);
  }

  /**
   * Apply a loadout - a collection of items to be moved and possibly equipped all at once.
   * @param allowUndo whether to include this loadout in the "undo loadout" menu stack.
   * @return a promise for the completion of the whole loadout operation.
   */
  function applyLoadout(store, loadout, allowUndo = false) {
    return dimActionQueue.queueAction(() => {
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

      let items = angular.copy(_.flatten(_.values(loadout.items)));

      const loadoutItemIds = items.map((i) => {
        return {
          id: i.id,
          hash: i.hash
        };
      });

      // Only select stuff that needs to change state
      let totalItems = items.length;
      items = _.filter(items, (pseudoItem) => {
        const item = getLoadoutItem(pseudoItem, store);
        const invalid = !item || !item.equipment;
        // provide a more accurate count of total items
        if (invalid) {
          totalItems--;
          return true;
        }

        const alreadyThere = item.owner !== store.id ||
              // Needs to be equipped. Stuff not marked "equip" doesn't
              // necessarily mean to de-equip it.
              (pseudoItem.equipped && !item.equipped);

        return alreadyThere;
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
      let itemsToEquip = _.filter(items, 'equipped');
      if (itemsToEquip.length > 1) {
        // we'll use the equipItems function
        itemsToEquip.forEach((i) => { i.equipped = false; });
      }

      // Stuff that's equipped on another character. We can bulk-dequip these
      const itemsToDequip = _.filter(items, (pseudoItem) => {
        const item = dimStoreService.getItemAcrossStores(pseudoItem);
        return item.owner !== store.id && item.equipped;
      });

      const scope = {
        failed: 0,
        total: totalItems,
        successfulItems: []
      };

      let promise = $q.when();

      if (itemsToDequip.length > 1) {
        const realItemsToDequip = itemsToDequip.map((i) => {
          return dimStoreService.getItemAcrossStores(i);
        });
        const dequips = _.map(_.groupBy(realItemsToDequip, 'owner'), (dequipItems, owner) => {
          const equipItems = _.compact(realItemsToDequip.map((i) => {
            return dimItemService.getSimilarItem(i, loadoutItemIds);
          }));
          return dimItemService.equipItems(dimStoreService.getStore(owner), equipItems);
        });
        promise = $q.all(dequips);
      }

      promise = promise
        .then(() => {
          return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
        })
        .then(() => {
          if (itemsToEquip.length > 1) {
            // Use the bulk equipAll API to equip all at once.
            itemsToEquip = _.filter(itemsToEquip, (i) => {
              return _.find(scope.successfulItems, { id: i.id });
            });
            const realItemsToEquip = itemsToEquip.map((i) => {
              return getLoadoutItem(i, store);
            });

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
            return dimStoreService.updateCharacters();
          }
          return undefined;
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
  function applyLoadoutItems(store, items, loadout, loadoutItemIds, scope) {
    if (items.length === 0) {
      // We're done!
      return $q.when();
    }

    let promise = $q.when();
    const pseudoItem = items.shift();
    let item = getLoadoutItem(pseudoItem, store);

    if (item.type === 'Material' || item.type === 'Consumable') {
      // handle consumables!
      const amountAlreadyHave = store.amountOfItem(pseudoItem);
      let amountNeeded = pseudoItem.amount - amountAlreadyHave;
      if (amountNeeded > 0) {
        const otherStores = _.reject(dimStoreService.getStores(), (otherStore) => {
          return store.id === otherStore.id;
        });
        const storesByAmount = _.sortBy(otherStores.map((store) => {
          return {
            store: store,
            amount: store.amountOfItem(pseudoItem)
          };
        }), 'amount').reverse();

        let totalAmount = amountAlreadyHave;
        while (amountNeeded > 0) {
          const source = _.max(storesByAmount, 'amount');
          const amountToMove = Math.min(source.amount, amountNeeded);
          const sourceItem = _.find(source.store.items, { hash: pseudoItem.hash });

          if (amountToMove === 0 || !sourceItem) {
            promise = promise.then(() => {
              const error = new Error($i18next.t('Loadouts.TooManyRequested', { total: totalAmount, itemname: item.name, requested: pseudoItem.amount }));
              error.level = 'warn';
              return $q.reject(error);
            });
            break;
          }

          source.amount -= amountToMove;
          amountNeeded -= amountToMove;
          totalAmount += amountToMove;

          promise = promise.then(() => dimItemService.moveTo(sourceItem, store, false, amountToMove));
        }
      }
    } else {
      if (item.type === 'Class') {
        item = _.find(store.items, {
          hash: pseudoItem.hash
        });
      }

      if (item) {
        // Pass in the list of items that shouldn't be moved away
        promise = dimItemService.moveTo(item, store, pseudoItem.equipped, item.amount, loadoutItemIds);
      } else {
        promise = $q.reject(new Error($i18next.t('Loadouts.DoesNotExist', { itemname: item.name })));
      }
    }

    promise = promise
      .then(() => {
        scope.successfulItems.push(item);
      })
      .catch((e) => {
        const level = e.level || 'error';
        if (level === 'error') {
          scope.failed++;
        }
        toaster.pop(e.level || 'error', item.name, e.message);
      })
      .finally(() => {
        // Keep going
        return applyLoadoutItems(store, items, loadout, loadoutItemIds, scope);
      });

    return promise;
  }

  function hydratev3d0(loadoutPrimitive) {
    const result = {
      id: loadoutPrimitive.id,
      name: loadoutPrimitive.name,
      platform: loadoutPrimitive.platform,
      classType: (_.isUndefined(loadoutPrimitive.classType) ? -1 : loadoutPrimitive.classType),
      version: 'v3.0',
      items: {
        unknown: []
      }
    };

    _.each(loadoutPrimitive.items, (itemPrimitive) => {
      let item = angular.copy(dimStoreService.getItemAcrossStores({
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
        item = {
          id: itemPrimitive.id,
          hash: itemPrimitive.hash,
          amount: itemPrimitive.amount,
          equipped: itemPrimitive.equipped
        };

        result.items.unknown.push(item);
      }
    });

    return result;
  }

  function dehydrate(loadout) {
    const result = {
      id: loadout.id,
      name: loadout.name,
      classType: loadout.classType,
      version: 'v3.0',
      platform: loadout.platform,
      items: []
    };

    const allItems = _.flatten(Object.values(loadout.items));
    result.items = allItems.map((item) => {
      return {
        id: item.id,
        hash: item.hash,
        amount: item.amount,
        equipped: item.equipped
      };
    });

    return result;
  }
}

