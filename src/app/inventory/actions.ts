import { DestinyAccount } from 'app/accounts/destiny-account';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import { ThunkResult } from 'app/store/types';
import { DestinyColor, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { get } from 'idb-keyval';
import { createAction } from 'typesafe-actions';
import { TagValue } from './dim-item-info';
import { DimItem } from './item-types';
import { AccountCurrency, DimCharacterStat, DimStore } from './store-types';

/**
 * Update the current profile (D2 only) and the computed/massaged state of inventory, plus account-wide info like currencies.
 */
export const update = createAction('inventory/UPDATE')<{
  stores: DimStore[];
  currencies: AccountCurrency[];
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
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const error = createAction('inventory/ERROR')<DimError>();

/**
 * An item has moved (or equipped/dequipped)
 */
export const itemMoved = createAction('inventory/MOVE_ITEM')<{
  item: DimItem;
  source: DimStore;
  target: DimStore;
  equip: boolean;
  amount: number;
}>();

/*
 * An item has been locked or unlocked (or tracked/untracked)
 */
export const itemLockStateChanged = createAction('inventory/ITEM_LOCK')<{
  item: DimItem;

  state: boolean;
  type: 'lock' | 'track';
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
