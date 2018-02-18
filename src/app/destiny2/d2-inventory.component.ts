import template from './d2-inventory.html';
import { subscribeOnScope } from '../rx-utils';
import { getBuckets } from './d2-buckets.service';

export const D2InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: D2InventoryController
};

function D2InventoryController($scope, D2StoresService) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    dnd: $featureFlags.dnd
  };

  this.$onInit = () => {
    getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, D2StoresService.getStoresStream(vm.account), (stores) => {
        if (stores) {
          vm.stores = stores;
        }
      });
    });
  };

  $scope.$on('dim-refresh', () => {
    D2StoresService.reloadStores();
  });

  if ($featureFlags.dnd) {
    let dragBox;

    $scope.$on('drag-start-item', (_event, args) => {
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
