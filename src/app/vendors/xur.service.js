import _ from 'underscore';

function XurService($rootScope, dimVendorService, dimStoreService) {
  'ngInject';

  const xurVendorId = 2796397637;
  const service = {
    available: false,
    totalCoins: {}
  };
/*
  // TODO: remove Xur service in favor of a XurLink component!
  dimVendorService.getVendorsStream(vm.account).subscribe(([stores, vendors]) => {
    vm.stores = stores;
    vm.vendors = vendors;
    vm.totalCoins = dimVendorService.countCurrencies(stores, vendors);
    service.totalCoins = dimVendorService.countCurrencies(stores, service.vendors);
  });

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

  // TODO: compute this in the xur component, not here
  $rootScope.$on('dim-stores-updated', (e, args) => {
    const stores = _.reject(args.stores, (s) => s.isVault);
    $rootScope.$applyAsync(() => {
      service.totalCoins = dimVendorService.countCurrencies(stores, service.vendors);
    });
  });
*/
  return service;
}

export {
  XurService
};
