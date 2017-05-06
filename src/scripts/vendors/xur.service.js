import angular from 'angular';
import _ from 'underscore';

function XurService($rootScope, dimVendorService, dimStoreService) {
  'ngInject';

  const xurVendorId = 2796397637;
  const service = {
    available: false,
    totalCoins: {}
  };

  $rootScope.$on('dim-vendors-updated', () => {
    // To fake Xur when he's not around, substitute another vendor's ID
    const xurVendor = dimVendorService.vendors[xurVendorId];
    service.available = Boolean(xurVendor);
    service.vendors = [xurVendor];
    const stores = dimStoreService.getStores();
    $rootScope.$applyAsync(() => {
      service.totalCoins = dimVendorService.countCurrencies(stores, service.vendors);
    });
  });


  $rootScope.$on('dim-stores-updated', function(e, args) {
    const stores = _.reject(args.stores, (s) => s.isVault);
    $rootScope.$applyAsync(() => {
      service.totalCoins = dimVendorService.countCurrencies(stores, service.vendors);
    });
  });

  return service;
}

export {
  XurService
};
