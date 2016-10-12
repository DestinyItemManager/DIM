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

    // Vendors we don't want to load
    const vendorBlackList = [
      2796397637, // Agent of the Nine
      2021251983, // Postmaster,
      4269570979, // Cryptarch (Tower)
      1303406887 // Cryptarch (Reef)
    ];

    // Vendors we know don't carry class-specific items
    const nonClassSpecificVendors = [
      44395194, // Vehicles
      134701236, // Guardian Outfitter
      459708109, // Shipwright
      570929315, // Gunsmith
      614738178, // Emote Collection
      2244880194, // Ship Collection
      2420628997, // Shader Collection
      3301500998, // Emblem Collection
      3917130357, // Eververse
      2190824863 // Tyra Karn (Cryptarch)
    ];

    const service = {
      vendorsLoaded: false,
      reloadVendors: reloadVendors,
      // By hash, then by character id
      vendors: {},
      totalVendors: 0,
      loadedVendors: 0
    };

    $rootScope.$on('dim-stores-updated', function(e, stores) {
      if (stores.stores.length) {
        service.reloadVendors(stores.stores, dimPlatformService.getActive());
      }
    });

    // TODO: trigger on characters, not stores
    // TODO: clear on platform switch
    // TODO: idempotent promise
    // TODO: Fix filters, loadout builder

    return service;

    function setVendorData(store, vendor) {
      // TODO: time to merge 'em

      // Expiration per character???

      const vendorData = service.vendors[vendor.hash] = service.vendors[vendor.hash] || {};
      vendorData[store.id] = vendor;
      vendorData[0] = vendor; // TODO: hack!
    }

    function reloadVendors(stores, platform) {
      const characters = _.reject(stores, 'isVault');

      // Pick a stable character
      const primeCharacter = _.min(characters, 'id');

      return dimDefinitions.then((defs) => {
        // Narrow down to only visible vendors (not packages and such)
        const vendorList = _.filter(defs.Vendor, (v) => v.summary.visible);

        service.totalVendors = (characters.length *
                                (vendorList.length - vendorBlackList.length - nonClassSpecificVendors.length)) +
          nonClassSpecificVendors.length;
        service.loadedVendors = 0;

        return $q.all(_.flatten(vendorList.map((vendorDef) => {
          if (vendorBlackList.includes(vendorDef.hash)) {
            return null;
          }

          if (nonClassSpecificVendors.includes(vendorDef.hash)) {
            return $q.when(loadVendorForCharacter(primeCharacter, vendorDef, platform, defs))
              .then((vendor) => {
                if (vendor) {
                  characters.forEach((store) => {
                    setVendorData(store, vendor);
                    console.log('vendor?', store.name, vendor);
                  });
                }
                return vendor;
              });
          } else {
            return characters.map((store) => loadVendorForCharacter(store, vendorDef, platform, defs));
          }
        })));
      }).then(() => {
        $rootScope.$broadcast('dim-vendors-updated', { stores: stores });
      });
    }

    function loadVendorForCharacter(store, vendorDef, platform, defs) {
      if (service.vendors[vendorDef.hash] &&
          service.vendors[vendorDef.hash][store.id] &&
          service.vendors[vendorDef.hash][store.id].nextRefreshDate > new Date().toISOString()) {
        service.loadedVendors++;
        return service.vendors[vendorDef.hash][store.id];
      } else {
        return loadVendor(store, vendorDef, platform, defs)
          .then((vendor) => {
            if (vendor) {
              setVendorData(store, vendor);
            }
            service.loadedVendors++;
            return vendor;
          });
      }
    }

    function loadVendor(store, vendorDef, platform, defs) {
      const vendorHash = vendorDef.hash;

      const key = vendorKey(store, vendorHash, platform);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          // TODO: eververse never expires... which means set a short expiration!
          if (vendor && vendor.nextRefreshDate > new Date().toISOString()) {
            //console.log("loaded local", key, vendor);
            return vendor;
          } else {
            //console.log("load remote", key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
            return dimBungieService
              .getVendorForCharacter(store, vendorHash)
              .then((vendor) => {
                return idbKeyval
                  .set(key, vendor)
                  .then(() => vendor);
              })
              .catch((e) => {
                //console.log("vendor error", e, e.code, e.status);
                if (e.status === 'DestinyVendorNotFound') {
                  // TODO: save a tombstone w/ time+jitter
                }
                return vendor; // FOR NOW
              });
          }
        })
        .then((vendor) => {
          if (vendor && true && vendor.enabled) {
            const processed = processVendor(vendor, vendorDef, defs);
            return processed;
          }
          return null;
        });
    }

    function vendorKey(store, vendorHash, platform) {
      return ['vendor', store.id, platform.type, vendorHash].join('-');
    }

    function processVendor(vendor, vendorDef, defs) {
      var def = vendorDef.summary;
      const createdVendor = {
        hash: vendorDef.hash,
        name: def.vendorName,
        icon: def.factionIcon || def.vendorIcon,
        nextRefreshDate: vendor.nextRefreshDate,
        expires: null,
        eventVendor: def.mapSectionIdentifier === 'EVENT',
        vendorOrder: def.vendorOrder,
        faction: def.factionHash // TODO: show rep!
      };

      // Collapse Vanguard
      if (def.mapSectionIdentifier === 'VANGUARD') {
        createdVendor.hash = 'VANGUARD';
        createdVendor.name = def.mapSectionName;
      }

      const items = _.flatten(vendor.saleItemCategories.map((categoryData) => {
        return categoryData.saleItems;
      }));

      return dimStoreService.processItems({ id: null }, _.pluck(items, 'item'))
        .then(function(items) {
          const itemsByHash = _.indexBy(items, 'hash');
          const categories = _.map(vendor.saleItemCategories, (category) => {
            const categoryItems = category.saleItems.map((saleItem) => {
              return {
                costs: saleItem.costs.map((cost) => {
                  return {
                    value: cost.value,
                    currency: _.pick(defs.InventoryItem[cost.itemHash], 'itemName', 'icon', 'itemHash')
                  };
                }),
                item: itemsByHash[saleItem.item.itemHash],
                unlocked: isSaleItemUnlocked(saleItem)
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
              if (item.bucket.sort === 'Weapons' || item.bucket.sort === 'Armor') {
                hasArmorWeaps = true;
              }
              if (item.type === 'Ship' || item.type === 'Vehicle') {
                hasVehicles = true;
              }
              if (item.type === "Emblem") {
                hasShadersEmbs = true;
              }
              if (item.type === "Shader") {
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
              title: category.categoryTitle,
              items: categoryItems,
              hasArmorWeaps: hasArmorWeaps,
              hasVehicles: hasVehicles,
              hasShadersEmbs: hasShadersEmbs,
              hasEmotes: hasEmotes,
              hasConsumables: hasConsumables,
              hasBounties: hasBounties
            };
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
      return _.every(saleItem.unlockStatuses, function(status) { return status.isSet; });
    }
  }
})();
