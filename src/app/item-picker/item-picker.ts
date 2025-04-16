import { use, useCallback } from 'react';
import { DimItem } from '../inventory/item-types';
import { ItemPickerContext } from './ItemPickerContainer';

export interface ItemPickerOptions {
  /** Override the default "Choose an Item" prompt. */
  prompt?: string;
  /** Optionally restrict items to a particular subset. */
  filterItems?: (item: DimItem) => boolean;
  /** An extra sort function that items will be sorted by (beyond the default sort chosen by the user)  */
  sortBy?: (item: DimItem) => string | number | boolean | undefined;
  uniqueBy?: (item: DimItem) => string | number | boolean | undefined;
}

export type ItemPickerState = ItemPickerOptions & {
  onItemSelected: (result: DimItem | undefined) => void;
};

/**
 * A function to show an item picker UI, optionally filtered to a specific set of items. When an item
 * is selected, the promise is resolved with that item. It is resolved with undefined if the picker
 * is closed without a selection.
 */
export type ShowItemPickerFn = (options: ItemPickerOptions) => Promise<DimItem | undefined>;

/**
 * Returns a function to show an item picker UI, optionally filtered to a specific set of items. When an item
 * is selected, the promise is resolved with that item. It is resolved with undefined if the picker
 * is closed without a selection.
 */
export function useItemPicker(): ShowItemPickerFn {
  const setOptions = use(ItemPickerContext);
  return useCallback(
    (options) =>
      new Promise((resolve) => {
        setOptions({ ...options, onItemSelected: resolve });
      }),
    [setOptions],
  );
}

/**
 * Returns a function that can be used to hide the item picker.
 */
export function useHideItemPicker() {
  const setOptions = use(ItemPickerContext);
  return useCallback(() => setOptions(undefined), [setOptions]);
}
