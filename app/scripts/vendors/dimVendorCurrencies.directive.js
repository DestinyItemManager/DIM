(function() {
  'use strict';

  var VendorCurrencies = {
    controller: VendorCurrenciesCtrl,
    controllerAs: 'vm',
    bindings: {
      vendorCategories: '<',
      totalCoins: '<',
      propertyFilter: '<'
    },
    template: [
      '<div class="vendor-currency" ng-repeat="currency in vm.currencies track by currency.itemHash">',
      '  {{vm.totalCoins[currency.itemHash]}}',
      '  <img ng-src="{{::currency.icon | bungieIcon}}" title="{{::currency.itemName}}"/>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorCurrencies', VendorCurrencies);

  VendorCurrenciesCtrl.$inject = ['$scope', '$filter'];

  function VendorCurrenciesCtrl($scope, $filter) {
    const vm = this;

    $scope.$watchGroup(['vm.vendorCategories', 'vm.propertyFilter'], () => {
      vm.currencies = _.chain(vm.vendorCategories)
        .filter(vm.propertyFilter)
        .pluck('saleItems')
        .map((i) => $filter('vendorTabItems')(i, vm.propertyFilter))
        .flatten()
        .pluck('costs')
        .flatten()
        .pluck('currency')
        .unique((c) => c.itemHash)
        .value();
    });
  }
})();
