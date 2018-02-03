import { subscribeOnScope } from '../rx-utils';
import template from './xur.html';

export const Xur = {
  template: template,
  controller: XurController
};

const xurVendorId = 2796397637;

function XurController($scope, dimVendorService, dimPlatformService) {
  'ngInject';

  const vm = this;

  vm.totalCoins = {};

  subscribeOnScope($scope, dimVendorService.getVendorsStream(dimPlatformService.getActive()), ([stores, vendors]) => {
    // To fake Xur when he's not around, substitute another vendor's ID
    const xurVendor = vendors[xurVendorId];
    vm.vendors = [xurVendor];
    vm.totalCoins = dimVendorService.countCurrencies(stores, vendors);
  });
}
