(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimStoreService', StoreService);

  StoreService.$inject = [
    '$rootScope',
    '$q',
    'dimBungieService',
    'dimPlatformService',
    'dimSettingsService',
    'dimCategory',
    'dimDefinitions',
    'dimBucketService',
    'dimYearsDefinitions',
    'dimItemInfoService',
    'dimInfoService',
    'SyncService',
    'loadingTracker',
    'dimManifestService',
    '$translate',
    'uuid2'
  ];

  function StoreService(
    $rootScope,
    $q,
    dimBungieService,
    dimPlatformService,
    dimSettingsService,
    dimCategory,
    dimDefinitions,
    dimBucketService,
    dimYearsDefinitions,
    dimItemInfoService,
    dimInfoService,
    SyncService,
    loadingTracker,
    dimManifestService,
    $translate,
    uuid2
  ) {
    var _stores = [];
    var _idTracker = {};

    var _removedNewItems = new Set();

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
      2763619072: { label: "SRL", order: 11 }
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
      // Get the total amount of this item in the store, across all stacks,
      // excluding stuff in the postmaster.
      amountOfItem: function(item) {
        return sum(_.filter(this.items, function(i) {
          return i.hash === item.hash && !i.location.inPostmaster;
        }), 'amount');
      },
      // How much of items like this item can fit in this store?
      capacityForItem: function(item) {
        if (!item.bucket) {
          console.error("item needs a 'bucket' field", item);
          return 10;
        }
        return item.bucket.capacity;
      },
      // How many *more* items like this item can fit in this store?
      spaceLeftForItem: function(item) {
        if (!item.type) {
          throw new Error("item needs a 'type' field");
        }
        return Math.max(0, this.capacityForItem(item) - this.buckets[item.location.id].length);
      },
      updateCharacterInfoFromEquip: function(characterInfo) {
        dimDefinitions.then((defs) => this.updateCharacterInfo(defs.Stat, characterInfo));
      },
      updateCharacterInfo: function(defs, characterInfo) {
        this.level = characterInfo.characterLevel;
        this.percentToNextLevel = characterInfo.percentToNextLevel / 100.0;
        this.powerLevel = characterInfo.characterBase.powerLevel;
        this.background = 'https://www.bungie.net/' + characterInfo.backgroundPath;
        this.icon = 'https://www.bungie.net/' + characterInfo.emblemPath;
        this.stats = getStatsData(defs.Stat, characterInfo.characterBase);
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
            title: 'Postmaster Limit',
            body: 'There are 20 lost items at the Postmaster on your ' + this.name + '. Any new items will overwrite the existing.',
            hide: 'Never show me this type of warning again.'
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
      }
    };

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
          !this.location.inPostmaster;
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
        dimDefinitions,
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

    function loadStores(activePlatform, includeVendors) {
      if (includeVendors) {
        return $q.when(dimDefinitions).then(function(defs) {
          return dimBungieService.getStores(activePlatform, includeVendors, defs.Vendor);
        });
      }
      return dimBungieService.getStores(activePlatform, includeVendors);
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

      // Include vendors on the first load and if they're expired
      const currDate = new Date().toISOString();
      const includeVendors = !_stores.length || _.any(_stores, (store) => store.minRefreshDate < currDate);

      // Save a snapshot of all the items before we update
      const previousItems = buildItemSet(_stores);
      const firstLoad = (previousItems.size === 0);

      function fakeItemId(item) {
        if (activePlatform.fake && item.itemInstanceId !== "0") {
          item.itemInstanceId = 'fake-' + item.itemInstanceId;
        }
      }

      console.time('Load stores (Bungie API)');
      _reloadPromise = $q.all([dimDefinitions,
                              dimBucketService,
                              loadNewItems(activePlatform),
                              dimItemInfoService(activePlatform),
                              $translate(['Vault']),
                              loadStores(activePlatform, includeVendors)])
        .then(function([defs, buckets, newItems, itemInfoService, translations, rawStores]) {
          console.timeEnd('Load stores (Bungie API)');
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
                name: translations.Vault,
                class: 'vault',
                current: false,
                className: translations.Vault,
                lastPlayed: '2005-01-01T12:00:01Z',
                icon: '/images/vault.png',
                background: '/images/vault-background.png',
                items: [],
                legendaryMarks: marks,
                glimmer: glimmer,
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
                  var sort = item.sort;
                  if (item.bucket) {
                    sort = item.bucket.sort;
                  }
                  if (!sort) {
                    throw new Error("item needs a 'sort' field");
                  }
                  return Math.max(0, this.capacityForItem(item) - count(this.items, function(i) {
                    return i.bucket.sort === sort;
                  }));
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
              } catch (e) {
                glimmer = 0;
                marks = 0;
              }

              const race = defs.Race[character.characterBase.raceHash];
              let genderRace = "";
              if (character.characterBase.genderType === 0) {
                genderRace = race.raceNameMale;
              } else {
                genderRace = race.raceNameFemale;
              }

              store = angular.extend(Object.create(StoreProto), {
                id: raw.id,
                icon: 'https://www.bungie.net/' + character.emblemPath,
                current: lastPlayedDate.getTime() === (new Date(character.characterBase.dateLastPlayed)).getTime(),
                lastPlayed: character.characterBase.dateLastPlayed,
                background: 'https://bungie.net/' + character.backgroundPath,
                level: character.characterLevel,
                powerLevel: character.characterBase.powerLevel,
                stats: getStatsData(defs.Stat, character.characterBase),
                class: getClass(character.characterBase.classType),
                className: defs.Class[character.characterBase.classHash].className,
                genderRace: genderRace,
                percentToNextLevel: character.percentToNextLevel / 100.0,
                progression: raw.character.progression,
                advisors: raw.character.advisors,
                vendors: raw.character.vendors,
                isVault: false
              });

              if (!includeVendors) {
                var prevStore = _.findWhere(_stores, { id: raw.id });
                store.vendors = prevStore.vendors;
                store.minRefreshDate = prevStore.minRefreshDate;
              }

              store.name = store.genderRace + ' ' + store.className;

              if (store.progression) {
                store.progression.progressions.forEach(function(prog) {
                  angular.extend(prog, defs.Progression[prog.progressionHash], progressionMeta[prog.progressionHash]);
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

              return processVendors(store.vendors)
                .then(function(vendors) {
                  _.each(vendors, function(vendor) {
                    store.vendors[vendor.vendorHash] = vendor;
                    if (!store.minRefreshDate || vendor.nextRefreshDate < store.minRefreshDate) {
                      store.minRefreshDate = vendor.nextRefreshDate;
                    }
                  });
                  return store;
                });
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

    function processSingleItem(defs, buckets, yearsDefs, previousItems, newItems, itemInfoService, item, owner) {
      var itemDef = defs.InventoryItem[item.itemHash];
      // Missing definition?
      if (!itemDef) {
        // maybe it is classified...
        itemDef = {
          itemName: "Missing Item",
          redacted: true
        };
        dimManifestService.warnMissingDefinition();
      }

      if (!itemDef.icon) {
        itemDef.icon = '/img/misc/missing_icon.png';
      }

      if (!itemDef.itemTypeName) {
        itemDef.itemTypeName = 'Unknown';
      }

      if (itemDef.redacted) {
        console.warn('Missing Item Definition:\n\n', item, '\n\nplease contact a developer to get this item added.');
      }

      if (!itemDef.itemName) {
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
        currentBucket = normalBucket;
      }

      var itemType = normalBucket.type;

      const categories = itemDef.itemCategoryHashes ? _.compact(itemDef.itemCategoryHashes.map((c) => {
        const category = defs.ItemCategory[c];
        return category ? category.identifier : null;
      })) : [];

      var dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

      var createdItem = angular.extend(Object.create(ItemProto), {
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
        isUnlocked: (!owner || owner.id === null) ? item.isUnlocked : true,
        name: itemDef.itemName,
        description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
        icon: itemDef.icon,
        notransfer: (currentBucket.inPostmaster || itemDef.nonTransferrable),
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
        dmg: dmgName,
        visible: true,
        year: (yearsDefs.year1.indexOf(item.itemHash) >= 0 ? 1 : 2),
        lockable: normalBucket.type !== 'Class' && ((currentBucket.inPostmaster && item.isEquipment) || currentBucket.inWeapons || item.lockable),
        trackable: currentBucket.inProgress && currentBucket.hash !== 375726501,
        tracked: item.state === 2,
        locked: item.locked,
        classified: itemDef.redacted
      });

      createdItem.index = createItemIndex(createdItem);

      // Moving rare masks destroys them
      if (createdItem.inCategory('CATEGORY_MASK') && createdItem.tier !== 'Legendary') {
        createdItem.notransfer = true;
      }

      if (createdItem.primStat) {
        createdItem.primStat.stat = defs.Stat[createdItem.primStat.statHash];
      }

      // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
      createdItem.isNew = false;
      try {
        createdItem.isNew = dimSettingsService.showNewItems && isItemNew(createdItem.id, previousItems, newItems);
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

      // More objectives properties
      if (owner.advisors && itemDef.recordBookHash && itemDef.recordBookHash > 0) {
        try {
          const recordBook = owner.advisors.recordBooks[itemDef.recordBookHash];

          recordBook.records = _.map(_.values(recordBook.records), (record) => _.extend(defs.Record[record.recordHash], record));

          createdItem.objectives = buildRecords(recordBook, defs.Objective);

          if (recordBook.progression) {
            recordBook.progression = angular.extend(recordBook.progression, defs.Progression[recordBook.progression.progressionHash]);
            createdItem.progress = recordBook.progression;
            createdItem.percentComplete = createdItem.progress.currentProgress / _.reduce(createdItem.progress.steps, (memo, step) => memo + step.progressTotal, 0);
          } else {
            createdItem.percentComplete = _.countBy(createdItem.objectives, function(task) {
              return task.complete;
            }).true / createdItem.objectives.length;
          }

          createdItem.complete = _.chain(recordBook.records)
            .pluck('objectives')
            .flatten()
            .all('isComplete')
            .value();
        } catch (e) {
          console.error("Error building record book for " + createdItem.name, item, itemDef, e);
        }
      } else if (createdItem.objectives) {
        createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, 'complete');
        createdItem.percentComplete = sum(createdItem.objectives, function(objective) {
          return Math.min(1.0, objective.progress / objective.completionValue) / createdItem.objectives.length;
        });
      } else if (createdItem.talentGrid) {
        createdItem.percentComplete = Math.min(1.0, createdItem.talentGrid.totalXP / createdItem.talentGrid.totalXPRequired);
        createdItem.complete = createdItem.talentGrid.complete;
      }

      return createdItem;
    }

    function buildTalentGrid(item, talentDefs, progressDefs) {
      var talentGridDef = talentDefs[item.talentGridHash];
      if (!item.progression || !talentGridDef) {
        return undefined;
      }

      var totalXP = item.progression.currentProgress;
      var totalLevel = item.progression.level; // Can be way over max

      // progressSteps gives the XP needed to reach each level, with
      // the last element repeating infinitely.
      var progressSteps = progressDefs[item.progression.progressionHash].steps;
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
      //   var perkDef = perkDefs[perk.perkHash];
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
          hidden: node.hidden

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

      // This can be handy for visualization/debugging
      // var columns = _.groupBy(gridNodes, 'column');

      var maxLevelRequired = _.max(gridNodes, 'activatedAtGridLevel').activatedAtGridLevel;
      var totalXPRequired = xpToReachLevel(maxLevelRequired);

      var ascendNode = _.find(gridNodes, { hash: 1920788875 });

      // Fix for stuff that has nothing in early columns
      var minColumn = _.min(gridNodes, 'column').column;
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
        complete: totalXPRequired <= totalXP && _.all(gridNodes, (n) => n.unlocked || (n.xpRequired === 0 && n.column === maxColumn))
      };
    }

    function buildRecords(recordBook, objectiveDef) {
      if (!recordBook.records || !recordBook.records.length) {
        return undefined;
      }

      let processRecord = (recordBook, record) => {
        var def = objectiveDef[record.objectives[0].objectiveHash];

        return {
          description: record.description,
          displayName: record.displayName,
          progress: record.objectives[0].progress,
          completionValue: def.completionValue,
          complete: record.objectives[0].isComplete,
          boolean: def.completionValue === 1
        };
      };

      processRecord = processRecord.bind(this, recordBook);

      return _.map(recordBook.records, processRecord);
    }

    function buildObjectives(objectives, objectiveDef) {
      if (!objectives || !objectives.length) {
        return undefined;
      }

      return objectives.map(function(objective) {
        var def = objectiveDef[objective.objectiveHash];

        return {
          description: '',
          displayName: def.displayDescription,
          progress: objective.progress,
          completionValue: def.completionValue,
          complete: objective.isComplete,
          boolean: def.completionValue === 1
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
        return ((quality.min === quality.max || light === 335)
                ? quality.min
                : (quality.min + "%-" + quality.max)) + '%';
      }

      if (!stats || !stats.length || light.value < 280) {
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
          : 42;
      }
      console.warn('item bonus not found', type);
      return 0;
    }

    function buildStats(item, itemDef, statDef, grid, type) {
      if (!item.stats || !item.stats.length || !itemDef.stats) {
        return undefined;
      }

      var armorNodes = [];
      var activeArmorNode;
      if (grid && grid.nodes && item.primaryStat.statHash === 3897883278) {
        armorNodes = _.filter(grid.nodes, function(node) {
          return _.contains([1034209669, 1263323987, 193091484], node.hash); // ['Increase Intellect', 'Increase Discipline', 'Increase Strength']
        });
        if (armorNodes) {
          activeArmorNode = _.findWhere(armorNodes, { activated: true }) || { hash: 0 };
        }
      }

      return _.sortBy(_.compact(_.map(itemDef.stats, function(stat) {
        var def = statDef[stat.statHash];
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

        if (item.primaryStat.stat.statIdentifier === 'STAT_DEFENSE') {
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
          sort: sort,
          value: val,
          maximumValue: maximumValue,
          bar: identifier !== 'STAT_MAGAZINE_SIZE' && identifier !== 'STAT_ATTACK_ENERGY' // energy == magazine for swords
        };
      })), 'sort');
    }

    function isSaleItemUnlocked(saleItem) {
      return _.every(saleItem.unlockStatuses, function(status) { return status.isSet; });
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
        return SyncService.get().then(function processCachedNewItems(data) {
          return new Set(data[newItemsKey()]);
        });
      }
      return $q.resolve(new Set());
    }

    function saveNewItems(newItems) {
      SyncService.set({ [newItemsKey()]: [...newItems] });
    }

    function newItemsKey() {
      const platform = dimPlatformService.getActive();
      return 'newItems-' + (platform ? platform.type : '');
    }

    function processItems(owner, items, previousItems = new Set(), newItems = new Set(), itemInfoService) {
      _idTracker = {};
      return $q.all([
        dimDefinitions,
        dimBucketService,
        dimYearsDefinitions,
        previousItems,
        newItems,
        itemInfoService])
        .then(function(args) {
          var result = [];
          dimManifestService.statusText = 'Loading Destiny characters and inventory...';
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

    function processVendors(vendors) {
      return dimDefinitions
        .then(function(defs) {
          return $q.all(_.map(vendors, function(vendor, vendorHash) {
            var def = defs.Vendor[vendorHash].summary;
            vendor.vendorName = def.vendorName;
            vendor.vendorIcon = def.factionIcon || def.vendorIcon;
            vendor.items = [];
            vendor.costs = [];
            vendor.hasArmorWeaps = false;
            vendor.hasVehicles = false;
            vendor.hasShadersEmbs = false;
            vendor.hasEmotes = false;
            if (vendor.enabled) {
              var items = [];
              _.each(vendor.saleItemCategories, function(categoryData) {
                var filteredSaleItems = _.filter(categoryData.saleItems, function(saleItem) {
                  saleItem.item.isUnlocked = isSaleItemUnlocked(saleItem);
                  return saleItem.item.isEquipment;
                });
                items.push(...filteredSaleItems);
              });
              vendor.items = _.pluck(items, 'item');
              vendor.costs = _.reduce(items, function(o, saleItem) {
                if (saleItem.costs.length) {
                  o[saleItem.item.itemHash] = {
                    cost: saleItem.costs[0].value,
                    currency: _.pick(defs.InventoryItem[saleItem.costs[0].itemHash], 'itemName', 'icon', 'itemHash')
                  };
                }
                return o;
              }, {});
            }
            return processItems({ id: null }, vendor.items)
              .then(function(items) {
                vendor.items = { armor: [], weapons: [], ships: [], vehicles: [], shaders: [], emblems: [], emotes: [] };
                _.each(items, function(item) {
                  item.vendorIcon = vendor.vendorIcon;
                  if (item.primStat && item.primStat.statHash === 3897883278) {
                    vendor.hasArmorWeaps = true;
                    vendor.items.armor.push(item);
                  } else if (item.primStat && item.primStat.statHash === 368428387) {
                    vendor.hasArmorWeaps = true;
                    vendor.items.weapons.push(item);
                  } else if (item.primStat && item.primStat.statHash === 1501155019) {
                    vendor.hasVehicles = true;
                    vendor.items.vehicles.push(item);
                  } else if (item.type === "Ship") {
                    vendor.hasVehicles = true;
                    vendor.items.ships.push(item);
                  } else if (item.type === "Emblem") {
                    vendor.hasShadersEmbs = true;
                    vendor.items.emblems.push(item);
                  } else if (item.type === "Shader") {
                    vendor.hasShadersEmbs = true;
                    vendor.items.shaders.push(item);
                  } else if (item.type === "Emote") {
                    vendor.hasEmotes = true;
                    vendor.items.emotes.push(item);
                  }
                });
                return vendor;
              });
          }));
        });
    }

    function getStatsData(statDefs, data) {
      var statsWithTiers = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH'];
      var stats = ['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH', 'STAT_ARMOR', 'STAT_RECOVERY', 'STAT_AGILITY'];
      var ret = {};
      for (var s = 0; s < stats.length; s++) {
        var statHash = {};
        switch (stats[s]) {
        case 'STAT_INTELLECT': statHash.name = 'Intellect'; statHash.effect = 'Super'; break;
        case 'STAT_DISCIPLINE': statHash.name = 'Discipline'; statHash.effect = 'Grenade'; break;
        case 'STAT_STRENGTH': statHash.name = 'Strength'; statHash.effect = 'Melee'; break;
        }

        const stat = data.stats[stats[s]];
        if (!stat) {
          continue;
        }
        statHash.value = stat.value;
        const statDef = statDefs[stat.statHash];
        if (statDef) {
          statHash.name = statDef.statName; // localized name
        }

        if (statsWithTiers.indexOf(stats[s]) > -1) {
          statHash.normalized = statHash.value > 300 ? 300 : statHash.value;
          statHash.tier = Math.floor(statHash.normalized / 60);
          statHash.tiers = [];
          statHash.remaining = statHash.value;
          for (var t = 0; t < 5; t++) {
            statHash.remaining -= statHash.tiers[t] = statHash.remaining > 60 ? 60 : statHash.remaining;
          }
          if (data.peerView) {
            statHash.cooldown = getAbilityCooldown(data.peerView.equipment[0].itemHash, stats[s], statHash.tier);
          }
          statHash.percentage = Number(100 * statHash.normalized / 300).toFixed();
        } else {
          statHash.percentage = Number(100 * statHash.value / 10).toFixed();
        }

        ret[stats[s]] = statHash;
      }
      return ret;
    }
    // code above is from https://github.com/DestinyTrialsReport
  }
})();
