import template from './d2-inventory.html';
import { subscribeOnScope } from '../rx-utils';

export const D2InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: D2InventoryController
};

function D2InventoryController($rootScope, $scope, D2StoresService, D2BucketsService) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    dnd: $featureFlags.dnd
  };

  let dragBox;

  this.$onInit = function() {
    D2BucketsService.getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, D2StoresService.getStoresStream(vm.account), (stores) => {
        vm.stores = stores;
      });
    });
  };

  $scope.$on('dim-refresh', () => {
    D2StoresService.reloadStores();
  });

  $rootScope.$on('drag-start-item', (event, args) => {
    dragBox = document.getElementById('item-drag-box');
    vm.item = args.item;
    dragBox.style.top = `${args.element.target.getBoundingClientRect().top - dragBox.offsetHeight}px`;
    $rootScope.$digest();
  });
  $rootScope.$on('drag-stop-item', (event, args) => {
    dragBox.style.top = '-200px';
    vm.item = null;
    $rootScope.$digest();
  });

}
