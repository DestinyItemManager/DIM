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
    'dimPlatformService'
  ];

  function VendorService(
    $rootScope,
    dimBungieService,
    dimStoreService,
    dimDefinitions,
    dimFeatureFlags,
    dimPlatformService
  ) {
    // Vendors we wish to load
    const vendorList = [
      //1990950, 3003633346, 1575820975, // vanguard
      3917130357, // eververse
      2610555297 // Iron Banner
    ];

    const service = {
      vendorsLoaded: false,
      reloadVendors: reloadVendors,
      // By character, then by hash
      vendors: {}
    };

    $rootScope.$on('dim-stores-updated', function(e, stores) {
      if (stores.stores.length > 0) {
        service.reloadVendors(stores.stores, dimPlatformService.getActive());
      }
    });

    // TODO: clear on platform switch
    // TODO: idempotent promise
    // TODO: throttle

    return service;


    function reloadVendors(stores, platform) {
      //console.log(stores);
      // TODO: whitelist vendors
      dimDefinitions.then((defs) => {
        stores.forEach((store) => {
          if (!store.isVault) {
            _.each(defs.Vendor, (vendorDef) => {
              // TODO: not all vendors for all characters! (hunter vangaurd, etc)

              //if (vendorList.includes(vendorDef.hash)) {
                if (service.vendors[store.id] &&
                    service.vendors[store.id][vendorDef.hash] &&
                    service.vendors[store.id][vendorDef.hash].nextRefreshDate > new Date().toISOString()) {
                  store.vendors = service.vendors[store.id];
                } else {
                  //  console.log(store.name, vendorDef);
                  loadVendor(store, vendorDef, platform, defs)
                    .then((vendor) => {
                      if (vendor) {
                        console.log(store.name, vendor.vendorName, _.pluck(_.flatten(_.values(vendor.items)), 'classTypeName'));
                        service.vendors[store.id] = service.vendors[store.id] || {};
                        service.vendors[store.id][vendor.hash] = vendor;
                        store.vendors = service.vendors[store.id];
                      }
                    });
                }
              //}
            });
          }
        });
      });
    }

    // TODO: Limit to certain vendors
    // TODO: ratelimit HTTP requests
    function loadVendor(store, vendorDef, platform, defs) {
      const vendorHash = vendorDef.hash;

      const key = vendorKey(store, vendorHash, platform);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          // TODO: look at what we already have!

          // TODO: parse date
          if (false && vendor && vendor.nextRefreshDate > new Date().toISOString()) {
            console.log("loaded local", key, vendor);
            return vendor;
          } else {
            console.log("load remote", key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
            // TODO: check enabled
            return dimBungieService
              .getVendorForCharacter(store, vendorHash)
              .then((vendor) => {
                return idbKeyval
                  .set(key, vendor)
                // TODO: cache processed items
                  .then(() => vendor);
              })
              .catch((e) => {
                console.log("vendor error", e, e.code, e.status);
                // DestinyVendor
                if (e.status === 'DestinyVendorNotFound') {
                  // TODO: save a tombstone w/ time+jitter

                }
                return vendor; // FOR NOW
              });
            // TODO: catch notfound

            // TODO: cache error/missing for some time+jitter

            // TODO: track percentage complete
          }
        })
        .then((vendor) => {
          // TODO: check enabled, canPurchase?
          if (vendor) {
            const processed = processVendor(vendor, vendorDef, defs);
            console.log('got vendor', vendorDef.summary.vendorName, vendor);
            return processed;
          }
          return null;
        });
    }

    function vendorKey(store, vendorHash, platform) {
      return ['vendor', store.id, platform.type, vendorHash].join('-');
    }

    function processVendor(vendor, vendorDef, defs) {
      // TODO: why is IB wrong???
      //
      var def = vendorDef.summary;
      const createdVendor = {
      };
      vendor.hash = vendorDef.hash;
      vendor.vendorName = def.vendorName;
      vendor.vendorIcon = def.factionIcon || def.vendorIcon;
      vendor.items = [];
      vendor.costs = [];
      vendor.hasArmorWeaps = false;
      vendor.hasVehicles = false;
      vendor.hasShadersEmbs = false;
      vendor.hasEmotes = false;
      //vendor.nextRefreshDate;
      // organize by category!
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
      return dimStoreService.processItems({ id: null }, vendor.items)
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
    }

    function isSaleItemUnlocked(saleItem) {
      return _.every(saleItem.unlockStatuses, function(status) { return status.isSet; });
    }
  }
})();
