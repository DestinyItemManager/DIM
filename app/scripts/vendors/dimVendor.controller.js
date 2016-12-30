const angular = require('angular');
const _ = require('lodash');

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

    vm.settings = dimSettingsService;
    vm.vendorService = dimVendorService;
    function init(stores = dimStoreService.getStores()) {
      if (_.isEmpty(stores)) {
        return;
      }

      vm.stores = _.reject(stores, (s) => s.isVault);

      countCurrencies(stores);
    }

    init();

    // TODO: watch vendors instead?
    $scope.$on('dim-vendors-updated', function() {
      init();
    });

    $scope.$on('dim-stores-updated', function(e, args) {
      vm.stores = _.reject(args.stores, (s) => s.isVault);
      countCurrencies(args.stores);
    });

    function countCurrencies(stores) {
      var currencies = _.chain(vm.vendorService.vendors)
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
