(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimVendorService', VendorService);

  VendorService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimItemDefinitions', 'dimPlatformService', 'dimVendorDefinitions', 'dimStoreService'];

  function VendorService($rootScope, $q, dimBungieService, dimItemDefinitions, dimPlatformService, dimVendorDefinitions, dimStoreService) {
    function getBuckets(items) {
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
    
    function initVanguardBuckets(vendors) {
      if (!vendors || !vendors.length) return;
      
      var titan = _.findWhere(vendors, {vendorHash: '1990950'});
      var hunter = _.findWhere(vendors, {vendorHash: '3003633346'});
      var warlock = _.findWhere(vendors, {vendorHash: '1575820975'});
      titan.items = {Titan: getBuckets(titan.items.filter(function(item) { return item.classType === 0 || item.classType === 3; }))};
      hunter.items = {Hunter: getBuckets(hunter.items.filter(function(item) { return item.classType === 1 || item.classType === 3; }))};
      warlock.items = {Warlock: getBuckets(warlock.items.filter(function(item) { return item.classType === 2 || item.classType === 3; }))};
      
      return {
        Titan: titan,
        Hunter: hunter,
        Warlock: warlock
      };
    }
    
    function initFactionBuckets(vendors) {
      if (!vendors || !vendors.length) return;
      
      var deadorbit = _.findWhere(vendors, {vendorHash: '3611686524'});
      var futurewar = _.findWhere(vendors, {vendorHash: '1821699360'});
      var newmon = _.findWhere(vendors, {vendorHash: '1808244981'});
      deadorbit.items = initBuckets(deadorbit.items);
      futurewar.items = initBuckets(futurewar.items);
      newmon.items = initBuckets(newmon.items);

      return {
        DeadOrbit: deadorbit,
        FutureWarCult: futurewar,
        NewMonarchy: newmon
      };
    }
    
    function initMiscBuckets(vendors) {
      if (!vendors || !vendors.length) return;
      
      var eris = _.findWhere(vendors, {vendorHash: '174528503'});
      var speaker = _.findWhere(vendors, {vendorHash: '2680694281'});
      var variks = _.findWhere(vendors, {vendorHash: '1998812735'});
      eris.items = initBuckets(eris.items);
      speaker.items = initBuckets(speaker.items);
      variks.items = initBuckets(variks.items);

      return {
        Eris: eris,
        Speaker: speaker,
        Variks: variks
      };
    }
    
    function initBanner(vendors) {
      if (!vendors || !vendors.length) return;
      
      var banner = _.findWhere(vendors, {vendorHash: '242140165'});
      banner.items = initBuckets(banner.items);

      return {
        Banner: banner
      };
    }
    
    function initCrucible(vendors) {
     if (!vendors || !vendors.length) return;
     
     var cruc = _.findWhere(vendors, {vendorHash: '3746647075'});
     cruc.items = initBuckets(cruc.items);
     
     return {
        Crucible: cruc
      };
    }
    
    function initExotics(vendors) {
      var exotics = _.findWhere(vendors, {vendorHash: '3902439767'});
      exotics.items = initBuckets(exotics.items);

      return {
        Exotics: exotics
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
      vanguardHashes: ['1990950', '3003633346', '1575820975'], // Titan, Hunter, Warlock
      factionHashes: ['3611686524', '1821699360', '1808244981'], // Dead orbit, Future war, New mon
      miscHashes: ['174528503', '2680694281', '1998812735'], // Eris, Speaker, Variks
      crucibleHash: '3746647075',
      bannerHash: '242140165',
      exoticsHash: '3902439767',
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
              promises.push(dimStoreService.processItems({ id: null }, vendorWithItems.items)
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
            self.vendorItems.vanguard = initVanguardBuckets(_.filter(vendorsWithProcessedItems, function(vendor) { return _.contains(self.vanguardHashes,vendor.vendorHash); }));
            self.vendorItems.factions = initFactionBuckets(_.filter(vendorsWithProcessedItems, function(vendor) { return _.contains(self.factionHashes,vendor.vendorHash); }));
            self.vendorItems.misc = initMiscBuckets(_.filter(vendorsWithProcessedItems, function(vendor) { return _.contains(self.miscHashes,vendor.vendorHash); }));
            self.vendorItems.crucible = initCrucible(_.filter(vendorsWithProcessedItems, function(vendor) { return self.crucibleHash === vendor.vendorHash }));
            self.vendorItems.banner = initBanner(_.filter(vendorsWithProcessedItems, function(vendor) { return self.bannerHash === vendor.vendorHash; }));
            self.vendorItems.exotics = initExotics(_.filter(vendorsWithProcessedItems, function(vendor) { return self.exoticsHash === vendor.vendorHash; }));
            //self.vendorItems = vendorsWithProcessedItems;
            // // Now lets split the items in each vendor up by class and armor type
            // _.each(vendorsWithProcessedItems, function(vendorWithProcessedItems) {
              // vendorWithProcessedItems.items = initBuckets(vendorWithProcessedItems.items);
            // });
            // self.vendorItems = vendorsWithProcessedItems;
          });
      }
    };
  }
})();
