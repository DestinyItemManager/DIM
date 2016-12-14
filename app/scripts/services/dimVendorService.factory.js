(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimVendorService', VendorService);

  VendorService.$inject = [
    '$rootScope',
    'dimBungieService',
    'dimStoreService',
    'dimDefinitions',
    'dimFeatureFlags',
    'dimPlatformService',
    '$q'
  ];

  function VendorService(
    $rootScope,
    dimBungieService,
    dimStoreService,
    dimDefinitions,
    dimFeatureFlags,
    dimPlatformService,
    $q
  ) {
    /*
    const allVendors = [
      1990950, // Titan Vanguard
      44395194, // Vehicles
      134701236, // Guardian Outfitter
      174528503, // Eris Morn
      242140165, // Iron Banner
      459708109, // Shipwright
      570929315, // Gunsmith
      614738178, // Emote Collection
      1303406887, // Cryptarch (Reef)
      1410745145, // Queen's Wrath
      1460182514, // Exotic Weapon Blueprints
      1527174714, // Bounty Tracker
      1575820975, // Warlock Vanguard
      1808244981, // New Monarchy
      1821699360, // Future War Cult
      1889676839, // Disciple of Osiris
      1998812735, // House of Judgment
      2021251983, // Postmaster
      2190824860, // Vanguard Scout
      2190824863, // Tyra Karn (Cryptarch)
      2244880194, // Ship Collection
      2420628997, // Shader Collection
      2610555297, // Iron Banner
      2648860054, // Iron Lord
      2668878854, // Vanguard Quartermaster
      2680694281, // The Speaker
      2762206170, // Postmaster
      2796397637, // Agent of the Nine
      3003633346, // Hunter Vanguard
      3301500998, // Emblem Collection
      3611686524, // Dead Orbit
      3658200622, // Crucible Quartermaster
      3746647075, // Crucible Handler
      3902439767, // Exotic Armor Blueprints
      3917130357, // Eververse
      4269570979 // Cryptarch (Tower)
    ];
     */

    // Vendors we don't want to load by default
    const vendorBlackList = [
      2021251983, // Postmaster,
      4269570979, // Cryptarch (Tower)
      1303406887 // Cryptarch (Reef)
    ];

    let _reloadPromise = null;

    const service = {
      vendorsLoaded: false,
      reloadVendors: reloadVendors,
      // By hash
      vendors: {},
      totalVendors: 0,
      loadedVendors: 0
      // TODO: expose getVendor promise, idempotently?
    };

    $rootScope.$on('dim-stores-updated', function(e, stores) {
      // TODO: trigger on characters, not stores
      if (stores.stores.length) {
        service.reloadVendors(stores.stores);
      }
    });

    $rootScope.$on('dim-active-platform-updated', function() {
      service.vendors = {};
      service.vendorsLoaded = false;
    });

    $rootScope.$on('dim-new-manifest', function() {
      service.vendors = {};
      service.vendorsLoaded = false;
      deleteCachedVendors();
    });

    return service;

    function deleteCachedVendors() {
      // Everything's in one table, so we can't just clear
      idbKeyval.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('vendor')) {
            idbKeyval.delete(key);
          }
        });
      });
    }

    function reloadVendors(stores) {
      const activePlatform = dimPlatformService.getActive();
      if (_reloadPromise && _reloadPromise.activePlatform === activePlatform) {
        return _reloadPromise;
      }

      const characters = _.reject(stores, 'isVault');

      _reloadPromise = dimDefinitions
        .then((defs) => {
          // Narrow down to only visible vendors (not packages and such)
          const vendorList = _.filter(defs.Vendor, (v) => v.summary.visible);

          service.totalVendors = characters.length * (vendorList.length - vendorBlackList.length);
          service.loadedVendors = 0;

          return $q.all(_.flatten(vendorList.map((vendorDef) => {
            if (vendorBlackList.includes(vendorDef.hash)) {
              return null;
            }

            if (service.vendors[vendorDef.hash] &&
                _.all(stores, (store) =>
                      cachedVendorUpToDate(service.vendors[vendorDef.hash].cacheKeys,
                                           store,
                                           vendorDef))) {
              service.loadedVendors++;
              return service.vendors[vendorDef.hash];
            } else {
              return $q.all(characters.map((store) => loadVendorForCharacter(store, vendorDef, defs)))
                .then((vendors) => {
                  const nonNullVendors = _.compact(vendors);
                  if (nonNullVendors.length) {
                    const mergedVendor = mergeVendors(_.compact(vendors));
                    service.vendors[mergedVendor.hash] = mergedVendor;
                  } else {
                    delete service.vendors[vendorDef.hash];
                  }
                });
            }
          })));
        })
        .then(() => {
          $rootScope.$broadcast('dim-vendors-updated');
          service.vendorsLoaded = true;
        })
        .finally(function() {
          // Clear the reload promise so this can be called again
          if (_reloadPromise.activePlatform === activePlatform) {
            _reloadPromise = null;
          }
        });

      _reloadPromise.activePlatform = activePlatform;
      return _reloadPromise;
    }

    function mergeVendors([firstVendor, ...otherVendors]) {
      const mergedVendor = angular.copy(firstVendor);

      otherVendors.forEach((vendor) => {
        angular.extend(firstVendor.cacheKeys, vendor.cacheKeys);

        vendor.categories.forEach((category) => {
          const existingCategory = _.find(mergedVendor.categories, { title: category.title });
          if (existingCategory) {
            mergeCategory(existingCategory, category);
          } else {
            mergedVendor.categories.push(category);
          }
        });

        mergedVendor.hasArmorWeaps = mergedVendor.hasArmorWeaps || vendor.hasArmorWeaps;
        mergedVendor.hasVehicles = mergedVendor.hasVehicles || vendor.hasVehicles;
        mergedVendor.hasShadersEmbs = mergedVendor.hasShadersEmbs || vendor.hasShadersEmbs;
        mergedVendor.hasEmotes = mergedVendor.hasEmotes || vendor.hasEmotes;
        mergedVendor.hasConsumables = mergedVendor.hasConsumables || vendor.hasConsumables;
        mergedVendor.hasBounties = mergedVendor.hasBounties || vendor.hasBounties;
      });

      mergedVendor.allItems = _.flatten(_.pluck(mergedVendor.categories, 'saleItems'), true);

      return mergedVendor;
    }

    function mergeCategory(mergedCategory, otherCategory) {
      otherCategory.saleItems.forEach((saleItem) => {
        const existingSaleItem = _.find(mergedCategory.saleItems, { index: saleItem.index });
        if (existingSaleItem) {
          existingSaleItem.unlocked = existingSaleItem.unlocked || saleItem.unlocked;
          if (saleItem.unlocked) {
            existingSaleItem.unlockedByCharacter.push(saleItem.unlockedByCharacter[0]);
          }
        } else {
          mergedCategory.saleItems.push(saleItem);
        }
      });

      mergedCategory.hasArmorWeaps = mergedCategory.hasArmorWeaps || otherCategory.hasArmorWeaps;
      mergedCategory.hasVehicles = mergedCategory.hasVehicles || otherCategory.hasVehicles;
      mergedCategory.hasShadersEmbs = mergedCategory.hasShadersEmbs || otherCategory.hasShadersEmbs;
      mergedCategory.hasEmotes = mergedCategory.hasEmotes || otherCategory.hasEmotes;
      mergedCategory.hasConsumables = mergedCategory.hasConsumables || otherCategory.hasConsumables;
      mergedCategory.hasBounties = mergedCategory.hasBounties || otherCategory.hasBounties;
    }

    function loadVendorForCharacter(store, vendorDef, defs) {
      return loadVendor(store, vendorDef, defs)
        .then((vendor) => {
          service.loadedVendors++;
          return vendor;
        })
        .catch((e) => {
          // TODO: ???

          service.loadedVendors++;
          // console.log(e);
          return null;
        });
    }

    /**
     * Get this character's level for the given faction.
     */
    function factionLevel(store, factionHash) {
      const rep = store.progression.progressions.find((rep) => {
        return rep.faction && rep.faction.factionHash === factionHash;
      });
      return (rep && rep.level) || 0;
    }

    /**
     * Whether or not this character is aligned with the given faction.
     */
    function factionAligned(store, factionHash) {
      const factionsByHash = {
        489342053: 'Future War Cult',
        2397602219: 'Dead Orbit',
        3197190122: 'New Monarchy'
      };
      const factionAlignment = store.factionAlignment();

      return factionAlignment === factionsByHash[factionHash];
    }

    /**
     * A cached vendor is only usable if it's not expired, and this character hasn't
     * changed level for the faction associated with this vendor (or changed whether
     * they're aligned with that faction).
     */
    function cachedVendorUpToDate(vendor, store, vendorDef) {
      return vendor &&
        vendor.expires > Date.now() &&
        vendor.factionLevel === factionLevel(store, vendorDef.summary.factionHash) &&
        vendor.factionAligned === factionAligned(store, vendorDef.summary.factionHash);
    }

    function loadVendor(store, vendorDef, defs) {
      const vendorHash = vendorDef.hash;

      const key = vendorKey(store, vendorHash);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          if (cachedVendorUpToDate(vendor, store, vendorDef)) {
            // console.log("loaded local", vendorDef.summary.vendorName, key, vendor);
            if (vendor.failed) {
              throw new Error("Cached failed vendor " + vendorDef.summary.vendorName);
            }
            return vendor;
          } else {
            // console.log("load remote", vendorDef.summary.vendorName, key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
            return dimBungieService
              .getVendorForCharacter(store, vendorHash)
              .then((vendor) => {
                vendor.expires = calculateExpiration(vendor.nextRefreshDate);
                vendor.factionLevel = factionLevel(store, vendorDef.summary.factionHash);
                vendor.factionAligned = factionAligned(store, vendorDef.summary.factionHash);
                return idbKeyval
                  .set(key, vendor)
                  .then(() => vendor);
              })
              .catch((e) => {
                // console.log("vendor error", vendorDef.summary.vendorName, 'for', store.name, e, e.code, e.status);
                if (e.status === 'DestinyVendorNotFound') {
                  const vendor = {
                    failed: true,
                    code: e.code,
                    status: e.status,
                    expires: Date.now() + (60 * 60 * 1000) + ((Math.random() - 0.5) * (60 * 60 * 1000)),
                    factionLevel: factionLevel(store, vendorDef.summary.factionHash),
                    factionAligned: factionAligned(store, vendorDef.summary.factionHash)
                  };

                  return idbKeyval
                    .set(key, vendor)
                    .then(() => {
                      throw new Error("Cached failed vendor " + vendorDef.summary.vendorName);
                    });
                }
                // throw new Error("Failed to load vendor " + vendorDef.summary.vendorName);
              });
          }
        })
        .then((vendor) => {
          if (vendor && vendor.enabled) {
            const processed = processVendor(vendor, vendorDef, defs, store);
            return processed;
          }
          // console.log("Couldn't load", vendorDef.summary.vendorName, 'for', store.name);
          return null;
        });
    }

    function vendorKey(store, vendorHash) {
      return ['vendor', store.id, vendorHash].join('-');
    }

    function calculateExpiration(nextRefreshDate) {
      const date = new Date(nextRefreshDate).getTime();

      // If the expiration is too far in the future, replace it with +8h
      if (date > 7 * 24 * 60 * 60 * 1000) {
        return Date.now() + (8 * 60 * 60 * 1000);
      }

      return date;
    }

    function processVendor(vendor, vendorDef, defs, store) {
      var def = vendorDef.summary;
      const createdVendor = {
        def: vendorDef,
        hash: vendorDef.hash,
        name: def.vendorName,
        icon: def.factionIcon || def.vendorIcon,
        nextRefreshDate: vendor.nextRefreshDate,
        cacheKeys: {
          [store.id]: {
            expires: vendor.expires,
            factionLevel: vendor.factionLevel,
            factionAligned: vendor.factionAligned
          }
        },
        eventVendor: def.mapSectionIdentifier === 'EVENT',
        vendorOrder: (def.mapSectionOrder * 1000) + def.vendorOrder,
        faction: def.factionHash // TODO: show rep!
      };

      const saleItems = flatMap(vendor.saleItemCategories, (categoryData) => {
        return categoryData.saleItems;
      });

      saleItems.forEach((saleItem) => {
        saleItem.item.itemInstanceId = "vendor-" + vendorDef.hash + '-' + saleItem.vendorItemIndex;
      });

      return dimStoreService.processItems({ id: null }, _.pluck(saleItems, 'item'))
        .then(function(items) {
          const itemsById = _.indexBy(items, 'id');
          const categories = _.map(vendor.saleItemCategories, (category) => {
            const categoryItems = category.saleItems.map((saleItem) => {
              const unlocked = isSaleItemUnlocked(saleItem);
              return {
                index: saleItem.vendorItemIndex,
                costs: saleItem.costs.map((cost) => {
                  return {
                    value: cost.value,
                    currency: _.pick(defs.InventoryItem[cost.itemHash], 'itemName', 'icon', 'itemHash')
                  };
                }).filter((c) => c.value > 0),
                item: itemsById["vendor-" + vendorDef.hash + '-' + saleItem.vendorItemIndex],
                // TODO: caveat, this won't update very often!
                unlocked: unlocked,
                unlockedByCharacter: unlocked ? [store.id] : []
              };
            });

            let hasArmorWeaps = false;
            let hasVehicles = false;
            let hasShadersEmbs = false;
            let hasEmotes = false;
            let hasConsumables = false;
            let hasBounties = false;
            categoryItems.forEach((saleItem) => {
              const item = saleItem.item;
              if (item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost') {
                hasArmorWeaps = true;
              }
              if (item.type === 'Ship' || item.type === 'Vehicle') {
                hasVehicles = true;
              }
              if (item.type === "Emblem" || item.type === "Shader") {
                hasShadersEmbs = true;
              }
              if (item.type === "Emote") {
                hasEmotes = true;
              }
              if (item.type === "Material" || item.type === "Consumable") {
                hasConsumables = true;
              }
              if (item.type === 'Bounties') {
                hasBounties = true;
              }
            });

            return {
              index: category.categoryIndex,
              title: vendorDef.categories[category.categoryIndex].displayTitle,
              saleItems: categoryItems,
              hasArmorWeaps: hasArmorWeaps,
              hasVehicles: hasVehicles,
              hasShadersEmbs: hasShadersEmbs,
              hasEmotes: hasEmotes,
              hasConsumables: hasConsumables,
              hasBounties: hasBounties
            };
          });

          items.forEach((item) => {
            item.vendorIcon = createdVendor.icon;
          });

          createdVendor.allItems = items;
          createdVendor.categories = categories;

          createdVendor.hasArmorWeaps = _.any(categories, 'hasArmorWeaps');
          createdVendor.hasVehicles = _.any(categories, 'hasVehicles');
          createdVendor.hasShadersEmbs = _.any(categories, 'hasShadersEmbs');
          createdVendor.hasEmotes = _.any(categories, 'hasEmotes');
          createdVendor.hasConsumables = _.any(categories, 'hasConsumables');
          createdVendor.hasBounties = _.any(categories, 'hasBounties');

          return createdVendor;
        });
    }

    function isSaleItemUnlocked(saleItem) {
      return _.every(saleItem.unlockStatuses, 'isSet');
    }
  }
})();
