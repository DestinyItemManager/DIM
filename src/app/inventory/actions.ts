import { createAction } from 'typesafe-actions';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { TagValue } from './dim-item-info';
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

/** Update the set of new items. */
export const setNewItems = createAction('new_items/SET')<Set<string>>();

export const setItemTag = createAction('tag_notes/SET_TAG')<{
  /** Item instance ID */
  itemId: string;
  tag?: TagValue;
}>();

export const setItemTagsBulk = createAction('tag_notes/SET_TAG_BULK')<
  {
    /** Item instance ID */
    itemId: string;
    tag?: TagValue;
  }[]
>();

export const setItemNote = createAction('tag_notes/SET_NOTE')<{
  /** Item instance ID */
  itemId: string;
  note?: string;
}>();

/** Update the item infos (tags/notes). */
export const tagsAndNotesLoaded = createAction('tag_notes/LOADED')<{
  [key: string]: {
    tag?: TagValue;
    notes?: string;
  };
}>();

/** Clear out tags and notes for items that no longer exist. Argument is the list of inventory item IDs to remove. */
export const tagCleanup = createAction('tag_notes/CLEANUP')<string[]>();

/** Notify that a stackable stack has begun or ended dragging. A bit overkill to put this in redux but eh. */
export const stackableDrag = createAction('stackable_drag/DRAG')<boolean>();
