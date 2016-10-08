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
      1990950, 3003633346, 1575820975 // vanguard
    ];

    const service = {
      vendorsLoaded: false,
      reloadVendors: reloadVendors,
      // By hash, then by character, or the other way?
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
      console.log(stores);
      dimDefinitions.then((defs) => {
        stores.forEach((store) => {
          if (!store.isVault) {
            _.each(defs.Vendor, (vendorDef) => {
              if (vendorList.includes(vendorDef.hash)) {
                console.log(store.name, vendorDef);
                loadVendor(store, vendorDef, platform);
              }
            });
          }
        });
      });
    }

    // TODO: Limit to certain vendors
    // TODO: ratelimit HTTP requests
    function loadVendor(store, vendorDef, platform) {
      const vendorHash = vendorDef.hash;
      const key = vendorKey(store, vendorHash, platform);
      return idbKeyval
        .get(key)
        .then((vendor) => {
          // TODO: look at what we already have!

          // TODO: parse date
          if (vendor && vendor.nextRefreshDate > new Date().toISOString()) {
            console.log("loaded local", vendor);
            return vendor;
          } else {
            console.log("load remote", vendorHash, vendor, vendor && vendor.nextRefreshDate);
            // TODO: check enabled
            return dimBungieService
              .getVendorForCharacter(store, vendorHash)
              .then((vendor) => {
                return idbKeyval
                  .set(key, vendor)
                // TODO: cache processed items
                  .then(() => vendor);
              });
            // TODO: catch notfound
          }
        });
    }

    function vendorKey(store, vendorHash, platform) {
      return ['vendor', store.id, platform.type, vendorHash].join('-');
    }
  }
})();
