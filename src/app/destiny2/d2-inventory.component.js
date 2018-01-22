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

  if ($featureFlags.dnd) {
    let dragBox;

    $scope.$on('drag-start-item', (event, args) => {
      dragBox = document.getElementById('item-drag-box');
      dragBox.style.top = `${args.element.target.getBoundingClientRect().top - dragBox.offsetHeight}px`;
      $scope.$apply(() => {
        vm.item = args.item;
      });
    });

    $scope.$on('drag-stop-item', () => {
      if (dragBox) {
        dragBox.style.top = '-200px';
      }
      $scope.$apply(() => {
        vm.item = null;
      });
    });
  }
}
