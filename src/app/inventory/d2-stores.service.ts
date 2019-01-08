import {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyProfileResponse,
  DestinyProgression,
  DestinyGameVersions
} from 'bungie-api-ts/destiny2';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import * as _ from 'lodash';
import { compareAccounts, DestinyAccount } from '../accounts/destiny-account.service';
import { getCharacters, getStores } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { getBuckets } from '../destiny2/d2-buckets.service';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { reportException } from '../exceptions';
import { optimalLoadout } from '../loadout/loadout-utils';
import { getLight } from '../loadout/loadout.service';
import '../rx-operators';
import { D2ManifestService } from '../manifest/manifest-service-json';
import { resetIdTracker, processItems } from './store/d2-item-factory.service';
import { makeVault, makeCharacter } from './store/d2-store-factory.service';
import { NewItemsService } from './store/new-items.service';
import { getItemInfoSource, ItemInfoSource } from './dim-item-info';
import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { D2Vault, D2Store, D2StoreServiceType } from './store-types';
import { DimItem, D2Item } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { dimDestinyTrackerService } from '../item-review/destiny-tracker.service';
import { router } from '../../router';
import store from '../store/store';
import { update } from './actions';
import { loadingTracker } from '../shell/loading-tracker';
import { D2SeasonInfo, D2SeasonEnum, D2CurrentSeason } from './d2-season-info';

export const D2StoresService = makeD2StoresService();

/**
 * TODO: For now this is a copy of StoreService customized for D2. Over time we should either
 * consolidate them, or at least organize them better.
 */
