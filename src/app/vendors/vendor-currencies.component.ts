import template from './vendor-currencies.component.html';
import * as _ from 'lodash';
import { IComponentOptions, IController, IScope } from 'angular';
import { vendorTabItems } from './vendors.filters';

export const VendorCurrencies: IComponentOptions = {
  controller: VendorCurrenciesCtrl,
  controllerAs: 'vm',
  bindings: {
    vendorCategories: '<',
    totalCoins: '<',
    propertyFilter: '<'
  },
  template
};

function VendorCurrenciesCtrl(this: IController, $scope: IScope) {
  'ngInject';

  const vm = this;

  $scope.$watchGroup(['vm.vendorCategories', 'vm.propertyFilter'], () => {
    const allCurrencies = {};
    const allItems = vendorTabItems(
      _.compact(
        _.flatMap(vm.vendorCategories, (category: any) => {
          if (!vm.propertyFilter || !vm.propertyFilter.length || category[vm.propertyFilter]) {
            return category.saleItems;
          }
          return undefined;
        })
      ),
      vm.propertyFilter
    );

    allItems.forEach((saleItem) => {
      saleItem.costs.forEach((cost) => {
        allCurrencies[cost.currency.itemHash] = cost.currency;
      });
    });

    vm.currencies = allCurrencies;
  });
}
