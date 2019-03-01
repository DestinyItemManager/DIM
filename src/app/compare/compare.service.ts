import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs/Subject';

export const CompareService = {
  dialogOpen: false,
  compareItems$: new Subject<{
    items: DimItem[];
    dupes: boolean;
  }>(),
  addItemsToCompare(items: DimItem[], dupes = false) {
    this.compareItems$.next({ items, dupes });
  }
};
