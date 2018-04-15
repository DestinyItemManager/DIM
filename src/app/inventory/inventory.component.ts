import template from "./inventory.html";
import { subscribeOnScope } from "../rx-utils";
import { getBuckets } from "../destiny1/d1-buckets.service";
import { IComponentOptions, IController, IScope } from "angular";
import { StoreServiceType } from "./d2-stores.service";
import { DestinyAccount } from "../accounts/destiny-account.service";

export const InventoryComponent: IComponentOptions = {
  template,
  bindings: {
    account: "<"
  },
  controller: InventoryController
};

function InventoryController(
  this: IController & { account: DestinyAccount },
  $scope: IScope,
  dimStoreService: StoreServiceType
) {
  "ngInject";

  const vm = this;

  this.$onInit = () => {
    getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, dimStoreService.getStoresStream(vm.account), (stores) => {
        if (stores) {
          vm.stores = stores;
        }
      });
    });
  };

  $scope.$on("dim-refresh", () => {
    dimStoreService.reloadStores();
  });
}
