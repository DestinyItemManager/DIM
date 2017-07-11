import _ from 'underscore';
import $ from 'jquery';

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
    // TODO: this is a hack for loading stores - it should be just an observable
    vm.stores = dimStoreService.getStores();
    // TODO: OK, need to push this check into store service
    if (!vm.stores.length ||
        dimStoreService.activePlatform.membershipId !== vm.account.membershipId ||
        dimStoreService.activePlatform.platformType !== vm.account.platformType) {
      dimStoreService.reloadStores(vm.account);
      // TODO: currently this wires us up via the dim-stores-updated event
    }

    init();
  };

  // TODO: break characters out into their own thing!
  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
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

  init();

  // TODO: watch vendors instead?
  $scope.$on('dim-vendors-updated', () => {
    init();
  });

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });
}
