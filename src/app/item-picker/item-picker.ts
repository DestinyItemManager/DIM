import { Subject } from 'rxjs/Subject';
import { DimItem } from '../inventory/item-types';

export interface ItemPickerOptions {
  /** Override the default "Choose an Item" prompt. */
  prompt?: string;
  /** Optionally restrict items to a particular subset. */
  filterItems?(item: DimItem): boolean;
}

interface ItemSelectResult {
  item: DimItem;
  equip: boolean;
}

export type ItemPickerState = ItemPickerOptions & {
  onItemSelected(result: ItemSelectResult): void;
  onCancel(reason?: Error): void;
};

export const showItemPicker$ = new Subject<ItemPickerState>();

/**
 * Show an item picker UI, optionally filtered to a specific set of items. When an item
 * is selected, the promise is resolved with that item. It is rejected if the picker
 * is closed without a selection.
 */
export function showItemPicker(options: ItemPickerOptions): Promise<ItemSelectResult> {
  return new Promise((resolve, reject) => {
    showItemPicker$.next({ ...options, onItemSelected: resolve, onCancel: reject });
  });
}
