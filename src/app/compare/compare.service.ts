import { DimItem } from '../inventory/item-types';
import { Subject } from 'rxjs/Subject';

export const CompareService = {
  dialogOpen: false,
  compareItem$: new Subject<{
    item: DimItem;
    dupes: boolean;
  }>(),
  addItemToCompare(item: DimItem, dupes = false) {
    this.compareItem$.next({ item, dupes });
  }
};
