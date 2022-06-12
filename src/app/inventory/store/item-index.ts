import { DimItem } from '../item-types';

let _idTracker: { [id: string]: number } = {};

export function resetItemIndexGenerator() {
  _idTracker = {};
}

/** Set an ID for the item that should be unique across all items */
export function createItemIndex(item: DimItem): string {
  // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
  if (item.id === '0') {
    _idTracker[item.hash] ||= 0;
    _idTracker[item.hash]++;
    return `${item.hash}-t${_idTracker[item.hash]}`;
  }

  return item.id;
}
