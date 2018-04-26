import { IRootScopeService } from "angular";
import { DimItem } from "../inventory/item-types";

export function CompareService($rootScope: IRootScopeService) {
  'ngInject';

  return {
    dialogOpen: false,
    addItemToCompare(item: DimItem, $event) {
      $rootScope.$broadcast('dim-store-item-compare', {
        item,
        clickEvent: $event
      });
    }
  };
}
