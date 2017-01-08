(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimXurService', XurService);

  XurService.$inject = ['$rootScope', 'dimVendorService', 'dimStoreService'];

  function XurService($rootScope, dimVendorService, dimStoreService) {
    const service = {
      available: false,
      totalCoins: {}
    };

    $rootScope.$on('dim-vendors-updated', () => {
      // To fake Xur when he's not around, substitute another vendor's ID
      const xurVendor = dimVendorService.vendors[2796397637];
      service.available = Boolean(xurVendor);
      service.vendors = [xurVendor];
    });


    $rootScope.$on('dim-stores-updated', function(e, args) {
      const stores = _.reject(args.stores, (s) => s.isVault);
      countCurrencies(stores);
    });

    // TODO: Stolen from dimVendor.controller.js - move this to vendor service
    function countCurrencies(stores) {
      var currencies = _.chain(service.vendors)
            .values()
            .pluck('categories')
            .flatten()
            .pluck('saleItems')
            .flatten()
            .pluck('costs')
            .flatten()
            .pluck('currency')
            .pluck('itemHash')
            .unique()
            .value();
      service.totalCoins = {};
      currencies.forEach(function(currencyHash) {
        // Legendary marks and glimmer are special cases
        if (currencyHash === 2534352370) {
          service.totalCoins[currencyHash] = dimStoreService.getVault().legendaryMarks;
        } else if (currencyHash === 3159615086) {
          service.totalCoins[currencyHash] = dimStoreService.getVault().glimmer;
        } else if (currencyHash === 2749350776) {
          service.totalCoins[currencyHash] = dimStoreService.getVault().silver;
        } else {
          service.totalCoins[currencyHash] = sum(stores, function(store) {
            return store.amountOfItem({ hash: currencyHash });
          });
        }
      });
      console.log(service.totalCoins);
    }

    return service;
  }
})();
