import _ from 'underscore';
import { Subject, BehaviorSubject } from 'rxjs';

import { flatMap } from '../util';
import { compareAccounts } from '../accounts/destiny-account.service';
import { optimalLoadout } from '../loadout/loadout-utils';

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
  loadingTracker,
  dimDestinyTrackerService
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
    reloadStores,
    refreshRatingsData
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
  function loadStores(account) {
    // Save a snapshot of all the items before we update
    const previousItems = NewItemsService.buildItemSet(_stores);
    const firstLoad = (previousItems.size === 0);

    D2ItemFactory.resetIdTracker();

    const dataDependencies = [
      D2Definitions.getDefinitions(),
      D2BucketsService.getBuckets(),
      NewItemsService.loadNewItems(account, 2),
      dimItemInfoService(account, 2),
      Destiny2Api.getStores(account)
    ];

    const reloadPromise = $q.all(dataDependencies)
      .then(([defs, buckets, newItems, itemInfoService, profileInfo]) => {
        NewItemsService.applyRemovedNewItems(newItems);

        const lastPlayedDate = findLastPlayedDate(profileInfo);

        // TODO: components may be hidden (privacy)

        const processVaultPromise = processVault(defs,
          profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : [],
          profileInfo.profileCurrencies.data ? profileInfo.profileCurrencies.data.items : [],
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
          profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : [],
          profileInfo.characterEquipment.data && profileInfo.characterEquipment.data[characterId] ? profileInfo.characterEquipment.data[characterId].items : [],
          profileInfo.itemComponents,
          Object.assign(profileInfo.characterProgressions.data[characterId].progressions, profileInfo.characterProgressions.data[characterId].factions),
          buckets,
          previousItems,
          newItems,
          itemInfoService,
          lastPlayedDate));

        return $q.all([defs, buckets, newItems, itemInfoService, processVaultPromise, ...processStorePromises]);
      })
      .then(([defs, buckets, newItems, itemInfoService, vault, ...characters]) => {
        // Save and notify about new items (but only if this wasn't the first load)
        if (!firstLoad) {
          // Save the list of new item IDs
          NewItemsService.applyRemovedNewItems(newItems);
          NewItemsService.saveNewItems(newItems, account, 2);
        }

        const stores = [...characters, vault];
        _stores = stores;

        // TODO: update vault counts for character account-wide
        updateVaultCounts(buckets, _.find(characters, 'current'), vault);

        dimDestinyTrackerService.fetchReviews(stores);

        itemInfoService.cleanInfos(stores);

        stores.forEach((s) => updateBasePower(stores, s, defs));

        // Let our styling know how many characters there are
        document.querySelector('html').style.setProperty("--num-characters", _stores.length - 1);

        dimDestinyTrackerService.reattachScoresFromCache(stores);

        // TODO: this is still useful, but not in as many situations
        $rootScope.$broadcast('d2-stores-updated', {
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
    profileInventory,
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
      611314723: { label: "Vanguard", order: 1 },
      3231773039: { label: "Vanguard Research", order: 2 },
      697030790: { label: "Crucible", order: 3 },
      1021210278: { label: "Gunsmith", order: 4 },

      4235119312: { label: "EDZ Deadzone Scout", order: 5 },
      4196149087: { label: "Titan Field Commander", order: 6 },
      1660497607: { label: "Nessus AI", order: 7 },
      828982195: { label: "Io Researcher", order: 8 },
      2677528157: { label: "Follower of Osiris", order: 9 },

      2105209711: { label: "New Monarchy", order: 10 },
      1714509342: { label: "Future War Cult", order: 11 },
      3398051042: { label: "Dead Orbit", order: 12 },
      3468066401: { label: "The Nine", order: 13 },
      1761642340: { label: "Iron Banner", order: 14 },

      1482334108: { label: "Leviathan", order: 15 }
    };

    if (progressions) {
      store.progression = {
        progressions: _.map(progressions)
      };
      store.progression.progressions.forEach((prog) => {
        Object.assign(prog, defs.Progression.get(prog.progressionHash), progressionMeta[prog.progressionHash]);
        const faction = _.find(defs.Faction, { progressionHash: prog.progressionHash });
        if (faction) {
          prog.faction = faction;
          prog.faction.factionName = faction.displayProperties.name;
          prog.faction.factionIcon = faction.displayProperties.icon;
        }
      });
    }

    // We work around the weird account-wide buckets by assigning them to the current character
    let items = characterInventory.concat(_.values(characterEquipment));
    if (store.current) {
      items = items.concat(Object.values(profileInventory).filter((i) => {
        // items that can be stored in a vault
        return buckets.byHash[i.bucketHash].vaultBucket;
      }));
    }

    return D2ItemFactory.processItems(store, items, itemComponents, previousItems, newItems, itemInfoService).then((items) => {
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

    const items = Object.values(profileInventory).filter((i) => {
      // items that cannot be stored in the vault, and are therefore *in* a vault
      return !buckets.byHash[i.bucketHash].vaultBucket;
    });
    return D2ItemFactory.processItems(store, items, itemComponents, previousItems, newItems, itemInfoService).then((items) => {
      store.items = items;

      // by type-bucket
      store.buckets = _.groupBy(items, (i) => i.location.id);

      store.d2VaultCounts = {};

      // Fill in any missing buckets
      _.values(buckets.byType).forEach((bucket) => {
        if (!store.buckets[bucket.id]) {
          store.buckets[bucket.id] = [];
        }

        if (bucket.vaultBucket) {
          const vaultBucketId = bucket.vaultBucket.id;
          store.d2VaultCounts[vaultBucketId] = store.d2VaultCounts[vaultBucketId] || {
            count: 0,
            bucket: bucket.accountWide ? bucket : bucket.vaultBucket
          };
          store.d2VaultCounts[vaultBucketId].count += store.buckets[bucket.id].length;
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

  // Add a fake stat for "max base power"
  function updateBasePower(stores, store, defs) {
    if (!store.isVault) {
      const def = defs.Stat.get(1935470627);
      const maxBasePower = getBasePower(store, maxBasePowerLoadout(stores, store));

      const hasClassified = flatMap(_stores, 'items').some((i) => {
        return i.classified &&
          (i.location.sort === 'Weapons' ||
           i.location.sort === 'Armor' ||
           i.type === 'Ghost');
      });

      store.stats.maxBasePower = {
        id: 'maxBasePower',
        name: $i18next.t('Stats.MaxBasePower'),
        hasClassified,
        description: def.displayProperties.description,
        value: hasClassified ? `${maxBasePower}*` : maxBasePower,
        icon: `https://www.bungie.net${def.displayProperties.icon}`,
        tiers: [maxBasePower],
        tierMax: 300,
        tier: 0
      };
    }
  }

  function maxBasePowerLoadout(stores, store) {
    const statHashes = new Set([
      1480404414, // Attack
      3897883278, // Defense
    ]);

    const applicableItems = _.filter(flatMap(stores, 'items'), (i) => {
      return i.canBeEquippedBy(store) &&
        i.primStat && // has a primary stat (sanity check)
        statHashes.has(i.primStat.statHash); // one of our selected stats
    });

    const bestItemFn = function(item) {
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

    return optimalLoadout(store, applicableItems, bestItemFn, '');
  }

  function getBasePower(store, loadout) {
    // https://www.reddit.com/r/DestinyTheGame/comments/6yg4tw/how_overall_power_level_is_calculated/
    const itemWeight = {
      Weapons: 6,
      Armor: 5,
      General: 4
    };
    // 3 Weapons, 4 Armor, 1 General
    const itemWeightDenominator = 42;

    const items = _.filter(_.flatten(_.values(loadout.items)), 'equipped');

    return (_.reduce(items, (memo, item) => {
      return memo + (item.basePower * itemWeight[item.type === 'ClassItem' ? 'General' : item.location.sort]);
    }, 0) / itemWeightDenominator).toFixed(1);
  }

  // TODO: vault counts are silly and convoluted. We really need an
  // object to represent a Profile.
  function updateVaultCounts(buckets, activeStore, vault) {
    // Fill in any missing buckets
    _.values(buckets.byType).forEach((bucket) => {
      if (bucket.accountWide && bucket.vaultBucket) {
        const vaultBucketId = bucket.id;
        vault.d2VaultCounts[vaultBucketId] = vault.d2VaultCounts[vaultBucketId] || {
          count: 0,
          bucket
        };
        vault.d2VaultCounts[vaultBucketId].count += activeStore.buckets[bucket.id].length;
      }
    });
    activeStore.vault = vault; // god help me
  }

  function refreshRatingsData() {
    dimDestinyTrackerService.clearCache();
    dimDestinyTrackerService.fetchReviews(_stores);
  }
}
