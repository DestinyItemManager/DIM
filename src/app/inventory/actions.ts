import { createAction } from 'typesafe-actions';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { DimItemInfo } from './dim-item-info';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const update = createAction('inventory/UPDATE')<{
  stores: DimStore[];
  buckets?: InventoryBuckets;
  newItems?: Set<string>;
  profileResponse?: DestinyProfileResponse;
}>();

/**
 * Set the bucket info.
 */
export const setBuckets = createAction('inventory/SET_BUCKETS')<InventoryBuckets>();

/**
 * Move an item from one store to another.
 */
export const moveItem = createAction('inventory/MOVE_ITEM')<{
  item: DimItem;
  source: DimStore;
  target: DimStore;
  equip: boolean;
  amount: number;
}>();

// TODO: tags/notes should probably be their own part of state
export const setTag = createAction('inventory/SET_TAG')<{
  itemId: string;
  tag: string;
}>();

/** Update the set of new items. */
export const setNewItems = createAction('new_items/SET')<Set<string>>();

/** Update the item infos (tags/notes). */
export const setTagsAndNotes = createAction('tag_notes/SET')<{
  [key: string]: DimItemInfo;
}>();

/** Set the tags/notes for a single item. */
export const setTagsAndNotesForItem = createAction('tag_notes/UPDATE_ITEM')<{
  key: string;
  info: DimItemInfo;
}>();

/** Notify that a stackable stack has begun or ended dragging. A bit overkill to put this in redux but eh. */
export const stackableDrag = createAction('stackable_drag/DRAG')<boolean>();

/** Notify that any item in the inventory view has begun or ended dragging. */
export const itemDrag = createAction('item_drag/DRAG')<boolean>();
