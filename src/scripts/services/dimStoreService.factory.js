import angular from 'angular';
import _ from 'underscore';
import { sum, count } from '../util';
import idbKeyval from 'idb-keyval';

angular.module('dimApp')
  .factory('dimStoreService', StoreService);

function StoreService(
  $rootScope,
  $q,
  dimBungieService,
  dimPlatformService,
  dimCategory,
  dimDefinitions,
  dimBucketService,
  dimItemInfoService,
  dimInfoService,
  SyncService,
  loadingTracker,
  dimManifestService,
  $translate,
  uuid2,
  dimFeatureFlags,
  dimSettingsService,
  $http
) {
  var _stores = [];
  var _idTracker = {};

  var _removedNewItems = new Set();

  // Load classified data once per load and keep it in memory until
  // reload. Classified data always comes from
  // beta.destinyitemmanager.com so it can be released faster than the
  // release website, but the release website can still use the
  // updated definitions.
  const getClassifiedData = _.memoize(function() {
    return idbKeyval.get('classified-data').then((data) => {
      // Use cached data for up to 4 hours
      if ($DIM_FLAVOR !== 'dev' &&
          data &&
          data.time > Date.now() - (4 * 60 * 60 * 1000)) {
        return data;
      }

      // In dev, use a local copy of the JSON for testing
      const url = ($DIM_FLAVOR === 'dev')
              ? '/data/classified.json'
              : 'https://beta.destinyitemmanager.com/data/classified.json';

      return $http.get(url)
        .then((response) => {
          if (response && response.status === 200) {
            const remoteData = response.data;
            remoteData.time = Date.now();
            return idbKeyval.set('classified-data', remoteData).then(() => remoteData);
          }

          console.error("Couldn't load classified info from " + url);

          return {
            itemHash: {}
          };
        })
        .catch((e) => {
          console.error("Couldn't load classified info from " + url, e);

          return {
            itemHash: {}
          };
        });
    });
  });

  const dimMissingSources = require('app/data/missing_sources.json');

  const yearHashes = {
    //         tTK       Variks        CoE         FoTL    Kings Fall
    year2: [2659839637, 512830513, 1537575125, 3475869915, 1662673928],
    //         RoI       WoTM         FoTl       Dawning    Raid Reprise
    year3: [2964550958, 4160622434, 3475869915, 3131490494, 4161861381]
  };

  // Label isn't used, but it helps us understand what each one is
  const progressionMeta = {
    529303302: { label: "Cryptarch", order: 0 },
    3233510749: { label: "Vanguard", order: 1 },
    1357277120: { label: "Crucible", order: 2 },
    2778795080: { label: "Dead Orbit", order: 3 },
    1424722124: { label: "Future War Cult", order: 4 },
    3871980777: { label: "New Monarchy", order: 5 },
    2161005788: { label: "Iron Banner", order: 6 },
    174528503: { label: "Crota's Bane", order: 7 },
    807090922: { label: "Queen's Wrath", order: 8 },
    3641985238: { label: "House of Judgment", order: 9 },
    2335631936: { label: "Gunsmith", order: 10 },
    2576753410: { label: "SRL", order: 11 }
  };

  // Maps tierType to tierTypeName in English
  const tiers = [
    'Unused 0',
    'Unused 1',
    'Common',
    'Uncommon',
    'Rare',
    'Legendary',
    'Exotic'
  ];

  // A promise used to dedup parallel calls to reloadStores
  var _reloadPromise;

  // Cooldowns
  var cooldownsSuperA = ['5:00', '4:46', '4:31', '4:15', '3:58', '3:40'];
  var cooldownsSuperB = ['5:30', '5:14', '4:57', '4:39', '4:20', '4:00'];
  var cooldownsGrenade = ['1:00', '0:55', '0:49', '0:42', '0:34', '0:25'];
  var cooldownsMelee = ['1:10', '1:04', '0:57', '0:49', '0:40', '0:29'];

  // Prototype for Store objects - add methods to this to add them to all
  // stores.
  var StoreProto = {
    /**
     * Get the total amount of this item in the store, across all stacks,
     * excluding stuff in the postmaster.
     */
    amountOfItem: function(item) {
      return sum(_.filter(this.items, function(i) {
        return i.hash === item.hash && !i.location.inPostmaster;
      }), 'amount');
    },
    /**
     * How much of items like this item can fit in this store? For
     * stackables, this is in stacks, not individual pieces.
     */
    capacityForItem: function(item) {
      if (!item.bucket) {
        console.error("item needs a 'bucket' field", item);
        return 10;
      }
      return item.bucket.capacity;
    },
    /**
     * How many *more* items like this item can fit in this store?
     * This takes into account stackables, so the answer will be in
     * terms of individual pieces.
     */
    spaceLeftForItem: function(item) {
      if (!item.type) {
        throw new Error("item needs a 'type' field");
      }
      const openStacks = Math.max(0, this.capacityForItem(item) -
                                  this.buckets[item.location.id].length);
      const maxStackSize = item.maxStackSize || 1;
      if (maxStackSize === 1) {
        return openStacks;
      } else {
        const existingAmount = this.amountOfItem(item);
        const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
        return (openStacks * maxStackSize) + stackSpace;
      }
    },
    updateCharacterInfoFromEquip: function(characterInfo) {
      dimDefinitions.getDefinitions().then((defs) => this.updateCharacterInfo(defs, characterInfo));
    },
    updateCharacterInfo: function(defs, characterInfo) {
      this.level = characterInfo.characterLevel;
      this.percentToNextLevel = characterInfo.percentToNextLevel / 100.0;
      this.powerLevel = characterInfo.characterBase.powerLevel;
      this.background = 'https://www.bungie.net/' + characterInfo.backgroundPath;
      this.icon = 'https://www.bungie.net/' + characterInfo.emblemPath;
      this.stats = getCharacterStatsData(defs.Stat, characterInfo.characterBase);
    },
    // Remove an item from this store. Returns whether it actually removed anything.
    removeItem: function(item) {
      // Completely remove the source item
      function match(i) { return item.index === i.index; }
      var sourceIndex = _.findIndex(this.items, match);
      if (sourceIndex >= 0) {
        this.items.splice(sourceIndex, 1);

        var bucketItems = this.buckets[item.location.id];
        var bucketIndex = _.findIndex(bucketItems, match);
        bucketItems.splice(bucketIndex, 1);

        return true;
      }
      return false;
    },
    addItem: function(item) {
      this.items.push(item);
      var bucketItems = this.buckets[item.location.id];
      bucketItems.push(item);
      if (item.location.id === 'BUCKET_RECOVERY' && bucketItems.length >= item.location.capacity) {
        dimInfoService.show('lostitems', {
          type: 'warning',
          title: $translate.instant('Postmaster.Limit'),
          body: $translate.instant('Postmaster.Desc', { store: this.name }),
          hide: $translate.instant('Help.NeverShow')
        });
      }
      item.owner = this.id;
    },
    // Create a loadout from this store's equipped items
    loadoutFromCurrentlyEquipped: function(name) {
      return {
        id: uuid2.newguid(),
        classType: -1,
        name: name,
        items: _(this.items)
          .chain()
          .select((item) => item.canBeInLoadout())
          .map((i) => angular.copy(i))
          .groupBy((i) => i.type.toLowerCase())
          .value()
      };
    },
    factionAlignment: function() {
      const factionBadges = {
        969832704: 'Future War Cult',
        27411484: 'Dead Orbit',
        2954371221: 'New Monarchy'
      };

      const badge = _.find(this.buckets.BUCKET_MISSION, (i) => factionBadges[i.hash]);
      if (!badge) {
        return null;
      }

      return factionBadges[badge.hash];
    }
  };

  /**
   * Check to see if this item has a node that restricts it to a
   * certain faction, and if the character is aligned with that
   * faction.
   */
  function factionItemAligns(store, item) {
    if (!item.talentGrid) {
      return true;
    }

    // Nodes that require matching faction alignment
    const factionNodes = {
      652505621: 'New Monarchy',
      2669659850: 'Future War Cult',
      2794386410: 'Dead Orbit'
    };

    const factionNode = _.find(item.talentGrid.nodes, (n) => factionNodes[n.hash]);
    if (!factionNode) {
      return true;
    }

    return factionNodes[factionNode.hash] === store.factionAlignment();
  }

  // Prototype for Item objects - add methods to this to add them to all
  // items.
  var ItemProto = {
    // Can this item be equipped by the given store?
    canBeEquippedBy: function(store) {
      if (store.isVault) {
        return false;
      }

      return this.equipment &&
        // For the right class
        (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
        // nothing we are too low-level to equip
        this.equipRequiredLevel <= store.level &&
        // can be moved or is already here
        (!this.notransfer || this.owner === store.id) &&
        !this.location.inPostmaster &&
        factionItemAligns(store, this);
    },
    inCategory: function(categoryName) {
      return _.contains(this.categories, categoryName);
    },
    isEngram: function() {
      return this.inCategory('CATEGORY_ENGRAM');
    },
    canBeInLoadout: function() {
      return this.equipment || this.type === 'Material' || this.type === 'Consumable';
    },
    // "The Life Exotic" Perk on Exotic Items means you can equip another exotic
    hasLifeExotic: function() {
      return this.isExotic && this.talentGrid && (_.find(this.talentGrid.nodes, { hash: 4044819214 }) !== undefined);
    }
  };

  var service = {
    getActiveStore: getActiveStore,
    getStores: getStores,
    reloadStores: reloadStores,
    getStore: getStore,
    getBonus: getBonus,
    getVault: getStore.bind(null, 'vault'),
    updateCharacters: updateCharacters,
    clearNewItems: clearNewItems,
    dropNewItem: dropNewItem,
    createItemIndex: createItemIndex,
    processItems: processItems,
    getCharacterStatsData,
    hasNewItems: false
  };

  $rootScope.$on('dim-active-platform-updated', function() {
    _stores = [];
    service.hasNewItems = false;
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
    ]).then(function([defs, bungieStores]) {
      _.each(_stores, function(dStore) {
        if (!dStore.isVault) {
          var bStore = _.findWhere(bungieStores, { id: dStore.id });
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
    const previousItems = buildItemSet(_stores);
    const firstLoad = (previousItems.size === 0);

    function fakeItemId(item) {
      if (activePlatform.fake && item.itemInstanceId !== "0") {
        item.itemInstanceId = 'fake-' + item.itemInstanceId;
      }
    }

    _reloadPromise = $q.all([
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      loadNewItems(activePlatform),
      dimItemInfoService(activePlatform),
      dimBungieService.getStores(activePlatform)])
      .then(function([defs, buckets, newItems, itemInfoService, rawStores]) {
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

        var glimmer;
        var marks;
        var silver;
        _removedNewItems.forEach((id) => newItems.delete(id));
        _removedNewItems.clear();
        service.hasNewItems = (newItems.size !== 0);

        return $q.all([newItems, itemInfoService, ...rawStores.map(function(raw) {
          if (activePlatform !== dimPlatformService.getActive()) {
            throw new Error("Active platform mismatch");
          }
          var store;
          var items = [];
          if (!raw) {
            return undefined;
          }

          const character = raw.character.base;

          if (raw.id === 'vault') {
            store = angular.extend(Object.create(StoreProto), {
              id: 'vault',
              name: $translate.instant('Bucket.Vault'),
              class: 'vault',
              current: false,
              className: $translate.instant('Bucket.Vault'),
              lastPlayed: '2005-01-01T12:00:01Z',
              icon: require('app/images/vault.png'),
              background: require('app/images/vault-background.png'),
              items: [],
              legendaryMarks: marks,
              glimmer: glimmer,
              silver: silver,
              isVault: true,
              // Vault has different capacity rules
              capacityForItem: function(item) {
                var sort = item.sort;
                if (item.bucket) {
                  sort = item.bucket.sort;
                }
                if (!sort) {
                  throw new Error("item needs a 'sort' field");
                }
                return buckets[sort].capacity;
              },
              spaceLeftForItem: function(item) {
                let sort = item.sort;
                if (item.bucket) {
                  sort = item.bucket.sort;
                }
                if (!sort) {
                  throw new Error("item needs a 'sort' field");
                }
                const openStacks = Math.max(0, this.capacityForItem(item) -
                                            count(this.items, (i) => i.bucket.sort === sort));
                const maxStackSize = item.maxStackSize || 1;
                if (maxStackSize === 1) {
                  return openStacks;
                } else {
                  const existingAmount = this.amountOfItem(item);
                  const stackSpace = existingAmount > 0 ? (maxStackSize - (existingAmount % maxStackSize)) : 0;
                  return (openStacks * maxStackSize) + stackSpace;
                }
              },
              removeItem: function(item) {
                var result = StoreProto.removeItem.call(this, item);
                this.vaultCounts[item.location.sort]--;
                return result;
              },
              addItem: function(item) {
                StoreProto.addItem.call(this, item);
                this.vaultCounts[item.location.sort]++;
              }
            });

            _.each(raw.data.buckets, function(bucket) {
              _.each(bucket.items, function(item) {
                item.bucket = bucket.bucketHash;
                fakeItemId(item);
              });

              items = _.union(items, bucket.items);
            });
          } else {
            try {
              glimmer = _.find(character.inventory.currencies, function(cur) { return cur.itemHash === 3159615086; }).value;
              marks = _.find(character.inventory.currencies, function(cur) { return cur.itemHash === 2534352370; }).value;
              silver = _.find(character.inventory.currencies, function(cur) { return cur.itemHash === 2749350776; }).value;
            } catch (e) {
              glimmer = 0;
              marks = 0;
            }

            const race = defs.Race[character.characterBase.raceHash];
            let genderRace = "";
            let className = "";
            let gender = "";
            if (character.characterBase.genderType === 0) {
              gender = 'male';
              genderRace = race.raceNameMale;
              className = defs.Class[character.characterBase.classHash].classNameMale;
            } else {
              gender = 'female';
              genderRace = race.raceNameFemale;
              className = defs.Class[character.characterBase.classHash].classNameFemale;
            }

            store = angular.extend(Object.create(StoreProto), {
              id: raw.id,
              icon: 'https://www.bungie.net/' + character.emblemPath,
              current: lastPlayedDate.getTime() === (new Date(character.characterBase.dateLastPlayed)).getTime(),
              lastPlayed: character.characterBase.dateLastPlayed,
              background: 'https://www.bungie.net/' + character.backgroundPath,
              level: character.characterLevel,
              powerLevel: character.characterBase.powerLevel,
              stats: getCharacterStatsData(defs.Stat, character.characterBase),
              class: getClass(character.characterBase.classType),
              classType: character.characterBase.classType,
              className: className,
              gender: gender,
              genderRace: genderRace,
              percentToNextLevel: character.percentToNextLevel / 100.0,
              progression: raw.character.progression,
              advisors: raw.character.advisors,
              isVault: false
            });

            store.name = store.genderRace + ' ' + store.className;

            if (store.progression) {
              store.progression.progressions.forEach(function(prog) {
                angular.extend(prog, defs.Progression.get(prog.progressionHash), progressionMeta[prog.progressionHash]);
                const faction = _.find(defs.Faction, { progressionHash: prog.progressionHash });
                if (faction) {
                  prog.faction = faction;
                }
              });
            }

            _.each(raw.data.buckets, function(bucket) {
              _.each(bucket, function(pail) {
                _.each(pail.items, function(item) {
                  item.bucket = pail.bucketHash;
                  fakeItemId(item);
                });

                items = _.union(items, pail.items);
              });
            });

            if (_.has(character.inventory.buckets, 'Invisible')) {
              if (_.size(character.inventory.buckets.Invisible) > 0) {
                _.each(character.inventory.buckets.Invisible, function(pail) {
                  _.each(pail.items, function(item) {
                    item.bucket = pail.bucketHash;
                    fakeItemId(item);
                  });

                  items = _.union(items, pail.items);
                });
              }
            }
          }

          return processItems(store, items, previousItems, newItems, itemInfoService).then(function(items) {
            if (activePlatform !== dimPlatformService.getActive()) {
              throw new Error("Active platform mismatch");
            }

            store.items = items;

            // by type-bucket
            store.buckets = _.groupBy(items, function(i) {
              return i.location.id;
            });

            // Fill in any missing buckets
            _.values(buckets.byType).forEach(function(bucket) {
              if (!store.buckets[bucket.id]) {
                store.buckets[bucket.id] = [];
              }
            });

            if (store.isVault) {
              store.vaultCounts = {};
              ['Weapons', 'Armor', 'General'].forEach(function(category) {
                store.vaultCounts[category] = 0;
                buckets.byCategory[category].forEach(function(bucket) {
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
      .then(function([newItems, itemInfoService, ...stores]) {
        if (activePlatform !== dimPlatformService.getActive()) {
          throw new Error("Active platform mismatch");
        }

        // Save and notify about new items (but only if this wasn't the first load)
        if (!firstLoad) {
          // Save the list of new item IDs
          _removedNewItems.forEach((id) => newItems.delete(id));
          _removedNewItems.clear();
          saveNewItems(newItems);
          service.hasNewItems = (newItems.size !== 0);
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
      .catch(function(e) {
        if (e.message === 'Active platform mismatch') {
          // no problem, just canceling the request
          return null;
        }
        throw e;
      })
      .finally(function() {
        // Clear the reload promise so this can be called again
        if (_reloadPromise.activePlatform === activePlatform) {
          _reloadPromise = null;
        }
        dimManifestService.isLoaded = true;
      });

    _reloadPromise.activePlatform = activePlatform;
    return _reloadPromise;
  }

  function getStore(id) {
    return _.find(_stores, { id: id });
  }

  // Set an ID for the item that should be unique across all items
  function createItemIndex(item) {
    // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
    var index = item.hash + '-';
    if (item.id === '0') {
      index = index + item.amount;
      _idTracker[index] = (_idTracker[index] || 0) + 1;
      index = index + '-' + _idTracker[index];
    } else {
      index = index + item.id;
    }
    return index;
  }

  function processSingleItem(defs, buckets, previousItems, newItems, itemInfoService, classifiedData, item, owner) {
    var itemDef = defs.InventoryItem.get(item.itemHash);
    // Missing definition?
    if (!itemDef) {
      // maybe it is redacted...
      itemDef = {
        itemName: "Missing Item",
        redacted: true
      };
      dimManifestService.warnMissingDefinition();
    }

    if (!itemDef.icon && !itemDef.action) {
      itemDef.classified = true;
      itemDef.classType = 3;
    }

    if (!itemDef.icon) {
      itemDef.icon = '/img/misc/missing_icon.png';
    }

    if (!itemDef.itemTypeName) {
      itemDef.itemTypeName = 'Unknown';
    }

    if (itemDef.redacted) {
      console.warn('Missing Item Definition:\n\n', item, '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.');
    }

    if (itemDef.classified) {
      const classifiedItemDef = buildClassifiedItem(classifiedData, itemDef.hash);
      if (classifiedItemDef) {
        itemDef = classifiedItemDef;
        item.primaryStat = itemDef.primaryStat;
      }
    }

    if (!itemDef || !itemDef.itemName) {
      return null;
    }

    // fix itemDef for defense items with missing nodes
    if (item.primaryStat && item.primaryStat.statHash === 3897883278 && _.size(itemDef.stats) > 0 && _.size(itemDef.stats) !== 5) {
      var defaultMinMax = _.find(itemDef.stats, function(stat) {
        return _.indexOf([144602215, 1735777505, 4244567218], stat.statHash) >= 0;
      });

      if (defaultMinMax) {
        [144602215, 1735777505, 4244567218].forEach(function(val) {
          if (!itemDef.stats[val]) {
            itemDef.stats[val] = {
              maximum: defaultMinMax.maximum,
              minimum: defaultMinMax.minimum,
              statHash: val,
              value: 0
            };
          }
        });
      }
    }

    // def.bucketTypeHash is where it goes normally
    var normalBucket = buckets.byHash[itemDef.bucketTypeHash];
    if (!normalBucket) {
      currentBucket = normalBucket = buckets.unknown;
      buckets.setHasUnknown();
    }

    // item.bucket is where it IS right now
    var currentBucket = buckets.byHash[item.bucket] || normalBucket;

    // We cheat a bit for items in the vault, since we treat the
    // vault as a character. So put them in the bucket they would
    // have been in if they'd been on a character.
    if (currentBucket.id.startsWith('BUCKET_VAULT')) {
      // TODO: Remove this if Bungie ever returns bucket.id for classified
      // items in the vault.
      if (itemDef.classified && itemDef.itemTypeName === 'Unknown') {
        if (currentBucket.id.endsWith('WEAPONS')) {
          currentBucket = buckets.byType.Heavy;
        } else if (currentBucket.id.endsWith('ARMOR')) {
          currentBucket = buckets.byType.ClassItem;
        } else if (currentBucket.id.endsWith('ITEMS')) {
          currentBucket = buckets.byType.Artifact;
        }
      } else {
        currentBucket = normalBucket;
      }
    }

    var itemType = normalBucket.type || 'Unknown';

    const categories = itemDef.itemCategoryHashes ? _.compact(itemDef.itemCategoryHashes.map((c) => {
      const category = defs.ItemCategory.get(c);
      return category ? category.identifier : null;
    })) : [];

    var dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

    itemDef.sourceHashes = itemDef.sourceHashes || [];

    const missingSource = dimMissingSources[itemDef.hash] || [];
    if (missingSource.length) {
      itemDef.sourceHashes = _.union(itemDef.sourceHashes, missingSource);
    }

    var createdItem = angular.extend(Object.create(ItemProto), {
      // figure out what year this item is probably from

      // The bucket the item is currently in
      location: currentBucket,
      // The bucket the item normally resides in (even though it may be in the vault/postmaster)
      bucket: normalBucket,
      hash: item.itemHash,
      // This is the type of the item (see dimCategory/dimBucketService) regardless of location
      type: itemType,
      categories: categories, // see defs.ItemCategory
      tier: tiers[itemDef.tierType] || 'Common',
      isExotic: tiers[itemDef.tierType] === 'Exotic',
      isVendorItem: (!owner || owner.id === null),
      name: itemDef.itemName,
      description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
      icon: itemDef.icon,
      notransfer: Boolean(currentBucket.inPostmaster || itemDef.nonTransferrable || !itemDef.allowActions || itemDef.classified),
      id: item.itemInstanceId,
      equipped: item.isEquipped,
      equipment: item.isEquipment,
      complete: item.isGridComplete,
      percentComplete: null,
      amount: item.stackSize,
      primStat: item.primaryStat,
      typeName: itemDef.itemTypeName,
      // "perks" are the two or so talent grid items that are "featured" for an
      // item in its popup in the game. We don't currently use these.
      // perks: item.perks,
      equipRequiredLevel: item.equipRequiredLevel,
      maxStackSize: (itemDef.maxStackSize > 0) ? itemDef.maxStackSize : 1,
      // 0: titan, 1: hunter, 2: warlock, 3: any
      classType: itemDef.classType,
      classTypeName: getClass(itemDef.classType),
      classTypeNameLocalized: getClassTypeNameLocalized(defs, itemDef.classType),
      dmg: dmgName,
      visible: true,
      sourceHashes: itemDef.sourceHashes,
      lockable: normalBucket.type !== 'Class' && ((currentBucket.inPostmaster && item.isEquipment) || currentBucket.inWeapons || item.lockable),
      trackable: currentBucket.inProgress && (currentBucket.hash === 2197472680 || currentBucket.hash === 1801258597),
      tracked: item.state === 2,
      locked: item.locked,
      redacted: itemDef.redacted,
      classified: itemDef.classified,
      isInLoadout: false
    });

    createdItem.taggable = createdItem.lockable && !_.contains(categories, 'CATEGORY_ENGRAM');

    createdItem.index = createItemIndex(createdItem);

    // Moving rare masks destroys them
    if (createdItem.inCategory('CATEGORY_MASK') && createdItem.tier !== 'Legendary') {
      createdItem.notransfer = true;
    }

    if (createdItem.primStat) {
      createdItem.primStat.stat = defs.Stat.get(createdItem.primStat.statHash);
    }

    // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
    createdItem.isNew = false;
    try {
      createdItem.isNew = isItemNew(createdItem.id, previousItems, newItems);
    } catch (e) {
      console.error("Error determining new-ness of " + createdItem.name, item, itemDef, e);
    }

    if (itemInfoService) {
      try {
        createdItem.dimInfo = itemInfoService.infoForItem(createdItem.hash, createdItem.id);
      } catch (e) {
        console.error("Error getting extra DIM info for " + createdItem.name, item, itemDef, e);
      }
    }

    try {
      createdItem.talentGrid = buildTalentGrid(item, defs.TalentGrid, defs.Progression);
    } catch (e) {
      console.error("Error building talent grid for " + createdItem.name, item, itemDef, e);
    }
    try {
      createdItem.stats = buildStats(item, itemDef, defs.Stat, createdItem.talentGrid, itemType);

      if (createdItem.stats && createdItem.stats.length === 0) {
        createdItem.stats = buildStats(item, item, defs.Stat, createdItem.talentGrid, itemType);
      }
    } catch (e) {
      console.error("Error building stats for " + createdItem.name, item, itemDef, e);
    }
    try {
      createdItem.objectives = buildObjectives(item.objectives, defs.Objective);
    } catch (e) {
      console.error("Error building objectives for " + createdItem.name, item, itemDef, e);
    }
    if (createdItem.talentGrid && createdItem.talentGrid.infusable) {
      try {
        createdItem.quality = getQualityRating(createdItem.stats, item.primaryStat, itemType);
      } catch (e) {
        console.error("Error building quality rating for " + createdItem.name, item, itemDef, e);
      }
    }

    setItemYear(createdItem);

    // More objectives properties
    if (createdItem.objectives) {
      createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, 'complete');
      createdItem.percentComplete = sum(createdItem.objectives, function(objective) {
        if (objective.completionValue) {
          return Math.min(1.0, objective.progress / objective.completionValue) / createdItem.objectives.length;
        } else {
          return 0;
        }
      });
    } else if (createdItem.talentGrid) {
      createdItem.percentComplete = Math.min(1.0, createdItem.talentGrid.totalXP / createdItem.talentGrid.totalXPRequired);
      createdItem.complete = createdItem.talentGrid.complete;
    }

    // In debug mode, keep the original JSON around
    if (dimFeatureFlags.debugMode) {
      createdItem.originalItem = item;
    }

    // do specific things for specific items
    if (createdItem.hash === 491180618) { // Trials Cards
      createdItem.objectives = buildTrials(owner.advisors.activities.trials);
      var best = owner.advisors.activities.trials.extended.highestWinRank;
      createdItem.complete = owner.advisors.activities.trials.completion.success;
      createdItem.percentComplete = createdItem.complete ? 1 : (best >= 7 ? .66 : (best >= 5 ? .33 : 0));
    }

    return createdItem;
  }

  function buildTalentGrid(item, talentDefs, progressDefs) {
    var talentGridDef = talentDefs.get(item.talentGridHash);
    if (!item.progression || !talentGridDef || !item.nodes || !item.nodes.length || !progressDefs.get(item.progression.progressionHash)) {
      return undefined;
    }

    var totalXP = item.progression.currentProgress;
    var totalLevel = item.progression.level; // Can be way over max

    // progressSteps gives the XP needed to reach each level, with
    // the last element repeating infinitely.
    var progressSteps = progressDefs.get(item.progression.progressionHash).steps;
    // Total XP to get to specified level
    function xpToReachLevel(level) {
      if (level === 0) {
        return 0;
      }
      var totalXPRequired = 0;
      for (var step = 1; step <= level; step++) {
        totalXPRequired += progressSteps[Math.min(step, progressSteps.length) - 1].progressTotal;
      }

      return totalXPRequired;
    }

    var possibleNodes = talentGridDef.nodes;

    // var featuredPerkNames = item.perks.map(function(perk) {
    //   var perkDef = perkDefs.get(perk.perkHash);
    //   return perkDef ? perkDef.displayName : 'Unknown';
    // });

    var gridNodes = item.nodes.map(function(node) {
      var talentNodeGroup = possibleNodes[node.nodeHash];
      var talentNodeSelected = talentNodeGroup.steps[node.stepIndex];

      if (!talentNodeSelected) {
        return undefined;
      }

      var nodeName = talentNodeSelected.nodeStepName;

      // Filter out some weird bogus nodes
      if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
        return undefined;
      }

      // Only one node in this column can be selected (scopes, etc)
      var exclusiveInColumn = Boolean(talentNodeGroup.exlusiveWithNodes &&
                               talentNodeGroup.exlusiveWithNodes.length > 0);

      // Unlocked is whether or not the material cost has been paid
      // for the node
      var unlocked = node.isActivated ||
            talentNodeGroup.autoUnlocks ||
            // If only one can be activated, the cost only needs to be
            // paid once per row.
            (exclusiveInColumn &&
             _.any(talentNodeGroup.exlusiveWithNodes, function(nodeIndex) {
               return item.nodes[nodeIndex].isActivated;
             }));

      // Calculate relative XP for just this node
      var startProgressionBarAtProgress = talentNodeSelected.startProgressionBarAtProgress;
      var activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;
      var xpRequired = xpToReachLevel(activatedAtGridLevel) - startProgressionBarAtProgress;
      var xp = Math.max(0, Math.min(totalXP - startProgressionBarAtProgress, xpRequired));

      // Build a perk string for the DTR link. See https://github.com/DestinyItemManager/DIM/issues/934
      var dtrHash = null;
      if (node.isActivated || talentNodeGroup.isRandom) {
        dtrHash = node.nodeHash.toString(16);
        if (dtrHash.length > 1) {
          dtrHash += ".";
        }

        if (talentNodeGroup.isRandom) {
          dtrHash += node.stepIndex.toString(16);
          if (node.isActivated) {
            dtrHash += "o";
          }
        }
      }

      // There's a lot more here, but we're taking just what we need
      return {
        name: nodeName,
        hash: talentNodeSelected.nodeStepHash,
        description: talentNodeSelected.nodeStepDescription,
        icon: talentNodeSelected.icon,
        // XP put into this node
        xp: xp,
        // XP needed for this node to unlock
        xpRequired: xpRequired,
        // Position in the grid
        column: talentNodeGroup.column,
        row: talentNodeGroup.row,
        // Is the node selected (lit up in the grid)
        activated: node.isActivated,
        // The item level at which this node can be unlocked
        activatedAtGridLevel: activatedAtGridLevel,
        // Only one node in this column can be selected (scopes, etc)
        exclusiveInColumn: exclusiveInColumn,
        // Whether there's enough XP in the item to buy the node
        xpRequirementMet: activatedAtGridLevel <= totalLevel,
        // Whether or not the material cost has been paid for the node
        unlocked: unlocked,
        // Some nodes don't show up in the grid, like purchased ascend nodes
        hidden: node.hidden,

        dtrHash: dtrHash

        // Whether (and in which order) this perk should be
        // "featured" on an abbreviated info panel, as in the
        // game. 0 = not featured, positive numbers signify the
        // order of the featured perks.
        // featuredPerk: (featuredPerkNames.indexOf(nodeName) + 1)

        // This list of material requirements to unlock the
        // item are a mystery. These hashes don't exist anywhere in
        // the manifest database. Also, the activationRequirement
        // object doesn't say how much of the material is
        // needed. There's got to be some missing DB somewhere with
        // this info.
        // materialsNeeded: talentNodeSelected.activationRequirement.materialRequirementHashes

        // These are useful for debugging or searching for new properties,
        // but they don't need to be included in the result.
        // talentNodeGroup: talentNodeGroup,
        // talentNodeSelected: talentNodeSelected,
        // itemNode: node
      };
    });

    // We need to unique-ify because Ornament nodes show up twice!
    gridNodes = _.uniq(_.compact(gridNodes), false, 'hash');

    if (!gridNodes.length) {
      return undefined;
    }

    // This can be handy for visualization/debugging
    // var columns = _.groupBy(gridNodes, 'column');

    var maxLevelRequired = _.max(gridNodes, 'activatedAtGridLevel').activatedAtGridLevel;
    var totalXPRequired = xpToReachLevel(maxLevelRequired);

    var ascendNode = _.find(gridNodes, { hash: 1920788875 });

    // Fix for stuff that has nothing in early columns
    var minColumn = _.min(_.reject(gridNodes, 'hidden'), 'column').column;
    if (minColumn > 0) {
      gridNodes.forEach(function(node) { node.column -= minColumn; });
    }
    var maxColumn = _.max(gridNodes, 'column').column;

    return {
      nodes: _.sortBy(gridNodes, function(node) { return node.column + (0.1 * node.row); }),
      xpComplete: totalXPRequired <= totalXP,
      totalXPRequired: totalXPRequired,
      totalXP: Math.min(totalXPRequired, totalXP),
      hasAscendNode: Boolean(ascendNode),
      ascended: Boolean(ascendNode && ascendNode.activated),
      infusable: _.any(gridNodes, { hash: 1270552711 }),
      dtrPerks: _.compact(_.pluck(gridNodes, 'dtrHash')).join(';'),
      complete: totalXPRequired <= totalXP && _.all(gridNodes, (n) => n.unlocked || (n.xpRequired === 0 && n.column === maxColumn))
    };
  }

  function buildTrials(trials) {
    var flawless = trials.completion.success;
    trials = trials.extended;
    function buildObjective(name, current, max, bool, style) {
      return {
        displayStyle: style,
        displayName: $translate.instant('TrialsCard.' + name),
        progress: current,
        completionValue: max,
        complete: bool ? current >= max : false,
        boolean: bool
      };
    }

    return [
      buildObjective('Wins', trials.scoreCard.wins, trials.scoreCard.maxWins, false, 'trials'),
      buildObjective('Losses', trials.scoreCard.losses, trials.scoreCard.maxLosses, false, 'trials'),
      buildObjective('FiveWins', trials.highestWinRank, trials.winRewardDetails[0].winCount, true),
      buildObjective('SevenWins', trials.highestWinRank, trials.winRewardDetails[1].winCount, true),
      buildObjective('Flawless', flawless, 1, true),
    ];
  }

  function buildObjectives(objectives, objectiveDefs) {
    if (!objectives || !objectives.length) {
      return undefined;
    }

    return objectives.map(function(objective) {
      var def = objectiveDefs.get(objective.objectiveHash);

      return {
        displayName: def.displayDescription ||
          (objective.isComplete
           ? $translate.instant('Objectives.Complete')
           : $translate.instant('Objectives.Incomplete')),
        progress: objective.progress,
        completionValue: def.completionValue,
        complete: objective.isComplete,
        boolean: def.completionValue === 1,
        display: objective.progress + "/" + def.completionValue
      };
    });
  }

  function fitValue(light) {
    if (light > 300) {
      return (0.2546 * light) - 23.825;
    } if (light > 200) {
      return (0.1801 * light) - 1.4612;
    } else {
      return -1;
    }
  }

  function getScaledStat(base, light) {
    var max = 335;

    if (light > 335) {
      light = 335;
    }

    return {
      min: Math.floor((base) * (fitValue(max) / fitValue(light))),
      max: Math.floor((base + 1) * (fitValue(max) / fitValue(light)))
    };
  }

  // thanks to bungie armory for the max-base stats
  // thanks to /u/iihavetoes for rates + equation
  // https://www.reddit.com/r/DestinyTheGame/comments/4geixn/a_shift_in_how_we_view_stat_infusion_12tier/
  // TODO set a property on a bucket saying whether it can have quality rating, etc
  function getQualityRating(stats, light, type) {
    // For a quality property, return a range string (min-max percentage)
    function getQualityRange(light, quality) {
      if (!quality) {
        return '';
      }

      if (light > 335) {
        light = 335;
      }

      return ((quality.min === quality.max || light === 335)
              ? quality.min
              : (quality.min + "%-" + quality.max)) + '%';
    }

    if (!stats || !stats.length || !light || light.value < 280) {
      return null;
    }

    var split = 0;
    switch (type.toLowerCase()) {
    case 'helmet':
      split = 46; // bungie reports 48, but i've only seen 46
      break;
    case 'gauntlets':
      split = 41; // bungie reports 43, but i've only seen 41
      break;
    case 'chest':
      split = 61;
      break;
    case 'leg':
      split = 56;
      break;
    case 'classitem':
    case 'ghost':
      split = 25;
      break;
    case 'artifact':
      split = 38;
      break;
    default:
      return null;
    }

    var ret = {
      total: {
        min: 0,
        max: 0
      },
      max: split * 2
    };

    var pure = 0;
    stats.forEach(function(stat) {
      var scaled = {
        min: 0,
        max: 0
      };
      if (stat.base) {
        scaled = getScaledStat(stat.base, light.value);
        pure = scaled.min;
      }
      stat.scaled = scaled;
      stat.split = split;
      stat.qualityPercentage = {
        min: Math.round(100 * stat.scaled.min / stat.split),
        max: Math.round(100 * stat.scaled.max / stat.split)
      };
      ret.total.min += scaled.min || 0;
      ret.total.max += scaled.max || 0;
    });

    if (pure === ret.total.min) {
      stats.forEach(function(stat) {
        stat.scaled = {
          min: Math.floor(stat.scaled.min / 2),
          max: Math.floor(stat.scaled.max / 2)
        };
        stat.qualityPercentage = {
          min: Math.round(100 * stat.scaled.min / stat.split),
          max: Math.round(100 * stat.scaled.max / stat.split)
        };
      });
    }

    var quality = {
      min: Math.round(ret.total.min / ret.max * 100),
      max: Math.round(ret.total.max / ret.max * 100)
    };

    if (type.toLowerCase() !== 'artifact') {
      stats.forEach(function(stat) {
        stat.qualityPercentage = {
          min: Math.min(100, stat.qualityPercentage.min),
          max: Math.min(100, stat.qualityPercentage.max)
        };
      });
      quality = {
        min: Math.min(100, quality.min),
        max: Math.min(100, quality.max)
      };
    }

    stats.forEach(function(stat) {
      stat.qualityPercentage.range = getQualityRange(light.value, stat.qualityPercentage);
    });
    quality.range = getQualityRange(light.value, quality);

    return quality;
  }

  // thanks to /u/iihavetoes for the bonuses at each level
  // thanks to /u/tehdaw for the spreadsheet with bonuses
  // https://docs.google.com/spreadsheets/d/1YyFDoHtaiOOeFoqc5Wc_WC2_qyQhBlZckQx5Jd4bJXI/edit?pref=2&pli=1#gid=0
  function getBonus(light, type) {
    switch (type.toLowerCase()) {
    case 'helmet':
    case 'helmets':
      return light < 292 ? 15
        : light < 307 ? 16
        : light < 319 ? 17
        : light < 332 ? 18
        : 19;
    case 'gauntlets':
      return light < 287 ? 13
        : light < 305 ? 14
        : light < 319 ? 15
        : light < 333 ? 16
        : 17;
    case 'chest':
    case 'chest armor':
      return light < 287 ? 20
        : light < 300 ? 21
        : light < 310 ? 22
        : light < 319 ? 23
        : light < 328 ? 24
        : 25;
    case 'leg':
    case 'leg armor':
      return light < 284 ? 18
        : light < 298 ? 19
        : light < 309 ? 20
        : light < 319 ? 21
        : light < 329 ? 22
        : 23;
    case 'classitem':
    case 'class items':
    case 'ghost':
    case 'ghosts':
      return light < 295 ? 8
        : light < 319 ? 9
        : 10;
    case 'artifact':
    case 'artifacts':
      return light < 287 ? 34
        : light < 295 ? 35
        : light < 302 ? 36
        : light < 308 ? 37
        : light < 314 ? 38
        : light < 319 ? 39
        : light < 325 ? 40
        : light < 330 ? 41
        : light < 336 ? 42
        : 43;
    }
    console.warn('item bonus not found', type);
    return 0;
  }

  function buildStats(item, itemDef, statDefs, grid, type) {
    if (!item.stats || !item.stats.length || !itemDef.stats) {
      return undefined;
    }

    var armorNodes = [];
    var activeArmorNode;
    if (grid && grid.nodes && item.primaryStat && item.primaryStat.statHash === 3897883278) {
      armorNodes = _.filter(grid.nodes, function(node) {
        return _.contains([1034209669, 1263323987, 193091484], node.hash); // ['Increase Intellect', 'Increase Discipline', 'Increase Strength']
      });
      if (armorNodes) {
        activeArmorNode = _.findWhere(armorNodes, { activated: true }) || { hash: 0 };
      }
    }

    return _.sortBy(_.compact(_.map(itemDef.stats, function(stat) {
      var def = statDefs.get(stat.statHash);
      if (!def) {
        return undefined;
      }

      const identifier = def.statIdentifier;

      // Only include these hidden stats, in this order
      var secondarySort = ['STAT_AIM_ASSISTANCE', 'STAT_EQUIP_SPEED'];
      var secondaryIndex = -1;

      var sort = _.findIndex(item.stats, { statHash: stat.statHash });
      var itemStat;
      if (sort < 0) {
        secondaryIndex = secondarySort.indexOf(identifier);
        sort = 50 + secondaryIndex;
      } else {
        itemStat = item.stats[sort];
        // Always at the end
        if (identifier === 'STAT_MAGAZINE_SIZE' || identifier === 'STAT_ATTACK_ENERGY') {
          sort = 100;
        }
      }

      if (!itemStat && secondaryIndex < 0) {
        return undefined;
      }

      var maximumValue = 100;
      if (itemStat && itemStat.maximumValue) {
        maximumValue = itemStat.maximumValue;
      }

      var val = itemStat ? itemStat.value : stat.value;
      var base = val;
      var bonus = 0;

      if (item.primaryStat && item.primaryStat.stat.statIdentifier === 'STAT_DEFENSE') {
        if ((identifier === 'STAT_INTELLECT' && _.find(armorNodes, { hash: 1034209669 /* Increase Intellect */ })) ||
           (identifier === 'STAT_DISCIPLINE' && _.find(armorNodes, { hash: 1263323987 /* Increase Discipline */ })) ||
           (identifier === 'STAT_STRENGTH' && _.find(armorNodes, { hash: 193091484 /* Increase Strength */ }))) {
          bonus = getBonus(item.primaryStat.value, type);

          if (activeArmorNode &&
              ((identifier === 'STAT_INTELLECT' && activeArmorNode.hash === 1034209669) ||
               (identifier === 'STAT_DISCIPLINE' && activeArmorNode.hash === 1263323987) ||
               (identifier === 'STAT_STRENGTH' && activeArmorNode.hash === 193091484))) {
            base = Math.max(0, val - bonus);
          }
        }
      }

      return {
        base: base,
        bonus: bonus,
        statHash: stat.statHash,
        name: def.statName,
        id: def.statIdentifier,
        sort: sort,
        value: val,
        maximumValue: maximumValue,
        bar: identifier !== 'STAT_MAGAZINE_SIZE' && identifier !== 'STAT_ATTACK_ENERGY' // energy == magazine for swords
      };
    })), 'sort');
  }

  /** New Item Tracking **/

  function buildItemSet(stores) {
    var itemSet = new Set();
    stores.forEach((store) => {
      store.items.forEach((item) => {
        itemSet.add(item.id);
      });
    });
    return itemSet;
  }

  // Should this item display as new? Note the check for previousItems size, so that
  // we don't mark everything as new on the first load.
  function isItemNew(id, previousItems, newItems) {
    let isNew = false;
    if (newItems.has(id)) {
      isNew = true;
    } else if (_removedNewItems.has(id)) {
      isNew = false;
    } else if (previousItems.size) {
      // Zero id check is to ignore general items and consumables
      isNew = (id !== '0' && !previousItems.has(id));
      if (isNew) {
        newItems.add(id);
      }
    }
    return isNew;
  }

  function dropNewItem(item) {
    if (!item.isNew) {
      return;
    }
    _removedNewItems.add(item.id);
    item.isNew = false;
    loadNewItems(dimPlatformService.getActive()).then((newItems) => {
      newItems.delete(item.id);
      service.hasNewItems = (newItems.size !== 0);
      saveNewItems(newItems);
    });
  }

  function clearNewItems() {
    _stores.forEach((store) => {
      store.items.forEach((item) => {
        if (item.isNew) {
          _removedNewItems.add(item.id);
          item.isNew = false;
        }
      });
    });
    service.hasNewItems = false;
    saveNewItems(new Set());
  }

  function loadNewItems(activePlatform) {
    if (activePlatform) {
      const key = newItemsKey();
      // Clean out old new-items from the Sync Service, we store in IndexedDB now.
      SyncService.remove(key);
      return idbKeyval.get(key).then((v) => v || new Set());
    }
    return $q.resolve(new Set());
  }

  function saveNewItems(newItems) {
    return idbKeyval.set(newItemsKey(), newItems);
  }

  function newItemsKey() {
    const platform = dimPlatformService.getActive();
    return 'newItems-' + (platform ? platform.type : '');
  }

  function processItems(owner, items, previousItems = new Set(), newItems = new Set(), itemInfoService) {
    return $q.all([
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      previousItems,
      newItems,
      itemInfoService,
      getClassifiedData()])
      .then(function(args) {
        var result = [];
        dimManifestService.statusText = $translate.instant('Manifest.LoadCharInv') + '...';
        _.each(items, function(item) {
          var createdItem = null;
          try {
            createdItem = processSingleItem(...args, item, owner);
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

  function getClass(type) {
    switch (type) {
    case 0:
      return 'titan';
    case 1:
      return 'hunter';
    case 2:
      return 'warlock';
    }
    return 'unknown';
  }

  function getClassTypeNameLocalized(defs, type) {
    const klass = _.find(_.values(defs.Class), { classType: type });
    if (klass) {
      return klass.className;
    } else {
      return $translate.instant('Loadouts.Any');
    }
  }

  // following code is from https://github.com/DestinyTrialsReport
  function getAbilityCooldown(subclass, ability, tier) {
    if (ability === 'STAT_INTELLECT') {
      switch (subclass) {
      case 2007186000: // Defender
      case 4143670656: // Nightstalker
      case 2455559914: // Striker
      case 3658182170: // Sunsinger
        return cooldownsSuperA[tier];
      default:
        return cooldownsSuperB[tier];
      }
    } else if (ability === 'STAT_DISCIPLINE') {
      return cooldownsGrenade[tier];
    } else if (ability === 'STAT_STRENGTH') {
      switch (subclass) {
      case 4143670656: // Nightstalker
      case 1716862031: // Gunslinger
        return cooldownsMelee[tier];
      default:
        return cooldownsGrenade[tier];
      }
    } else {
      return '-:--';
    }
  }

  function setItemYear(item) {
    // determine what year this item came from based on sourceHash value
    // items will hopefully be tagged as follows
    // No value: Vanilla, Crota's End, House of Wolves
    // The Taken King (year 2): 460228854
    // Rise of Iron (year 3): 24296771

    // This could be further refined for CE/HoW based on activity. See
    // DestinyRewardSourceDefinition and filter on %SOURCE%
    // if sourceHash doesn't contain these values, we assume they came from
    // year 1

    item.year = 1;
    var infusable = (item.talentGrid && item.talentGrid.infusable);
    var ttk = item.sourceHashes.includes(yearHashes.year2[0]);
    var roi = item.sourceHashes.includes(yearHashes.year3[0]);
    if (ttk || infusable || _.intersection(yearHashes.year2, item.sourceHashes).length) {
      item.year = 2;
    }
    if (!ttk && (item.classified || roi || _.intersection(yearHashes.year3, item.sourceHashes).length)) {
      item.year = 3;
    }
  }

  /**
   * Compute character-level stats (int, dis, str).
   */
  function getCharacterStatsData(statDefs, data) {
    const statsWithTiers = new Set(['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH']);
    var stats = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH', 'STAT_ARMOR', 'STAT_RECOVERY', 'STAT_AGILITY'];
    var ret = {};
    stats.forEach((statId) => {
      var statHash = {};
      statHash.id = statId;
      switch (statId) {
      case 'STAT_INTELLECT':
        statHash.name = 'Intellect';
        statHash.effect = 'Super';
        statHash.icon = require('app/images/intellect.png');
        break;
      case 'STAT_DISCIPLINE':
        statHash.name = 'Discipline';
        statHash.effect = 'Grenade';
        statHash.icon = require('app/images/discipline.png');
        break;
      case 'STAT_STRENGTH':
        statHash.name = 'Strength';
        statHash.effect = 'Melee';
        statHash.icon = require('app/images/strength.png');
        break;
      }

      const stat = data.stats[statId];
      if (!stat) {
        return;
      }
      statHash.value = stat.value;
      const statDef = statDefs.get(stat.statHash);
      if (statDef) {
        statHash.name = statDef.statName; // localized name
      }

      if (statsWithTiers.has(statId)) {
        statHash.normalized = statHash.value > 300 ? 300 : statHash.value;
        statHash.tier = Math.floor(statHash.normalized / 60);
        statHash.tiers = [];
        statHash.remaining = statHash.value;
        for (var t = 0; t < 5; t++) {
          statHash.remaining -= statHash.tiers[t] = statHash.remaining > 60 ? 60 : statHash.remaining;
        }
        if (data.peerView) {
          statHash.cooldown = getAbilityCooldown(data.peerView.equipment[0].itemHash, statId, statHash.tier);
        }
        statHash.percentage = Number(100 * statHash.normalized / 300).toFixed();
      } else {
        statHash.percentage = Number(100 * statHash.value / 10).toFixed();
      }

      ret[statId] = statHash;
    });
    return ret;
  }

  function buildClassifiedItem(classifiedData, hash) {
    const info = classifiedData.itemHash[hash];
    if (info) { // do we have declassification info for item?
      const localInfo = info.i18n[dimSettingsService.language];
      const classifiedItem = {
        classified: true,
        icon: info.icon,
        itemName: localInfo.itemName,
        itemDescription: localInfo.itemDescription,
        itemTypeName: localInfo.itemTypeName,
        bucketTypeHash: info.bucketHash,
        tierType: info.tierType,
        classType: info.classType
      };
      if (info.primaryBaseStatHash) {
        classifiedItem.primaryStat = {
          statHash: info.primaryBaseStatHash,
          value: info.stats[info.primaryBaseStatHash].value
        };
      }
      if (info.stats) {
        classifiedItem.stats = info.stats;
      }
      return classifiedItem;
    }
    return null;
  }
}
