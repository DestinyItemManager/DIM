(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimVendorCtrl', dimVendorCtrl);

  dimVendorCtrl.$inject = ['$scope', '$state', '$q', 'dimStoreService', 'dimSettingsService', 'dimVendorService'];

  function dimVendorCtrl($scope, $state, $q, dimStoreService, dimSettingsService, dimVendorService) {
    var vm = this;

    var $window = $(window);
    var $vendorHeaders = $('#vendorHeaderWrapper');
    var $vendorHeadersBackground = $('#vendorHeadersBackground');
    var vendorsTop = $vendorHeaders.offset().top - 50; // Subtract height of title and back link

    function stickyHeader(e) {
      $vendorHeaders.toggleClass('sticky', $window.scrollTop() > vendorsTop);
      $vendorHeadersBackground.toggleClass('sticky', $window.scrollTop() > vendorsTop);
    }

    $window.on('scroll', stickyHeader);

    $scope.$on('$destroy', function() {
      $window.off('scroll', stickyHeader);
    });

    vm.activeTab = 'hasArmorWeaps';
    vm.activeTypeDefs = {
      armorweaps: ['armor', 'weapons'],
      vehicles: ['ships', 'vehicles'],
      shadersembs: ['shaders', 'emblems'],
      emotes: ['emotes']
    };

    /*
    // Banner
    vm.bannerHash = [242140165];

    // Titan van, Hunter van, Warlock van
    vm.vanguardHashes = [1990950, 3003633346, 1575820975];
     */

    vm.settings = dimSettingsService;
    vm.vendorService = dimVendorService;
    function init(stores) {
      if (_.isEmpty(stores)) {
        return;
      }

      vm.stores = _.reject(stores, (s) => s.isVault);

      // TODO: actually process vendors into the shape we want

      vm.vendors = _.pluck(vm.stores, 'vendors');

      // TODO: put event vendors in front

      // TODO: rearrange vendors by vendor, then by character???
      // TODO: merge vendors / category items

      /*
      vm.vendors = { armorweaps: {}, vehicles: {}, shadersembs: {}, emotes: {} };
      _.each(vendors, function(vendorMap, index) {
        vm.vendors.armorweaps[index] = {};
        vm.vendors.vehicles[index] = {};
        vm.vendors.shadersembs[index] = {};
        vm.vendors.emotes[index] = {};
        _.each(vendorMap, function(vendor, vendorHash) {
          if (vendor.hasArmorWeaps) {
            vm.vendors.armorweaps[index][vendorHash] = vendor;
          }
          if (vendor.hasVehicles) {
            vm.vendors.vehicles[index][vendorHash] = vendor;
          }
          if (vendor.hasShadersEmbs) {
            vm.vendors.shadersembs[index][vendorHash] = vendor;
          }
          if (vendor.hasEmotes) {
            vm.vendors.emotes[index][vendorHash] = vendor;
          }
        });
      });
       */
      countCurrencies(vm.stores);
      vm.vendorHashes = _.uniq(_.flatten(vm.vendors.map((v) => _.keys(v))));
      console.log(vm);
    }

    vm.stores = _.reject(dimStoreService.getStores(), (s) => s.isVault);
    init(vm.stores);

    // TODO: watch vendors instead?
    // TODO: get vendors directly from vendor service!
    $scope.$on('dim-vendors-updated', function(e, args) {
      init(args.stores);
    });

    $scope.$on('dim-stores-updated', function(e, args) {
      vm.stores = _.reject(args.stores, (s) => s.isVault);
      countCurrencies(args.stores);
    });

    function countCurrencies(stores) {
      var currencies = _.chain(vm.vendors)
            .map((c) => _.values(c))
            .flatten()
            .pluck('categories')
            .flatten()
            .flatten()
            .pluck('items')
            .flatten()
            .pluck('costs')
            .flatten()
            .pluck('currency')
            .pluck('itemHash')
            .unique()
            .value();
      vm.totalCoins = {};
      currencies.forEach(function(currencyHash) {
        // Legendary marks and glimmer are special cases
        if (currencyHash === 2534352370) {
          vm.totalCoins[currencyHash] = dimStoreService.getVault().legendaryMarks;
        } else if (currencyHash === 3159615086) {
          vm.totalCoins[currencyHash] = dimStoreService.getVault().glimmer;
        } else if (currencyHash === 2749350776) {
          vm.totalCoins[currencyHash] = dimStoreService.getVault().silver;
        } else {
          vm.totalCoins[currencyHash] = sum(stores, function(store) {
            return store.amountOfItem({ hash: currencyHash });
          });
        }
      });
    }
  }
})();
