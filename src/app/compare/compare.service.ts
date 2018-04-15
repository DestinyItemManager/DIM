import { DimItem } from "../inventory/store/d2-item-factory.service";
import { IRootScopeService } from "angular";

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
