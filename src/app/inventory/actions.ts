import { createAction } from 'typesafe-actions';
import { DimStore, DimCharacterStat } from './store-types';
import { DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';
import { TagValue } from './dim-item-info';
import { DestinyProfileResponse, DestinyColor } from 'bungie-api-ts/destiny2';
import { ThunkResult } from 'app/store/types';
import { get } from 'idb-keyval';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { DimError } from 'app/bungie-api/bungie-service-helper';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const update = createAction('inventory/UPDATE')<{
  stores: DimStore[];
  profileResponse?: DestinyProfileResponse;
}>();

export interface CharacterInfo {
  characterId: string;
  level: number;
  powerLevel: number;
  background: string;
  icon: string;
  stats: {
    [hash: number]: DimCharacterStat;
  };
  percentToNextLevel?: number;
  color?: DestinyColor;
}

/**
 * Update just the stats of the characters, no inventory.
 */
export const charactersUpdated = createAction('inventory/CHARACTERS')<CharacterInfo[]>();

/**
 * Force stores to be updated to reflect a change. This is a hack that should go
 * away as we normalize inventory state.
 */
export const touch = createAction('inventory/TOUCH')();

/**
 * Force stores to be updated to reflect a change in a single item by instance ID. This is a hack that should go
 * away as we normalize inventory state.
 */
export const touchItem = createAction('inventory/TOUCH_ITEM')<string>();

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const error = createAction('inventory/ERROR')<DimError>();

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
/** Clear new-ness of an item by its instance ID */
export const clearNewItem = createAction('new_items/CLEAR_NEW')<string>();
/** Clear new-ness of all items */
export const clearAllNewItems = createAction('new_items/CLEAR_ALL')();

/** Load which items are new from IndexedDB */
export function loadNewItems(account: DestinyAccount): ThunkResult {
  return async (dispatch, getState) => {
    if (getState().inventory.newItemsLoaded) {
      return;
    }

    const key = `newItems-m${account.membershipId}-d${account.destinyVersion}`;
    const newItems = await get<Set<string> | undefined>(key);
    if (newItems) {
      dispatch(setNewItems(newItems));
    }
  };
}

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

/**
 * Tag an item by hash (for uninstanced items like shaders)
 */
export const setItemHashTag = createAction('tag_notes/SET_HASH_TAG')<{
  itemHash: number;
  tag?: TagValue;
}>();

export const setItemHashNote = createAction('tag_notes/SET_HASH_NOTE')<{
  itemHash: number;
  note?: string;
}>();

/** Clear out tags and notes for items that no longer exist. Argument is the list of inventory item IDs to remove. */
export const tagCleanup = createAction('tag_notes/CLEANUP')<string[]>();

/** Notify that a stackable stack has begun or ended dragging. A bit overkill to put this in redux but eh. */
export const stackableDrag = createAction('stackable_drag/DRAG')<boolean>();
