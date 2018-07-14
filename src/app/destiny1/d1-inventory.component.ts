import template from "./d1-inventory.html";
import { subscribeOnScope } from "../rx-utils";
import { getBuckets } from "./d1-buckets.service";
import { IComponentOptions, IController, IScope } from "angular";
import { DestinyAccount } from "../accounts/destiny-account.service";
import { D1StoresService } from "../inventory/d1-stores.service";

export const D1InventoryComponent: IComponentOptions = {
  template,
  bindings: {
    account: "<"
  },
  controller: D1InventoryController
};

function D1InventoryController(
  this: IController & { account: DestinyAccount },
  $scope: IScope
) {
  "ngInject";

  const vm = this;

  this.$onInit = () => {
    getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, D1StoresService.getStoresStream(vm.account), (stores) => {
        if (stores) {
          vm.stores = stores;
        }
      });
    });
  };

  $scope.$on("dim-refresh", () => {
    D1StoresService.reloadStores();
  });
}
