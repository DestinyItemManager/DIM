import angular from 'angular';
import _ from 'underscore';
import { ClassifiedDataService } from './store/classified-data.service';
import { StoreFactory } from './store/store-factory.service';
import { ItemFactory } from './store/item-factory.service';
import { NewItemsService } from './store/new-items.service';
import { getCharacterStatsData, getBonus } from './store/character-stats-data';

angular.module('dimApp')
  .factory('dimStoreService', StoreService)
  .factory('ClassifiedDataService', ClassifiedDataService)
  .factory('StoreFactory', StoreFactory)
  .factory('ItemFactory', ItemFactory)
  .factory('NewItemsService', NewItemsService);

function StoreService(
  $rootScope,
  $q,
  dimBungieService,
  dimPlatformService,
  dimCategory,
  dimDefinitions,
  dimBucketService,
  dimItemInfoService,
  loadingTracker,
  dimManifestService,
  $translate,
  dimDestinyTrackerService,
  toaster,
  ClassifiedDataService,
  StoreFactory,
  ItemFactory,
  NewItemsService
) {
  let _stores = [];

  // A promise used to dedup parallel calls to reloadStores
  let _reloadPromise;

  const service = {
    getActiveStore: getActiveStore,
    getStores: getStores,
    reloadStores: reloadStores,
    getStore: getStore,
    getBonus: getBonus,
    getVault: getStore.bind(null, 'vault'),
    updateCharacters: updateCharacters,
    createItemIndex: ItemFactory.createItemIndex,
    processItems: processItems,
    getCharacterStatsData
  };

  $rootScope.$on('dim-active-platform-updated', () => {
    _stores = [];
    NewItemsService.hasNewItems = false;
    $rootScope.$broadcast('dim-stores-updated', {
      stores: _stores
    });
    loadingTracker.addPromise(service.reloadStores(true));
  });

  return service;

  // Update the high level character information for all the stores
  // (level, light, int/dis/str, etc.). This does not update the
  // items in the stores - to do that, call reloadStores.
  function updateCharacters() {
    return $q.all([
      dimDefinitions.getDefinitions(),
      dimBungieService.getCharacters(dimPlatformService.getActive())
    ]).then(([defs, bungieStores]) => {
      _.each(_stores, (dStore) => {
        if (!dStore.isVault) {
          const bStore = _.findWhere(bungieStores, { id: dStore.id });
          dStore.updateCharacterInfo(defs, bStore.base);
        }
      });
      return _stores;
    });
  }

  function getActiveStore() {
    return _.find(_stores, 'current');
  }

  function getStores() {
    return _stores;
  }

  // Returns a promise for a fresh view of the stores and their items.
  // If this is called while a reload is already happening, it'll return the promise
  // for the ongoing reload rather than kicking off a new reload.
  function reloadStores() {
    const activePlatform = dimPlatformService.getActive();
    if (_reloadPromise && _reloadPromise.activePlatform === activePlatform) {
      return _reloadPromise;
    }

    // #786 Exiting early when finding no activePlatform.
    if (!activePlatform) {
      return $q.reject("Cannot find active platform.");
    }

    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);
    const firstLoad = (previousItems.size === 0);

    ItemFactory.resetIdTracker();

    _reloadPromise = $q.all([
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      NewItemsService.loadNewItems(activePlatform),
      dimItemInfoService(activePlatform),
      dimBungieService.getStores(activePlatform)])
      .then(([defs, buckets, newItems, itemInfoService, rawStores]) => {
        if (activePlatform !== dimPlatformService.getActive()) {
          throw new Error("Active platform mismatch");
        }

        const lastPlayedDate = _.reduce(rawStores, (memo, rawStore) => {
          if (rawStore.id === 'vault') {
            return memo;
          }

          const d1 = new Date(rawStore.character.base.characterBase.dateLastPlayed);

          return (memo) ? ((d1 >= memo) ? d1 : memo) : d1;
        }, null);

        const currencies = {
          glimmer: 0,
          marks: 0,
          silver: 0
        };

        NewItemsService.applyRemovedNewItems(newItems);

        return $q.all([newItems, itemInfoService, ...rawStores.map((raw) => {
          if (activePlatform !== dimPlatformService.getActive()) {
            throw new Error("Active platform mismatch");
          }
          if (!raw) {
            return undefined;
          }

          let store;
          let items;
          if (raw.id === 'vault') {
            const result = StoreFactory.makeVault(raw, buckets, currencies);
            store = result.store;
            items = result.items;
          } else {
            const result = StoreFactory.makeCharacter(raw, defs, lastPlayedDate, currencies);
            store = result.store;
            items = result.items;
          }

          return processItems(store, items, previousItems, newItems, itemInfoService).then((items) => {
            if (activePlatform !== dimPlatformService.getActive()) {
              throw new Error("Active platform mismatch");
            }

            store.items = items;

            // by type-bucket
            store.buckets = _.groupBy(items, (i) => {
              return i.location.id;
            });

            // Fill in any missing buckets
            _.values(buckets.byType).forEach((bucket) => {
              if (!store.buckets[bucket.id]) {
                store.buckets[bucket.id] = [];
              }
            });

            if (store.isVault) {
              store.vaultCounts = {};
              ['Weapons', 'Armor', 'General'].forEach((category) => {
                store.vaultCounts[category] = 0;
                buckets.byCategory[category].forEach((bucket) => {
                  if (store.buckets[bucket.id]) {
                    store.vaultCounts[category] += store.buckets[bucket.id].length;
                  }
                });
              });
            }

            return store;
          });
        })]);
      })
      .then(([newItems, itemInfoService, ...stores]) => {
        if (activePlatform !== dimPlatformService.getActive()) {
          throw new Error("Active platform mismatch");
        }

        // Save and notify about new items (but only if this wasn't the first load)
        if (!firstLoad) {
          // Save the list of new item IDs
          NewItemsService.applyRemovedNewItems(newItems);
          NewItemsService.saveNewItems(newItems);
        }

        _stores = stores;

        $rootScope.$broadcast('dim-stores-updated', {
          stores: stores
        });

        itemInfoService.cleanInfos(stores);

        // Let our styling know how many characters there are
        document.querySelector('html').style.setProperty("--num-characters", _stores.length - 1);

        return stores;
      })
      .then((stores) => {
        dimDestinyTrackerService.reattachScoresFromCache(stores);
        return stores;
      })
      .catch((e) => {
        if (e.message === 'Active platform mismatch') {
          // no problem, just canceling the request
          return null;
        }
        if (e.code === 1601) { // DestinyAccountNotFound
          return dimPlatformService.reportBadPlatform(activePlatform, e);
        }
        throw e;
      })
      .catch((e) => {
        showErrorToaster(e);
        throw e;
      })
      .finally(() => {
        // Clear the reload promise so this can be called again
        if (_reloadPromise.activePlatform === activePlatform) {
          _reloadPromise = null;
        }
        dimManifestService.isLoaded = true;
      });

    _reloadPromise.activePlatform = activePlatform;
    return _reloadPromise;
  }

  function showErrorToaster(e) {
    const twitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a>';
    const twitter = `<div> ${$translate.instant('BungieService.Twitter')} ${twitterLink}</div>`;

    toaster.pop({
      type: 'error',
      bodyOutputType: 'trustedHtml',
      title: 'Bungie.net Error',
      body: e.message + twitter,
      showCloseButton: false
    });
  }

  function getStore(id) {
    return _.find(_stores, { id: id });
  }

  function processItems(owner, items, previousItems = new Set(), newItems = new Set(), itemInfoService) {
    return $q.all([
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      previousItems,
      newItems,
      itemInfoService,
      ClassifiedDataService.getClassifiedData()])
      .then((args) => {
        const result = [];
        dimManifestService.statusText = `${$translate.instant('Manifest.LoadCharInv')}...`;
        _.each(items, (item) => {
          let createdItem = null;
          try {
            createdItem = ItemFactory.makeItem(...args, item, owner);
          } catch (e) {
            console.error("Error processing item", item, e);
          }
          if (createdItem !== null) {
            createdItem.owner = owner.id;
            result.push(createdItem);
          }
        });
        return result;
      });
  }
}
