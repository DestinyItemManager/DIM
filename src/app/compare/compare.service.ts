import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs';

export const CompareService = {
  dialogOpen: false,
  compareItems$: new Subject<{
    additionalItems: DimItem[];
    showSomeDupes: boolean;
  }>(),
  addItemsToCompare(additionalItems: DimItem[], showSomeDupes = false) {
    this.compareItems$.next({ additionalItems, showSomeDupes });
  },
};
