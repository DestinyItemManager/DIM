import { createStandardAction } from 'typesafe-actions';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { DimItemInfo } from './dim-item-info';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const update = createStandardAction('inventory/UPDATE')<{
  stores: DimStore[];
  buckets?: InventoryBuckets;
  newItems?: Set<string>;
}>();

/**
 * Set the bucket info.
 */
export const setBuckets = createStandardAction('inventory/SET_BUCKETS')<InventoryBuckets>();

/**
 * Move an item from one store to another.
 */
export const moveItem = createStandardAction('inventory/MOVE_ITEM')<{
  item: DimItem;
  source: DimStore;
  target: DimStore;
  equip: boolean;
  amount: number;
}>();

// TODO: tags/notes should probably be their own part of state
export const setTag = createStandardAction('inventory/SET_TAG')<{
  itemId: string;
  tag: string;
}>();

/** Update the set of new items. */
export const setNewItems = createStandardAction('new_items/SET')<Set<string>>();

/** Update the item infos (tags/notes). */
export const setTagsAndNotes = createStandardAction('tag_notes/SET')<{
  [key: string]: DimItemInfo;
}>();

/** Set the tags/notes for a single item. */
export const setTagsAndNotesForItem = createStandardAction('tag_notes/UPDATE_ITEM')<{
  key: string;
  info: DimItemInfo;
}>();

/** Notify that a stackable stack has begun or ended dragging. A bit overkill to put this in redux but eh. */
export const stackableDrag = createStandardAction('stackable_drag/DRAG')<boolean>();
/** Notify that a stackable stack has started or stopped hovering. */
export const stackableHover = createStandardAction('stackable_drag/HOVER')<boolean>();
