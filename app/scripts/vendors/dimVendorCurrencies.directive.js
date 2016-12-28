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
    templateUrl: 'scripts/vendors/dimVendorCurrencies.directive.html'
  };

  angular.module('dimApp')
    .component('dimVendorCurrencies', VendorCurrencies);

  VendorCurrenciesCtrl.$inject = ['$scope', '$filter'];

  function VendorCurrenciesCtrl($scope, $filter) {
    const vm = this;

    $scope.$watchGroup(['vm.vendorCategories', 'vm.propertyFilter'], () => {
      const allCurrencies = {};
      const vendorTabItems = $filter('vendorTabItems');
      const allItems = vendorTabItems(flatMap(vm.vendorCategories, (category) => {
        if (!vm.propertyFilter || !vm.propertyFilter.length || category[vm.propertyFilter]) {
          return category.saleItems;
        }
        return undefined;
      }), vm.propertyFilter);

      allItems.forEach((saleItem) => {
        saleItem.costs.forEach((cost) => {
          allCurrencies[cost.currency.itemHash] = cost.currency;
        });
      });

      vm.currencies = allCurrencies;
    });
  }
})();
