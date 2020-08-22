import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { reportException } from '../utils/exceptions';
import { getStores } from '../bungie-api/destiny1-api';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { cleanInfos } from './dim-item-info';
import { makeCharacter, makeVault } from './store/d1-store-factory';
import { resetIdTracker, processItems } from './store/d1-item-factory';
import { D1Store, D1Vault, D1StoreServiceType, DimVault } from './store-types';
import { D1Item } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { fetchRatings } from '../item-review/destiny-tracker.service';
import store from '../store/store';
import { update, loadNewItems, error } from './actions';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification } from '../notifications/notifications';
import { BehaviorSubject, Subject, ConnectableObservable } from 'rxjs';
import { take, switchMap, publishReplay, merge } from 'rxjs/operators';
import { storesSelector, bucketsSelector } from './selectors';

export const D1StoresService = StoreService();

function StoreService(): D1StoreServiceType {
  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream = new BehaviorSubject<DestinyAccount | null>(null);

  // The triggering observable for force-reloading stores.
  const forceReloadTrigger = new Subject();

  // A stream of stores that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const storesStream = accountStream.pipe(
    // But also re-emit the current value of the account stream
    // whenever the force reload triggers
    merge(forceReloadTrigger.pipe(switchMap(() => accountStream.pipe(take(1))))),
    // Whenever either trigger happens, load stores
    switchMap(loadingTracker.trackPromise(loadStores)),
    // Keep track of the last value for new subscribers
    publishReplay(1)
  ) as ConnectableObservable<D1Store[] | undefined>;
  // TODO: If we can make the store structures immutable, we could use
  //       distinctUntilChanged to avoid emitting store updates when
  //       nothing changed!

  const service = {
    getStores: () => storesSelector(store.getState()) as D1Store[],
    getStoresStream,
    reloadStores,
  };

  return service;

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
    const promise = storesStream.pipe(take(2)).toPromise();
    forceReloadTrigger.next(); // signal the force reload
    return promise;
  }

  /**
   * Returns a promise for a fresh view of the stores and their items.
   */
  function loadStores(account: DestinyAccount): Promise<D1Store[] | undefined> {
    resetIdTracker();

    const reloadPromise = Promise.all([
      (store.dispatch(getDefinitions()) as any) as Promise<D1ManifestDefinitions>,
      store.dispatch(loadNewItems(account)),
      getStores(account),
    ])
      .then(([defs, , rawStores]) => {
        const lastPlayedDate = findLastPlayedDate(rawStores);
        const buckets = bucketsSelector(store.getState())!;

        // Currencies object gets mutated by processStore
        const currencies: DimVault['currencies'] = [];

        const processStorePromises = Promise.all(
          _.compact(
            (rawStores as any[]).map((raw) =>
              processStore(raw, defs, buckets, currencies, lastPlayedDate)
            )
          )
        );

        return processStorePromises;
      })
      .then((stores) => {
        if ($featureFlags.reviewsEnabled) {
          store.dispatch(fetchRatings(stores));
        }

        store.dispatch(cleanInfos(stores));

        // Let our styling know how many characters there are
        document
          .querySelector('html')!
          .style.setProperty('--num-characters', String(stores.length - 1));

        store.dispatch(update({ stores }));

        return stores;
      })
      .catch((e) => {
        console.error('Error loading stores', e);
        reportException('D1StoresService', e);
        if (storesSelector(store.getState()).length > 0) {
          // don't replace their inventory with the error, just notify
          showNotification(bungieErrorToaster(e));
        } else {
          store.dispatch(error(e));
        }
        // It's important that we swallow all errors here - otherwise
        // our observable will fail on the first error. We could work
        // around that with some rxjs operators, but it's easier to
        // just make this never fail.
        return undefined;
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
    currencies: DimVault['currencies'],
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

    return processItems(store, items, defs, buckets).then((items) => {
      store.items = items;

      // by type-bucket
      store.buckets = _.groupBy(items, (i) => i.location.hash);

      // Fill in any missing buckets
      Object.values(buckets.byType).forEach((bucket) => {
        if (!store.buckets[bucket.hash]) {
          store.buckets[bucket.hash] = [];
        }
      });

      if (isVault(store)) {
        const vault = store;
        vault.vaultCounts = {};
        const vaultBucketOrder = [
          4046403665, // Weapons
          3003523923, // Armor
          138197802, // General
        ];

        _.sortBy(
          Object.values(buckets.byType).filter((b) => b.vaultBucket),
          (b) => vaultBucketOrder.indexOf(b.vaultBucket!.hash)
        ).forEach((bucket) => {
          const vaultBucketId = bucket.vaultBucket!.hash;
          vault.vaultCounts[vaultBucketId] = vault.vaultCounts[vaultBucketId] || {
            count: 0,
            bucket: bucket.accountWide ? bucket : bucket.vaultBucket,
          };
          vault.vaultCounts[vaultBucketId].count += store.buckets[bucket.hash].length;
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