function makeD2StoresService(): D2StoreServiceType {
  'ngInject';

  let _stores: D2Store[] = [];

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
    getStore: (id: string) => _stores.find((s) => s.id === id),
    getVault: () => _stores.find((s) => s.isVault) as D2Vault | undefined,
    getAllItems: () => _.flatMap(_stores, (s) => s.items),
    getStoresStream,
    getItemAcrossStores,
    updateCharacters,
    reloadStores,
    refreshRatingsData,
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
  async function updateCharacters(account: DestinyAccount): Promise<D2Store[]> {
    // TODO: the router.globals.params defaults are just for now, to bridge callsites that don't know platform
    if (!account) {
      if (router.globals.params.membershipId && router.globals.params.platformType) {
        account = {
          membershipId: router.globals.params.membershipId,
          platformType: router.globals.params.platformType,
          displayName: 'Unknown',
          platformLabel: 'Unknown',
          destinyVersion: 2
        };
      } else {
        throw new Error("Don't know membership ID and platform type");
      }
    }

    const [defs, profileInfo] = await Promise.all([getDefinitions(), getCharacters(account)]);
    // TODO: create a new store
    _stores.forEach((dStore) => {
      if (!dStore.isVault) {
        const bStore = profileInfo.characters.data[dStore.id];
        if (bStore) {
          dStore.updateCharacterInfo(defs, bStore);
        }
      }
    });
    service.touch();
    return _stores;
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
  function reloadStores() {
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
  async function loadStores(account: DestinyAccount): Promise<D2Store[] | undefined> {
    console.time('Load stores');
    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);

    resetIdTracker();

    try {
      const [defs, buckets, newItems, itemInfoService, profileInfo] = await Promise.all([
        getDefinitions(),
        getBuckets(),
        NewItemsService.loadNewItems(account),
        getItemInfoSource(account),
        getStores(account)
      ]);
      NewItemsService.applyRemovedNewItems(newItems);

      // TODO: components may be hidden (privacy)

      if (
        !profileInfo.profileInventory.data ||
        !profileInfo.characterInventories.data ||
        !profileInfo.characters.data
      ) {
        console.error(
          'Vault or character inventory was missing - bailing in order to avoid corruption'
        );
        throw new Error(t('BungieService.Difficulties'));
      }

      const lastPlayedDate = findLastPlayedDate(profileInfo);

      const processVaultPromise = processVault(
        profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : [],
        profileInfo.profileCurrencies.data ? profileInfo.profileCurrencies.data.items : [],
        profileInfo.itemComponents,
        buckets,
        previousItems,
        newItems,
        itemInfoService
      );

      const processStorePromises = Object.keys(profileInfo.characters.data).map((characterId) =>
        processCharacter(
          defs,
          profileInfo.characters.data[characterId],
          profileInfo.characterInventories.data &&
            profileInfo.characterInventories.data[characterId]
            ? profileInfo.characterInventories.data[characterId].items
            : [],
          profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : [],
          profileInfo.characterEquipment.data && profileInfo.characterEquipment.data[characterId]
            ? profileInfo.characterEquipment.data[characterId].items
            : [],
          profileInfo.itemComponents,
          profileInfo.characterProgressions.data &&
            profileInfo.characterProgressions.data[characterId]
            ? profileInfo.characterProgressions.data[characterId].progressions
            : [],
          buckets,
          previousItems,
          newItems,
          itemInfoService,
          lastPlayedDate
        )
      );

      const [vault, ...characters] = await Promise.all([
        processVaultPromise,
        ...processStorePromises
      ]);
      // Save the list of new item IDs
      NewItemsService.applyRemovedNewItems(newItems);
      NewItemsService.saveNewItems(newItems, account);

      const stores = [...characters, vault];
      _stores = stores;

      updateVaultCounts(buckets, characters.find((c) => c.current)!, vault as D2Vault);

      dimDestinyTrackerService.fetchReviews(stores);

      itemInfoService.cleanInfos(stores);

      stores.forEach((s) => updateBasePower(account, stores, s, defs));

      // Let our styling know how many characters there are
      document
        .querySelector('html')!
        .style.setProperty('--num-characters', String(_stores.length - 1));

      dimDestinyTrackerService.reattachScoresFromCache(stores);

      store.dispatch(update({ stores, buckets, newItems }));

      return stores;
    } catch (e) {
      toaster.pop(bungieErrorToaster(e));
      console.error('Error loading stores', e);
      reportException('d2stores', e);
      // It's important that we swallow all errors here - otherwise
      // our observable will fail on the first error. We could work
      // around that with some rxjs operators, but it's easier to
      // just make this never fail.
      return undefined;
    } finally {
      console.timeEnd('Load stores');
      D2ManifestService.loaded = true;
    }
  }

  /**
   * Process a single character from its raw form to a DIM store, with all the items.
   */
  async function processCharacter(
    defs: D2ManifestDefinitions,
    character: DestinyCharacterComponent,
    characterInventory: DestinyItemComponent[],
    profileInventory: DestinyItemComponent[],
    characterEquipment: DestinyItemComponent[],
    itemComponents: DestinyItemComponentSetOfint64,
    progressions: { [key: number]: DestinyProgression },
    buckets: InventoryBuckets,
    previousItems: Set<string>,
    newItems: Set<string>,
    itemInfoService: ItemInfoSource,
    lastPlayedDate: Date
  ): Promise<D2Store> {
    const store = makeCharacter(defs, character, lastPlayedDate);

    // This is pretty much just needed for the xp bar under the character header
    store.progression = progressions ? { progressions: Object.values(progressions) } : null;

    // We work around the weird account-wide buckets by assigning them to the current character
    let items = characterInventory.concat(Object.values(characterEquipment));
    if (store.current) {
      items = items.concat(
        Object.values(profileInventory).filter((i) => {
          // items that can be stored in a vault
          return buckets.byHash[i.bucketHash].vaultBucket;
        })
      );
    }

    const processedItems = await processItems(
      store,
      items,
      itemComponents,
      previousItems,
      newItems,
      itemInfoService
    );
    store.items = processedItems;
    // by type-bucket
    store.buckets = _.groupBy(store.items, (i) => i.location.id);
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (!store.buckets[bucket.id]) {
        store.buckets[bucket.id] = [];
      }
    });
    return store;
  }

  async function processVault(
    profileInventory: DestinyItemComponent[],
    profileCurrencies: DestinyItemComponent[],
    itemComponents: DestinyItemComponentSetOfint64,
    buckets: InventoryBuckets,
    previousItems: Set<string>,
    newItems: Set<string>,
    itemInfoService: ItemInfoSource
  ): Promise<D2Vault> {
    const store = makeVault(profileCurrencies);

    const items = Object.values(profileInventory).filter((i) => {
      // items that cannot be stored in the vault, and are therefore *in* a vault
      return buckets.byHash[i.bucketHash] && !buckets.byHash[i.bucketHash].vaultBucket;
    });
    const processedItems = await processItems(
      store,
      items,
      itemComponents,
      previousItems,
      newItems,
      itemInfoService
    );
    store.items = processedItems;
    // by type-bucket
    store.buckets = _.groupBy(store.items, (i) => i.location.id);
    store.vaultCounts = {};
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (!store.buckets[bucket.id]) {
        store.buckets[bucket.id] = [];
      }
      if (bucket.vaultBucket) {
        const vaultBucketId = bucket.vaultBucket.id;
        store.vaultCounts[vaultBucketId] = store.vaultCounts[vaultBucketId] || {
          count: 0,
          bucket: bucket.accountWide ? bucket : bucket.vaultBucket
        };
        store.vaultCounts[vaultBucketId].count += store.buckets[bucket.id].length;
      }
    });
    return store;
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(profileInfo: DestinyProfileResponse) {
    return Object.values(profileInfo.characters.data).reduce(
      (memo: Date, character: DestinyCharacterComponent) => {
        const d1 = new Date(character.dateLastPlayed);
        return memo ? (d1 >= memo ? d1 : memo) : d1;
      },
      new Date(0)
    );
  }

  // Add a fake stat for "max base power"
  function updateBasePower(
    account: DestinyAccount,
    stores: D2Store[],
    store: D2Store,
    defs: D2ManifestDefinitions
  ) {
    if (!store.isVault) {
      const def = defs.Stat.get(1935470627);
      const maxBasePower = getLight(store, maxBasePowerLoadout(stores, store));

      const hasClassified = _.flatMap(_stores, (s) => s.items).some((i) => {
        return (
          i.classified &&
          (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
        );
      });

      store.stats.maxBasePower = {
        id: -1,
        name: t('Stats.MaxBasePower'),
        hasClassified,
        description: def.displayProperties.description,
        value: hasClassified ? `${maxBasePower}*` : maxBasePower,
        icon: bungieNetPath(def.displayProperties.icon),
        tiers: [maxBasePower],
        tierMax: getCurrentMaxBasePower(account)
      };
    }
  }

  function getCurrentMaxBasePower(account: DestinyAccount) {
    if (!account.versionsOwned || DestinyGameVersions.Forsaken & account.versionsOwned) {
      return D2SeasonInfo[D2CurrentSeason].maxPower;
    }
    if (DestinyGameVersions.DLC2 & account.versionsOwned) {
      return D2SeasonInfo[D2SeasonEnum.WARMIND].maxPower;
    }
    if (DestinyGameVersions.DLC1 & account.versionsOwned) {
      return D2SeasonInfo[D2SeasonEnum.CURSE_OF_OSIRIS].maxPower;
    }
    if (DestinyGameVersions.Destiny2 & account.versionsOwned) {
      return D2SeasonInfo[D2SeasonEnum.RED_WAR].maxPower;
    }
    return D2SeasonInfo[D2SeasonEnum.FORSAKEN].maxPower;
  }

  function maxBasePowerLoadout(stores: D2Store[], store: D2Store) {
    const statHashes = new Set([
      1480404414, // Attack
      3897883278 // Defense
    ]);

    const applicableItems = _.flatMap(stores, (s) => s.items).filter((i) => {
      return (
        i.canBeEquippedBy(store) &&
        i.primStat && // has a primary stat (sanity check)
        statHashes.has(i.primStat.statHash)
      ); // one of our selected stats
    });

    const bestItemFn = (item: D2Item) => {
      let value = item.basePower;

      // Break ties when items have the same stats. Note that this should only
      // add less than 0.25 total, since in the exotics special case there can be
      // three items in consideration and you don't want to go over 1 total.
      if (item.owner === store.id) {
        // Prefer items owned by this character
        value += 0.1;
        if (item.equipped) {
          // Prefer them even more if they're already equipped
          value += 0.1;
        }
      } else if (item.owner === 'vault') {
        // Prefer items in the vault over items owned by a different character
        // (but not as much as items owned by this character)
        value += 0.05;
      }
      return value;
    };

    return optimalLoadout(applicableItems, bestItemFn, '');
  }

  // TODO: vault counts are silly and convoluted. We really need an
  // object to represent a Profile.
  function updateVaultCounts(buckets: InventoryBuckets, activeStore: D2Store, vault: D2Vault) {
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (bucket.accountWide && bucket.vaultBucket) {
        const vaultBucketId = bucket.id;
        vault.vaultCounts[vaultBucketId] = vault.vaultCounts[vaultBucketId] || {
          count: 0,
          bucket
        };
        vault.vaultCounts[vaultBucketId].count += activeStore.buckets[bucket.id].length;
      }
    });
    activeStore.vault = vault; // god help me
  }

  function refreshRatingsData() {
    dimDestinyTrackerService.clearCache();
    dimDestinyTrackerService.fetchReviews(_stores);
  }
}
