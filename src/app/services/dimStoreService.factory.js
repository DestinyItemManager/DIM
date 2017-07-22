import angular from 'angular';
import _ from 'underscore';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

import { ClassifiedDataService } from './store/classified-data.service';
import { StoreFactory } from './store/store-factory.service';
import { ItemFactory } from './store/item-factory.service';
import { NewItemsService } from './store/new-items.service';
import { flatMap } from '../util';
import { compareAccounts } from '../accounts/destiny-account.service';


angular.module('dimApp')
  .factory('dimStoreService', StoreService)
  .factory('ClassifiedDataService', ClassifiedDataService)
  .factory('StoreFactory', StoreFactory)
  .factory('ItemFactory', ItemFactory)
  .factory('NewItemsService', NewItemsService);

function StoreService(
  $rootScope,
  $q,
  Destiny1Api,
  dimPlatformService,
  dimDefinitions,
  dimBucketService,
  dimItemInfoService,
  dimManifestService,
  $i18next,
  dimDestinyTrackerService,
  toaster,
  StoreFactory,
  ItemFactory,
  NewItemsService,
  $stateParams,
  loadingTracker
) {
  let _stores = [];

  // A subject that keeps track of the current account
  const accountStream = new BehaviorSubject(null);
  // A force reload trigger
  const reloadTrigger = new Subject();
  const theStoresStream = accountStream
        // Only emit when the account changes
        .distinctUntilChanged(compareAccounts)
        // But also emit the value of the account stream whenever the force reload triggers
        .merge(reloadTrigger.switchMap(() => accountStream))
        // Whenever the trigger happens, load stores
        .switchMap((account) => {
          console.log('switchMap!', account);
          return Observable.from(doReloadStores(account));
        })
        // Keep track of the last value for new subscribers
        .publishReplay(1)
        // Connect when the first subscription happens, and only disconnect
        // when they're all done.
        .refCount();
        // TODO: retry

  // TODO: If we can make the store structures immutable, we could use
  //       distinctUntilChanged to avoid emitting store updates when
  //       nothing changed!

  const service = {
    getActiveStore: () => _.find(_stores, 'current'),
    getStores: () => _stores,
    getStore: (id) => _.find(_stores, { id: id }),
    getVault: () => _.find(_stores, { id: 'vault' }),
    getAllItems: () => flatMap(_stores, 'items'),
    storesStream,
    getItemAcrossStores,
    updateCharacters,
    reloadStores
  };

  return service;

  /**
   * Find an item among all stores that matches the params provided.
   * @param {{ id, hash, notransfer }} params
   */
  function getItemAcrossStores(params) {
    const predicate = _.iteratee(_.pick(params, 'id', 'hash', 'notransfer'));
    for (let i = 0; i < _stores.length; i++) {
      const result = _stores[i].items.find(predicate);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  /**
   * Update the high level character information for all the stores
   * (level, light, int/dis/str, etc.). This does not update the
   * items in the stores - to do that, call reloadStores.
   */
  function updateCharacters(account) {
    // TODO: the $stateParam defaults are just for now, to bridge callsites that don't know platform
    if (!account) {
      if ($stateParams.membershipId && $stateParams.platformType) {
        account = {
          membershipId: $stateParams.membershipId,
          platformType: $stateParams.platformType
        };
      } else {
        throw new Error("Don't know membership ID and platform type");
      }
    }

    return $q.all([
      dimDefinitions.getDefinitions(),
      Destiny1Api.getCharacters(account)
    ]).then(([defs, bungieStores]) => {
      _stores.forEach((dStore) => {
        if (!dStore.isVault) {
          const bStore = _.find(bungieStores, { id: dStore.id });
          dStore.updateCharacterInfo(defs, bStore.base);
        }
      });
      return _stores;
    });
  }

  function storesStream(account) {
    accountStream.next(account);
    return theStoresStream;
  }

  function reloadStores() {
    // TODO: this should return a promise still
    reloadTrigger.next();
  }

  /**
   * Returns a promise for a fresh view of the stores and their items.
   * If this is called while a reload is already happening, it'll return the promise
   * for the ongoing reload rather than kicking off a new reload.
   */
  // TODO: better way to ping the observable?
  function doReloadStores(account) {
    console.log("reloading stores");
    // TODO: the $stateParam defaults are just for now, to bridge callsites that don't know platform
    if (!account) {
      if ($stateParams.membershipId && $stateParams.platformType) {
        account = {
          membershipId: $stateParams.membershipId,
          platformType: $stateParams.platformType
        };
      } else {
        throw new Error("Don't know membership ID and platform type");
      }
    }

    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);
    const firstLoad = (previousItems.size === 0);

    ItemFactory.resetIdTracker();

    const dataDependencies = [
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      NewItemsService.loadNewItems(account),
      dimItemInfoService(account),
      Destiny1Api.getStores(account)
    ];

    const reloadPromise = $q.all(dataDependencies)
      .then(([defs, buckets, newItems, itemInfoService, rawStores]) => {
        NewItemsService.applyRemovedNewItems(newItems);

        const lastPlayedDate = findLastPlayedDate(rawStores);

        // Currencies object gets mutated by processStore
        const currencies = {
          glimmer: 0,
          marks: 0,
          silver: 0
        };

        const processStorePromises = rawStores.map((raw) => processStore(raw, defs, buckets, previousItems, newItems, itemInfoService, currencies, lastPlayedDate));

        return $q.all([newItems, itemInfoService, ...processStorePromises]);
      })
      .then(([newItems, itemInfoService, ...stores]) => {
        // Save and notify about new items (but only if this wasn't the first load)
        if (!firstLoad) {
          // Save the list of new item IDs
          NewItemsService.applyRemovedNewItems(newItems);
          NewItemsService.saveNewItems(newItems);
        }

        _stores = stores;

        dimDestinyTrackerService.fetchReviews(_stores);

        itemInfoService.cleanInfos(stores);

        // Let our styling know how many characters there are
        document.querySelector('html').style.setProperty("--num-characters", _stores.length - 1);

        dimDestinyTrackerService.reattachScoresFromCache(stores);

        // TODO: this is still useful, but not in as many situations
        $rootScope.$broadcast('dim-stores-updated', {
          stores: stores
        });

        return stores;
      })
      .catch((e) => {
        if (e.code === 1601 || e.code === 1618) { // DestinyAccountNotFound
          return dimPlatformService.reportBadPlatform(account, e);
        }
        throw e;
      })
      .catch((e) => {
        showErrorToaster(e);
        throw e;
      })
      .finally(() => {
        dimManifestService.isLoaded = true;
      });

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  }

  /**
   * Process a single store from its raw form to a DIM store, with all the items.
   */
  function processStore(raw, defs, buckets, previousItems, newItems, itemInfoService, currencies, lastPlayedDate) {
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

    return ItemFactory.processItems(store, items, previousItems, newItems, itemInfoService).then((items) => {
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
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(rawStores) {
    return _.reduce(rawStores, (memo, rawStore) => {
      if (rawStore.id === 'vault') {
        return memo;
      }

      const d1 = new Date(rawStore.character.base.characterBase.dateLastPlayed);

      return (memo) ? ((d1 >= memo) ? d1 : memo) : d1;
    }, null);
  }

  function showErrorToaster(e) {
    const twitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a>';
    const twitter = `<div> ${$i18next.t('BungieService.Twitter')} ${twitterLink}</div>`;

    toaster.pop({
      type: 'error',
      bodyOutputType: 'trustedHtml',
      title: 'Bungie.net Error',
      body: e.message + twitter,
      showCloseButton: false
    });
  }
}
