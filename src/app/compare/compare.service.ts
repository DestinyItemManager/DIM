import { DimItem } from "../inventory/item-types";
import { $rootScope } from 'ngimport';

export const CompareService = {
  dialogOpen: false,
  addItemToCompare(item: DimItem, $event) {
    $rootScope.$broadcast('dim-store-item-compare', {
      item,
      clickEvent: $event
    });
  }
};
