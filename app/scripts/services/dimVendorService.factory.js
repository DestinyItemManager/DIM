(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimVendorService', VendorService);

  VendorService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimPlatformService', 'dimVendorDefinitions', 'dimStoreService', '$http'];

  function VendorService($rootScope, $q, dimBungieService, dimPlatformService, dimVendorDefinitions, dimStoreService, $http) {
    
    function getBuckets(items) {
      // load the best items
      return {
        Helmet: items.filter(function(item) { return item.type === 'Helmet'; }),
        Gauntlets: items.filter(function(item) { return item.type === 'Gauntlets'; }),
        Chest: items.filter(function(item) { return item.type === 'Chest'; }),
        Leg: items.filter(function(item) { return item.type === 'Leg'; }),
        ClassItem: items.filter(function(item) { return item.type === 'ClassItem'; }),
        Ghost: items.filter(function(item) { return item.type === 'Ghost'; }),        
        Artifact: items.filter(function(item) { return item.type === 'Artifact'; })
      };
    }

    function initBuckets(items) {
      return {
        Titan: getBuckets(items.filter(function(item) { return item.classType === 0 || item.classType === 3; })),
        Hunter: getBuckets(items.filter(function(item) { return item.classType === 1 || item.classType === 3; })),
        Warlock: getBuckets(items.filter(function(item) { return item.classType === 2 || item.classType === 3; }))
      };
    }
    
    return {
      vendorItems: {},
      updateVendorItems: function() {
        var self = this;

        return dimBungieService.getVendors(dimPlatformService.getActive())
          .then(function(vendors) {
            return dimVendorDefinitions.then(function(vendorDefs) {
              _.each(vendors, function(vendor) {
                vendor.vendorName = vendorDefs[vendor.vendorHash].vendorName;
                vendor.vendorIcon = vendorDefs[vendor.vendorHash].vendorIcon;
              });
              return vendors;
            });
          })
          .then(function(vendors) {
            var vendorsWithItems =  [];
            _.each(vendors, function(vendor) {
              if (vendor.enabled) {
                var items = [];
                _.each(vendor.saleItemCategories, function(categoryData) {
                  var filteredSaleItems = _.filter(categoryData.saleItems, function(saleItem) { return saleItem.item.isEquipment && saleItem.costs.length; });
                  _.each(filteredSaleItems, function(saleItem) {
                    items.push(saleItem.item);
                  });
                });
                vendorsWithItems.push({vendorHash: vendor.vendorHash, vendorName: vendor.vendorName, vendorIcon: vendor.vendorIcon, items: items});
              }
            });
            return vendorsWithItems;
          })
          .then(function(vendorsWithItems) {
            var grouped = _.groupBy(vendorsWithItems, 'vendorHash');
            var mergedVendors = _.map(_.keys(grouped), function(key) {
              var combinedItems = _.filter(_.uniq(_.flatten(_.pluck(grouped[key], 'items')), function(item) { return item.itemHash; }), function(item) {
                return item.primaryStat &&
                  item.primaryStat.statHash === 3897883278 && // has defence hash
                  item.primaryStat.value >= 280 && // only 280+ light items
                  item.stats;
              });
              return {vendorHash: key, vendorName: grouped[key][0].vendorName, vendorIcon: grouped[key][0].vendorIcon, items:combinedItems};
            });
            var promises = [];
            _.each(mergedVendors, function(vendorWithItems) {
              promises.push(dimStoreService.processItems(null, vendorWithItems.items)
                .then(function (processedItems) {
                  vendorWithItems.items = processedItems;
                  return vendorWithItems;
                })
              );
            });
            return $q.all(promises);
          })
          .then(function(vendorsWithProcessedItems) {
            // Now lets split the items up by class and armor type
            _.each(vendorsWithProcessedItems, function(vendorWithProcessedItems) {
              vendorWithProcessedItems.items = initBuckets(vendorWithProcessedItems.items);
            });
            self.vendorItems = vendorsWithProcessedItems;
          });
      }
    };
  }
})();
