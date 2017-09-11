import _ from 'underscore';
import { Subject, BehaviorSubject } from 'rxjs';

import { flatMap } from '../util';
import { compareAccounts } from '../accounts/destiny-account.service';

/**
 * TODO: For now this is a copy of StoreService customized for D2. Over time we should either
 * consolidate them, or at least organize them better.
 */
export function D2StoresService(
  $rootScope,
  $q,
  Destiny2Api,
  dimPlatformService,
  D2Definitions,
  D2BucketsService,
  dimItemInfoService,
  D2ManifestService,
  $i18next,
  toaster,
  D2StoreFactory,
  D2ItemFactory,
  NewItemsService,
  $stateParams,
  loadingTracker
) {
  'ngInject';

  let _stores = [];

  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream = new BehaviorSubject(null);

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
        .switchMap((account) => loadStores(account))
        // Keep track of the last value for new subscribers
        .publishReplay(1);

  // TODO: If we can make the store structures immutable, we could use
  //       distinctUntilChanged to avoid emitting store updates when
  //       nothing changed!

  const service = {
    getActiveStore: () => _.find(_stores, 'current'),
    getStores: () => _stores,
    getStore: (id) => _.find(_stores, { id: id }),
    getVault: () => _.find(_stores, { id: 'vault' }),
    getAllItems: () => flatMap(_stores, 'items'),
    getStoresStream,
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
      D2Definitions.getDefinitions(),
      Destiny2Api.getCharacters(account)
    ]).then(([defs, profileInfo]) => {
      _stores.forEach((dStore) => {
        if (!dStore.isVault) {
          const bStore = profileInfo.characters.data[dStore.id];
          dStore.updateCharacterInfo(defs, bStore);
        }
      });
      return _stores;
    });
  }

  /**
   * Set the current account, and get a stream of stores updates.
   * This will keep returning stores even if something else changes
   * the account by also calling "storesStream". This won't force the
   * stores to reload unless they haven't been loaded at all.
   *
   * @return {Observable} a stream of store updates
   */
  function getStoresStream(account) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    storesStream.connect();
    return storesStream;
  }

  /**
   * Force the inventory and characters to reload.
   * @return {Promise} the new stores
   */
  function reloadStores() {
    forceReloadTrigger.next(); // signal the force reload
    // adhere to the old contract by returning the next value as a promise
    return storesStream.take(1).toPromise();
  }

  /**
   * Returns a promise for a fresh view of the stores and their items.
   */
  function loadStores(account) {
    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);
    const firstLoad = (previousItems.size === 0);

    D2ItemFactory.resetIdTracker();

    const dataDependencies = [
      D2Definitions.getDefinitions(),
      D2BucketsService.getBuckets(),
      NewItemsService.loadNewItems(account),
      dimItemInfoService(account),
      Destiny2Api.getStores(account)
    ];

    const reloadPromise = $q.all(dataDependencies)
      .then(([defs, buckets, newItems, itemInfoService, profileInfo]) => {
        NewItemsService.applyRemovedNewItems(newItems);

        const lastPlayedDate = findLastPlayedDate(profileInfo);


        console.log(profileInfo);
        // TODO: components may be hidden (privacy)

        const processVaultPromise = processVault(defs,
          profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : [],
          profileInfo.profileInventory.data ? profileInfo.profileCurrencies.data.items : [],
          profileInfo.itemComponents,
          buckets,
          previousItems,
          newItems,
          itemInfoService,
          lastPlayedDate);

        const processStorePromises = Object.keys(profileInfo.characters.data).map((characterId) => processCharacter(
          defs,
          profileInfo.characters.data[characterId],
          profileInfo.characterInventories.data && profileInfo.characterInventories.data[characterId] ? profileInfo.characterInventories.data[characterId].items : [],
          profileInfo.characterEquipment.data && profileInfo.characterEquipment.data[characterId] ? profileInfo.characterEquipment.data[characterId].items : [],
          profileInfo.itemComponents,
          Object.assign(profileInfo.characterProgressions.data[characterId].progressions, profileInfo.characterProgressions.data[characterId].factions),
          buckets,
          previousItems,
          newItems,
          itemInfoService,
          lastPlayedDate));

        return $q.all([newItems, itemInfoService, processVaultPromise, ...processStorePromises]);
      })
      .then(([newItems, itemInfoService, ...stores]) => {
        // Save and notify about new items (but only if this wasn't the first load)
        if (!firstLoad) {
          // Save the list of new item IDs
          NewItemsService.applyRemovedNewItems(newItems);
          NewItemsService.saveNewItems(newItems);
        }

        _stores = stores;

        itemInfoService.cleanInfos(stores);

        // Let our styling know how many characters there are
        document.querySelector('html').style.setProperty("--num-characters", _stores.length - 1);

        // TODO: this is still useful, but not in as many situations
        $rootScope.$broadcast('d2-stores-updated', {
          stores: stores
        });
        console.log(stores);
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
        // It's important that we swallow all errors here - otherwise
        // our observable will fail on the first error. We could work
        // around that with some rxjs operators, but it's easier to
        // just make this never fail.
      })
      .finally(() => {
        D2ManifestService.isLoaded = true;
      });

    loadingTracker.addPromise(reloadPromise);
    return reloadPromise;
  }

  /**
   * Process a single character from its raw form to a DIM store, with all the items.
   */
  function processCharacter(defs,
    character,
    characterInventory,
    characterEquipment,
    itemComponents,
    progressions,
    buckets,
    previousItems,
    newItems,
    itemInfoService,
    lastPlayedDate) {
    const store = D2StoreFactory.makeCharacter(defs, character, lastPlayedDate);

    /* Label isn't used, but it helps us understand what each one is */
    const progressionMeta = {
      611314723: { label: "Vanguard", order: 0 },
      697030790: { label: "Crucible", order: 1 },
      828982195: { label: "Researcher", order: 2 },
      1021210278: { label: "Gunsmith", order: 3 },
      1660497607: { label: "AI", order: 4 },
      1761642340: { label: "Unknown", order: -1 },
      3231773039: { label: "Vanguard Research", order: 6 },
      4196149087: { label: "Field Commander", order: 7 },
      4235119312: { label: "Deadzone Scout", order: 8 }
    };

    if (progressions) {
      store.progression = {
        progressions
      };
      store.progression.progressions = _.map(store.progression.progressions);
      store.progression.progressions.forEach((prog) => {
        Object.assign(prog, defs.Progression.get(prog.progressionHash), progressionMeta[prog.progressionHash]);
        const faction = _.find(defs.Faction, { progressionHash: prog.progressionHash });
        if (faction) {
          prog.faction = faction;
          prog.faction.factionName = prog.faction.factionName || faction.displayProperties.name;
          prog.faction.factionIcon = prog.faction.factionIcon || faction.displayProperties.icon;
        }
      });
    }

    return D2ItemFactory.processItems(store, characterInventory.concat(_.values(characterEquipment)), itemComponents, previousItems, newItems, itemInfoService).then((items) => {
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

      return store;
    });
  }

  function processVault(
    defs,
    profileInventory,
    profileCurrencies,
    itemComponents,
    buckets,
    previousItems,
    newItems,
    itemInfoService) {
    const store = D2StoreFactory.makeVault(buckets, profileCurrencies);

    return D2ItemFactory.processItems(store, _.values(profileInventory), itemComponents, previousItems, newItems, itemInfoService).then((items) => {
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

      store.vaultCounts = {};
      ['Weapons', 'Armor', 'General', 'Inventory'].forEach((category) => {
        store.vaultCounts[category] = 0;
        buckets.byCategory[category].forEach((bucket) => {
          if (store.buckets[bucket.id]) {
            store.vaultCounts[category] += store.buckets[bucket.id].length;
          }
        });
      });

      return store;
    });
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(profileInfo) {
    return _.reduce(_.values(profileInfo.characters.data), (memo, character) => {
      const d1 = new Date(character.dateLastPlayed);
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

    console.error('Error loading stores', e);
  }
}
