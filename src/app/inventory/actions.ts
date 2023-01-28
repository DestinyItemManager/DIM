import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { get } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { infoLog, warnLog } from 'app/utils/log';
import {
  DestinyColor,
  DestinyItemChangeResponse,
  DestinyProfileResponse,
} from 'bungie-api-ts/destiny2';
import { createAction } from 'typesafe-actions';
import { TagCommand, TagValue } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { DimItem } from './item-types';
import { AccountCurrency, DimCharacterStat, DimStore } from './store-types';

/**
 * Update the computed/massaged state of inventory, plus account-wide info like currencies.
 */
export const update = createAction('inventory/UPDATE')<{
  stores: DimStore[];
  currencies: AccountCurrency[];
}>();

export const profileLoaded = createAction('inventory/PROFILE_LOADED')<{
  profile: DestinyProfileResponse;
  live: boolean;
}>();
export const profileError = createAction('inventory/PROFILE_ERROR')<Error | undefined>();

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
 * An error that occurred during building the stores
 */
export const error = createAction('inventory/ERROR')<Error>();

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

/**
 * An item was mutated by Advanced Write Actions (perks changed, sockets inserted, etc.).
 * We need to update the inventory with the updated item and any removed/added items.
 */
export const awaItemChanged = createAction('inventory/AWA_CHANGE')<{
  item: DimItem | null;
  changes: DestinyItemChangeResponse;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
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
      // If we switched account since starting this, give up
      if (account !== currentAccountSelector(getState())) {
        return;
      }
      dispatch(setNewItems(newItems));
    }
  };
}

export const setItemTag = createAction('tag_notes/SET_TAG')<{
  /** Item instance ID */
  itemId: string;
  tag?: TagValue;
  craftedDate?: number;
}>();

export const setItemTagsBulk = createAction('tag_notes/SET_TAG_BULK')<
  {
    /** Item instance ID */
    itemId: string;
    tag?: TagValue;
    craftedDate?: number;
  }[]
>();

export const setItemNote = createAction('tag_notes/SET_NOTE')<{
  /** Item instance ID */
  itemId: string;
  note?: string;
  craftedDate?: number;
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

/**
 * Set the tag for an item regardless of whether it's instanced or not. Prefer this to setItemTag / setItemHashTag.
 */
export function setTag(item: DimItem, tag: TagCommand | undefined): ThunkResult {
  return async (dispatch) => {
    if (!item.taggable) {
      return;
    }

    if ($featureFlags.warnNoSync) {
      dispatch(warnNoSync());
    }
    dispatch(
      item.instanced
        ? setItemTag({
            itemId: item.id,
            tag: tag === 'clear' ? undefined : tag,
            craftedDate: item.craftedInfo?.craftedDate,
          })
        : setItemHashTag({
            itemHash: item.hash,
            tag: tag === 'clear' ? undefined : tag,
          })
    );
  };
}

/**
 * Set the note for an item regardless of whether it's instanced or not. Prefer this to setItemNote / setItemHashNote.
 */
export function setNote(item: DimItem, note: string | undefined): ThunkResult {
  return async (dispatch) => {
    if (!item.taggable) {
      return;
    }

    if ($featureFlags.warnNoSync) {
      dispatch(warnNoSync());
    }
    dispatch(
      item.instanced
        ? setItemNote({
            itemId: item.id,
            note,
            craftedDate: item.craftedInfo?.craftedDate,
          })
        : setItemHashNote({
            itemHash: item.hash,
            note,
          })
    );
  };
}

/**
 * Warn the first time someone saves a tag or note and they haven't enabled DIM Sync.
 */
function warnNoSync(): ThunkResult {
  return async (_dispatch, getState) => {
    if (
      !apiPermissionGrantedSelector(getState()) &&
      localStorage.getItem('warned-no-sync') !== 'true'
    ) {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const isPersisted = await navigator.storage.persist();
        if (isPersisted) {
          infoLog('storage', 'Persisted storage granted');
        } else {
          warnLog('storage', 'Persisted storage not granted');
        }
      }
      localStorage.setItem('warned-no-sync', 'true');
      showNotification({
        type: 'warning',
        title: t('Storage.DataIsLocal'),
        body: t('Storage.DimSyncNotEnabled'),
        duration: 60_000,
      });
    }
  };
}

/** Clear out tags and notes for items that no longer exist. Argument is the list of inventory item IDs to remove. */
export const tagCleanup = createAction('tag_notes/CLEANUP')<string[]>();

/** input a mock profile API response */
export const setMockProfileResponse =
  createAction('inventory/MOCK_PROFILE')<DestinyProfileResponse>();
