import * as _ from 'lodash';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import '../rx-operators';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account.service';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { reportException } from '../exceptions';
import { getCharacters, getStores } from '../bungie-api/destiny1-api';
import { D1ManifestService } from '../manifest/manifest-service';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { getBuckets } from '../destiny1/d1-buckets.service';
import { NewItemsService } from './store/new-items.service';
import { getItemInfoSource, ItemInfoSource } from './dim-item-info';
import { D1Currencies, makeCharacter, makeVault } from './store/d1-store-factory.service';
import { toaster } from '../ngimport-more';
import { resetIdTracker, processItems } from './store/d1-item-factory.service';
import { D1Store, D1Vault, D1StoreServiceType } from './store-types';
import { D1Item, DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { dimDestinyTrackerService } from '../item-review/destiny-tracker.service';
import { router } from '../../router';
import store from '../store/store';
import { update } from './actions';
import { loadingTracker } from '../shell/loading-tracker';

export const D1StoresService = StoreService();

function StoreService(): D1StoreServiceType {
  'ngInject';

  let _stores: D1Store[] = [];

  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream = new BehaviorSubject<DestinyAccount | null>(null);

  // The triggering observable for force-reloading stores.
  const forceReloadTrigger = new Subject();

  // A stream of stores that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const storesStream = accountStream
    // Only emit when the account changes
    .distinctUntilChanged(compareAccounts)
    // But also re-emit the current value of the account stream
    // whenever the force reload triggers
    .merge(forceReloadTrigger.switchMap(() => accountStream.take(1)))
    // Whenever either trigger happens, load stores
    .switchMap(loadingTracker.trackPromise(loadStores))
    // Keep track of the last value for new subscribers
    .publishReplay(1);

  // TODO: If we can make the store structures immutable, we could use
  //       distinctUntilChanged to avoid emitting store updates when
  //       nothing changed!

  const service = {
    getActiveStore: () => _stores.find((s) => s.current),
    getStores: () => _stores,
    getStore: (id) => _stores.find((s) => s.id === id),
    getVault: () => _stores.find((s) => s.isVault) as D1Vault | undefined,
    getAllItems: () => _.flatMap(_stores, (s) => s.items),
    refreshRatingsData() {
      return;
    },
    getStoresStream,
    getItemAcrossStores,
    updateCharacters,
    reloadStores,
    touch() {
      store.dispatch(update({ stores: _stores }));
    }
  };

  return service;

  /**
   * Find an item among all stores that matches the params provided.
   */
  function getItemAcrossStores(params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
    amount?: number;
  }) {
    const predicate = _.iteratee(_.pick(params, 'id', 'hash', 'notransfer', 'amount')) as (
      i: DimItem
    ) => boolean;
    for (const store of _stores) {
      const result = store.items.find(predicate);
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
  function updateCharacters(account: DestinyAccount) {
    // TODO: the router.globals.params defaults are just for now, to bridge callsites that don't know platform
    if (!account) {
      if (router.globals.params.membershipId && router.globals.params.platformType) {
        account = {
          membershipId: router.globals.params.membershipId,
          platformType: router.globals.params.platformType,
          displayName: 'Unknown',
          platformLabel: 'Unknown',
          destinyVersion: 1
        };
      } else {
        throw new Error("Don't know membership ID and platform type");
      }
    }

    return Promise.all([getDefinitions(), getCharacters(account)]).then(([defs, bungieStores]) => {
      _stores.forEach((dStore) => {
        if (!dStore.isVault) {
          const bStore = bungieStores.find((s) => s.id === dStore.id)!;
          dStore.updateCharacterInfo(defs, bStore.base);
        }
      });
      service.touch();
      return _stores;
    });
  }

  /**
   * Set the current account, and get a stream of stores updates.
   * This will keep returning stores even if something else changes
   * the account by also calling "storesStream". This won't force the
   * stores to reload unless they haven't been loaded at all.
   *
   * @return a stream of store updates
   */
  function getStoresStream(account: DestinyAccount) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    storesStream.connect();
    return storesStream;
  }

  /**
   * Force the inventory and characters to reload.
   * @return the new stores
   */
  function reloadStores(): Promise<D1Store[] | undefined> {
    // adhere to the old contract by returning the next value as a
    // promise We take 2 from the stream because the publishReplay
    // will always return the latest value instantly, and we want the
    // next value (the refreshed value). toPromise returns the last
    // value in the sequence.
    const promise = storesStream.take(2).toPromise();
    forceReloadTrigger.next(); // signal the force reload
    return promise;
  }

  /**
   * Returns a promise for a fresh view of the stores and their items.
   */
  function loadStores(account: DestinyAccount): Promise<D1Store[] | undefined> {
    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);

    resetIdTracker();

    const reloadPromise = Promise.all([
      getDefinitions(),
      getBuckets(),
      NewItemsService.loadNewItems(account),
      getItemInfoSource(account),
      getStores(account)
    ])
      .then(([defs, buckets, newItems, itemInfoService, rawStores]) => {
        NewItemsService.applyRemovedNewItems(newItems);

        const lastPlayedDate = findLastPlayedDate(rawStores);

        // Currencies object gets mutated by processStore
        const currencies: D1Currencies = {
          glimmer: 0,
          marks: 0,
          silver: 0
        };

        const processStorePromises = Promise.all(
          _.compact(
            (rawStores as any[]).map((raw) =>
              processStore(
                raw,
                defs,
                buckets,
                previousItems,
                newItems,
                itemInfoService,
                currencies,
                lastPlayedDate
              )
            )
          )
        );

        return Promise.all([buckets, newItems, itemInfoService, processStorePromises]);
      })
      .then(([buckets, newItems, itemInfoService, stores]) => {
        // Save and notify about new items
        NewItemsService.applyRemovedNewItems(newItems);
        NewItemsService.saveNewItems(newItems, account);

        _stores = stores;

        dimDestinyTrackerService.fetchReviews(stores);

        itemInfoService.cleanInfos(stores);

        // Let our styling know how many characters there are
        document
          .querySelector('html')!
          .style.setProperty('--num-characters', String(stores.length - 1));

        dimDestinyTrackerService.reattachScoresFromCache(stores);

        store.dispatch(update({ stores, buckets, newItems }));

        return stores;
      })
      .catch((e) => {
        toaster.pop(bungieErrorToaster(e));
        console.error('Error loading stores', e);
        reportException('D1StoresService', e);
        // It's important that we swallow all errors here - otherwise
        // our observable will fail on the first error. We could work
        // around that with some rxjs operators, but it's easier to
        // just make this never fail.
        return undefined;
      })
      .finally(() => {
        D1ManifestService.loaded = true;
      });

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  }

  /**
   * Process a single store from its raw form to a DIM store, with all the items.
   */
  function processStore(
    raw,
    defs: D1ManifestDefinitions,
    buckets: InventoryBuckets,
    previousItems: Set<string>,
    newItems: Set<string>,
    itemInfoService: ItemInfoSource,
    currencies: D1Currencies,
    lastPlayedDate: Date
  ) {
    if (!raw) {
      return undefined;
    }

    let store: D1Store;
    let items: D1Item[];
    if (raw.id === 'vault') {
      const result = makeVault(raw, currencies);
      store = result.store;
      items = result.items;
    } else {
      const result = makeCharacter(raw, defs, lastPlayedDate, currencies);
      store = result.store;
      items = result.items;
    }

    return processItems(store, items, previousItems, newItems, itemInfoService).then((items) => {
      store.items = items;

      // by type-bucket
      store.buckets = _.groupBy(items, (i) => {
        return i.location.id;
      });

      // Fill in any missing buckets
      Object.values(buckets.byType).forEach((bucket) => {
        if (!store.buckets[bucket.id]) {
          store.buckets[bucket.id] = [];
        }
      });

      if (isVault(store)) {
        const vault = store;
        vault.vaultCounts = {};
        const vaultBucketOrder = [
          'BUCKET_VAULT_WEAPONS',
          'BUCKET_VAULT_ARMOR',
          'BUCKET_VAULT_ITEMS'
        ];

        _.sortBy(Object.values(buckets.byType).filter((b) => b.vaultBucket), (b) =>
          vaultBucketOrder.indexOf(b.vaultBucket!.id)
        ).forEach((bucket) => {
          const vaultBucketId = bucket.vaultBucket!.id;
          vault.vaultCounts[vaultBucketId] = vault.vaultCounts[vaultBucketId] || {
            count: 0,
            bucket: bucket.accountWide ? bucket : bucket.vaultBucket
          };
          vault.vaultCounts[vaultBucketId].count += store.buckets[bucket.id].length;
        });
      }

      return store;
    });
  }

  function isVault(store: D1Store): store is D1Vault {
    return store.isVault;
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(rawStores: any[]): Date {
    return Object.values(rawStores).reduce((memo, rawStore) => {
      if (rawStore.id === 'vault') {
        return memo;
      }

      const d1 = new Date(rawStore.character.base.characterBase.dateLastPlayed);

      return memo ? (d1 >= memo ? d1 : memo) : d1;
    }, new Date(0));
  }
}
