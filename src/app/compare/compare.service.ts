import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs/Subject';

export const CompareService = {
  dialogOpen: false,
  compareType: '',
  compareItem$: new Subject<{
    item: DimItem;
    dupes: boolean;
  }>(),
  compareMultiItem$: new Subject<{
    items: DimItem[];
  }>(),
  addItemToCompare(item: DimItem, dupes = false) {
    this.compareItem$.next({ item, dupes });
  },
  addMultiItemsToCompare(items: DimItem[]) {
    this.compareMultiItem$.next({ items });
  }
};
