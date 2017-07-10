import _ from 'underscore';
import $ from 'jquery';

import template from './vendors.html';
import './vendors.scss';

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

  init();

  // TODO: watch vendors instead?
  $scope.$on('dim-vendors-updated', () => {
    init();
  });

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });
}

export const VendorsComponent = {
  controller: VendorsController,
  template: template,
  controllerAs: 'vm'
};
