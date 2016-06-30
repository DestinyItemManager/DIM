(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimVendorService', VendorService);

  VendorService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimItemDefinitions', 'dimPlatformService', 'dimVendorDefinitions', 'dimStoreService'];

  function VendorService($rootScope, $q, dimBungieService, dimItemDefinitions, dimPlatformService, dimVendorDefinitions, dimStoreService) {
    function getBuckets(items) {
      // load the best items
      return {
        Helmet: items.filter(function(item) { return item.type === 'Helmet'; }),
        Gauntlets: items.filter(function(item) { return item.type === 'Gauntlets'; }),
        Chest: items.filter(function(item) { return item.type === 'Chest'; }),
        Leg: items.filter(function(item) { return item.type === 'Leg'; }),
        ClassItem: items.filter(function(item) { return item.type === 'ClassItem'; }),
        Ghost: items.filter(function(item) { return item.type === 'Ghost'; })
      };
    }

    function initBuckets(items) {
      return {
        Titan: getBuckets(items.filter(function(item) { return item.classType === 0 || item.classType === 3; })),
        Hunter: getBuckets(items.filter(function(item) { return item.classType === 1 || item.classType === 3; })),
        Warlock: getBuckets(items.filter(function(item) { return item.classType === 2 || item.classType === 3; }))
      };
    }

    function mergeMaps(o, map) {
      _.each(map, function(val, key) {
        if (!o[key]) {
          o[key] = map[key];
        }
      });
      return o;
    }

    return {
      vendorItems: [],
      updateVendorItems: function() {
        var self = this;

        return dimBungieService.getVendors(dimPlatformService.getActive())
          .then(function(vendors) {
            // Get vendor metadata
            return dimVendorDefinitions.then(function(vendorDefs) {
              _.each(vendors, function(vendor) {
                vendor.vendorName = vendorDefs[vendor.vendorHash].vendorName;
                vendor.vendorIcon = vendorDefs[vendor.vendorHash].factionIcon || vendorDefs[vendor.vendorHash].vendorIcon;
              });
              return vendors;
            });
          })
          .then(function(vendors) {
            // Add items that are buyable to vendors
            var vendorsWithItems = [];
            _.each(vendors, function(vendor) {
              if (vendor.enabled) {
                var items = [];
                _.each(vendor.saleItemCategories, function(categoryData) {
                  var filteredSaleItems = _.filter(categoryData.saleItems, function(saleItem) { return saleItem.item.isEquipment && saleItem.costs.length; });
                  items.push.apply(items, filteredSaleItems);
                });
                vendorsWithItems.push({ vendorHash: vendor.vendorHash, vendorName: vendor.vendorName, vendorIcon: vendor.vendorIcon, items: items });
              }
            });

            // Get the costs and currency types of the items
            return dimItemDefinitions.then(function(itemDefs) {
              _.each(vendorsWithItems, function(vendorWithItems) {
                var rawItems = _.pluck(vendorWithItems.items, 'item');
                var costs = _.reduce(vendorWithItems.items, function(o, saleItem) {
                  o[saleItem.item.itemHash] = { cost: saleItem.costs[0].value, currency: _.pick(itemDefs[saleItem.costs[0].itemHash], 'itemName', 'icon', 'itemHash') };
                  return o;
                }, {});
                vendorWithItems.items = rawItems;
                vendorWithItems.costs = costs;
              });
              return vendorsWithItems;
            });
          })
          .then(function(vendorsWithItems) {
            // Up to this point we have a vendor for each character on the account
            // Let's combine the items today by vendorHash and filter out weapons and < 280 light gear
            var grouped = _.groupBy(vendorsWithItems, 'vendorHash');
            var mergedVendors = _.map(_.keys(grouped), function(key) {
              var combinedItems = _.filter(_.uniq(_.flatten(_.pluck(grouped[key], 'items')), function(item) { return item.itemHash; }), function(item) {
                return item.primaryStat &&
                  item.primaryStat.statHash === 3897883278 && // has defence hash
                  item.primaryStat.value >= 280 && // only 280+ light items
                  item.stats;
              });
              // Merge the costs of the items here too
              return { vendorHash: key, vendorName: grouped[key][0].vendorName, vendorIcon: grouped[key][0].vendorIcon, costs: _.reduce(_.pluck(grouped[key], 'costs'), mergeMaps, {}), items: combinedItems };
            });

            // Now get the actual items from dimStoreService and add the costs/currency to the items
            var promises = [];
            _.each(mergedVendors, function(vendorWithItems) {
              promises.push(dimStoreService.processItems(null, vendorWithItems.items)
                .then(function(processedItems) {
                  _.each(processedItems, function(processedItem) {
                    processedItem.cost = vendorWithItems.costs[processedItem.hash];
                  });
                  vendorWithItems.items = processedItems;
                  return vendorWithItems;
                })
              );
            });
            return $q.all(promises);
          })
          .then(function(vendorsWithProcessedItems) {
            // Now lets split the items in each vendor up by class and armor type
            _.each(vendorsWithProcessedItems, function(vendorWithProcessedItems) {
              vendorWithProcessedItems.items = initBuckets(vendorWithProcessedItems.items);
            });
            self.vendorItems = vendorsWithProcessedItems;
          });
      }
    };
  }
})();
