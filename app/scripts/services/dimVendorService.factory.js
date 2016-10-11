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

    return service;


    function reloadVendors(stores, platform) {
      const characters = _.reject(stores, 'isVault');
      // TODO: whitelist vendors
      return dimDefinitions.then((defs) => {
        return $q.all(_.flatten(characters.map((store) => {
          service.vendors[store.id] = service.vendors[store.id] || {};
          const vendorData = service.vendors[store.id];
          return _.map(defs.Vendor, (vendorDef) => {
            // TODO: not all vendors for all characters! (hunter vangaurd, etc)

            if (vendorList.includes(vendorDef.hash)) {
              if (vendorData &&
                  vendorData[vendorDef.hash] &&
                  vendorData[vendorDef.hash].nextRefreshDate > new Date().toISOString()) {
                store.vendors = vendorData;
                return vendorData[vendorDef.hash];
              } else {
                return loadVendor(store, vendorDef, platform, defs)
                  .then((vendor) => {
                    if (vendor) {
                      vendorData[vendor.hash] = vendor;
                      store.vendors = vendorData;
                    }
                    return vendor;
                  });
              }
            }
            return null;
          });
        })));
      }).then(() => {
        $rootScope.$broadcast('dim-vendors-updated', { stores: stores });
      });
    }

    // TODO: Limit to certain vendors
    function loadVendor(store, vendorDef, platform, defs) {
      const vendorHash = vendorDef.hash;

      const key = vendorKey(store, vendorHash, platform);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          // TODO: eververse never expires...
          if (vendor && vendor.nextRefreshDate > new Date().toISOString()) {
            console.log("loaded local", key, vendor);
            return vendor;
          } else {
            console.log("load remote", key, vendorHash, vendor, vendor && vendor.nextRefreshDate);
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

            // TODO: track percentage complete
          }
        })
        .then((vendor) => {
          if (vendor && vendor.enabled) {
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
      // TODO: why is IB wrong??? all titan!
      //
      var def = vendorDef.summary;
      const createdVendor = {
        hash: vendorDef.hash,
        name: def.vendorName,
        icon: def.factionIcon || def.vendorIcon,
        items: [],
        costs: [],
        nextRefreshDate: vendor.nextRefreshDate
      };
      /*
      vendor.hash = vendorDef.hash;
      vendor.vendorName = def.vendorName;
      vendor.vendorIcon = def.factionIcon || def.vendorIcon;
      vendor.items = [];
      vendor.costs = [];
      vendor.hasArmorWeaps = false;
      vendor.hasVehicles = false;
      vendor.hasShadersEmbs = false;
      vendor.hasEmotes = false;
       */
      //vendor.nextRefreshDate;
      // organize by category!

      let items = _.flatten(vendor.saleItemCategories.map((categoryData) => {
        return categoryData.saleItems;

        // TODO populate unlocked
        /*_.filter(categoryData.saleItems, (saleItem) => {
          saleItem.item.isUnlocked = isSaleItemUnlocked(saleItem);
          return saleItem.item.isEquipment;
        });
         */
      }));
      createdVendor.costs = _.reduce(items, (o, saleItem) => {
        if (saleItem.costs.length) {
          o[saleItem.item.itemHash] = {
            cost: saleItem.costs[0].value,
            currency: _.pick(defs.InventoryItem[saleItem.costs[0].itemHash], 'itemName', 'icon', 'itemHash')
          };
        }
        return o;
      }, {});

      return dimStoreService.processItems({ id: null }, _.pluck(items, 'item'))
        .then(function(items) {
          const itemsByHash = _.indexBy(items, 'hash');
          const categories = _.mapObject(vendor.saleItemCategories, (category) => {
            return {
              title: category.categoryTitle,
              items: category.saleItems.map((saleItem) => {
                return {
                  costs: saleItem.costs.map((cost) => {
                    return {
                      value: cost.value,
                      currency: _.pick(defs.InventoryItem[cost.itemHash], 'itemName', 'icon', 'itemHash')
                    };
                  }),
                  item: itemsByHash[saleItem.item.itemHash]
                };
              })
            };
          });

          createdVendor.allItems = items;
          createdVendor.categories = categories;

          createdVendor.items = { armor: [], weapons: [], ships: [], vehicles: [], shaders: [], emblems: [], emotes: [] };
          _.each(items, function(item) {
            item.vendorIcon = createdVendor.icon;
            if (item.primStat && item.primStat.statHash === 3897883278) {
              createdVendor.hasArmorWeaps = true;
              createdVendor.items.armor.push(item);
            } else if (item.primStat && item.primStat.statHash === 368428387) {
              createdVendor.hasArmorWeaps = true;
              createdVendor.items.weapons.push(item);
            } else if (item.primStat && item.primStat.statHash === 1501155019) {
              createdVendor.hasVehicles = true;
              createdVendor.items.vehicles.push(item);
            } else if (item.type === "Ship") {
              createdVendor.hasVehicles = true;
              createdVendor.items.ships.push(item);
            } else if (item.type === "Emblem") {
              createdVendor.hasShadersEmbs = true;
              createdVendor.items.emblems.push(item);
            } else if (item.type === "Shader") {
              createdVendor.hasShadersEmbs = true;
              createdVendor.items.shaders.push(item);
            } else if (item.type === "Emote") {
              createdVendor.hasEmotes = true;
              createdVendor.items.emotes.push(item);
            }
          });

          return createdVendor;
        });
    }

    function isSaleItemUnlocked(saleItem) {
      return _.every(saleItem.unlockStatuses, function(status) { return status.isSet; });
    }
  }
})();
