(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimXurService', XurService);

  XurService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimDefinitions', 'dimStoreService', '$http'];

  function XurService($rootScope, $q, dimBungieService, dimDefinitions, dimStoreService, $http) {
    var xurTest = false; // set this to true when you want to test but Xur's not around
    function xurTestData() {
      return $http.get('scripts/xur/xur.json')
        .then(function(json) {
          return json.data.Response.data;
        });
    }

    return {
      available: false,
      itemCategories: {},
      updateXur: function() {
        var self = this;
        var xurPromise = xurTest ? xurTestData() : dimBungieService.getXur();

        return xurPromise.then(function(xurData) {
          self.available = xurData && xurData.enabled && xurData.saleItemCategories;

          if (self.available) {
            dimDefinitions.then(function(defs) {
              self.itemCategories = {};
              var rawItems = [];
              xurData.saleItemCategories.forEach(function(categoryData) {
                var wares = categoryData.saleItems.map(function(saleItem) {
                  rawItems.push(saleItem.item);
                  return {
                    cost: saleItem.costs[0].value,
                    currency: _.pick(defs.InventoryItem[saleItem.costs[0].itemHash], 'itemName', 'icon', 'itemHash'),
                    itemHash: saleItem.item.itemHash
                  };
                });
                self.itemCategories[categoryData.categoryTitle] = wares;
              });
              return dimStoreService.processItems({ id: null }, rawItems).then(function(items) {
                var itemsByHash = _.indexBy(items, 'hash');
                _.each(self.itemCategories, function(saleItems) {
                  saleItems.forEach(function(saleItem) {
                    saleItem.item = itemsByHash[saleItem.itemHash];
                    delete saleItem.itemHash;
                  });
                });
              });
            });
          }
        }, function() {
          self.available = false;
          self.itemCategories = {};
        });
      }
    };
  }
})();
