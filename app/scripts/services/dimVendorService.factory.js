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

    return service;


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
                service.vendors[vendorDef.hash].expires > Date.now()) {
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

    // TODO: loadVendor (loads appropriate chars)


    function mergeVendors([firstVendor, ...otherVendors]) {
      const mergedVendor = angular.copy(firstVendor);

      otherVendors.forEach((vendor) => {
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

      mergedVendor.categories = _.sortBy(mergedVendor.categories, 'index');
      mergedVendor.allItems = _.flatten(_.pluck(mergedVendor.categories, 'saleItems'));

      return mergedVendor;
    }

    function mergeCategory(mergedCategory, otherCategory) {
      otherCategory.saleItems.forEach((saleItem) => {
        const existingSaleItem = _.find(mergedCategory.saleItems, (existingSaleItem) =>
                                    existingSaleItem.item.hash === saleItem.item.hash);
        if (existingSaleItem) {
          existingSaleItem.unlocked = existingSaleItem.unlocked || saleItem.unlocked;
          existingSaleItem.unlockedByCharacter.push(saleItem.unlockedByCharacter[0]);
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

    function loadVendor(store, vendorDef, defs) {
      const vendorHash = vendorDef.hash;

      const key = vendorKey(store, vendorHash);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          if (vendor && vendor.expires > Date.now()) {
            // console.log("loaded local", key, vendor);
            if (vendor.failed) {
              // TODO: delete from cache
              throw new Error("Cached failed vendor " + vendorDef.summary.vendorName);
            }
            return vendor;
          } else {
            // console.log("load remote", key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
            return dimBungieService
              .getVendorForCharacter(store, vendorHash)
              .then((vendor) => {
                vendor.expires = calculateExpiration(vendor.nextRefreshDate);
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
                    expires: Date.now() + (60 * 60 * 1000) + ((Math.random() - 0.5) * (60 * 60 * 1000))
                  };

                  return idbKeyval
                    .set(key, vendor)
                    .then(() => {
                      throw new Error("Cached failed vendor " + vendorDef.summary.vendorName);
                    });
                }
                throw new Error("Failed to load vendor " + vendorDef.summary.vendorName);
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
        expires: calculateExpiration(vendor.nextRefreshDate),
        eventVendor: def.mapSectionIdentifier === 'EVENT',
        vendorOrder: (def.mapSectionOrder * 1000) + def.vendorOrder,
        faction: def.factionHash // TODO: show rep!
      };

      const items = _.flatten(vendor.saleItemCategories.map((categoryData) => {
        return categoryData.saleItems;
      }));

      return dimStoreService.processItems({ id: null }, _.pluck(items, 'item'))
        .then(function(items) {
          const itemsByHash = _.indexBy(items, 'hash');
          const categories = _.map(vendor.saleItemCategories, (category) => {
            const categoryItems = category.saleItems.map((saleItem) => {
              return {
                index: saleItem.vendorItemIndex,
                costs: saleItem.costs.map((cost) => {
                  return {
                    value: cost.value,
                    currency: _.pick(defs.InventoryItem[cost.itemHash], 'itemName', 'icon', 'itemHash')
                  };
                }).filter((c) => c.value > 0),
                item: itemsByHash[saleItem.item.itemHash],
                // TODO: caveat, this won't update very often!
                unlocked: isSaleItemUnlocked(saleItem),
                unlockedByCharacter: [store.id]
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
              title: category.categoryTitle,
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
            item = getItem(item, defs, createdVendor);
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

    function getItem(itemByHash, defs, createdVendor) {
      var item = itemByHash;
      var itemDef = defs.InventoryItem[item.hash];
      var hash = null;

      if (itemDef.stats && itemDef.stats[3897883278]) {
        hash = 3897883278;
      } else if (itemDef.stats && itemDef.stats[368428387]) {
        hash = 368428387;
      }

      if (hash) {
        item.primStat = itemDef.stats[hash];
        item.primStat.stat = defs.Stat[hash];
        item.year = getItemYear(item);
        setItemPrimStat(item, createdVendor);
        item.quality = dimStoreService.getQualityRating(item.stats, item.primStat, item.bucket.type);
      }
      return item;
    }

    function getItemYear(itemDef) {
      itemDef.sourceHashes = itemDef.sourceHashes || [];
      var itemYear = 1;
      if (itemDef.sourceHashes.includes(460228854) ||  // ttk
          itemDef.sourceHashes.includes(3523074641) || // variks
          itemDef.sourceHashes.includes(3551688287) || // kings fall
          itemDef.hash === 3688594188) {      // boolean gemini
        itemYear = 2;
      }
      if ((itemDef.sourceHashes.includes(24296771) ||        // roi
          !itemDef.sourceHashes.length) &&          // new items
          !(itemDef.primStat.minimum === 170) &&    // ttk CE exotic class items
          !(itemDef.hash === 3688594188)) {         // boolean gemini
        itemYear = 3;
      }
      return itemYear;
    }

    function setItemPrimStat(item, createdVendor) {
      if (item.isExotic) {
        switch (createdVendor.hash) {
        case 2796397637: // fixes xur exotics
          item.primStat.value = 350;
          break;
        case 1460182514:  // fix exotics in
        case 3902439767:  // kiosks
          if (item.year === 2) {  // year 2
            item.primStat.value = 280;
          }
          if (item.year === 3 || item.primStat.value === 3) {
            item.primStat.value = 320;
          }
          if (item.year === 1) {
            if (item.primStat.minimum <= 145) {
              item.primStat.value = 160;
            }
            if (item.primStat.minimum === 155) {
              item.primStat.value = 170;
            }
            switch (item.hash) {
            case 346443849: // vex mythoclast
              item.primStat.value = 162;
              break;
            case 2344494718:  // 4th horseman
              item.primStat.value = 155;
              break;
            case 2809229973:   // necrochasm
              item.primStat.value = 172;
              break;
            case 3705198528:  // dragon's breath
              item.primStat.value = 167;
              break;
            }
          }
        }
      }
    }
  }
})();
