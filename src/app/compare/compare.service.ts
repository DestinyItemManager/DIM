import { Subject } from 'rxjs';
import { DimItem } from '../inventory/item-types';

export const CompareService = {
  dialogOpen: false,
  compareItems$: new Subject<{
    additionalItems: DimItem[];
  }>(),
  addItemsToCompare(additionalItems: DimItem[]) {
    this.compareItems$.next({ additionalItems });
  },
};
