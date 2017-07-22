import _ from 'underscore';
import { subscribeOnScope } from '../rx-utils';

import template from './vendors.html';
import './vendors.scss';

export const VendorsComponent = {
  controller: VendorsController,
  template: template,
  bindings: {
    account: '<'
  },
  controllerAs: 'vm'
};

function VendorsController($scope, $state, $q, dimStoreService, dimSettingsService, dimVendorService) {
  'ngInject';

  const vm = this;

  vm.activeTab = 'hasArmorWeaps';
  vm.activeTypeDefs = {
    armorweaps: ['armor', 'weapons'],
    vehicles: ['ships', 'vehicles'],
    shadersembs: ['shaders', 'emblems'],
    emotes: ['emotes']
  };

  vm.settings = dimSettingsService;
  vm.vendorService = dimVendorService;

  this.$onInit = function() {
    subscribeOnScope($scope, dimStoreService.getStoresStream(vm.account), init);

    // TODO: get rid of this when we subscribe to *vendors*, not *stores*
    init();
  };

  $scope.$on('dim-refresh', () => {
    // TODO: Reload vendor data independently
    dimStoreService.reloadStores();
  });

  function init(stores = dimStoreService.getStores()) {
    if (_.isEmpty(stores)) {
      return;
    }

    $scope.$applyAsync(() => {
      vm.stores = _.reject(stores, (s) => s.isVault);
      vm.totalCoins = dimVendorService.countCurrencies(stores, vm.vendorService.vendors);
    });

    dimVendorService.requestRatings();
  }

  // TODO: vendors observable!
  $scope.$on('dim-vendors-updated', () => {
    init();
  });
}
