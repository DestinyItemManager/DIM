(function() {
  'use strict';

  var VendorCurrencies = {
    controller: VendorCurrenciesCtrl,
    controllerAs: 'vm',
    bindings: {
      vendorCategories: '<',
      totalCoins: '<'
    },
    template: [
      '<div class="vendor-currency" ng-repeat="currency in vm.currencies track by $index">',
      '  {{vm.totalCoins[currency.itemHash]}}',
      '  <img ng-src="{{::currency.icon | bungieIcon}}" title="{{::currency.itemName}}"/>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorCurrencies', VendorCurrencies);

  VendorCurrenciesCtrl.$inject = ['$scope', 'ngDialog', 'dimStoreService', 'dimSettingsService'];

  function VendorCurrenciesCtrl($scope) {
    const vm = this;

    $scope.$watch('vm.vendorCategories', () => {
      vm.currencies = _.chain(vm.vendorCategories)
        .pluck('saleItems')
        .flatten()
        .pluck('costs')
        .flatten()
        .pluck('currency')
        .unique((c) => c.itemHash)
        .value();
    });
  }
})();
