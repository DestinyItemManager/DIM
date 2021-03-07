import { EventBus } from 'app/utils/observable';
import { DimItem } from '../inventory/item-types';

export const CompareService = {
  dialogOpen: false,
  compareItems$: new EventBus<{
    additionalItems: DimItem[];
    showSomeDupes: boolean;
  }>(),
  addItemsToCompare(additionalItems: DimItem[], showSomeDupes = false) {
    this.compareItems$.next({ additionalItems, showSomeDupes });
  },
};
