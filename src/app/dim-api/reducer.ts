import {
  CustomStatWeights,
  DestinyVersion,
  GlobalSettings,
  ItemAnnotation,
  ItemHashTag,
  Loadout,
  ProfileUpdateResult,
  Search,
  SearchType,
  TagValue,
  defaultGlobalSettings,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { t } from 'app/i18next-t';
import { convertDimLoadoutToApiLoadout } from 'app/loadout/loadout-type-converters';
import { recentSearchComparator } from 'app/search/autocomplete';
import { CUSTOM_TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { FilterContext } from 'app/search/items/item-filter-types';
import { buildItemFiltersMap } from 'app/search/items/item-search-filter';
import { parseAndValidateQuery } from 'app/search/search-filter';
import { count, uniqBy } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { errorLog, infoLog } from 'app/utils/log';
import { clearWishLists } from 'app/wishlists/actions';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { deepEqual } from 'fast-equals';
import { Draft, produce } from 'immer';
import _ from 'lodash';
import { ActionType, getType } from 'typesafe-actions';
import * as inventoryActions from '../inventory/actions';
import * as loadoutActions from '../loadout/actions';
import { Loadout as DimLoadout } from '../loadout/loadout-types';
import * as settingsActions from '../settings/actions';
import { Settings, initialSettingsState } from '../settings/initial-settings';
import { DeleteLoadoutUpdateWithRollback, ProfileUpdateWithRollback } from './api-types';
import * as actions from './basic-actions';
import { makeProfileKey, makeProfileKeyFromAccount } from './selectors';

// After you've got a search history of more than this many items, we start deleting the older ones
const MAX_SEARCH_HISTORY = 300;

export interface DimApiState {
  globalSettings: GlobalSettings;
  globalSettingsLoaded: boolean;

  /** Has the user granted us permission to store their info? */
  apiPermissionGranted: boolean | null;

  profileLoadedFromIndexedDb: boolean;
  profileLoaded: boolean;
  profileLoadedError?: Error;
  // unix timestamp for when any profile was last loaded
  profileLastLoaded: number;

  /**
   * App settings. Settings are global, not per-platform-membership
   */
  settings: Settings;

  /**
   * Tags-by-item-hash are only available for D2 and are not profile-specific. Mostly for tagging shaders.
   */
  itemHashTags: {
    [itemHash: string]: ItemHashTag;
  };

  /*
   * DIM API profile data, per account. The key is `${platformMembershipId}-d${destinyVersion}`.
   */
  profiles: {
    [accountKey: string]: {
      // unix timestamp for when this specific profile was last loaded
      profileLastLoaded: number;

      /** Loadouts stored by loadout ID */
      loadouts: {
        [id: string]: Loadout;
      };
      /** Tags/notes stored by inventory item ID */
      tags: {
        [itemId: string]: ItemAnnotation;
      };
      /** Tracked triumphs */
      triumphs: number[];
    };
  };

  /**
   * Saved searches are per-Destiny-version
   */
  searches: {
    [version in DestinyVersion]: Search[];
  };

  /**
   * Updates that haven't yet been flushed to the API. Each one is optimistic - we apply its
   * effects to local state immediately, but if they fail later we undo their effects. This
   * is stored locally to be redriven.
   */
  updateQueue: ProfileUpdateWithRollback[];

  /**
   * This watermark indicates how many items in the update queue (starting with the head of the
   * queue) are currently in the process of being flushed to the server. Items at indexes
   * less than the watermark should not be modified. Once the flush is done, those items can
   * be removed from the queue and this watermark set back to 0.
   */
  updateInProgressWatermark: number;
}

function getInitialApiPermissionSetting() {
  const setting = localStorage.getItem('dim-api-enabled');
  if (setting === null) {
    return null;
  } else if (setting === 'true') {
    return true;
  } else {
    return false;
  }
}

/**
 * Global DIM platform settings from the DIM API.
 */
export const initialState: DimApiState = {
  globalSettingsLoaded: false,
  globalSettings: {
    ...defaultGlobalSettings,
    // 2019-12-17 we've been asked to disable auto-refresh
    autoRefresh: false,
    showIssueBanner: false,
  },

  apiPermissionGranted: getInitialApiPermissionSetting(),

  profileLoaded: false,
  profileLoadedFromIndexedDb: false,
  profileLastLoaded: 0,

  settings: initialSettingsState,

  itemHashTags: {},
  profiles: {},
  searches: {
    1: [],
    2: [],
  },

  updateQueue: [],
  updateInProgressWatermark: 0,
};

type DimApiAction =
  | ActionType<typeof actions>
  | ActionType<typeof settingsActions>
  | ActionType<typeof clearWishLists>
  | ActionType<typeof loadoutActions>
  | ActionType<typeof inventoryActions>;

export const dimApi = (
  state: DimApiState = initialState,
  action: DimApiAction,
  // This is a specially-handled reducer (see reducers.ts) which gets the current account (based on incoming state) passed along
  account?: DestinyAccount,
): DimApiState => {
  switch (action.type) {
    case getType(actions.globalSettingsLoaded):
      return {
        ...state,
        globalSettingsLoaded: true,
        globalSettings: {
          ...state.globalSettings,
          ...action.payload,
        },
      };

    case getType(actions.profileLoadedFromIDB): {
      // When loading from IDB, merge with current state
      if (state.updateQueue) {
        // Undo all the changes, starting with the most recent
        state = state.updateQueue
          .toReversed()
          .reduce(
            (state, update) => produce(state, (draft) => reverseUpdateLocally(draft, update)),
            state,
          );
      }

      const newUpdateQueue = action.payload
        ? // TODO: undo existing updates, add loaded updates, reapply them all
          [...(action.payload.updateQueue ?? []), ...state.updateQueue]
        : [];

      // Now apply all those updates, starting with the oldest
      state = newUpdateQueue.reduce(
        (state, update) => produce(state, (draft) => applyUpdateLocally(draft, update)),
        state,
      );

      return action.payload
        ? migrateSettings({
            ...state,
            profileLoadedFromIndexedDb: true,
            settings: {
              ...state.settings,
              ...action.payload.settings,
            },
            profiles: {
              ...state.profiles,
              ...action.payload.profiles,
            },
            updateQueue: newUpdateQueue,
            itemHashTags: action.payload.itemHashTags || initialState.itemHashTags,
            searches: {
              ...state.searches,
              ...action.payload.searches,
            },
          })
        : {
            ...state,
            profileLoadedFromIndexedDb: true,
          };
    }

    case getType(actions.profileLoaded): {
      const { profileResponse, account } = action.payload;

      const profileKey = account ? makeProfileKeyFromAccount(account) : '';
      const existingProfile = account ? state.profiles[profileKey] : undefined;

      // TODO: clean out invalid/simple searches on first load?
      const newState: DimApiState = migrateSettings({
        ...state,
        profileLoaded: true,
        profileLoadedError: undefined,
        profileLastLoaded: Date.now(),
        settings: {
          ...state.settings,
          ...(profileResponse.settings as Settings),
        },
        itemHashTags: profileResponse.itemHashTags
          ? _.keyBy(profileResponse.itemHashTags, (t) => t.hash)
          : state.itemHashTags,
        profiles: account
          ? {
              ...state.profiles,
              // Overwrite just this account's profile. If a specific key is missing from the response, don't overwrite it.
              [profileKey]: {
                profileLastLoaded: Date.now(),
                loadouts: profileResponse.loadouts
                  ? _.keyBy(profileResponse.loadouts, (l) => l.id)
                  : existingProfile?.loadouts ?? {},
                tags: profileResponse.tags
                  ? _.keyBy(profileResponse.tags, (t) => t.id)
                  : existingProfile?.tags ?? {},
                triumphs: profileResponse.triumphs
                  ? profileResponse.triumphs.map((t) => parseInt(t.toString(), 10))
                  : existingProfile?.triumphs ?? [],
              },
            }
          : state.profiles,
        searches:
          account && profileResponse.searches
            ? {
                ...state.searches,
                [account.destinyVersion]: profileResponse.searches || [],
              }
            : state.searches,
      });

      // If this is the first load, cleanup searches
      if (
        account &&
        profileResponse.searches?.length &&
        !state.searches[account.destinyVersion].length
      ) {
        return produce(newState, (state) => cleanupInvalidSearches(state, account));
      }

      return newState;
    }

    case getType(actions.profileLoadError): {
      return {
        ...state,
        profileLoadedError: action.payload,
      };
    }

    case getType(actions.setApiPermissionGranted): {
      const apiPermissionGranted = action.payload;
      return apiPermissionGranted
        ? {
            ...state,
            apiPermissionGranted,
          }
        : // If we're disabling DIM Sync, unset profile loaded and clear the update queue
          {
            ...state,
            apiPermissionGranted,
            profileLoaded: false,
            updateQueue: [],
            updateInProgressWatermark: 0,
          };
    }

    case getType(actions.prepareToFlushUpdates): {
      return prepareUpdateQueue(state);
    }

    case getType(actions.allDataDeleted): {
      return {
        ...state,
        profiles: initialState.profiles,
        settings: initialState.settings,
        updateQueue: [],
        updateInProgressWatermark: 0,
      };
    }

    case getType(actions.finishedUpdates): {
      return applyFinishedUpdatesToQueue(state, action.payload);
    }

    // For now, a failed update just resets state so we can flush again. Note that flushing will happen immediately...
    case getType(actions.flushUpdatesFailed):
      return {
        ...state,
        updateInProgressWatermark: 0,
      };

    // *** Settings ***

    case getType(settingsActions.setSettingAction):
      return changeSetting(state, action.payload.property, action.payload.value);

    case getType(settingsActions.toggleCollapsedSection):
      return changeSetting(state, 'collapsedSections', {
        ...state.settings.collapsedSections,
        [action.payload]: !state.settings.collapsedSections[action.payload],
      });

    case getType(settingsActions.setCharacterOrder): {
      const order = action.payload;
      return changeSetting(
        state,
        'customCharacterSort',
        // The order includes characters from multiple profiles, so we can't just replace it
        state.settings.customCharacterSort.filter((id) => !order.includes(id)).concat(order),
      );
    }

    // Clearing wish lists also clears the wishListSource setting
    case getType(clearWishLists):
      return changeSetting(state, 'wishListSource', '');

    // *** Loadouts ***

    case getType(loadoutActions.deleteLoadout):
      return deleteLoadout(state, action.payload);

    case getType(loadoutActions.updateLoadout):
      return updateLoadout(state, action.payload, account!);

    // *** Tags/Notes ***

    case getType(inventoryActions.setItemTag): {
      const { itemId, tag, craftedDate } = action.payload;
      return produce(state, (draft) => {
        setTag(draft, itemId, tag, craftedDate, account!);
      });
    }

    case getType(inventoryActions.setItemTagsBulk):
      return produce(state, (draft) => {
        for (const info of action.payload) {
          setTag(draft, info.itemId, info.tag, info.craftedDate, account!);
        }
      });

    case getType(inventoryActions.setItemNote): {
      const { itemId, note, craftedDate } = action.payload;
      return produce(state, (draft) => {
        setNote(draft, itemId, note, craftedDate, account!);
      });
    }

    case getType(inventoryActions.tagCleanup):
      return tagCleanup(state, action.payload, account!);

    case getType(inventoryActions.setItemHashTag):
      return produce(state, (draft) => {
        setItemHashTag(draft, action.payload.itemHash, action.payload.tag, account!);
      });

    case getType(inventoryActions.setItemHashNote):
      return produce(state, (draft) => {
        setItemHashNote(draft, action.payload.itemHash, action.payload.note, account!);
      });

    // *** Searches ***

    case getType(actions.searchUsed):
      return produce(state, (draft) => {
        searchUsed(draft, account!, action.payload.query, action.payload.type);
      });

    case getType(actions.saveSearch):
      return produce(state, (draft) => {
        saveSearch(
          account!,
          draft,
          action.payload.query,
          action.payload.saved,
          action.payload.type,
        );
      });

    case getType(actions.searchDeleted):
      return produce(state, (draft) => {
        deleteSearch(draft, account!.destinyVersion, action.payload.query, action.payload.type);
      });

    // *** Triumphs ***

    case getType(actions.trackTriumph):
      return produce(state, (draft) => {
        trackTriumph(draft, account!, action.payload.recordHash, action.payload.tracked);
      });

    default:
      return state;
  }
};

/**
 * Migrates deprecated settings to their new equivalent, and erroneous settings values to their correct value.
 * This updates the settings state and adds their updates to the update queue
 */
function migrateSettings(state: DimApiState) {
  // Fix some integer settings being stored as strings
  if (typeof state.settings.charCol === 'string') {
    state = changeSetting(state, 'charCol', parseInt(state.settings.charCol, 10));
  }
  if (typeof state.settings.charColMobile === 'string') {
    state = changeSetting(state, 'charColMobile', parseInt(state.settings.charColMobile, 10));
  }
  if (typeof state.settings.inventoryClearSpaces === 'string') {
    state = changeSetting(
      state,
      'inventoryClearSpaces',
      parseInt(state.settings.inventoryClearSpaces, 10),
    );
  }
  if (typeof state.settings.itemSize === 'string') {
    state = changeSetting(state, 'itemSize', parseInt(state.settings.itemSize, 10));
  }

  // Using undefined for the absence of a watermark was a bad idea
  if (state.settings.itemFeedWatermark === undefined) {
    state = changeSetting(state, 'itemFeedWatermark', initialSettingsState.itemFeedWatermark);
  }

  // Replace 'element' sort with 'elementWeapon' and 'elementArmor'
  const sortOrder = state.settings.itemSortOrderCustom || [];
  const reversals = state.settings.itemSortReversals || [];

  if (sortOrder.includes('element')) {
    state = changeSetting(
      state,
      'itemSortOrderCustom',
      sortOrder.toSpliced(sortOrder.indexOf('element'), 1, 'elementWeapon', 'elementArmor'),
    );
  }

  if (reversals.includes('element')) {
    state = changeSetting(
      state,
      'itemSortReversals',
      reversals.toSpliced(sortOrder.indexOf('element'), 1, 'elementWeapon', 'elementArmor'),
    );
  }

  // converts any old custom stats stored in the old settings key, to the new format
  const oldCustomStats = state.settings.customTotalStatsByClass;
  if (!_.isEmpty(oldCustomStats)) {
    // this existing array should 100% be empty if the user's stats are in old format...
    // but not taking any chances. we'll preserve what's there.
    const customStats = [...state.settings.customStats];

    for (const classEnumString in oldCustomStats) {
      const classEnum: DestinyClass = parseInt(classEnumString, 10);
      const statHashList = oldCustomStats[classEnum];

      if (classEnum !== DestinyClass.Unknown && statHashList?.length > 0) {
        const weights: CustomStatWeights = {};
        for (const statHash of statHashList) {
          weights[statHash] = 1;
        }
        customStats.push({
          label: t('Stats.Custom'),
          shortLabel: 'custom',
          class: classEnum,
          weights,
          // converted old stats get special permission to use stat hashes higher than CUSTOM_TOTAL_STAT_HASH
          // other are decremented from CUSTOM_TOTAL_STAT_HASH
          statHash: CUSTOM_TOTAL_STAT_HASH + 1 + classEnum,
        });
      }
    }

    // empty out the old-format setting. eventually phase out this old settings key?
    state = changeSetting(state, 'customStats', customStats);
    state = changeSetting(state, 'customTotalStatsByClass', {});
  }

  // A previous bug ins settings migration could cause duplicate custom stats
  if (state.settings.customStats.length) {
    const uniqCustomStats = uniqBy(state.settings.customStats, (stat) => stat.statHash);
    if (uniqCustomStats.length !== state.settings.customStats.length) {
      state = changeSetting(state, 'customStats', uniqCustomStats);
    }
  }

  return state;
}

function changeSetting<V extends keyof Settings>(state: DimApiState, prop: V, value: Settings[V]) {
  // Don't worry about changing settings to their current value
  if (deepEqual(state.settings[prop], value)) {
    return state;
  }

  return produce(state, (draft) => {
    const beforeValue = draft.settings[prop];

    const update: ProfileUpdateWithRollback = {
      action: 'setting',
      payload: {
        [prop]: value,
      },
      before: {
        [prop]: beforeValue,
      },
    };
    applyUpdateLocally(draft, update);
    draft.updateQueue.push(update);
  });
}

/**
 * This prepares the update queue to be flushed to the DIM API. It first
 * compacts the updates so that there aren't redundant actions, and then sets
 * the update watermark.
 */
function prepareUpdateQueue(state: DimApiState) {
  return produce(state, (draft) => {
    // If the user only wants to save data locally, then throw away the update queue.
    if (state.apiPermissionGranted === false) {
      draft.updateQueue = emptyArray();
      draft.updateInProgressWatermark = 0;
      return;
    }

    let platformMembershipId: string | undefined;
    let destinyVersion: DestinyVersion | undefined;

    // Multiple updates to a particular object can be coalesced into a single update
    // before being sent. We iterate from beginning (oldest update) to end (newest update).
    const compacted: {
      [key: string]: ProfileUpdateWithRollback;
    } = {};
    const rest: ProfileUpdateWithRollback[] = [];
    for (const update of draft.updateQueue) {
      // The first time we see a profile-specific update, keep track of which
      // profile it was, and reject updates for the other profiles. This is
      // because DIM API update can only work one profile at a time.
      if (!platformMembershipId && !destinyVersion) {
        platformMembershipId = update.platformMembershipId;
        destinyVersion = update.destinyVersion;
      } else if (
        update.platformMembershipId &&
        (update.platformMembershipId !== platformMembershipId ||
          update.destinyVersion !== destinyVersion)
      ) {
        // Put it on the list of other updates that won't be flushed, and move on.
        // Some updates, like settings, aren't profile-specific and can always
        // be sent.
        rest.push(update);
        continue;
      }

      compactUpdate(compacted, update);
    }

    draft.updateQueue = Object.values(compacted);

    // Set watermark to what we're going to flush.
    // TODO: Maybe add a maximum update length?
    draft.updateInProgressWatermark = draft.updateQueue.length;

    // Put the other updates we aren't going to send back on the end of the queue.
    draft.updateQueue.push(...rest);
  });
}

let unique = 0;

/**
 * Combine this update with any update to the same object that's already in the queue.
 * This is meant to reduce how many updates the API has to process - especially if the
 * app has been offline for some time.
 *
 * For example, if I edit a loadout twice then delete it, we can just issue a delete.
 *
 * Note that this may result in taking two updates, one of which would succeed and one
 * which would fail, and turning them into a single update that will fail and roll back
 * to the initial state before either of them. Hopefully this is rare.
 */
function compactUpdate(
  compacted: {
    [key: string]: ProfileUpdateWithRollback;
  },
  update: ProfileUpdateWithRollback,
) {
  // Figure out the ID of the object being acted on
  let key: string;
  switch (update.action) {
    case 'setting':
    case 'tag_cleanup':
      // These don't act on a specific object
      key = update.action;
      break;
    case 'loadout':
    case 'tag':
      // These store their ID in an object
      key = `${update.action}-${update.payload.id}`;
      break;
    case 'delete_loadout':
      // The payload is the ID, and it should coalesce with other loadout actions
      key = `loadout-${update.payload}`;
      break;
    case 'save_search':
      key = `${update.action}-${update.payload.query}`;
      break;
    case 'item_hash_tag':
      // These store their ID in an object
      key = `${update.action}-${update.payload.hash}`;
      break;
    case 'track_triumph':
      key = `${update.action}-${update.payload.recordHash}`;
      break;
    case 'search':
    case 'delete_search':
      // These don't combine (though maybe they should be extended to include an array of usage times?)
      key = `unique-${unique++}`;
      break;
  }

  const existingUpdate = compacted[key];
  if (!existingUpdate) {
    compacted[key] = update;
    return;
  }

  let combinedUpdate: ProfileUpdateWithRollback | undefined;

  // The if statements checking existingUpdate's action are to inform types
  switch (update.action) {
    case 'setting': {
      if (existingUpdate.action === 'setting') {
        const payload = {
          // Merge settings, newer overwriting older
          ...existingUpdate.payload,
          ...update.payload,
        };
        const before = {
          // Reversed order
          ...update.before,
          ...existingUpdate.before,
        };

        // Eliminate chains of settings that get back to the initial state
        for (const key in payload) {
          const typedKey = key as keyof typeof payload;
          if (payload[typedKey] === before[typedKey]) {
            delete payload[typedKey];
            delete before[typedKey];
          }
        }
        if (_.isEmpty(payload)) {
          break;
        }

        combinedUpdate = {
          ...existingUpdate,
          payload,
          before,
        };
      }
      break;
    }

    case 'tag_cleanup': {
      if (existingUpdate.action === 'tag_cleanup') {
        combinedUpdate = {
          ...existingUpdate,
          // Combine into a unique set
          payload: [...new Set([...existingUpdate.payload, ...update.payload])],
        };
      }
      break;
    }

    case 'loadout': {
      if (existingUpdate.action === 'loadout') {
        combinedUpdate = {
          ...existingUpdate,
          // Loadouts completely overwrite
          payload: update.payload,
          // We keep the "before" from the existing update
        };
      } else if (existingUpdate.action === 'delete_loadout') {
        // Someone deleted then recreated. Maybe a future undo delete case? It's not possible today.
        combinedUpdate = {
          ...update,
          // Before is whatever loadout existed before being deleted.
          before: existingUpdate.before as Loadout,
        };
      }
      break;
    }

    case 'delete_loadout': {
      if (existingUpdate.action === 'loadout') {
        // If there was no before (a new loadout) and now we're deleting it, there's nothing to update.
        if (!existingUpdate.before) {
          break;
        }

        combinedUpdate = {
          // Turn it into a delete loadout
          ...update,
          // Loadouts completely overwrite
          before: existingUpdate.before,
          // We keep the "before" from the existing update
        } as DeleteLoadoutUpdateWithRollback;
      } else if (existingUpdate.action === 'delete_loadout') {
        // Doesn't seem like we should get two delete loadouts for the same thing. Ignore the new update.
        combinedUpdate = existingUpdate;
      }
      break;
    }
    case 'tag': {
      if (existingUpdate.action === 'tag') {
        // Successive tag/notes updates overwrite
        combinedUpdate = {
          ...existingUpdate,
          payload: {
            ...existingUpdate.payload,
            ...update.payload,
          },
          before: existingUpdate.before,
        };
      }
      break;
    }
    case 'item_hash_tag': {
      if (existingUpdate.action === 'item_hash_tag') {
        // Successive tag/notes updates overwrite
        combinedUpdate = {
          ...existingUpdate,
          payload: {
            ...existingUpdate.payload,
            ...update.payload,
          },
          before: existingUpdate.before,
        };
      }
      break;
    }
    case 'track_triumph': {
      if (existingUpdate.action === 'track_triumph') {
        // Successive track state updates overwrite
        combinedUpdate = {
          ...existingUpdate,
          payload: {
            ...existingUpdate.payload,
            ...update.payload,
          },
          before: existingUpdate.before,
        };
      }
      break;
    }
    case 'save_search': {
      if (existingUpdate.action === 'save_search') {
        // Successive save state updates overwrite
        combinedUpdate = {
          ...existingUpdate,
          payload: {
            ...existingUpdate.payload,
            ...update.payload,
          },
          before: existingUpdate.before,
        };
      }
      break;
    }
    case 'search':
    case 'delete_search':
      break;
  }

  if (combinedUpdate) {
    compacted[key] = combinedUpdate;
  } else {
    delete compacted[key];
  }
}

/**
 * Record the result of an update call to the API
 */
function applyFinishedUpdatesToQueue(state: DimApiState, results: ProfileUpdateResult[]) {
  const total = Math.min(state.updateInProgressWatermark, results?.length || 0);

  for (let i = 0; i < total; i++) {
    const update = state.updateQueue[i];
    const result = results[i];

    let message = 'unknown';
    switch (update.action) {
      case 'search':
        message = update.payload.query;
        break;
      case 'delete_search':
        message = update.payload.query;
        break;
      case 'delete_loadout':
        message = update.payload;
        break;
      case 'tag':
        message = `${update.payload.id}: ${update.before?.tag}/${update.before?.notes} => ${update.payload.tag}/${update.payload.notes}`;
        break;
      case 'item_hash_tag':
        message = `${update.payload.hash}: ${update.before?.tag}/${update.before?.notes} => ${update.payload.tag}/${update.payload.notes}`;
        break;
      case 'tag_cleanup':
        message = update.payload.length.toString();
        break;
      case 'loadout':
        message = update.payload.name;
        break;
      case 'track_triumph':
        message = update.payload.recordHash.toString();
        break;
      case 'save_search':
        message = update.payload.query;
        break;
      case 'setting':
        break;
    }

    if (!(result.status === 'Success' || result.status === 'NotFound')) {
      // TODO: notification
      errorLog('dim sync', update.action, result.status, message, result.message, update);
      state = produce(state, (draft) => reverseUpdateLocally(draft, update));
    } else {
      infoLog('dim sync', update.action, result.status, message, update);
    }
  }

  return {
    ...state,
    // There's currently no error that would leave them in the array
    updateQueue: state.updateQueue.toSpliced(0, state.updateInProgressWatermark),
    updateInProgressWatermark: 0,
  };
}

/**
 * Delete a loadout by ID, from any profile it may be in.
 */
function deleteLoadout(state: DimApiState, loadoutId: string) {
  return produce(state, (draft) => {
    let profileWithLoadout: string | undefined;
    let loadout: Loadout | undefined;
    for (const profile in draft.profiles) {
      const loadouts = draft.profiles[profile]?.loadouts;

      if (loadouts[loadoutId]) {
        profileWithLoadout = profile;
        loadout = loadouts[loadoutId];
        break;
      }
    }

    if (!loadout || !profileWithLoadout) {
      return;
    }

    const [platformMembershipId, destinyVersion] = parseProfileKey(profileWithLoadout);

    const update: ProfileUpdateWithRollback = {
      action: 'delete_loadout',
      payload: loadoutId,
      before: loadout,
      platformMembershipId,
      destinyVersion,
    };
    applyUpdateLocally(draft, update);
    draft.updateQueue.push(update);
  });
}

function updateLoadout(state: DimApiState, loadout: DimLoadout, account: DestinyAccount) {
  if (loadout.id === 'equipped') {
    throw new Error('You have to change the ID before saving the equipped loadout');
  }
  return produce(state, (draft) => {
    const profileKey = makeProfileKey(account.membershipId, account.destinyVersion);
    const profile = ensureProfile(draft, profileKey);
    const loadouts = profile.loadouts;
    const newLoadout = convertDimLoadoutToApiLoadout(loadout);
    const update: ProfileUpdateWithRollback = {
      action: 'loadout',
      payload: newLoadout,
      platformMembershipId: account.membershipId,
      destinyVersion: account.destinyVersion,
    };
    if (loadouts[loadout.id]) {
      update.before = loadouts[loadout.id];
    }
    applyUpdateLocally(draft, update);
    draft.updateQueue.push(update);
  });
}

function setTag(
  draft: Draft<DimApiState>,
  itemId: string,
  tag: TagValue | undefined,
  craftedDate: number | undefined,
  account: DestinyAccount,
) {
  if (!itemId || itemId === '0') {
    errorLog('setTag', 'Cannot tag a non-instanced item. Use setItemHashTag instead');
    return;
  }

  const profileKey = makeProfileKeyFromAccount(account);
  const profile = ensureProfile(draft, profileKey);
  const tags = profile.tags;
  const existingTag = tags[itemId];

  if (tag) {
    if (existingTag?.tag === tag) {
      return; // nothing to do
    }
  } else if (!existingTag?.tag) {
    return; // nothing to do
  }

  const updateAction: ProfileUpdateWithRollback = {
    action: 'tag',
    payload: {
      id: itemId,
      tag: tag ?? null,
      craftedDate: craftedDate ?? existingTag?.craftedDate,
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function setItemHashTag(
  draft: Draft<DimApiState>,
  itemHash: number,
  tag: TagValue | undefined,
  account: DestinyAccount,
) {
  const tags = draft.itemHashTags;
  const existingTag = tags[itemHash];

  if (tag) {
    if (existingTag?.tag === tag) {
      return; // nothing to do
    }
  } else if (!existingTag?.tag) {
    return; // nothing to do
  }

  const updateAction: ProfileUpdateWithRollback = {
    action: 'item_hash_tag',
    payload: {
      hash: itemHash,
      tag: tag ?? null,
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function setNote(
  draft: Draft<DimApiState>,
  itemId: string,
  notes: string | undefined,
  craftedDate: number | undefined,
  account: DestinyAccount,
) {
  if (!itemId || itemId === '0') {
    errorLog('setNote', 'Cannot note a non-instanced item. Use setItemHashNote instead');
    return;
  }
  const profileKey = makeProfileKeyFromAccount(account);
  const profile = ensureProfile(draft, profileKey);
  const tags = profile.tags;
  const existingTag = tags[itemId];

  const updateAction: ProfileUpdateWithRollback = {
    action: 'tag',
    payload: {
      id: itemId,
      notes: notes && notes.length > 0 ? notes : null,
      craftedDate: craftedDate ?? existingTag?.craftedDate,
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function setItemHashNote(
  draft: Draft<DimApiState>,
  itemHash: number,
  notes: string | undefined,
  account: DestinyAccount,
) {
  const tags = draft.itemHashTags;
  const existingTag = tags[itemHash];

  const updateAction: ProfileUpdateWithRollback = {
    action: 'item_hash_tag',
    payload: {
      hash: itemHash,
      notes: notes && notes.length > 0 ? notes : null,
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function tagCleanup(state: DimApiState, itemIdsToRemove: string[], account: DestinyAccount) {
  if (!state.profileLoaded) {
    // Don't try to cleanup anything if we haven't loaded yet
    return state;
  }
  return produce(state, (draft) => {
    const updateAction: ProfileUpdateWithRollback = {
      action: 'tag_cleanup',
      payload: itemIdsToRemove,
      // "before" isn't really valuable here
      platformMembershipId: account.membershipId,
      destinyVersion: account.destinyVersion,
    };
    applyUpdateLocally(draft, updateAction);
    draft.updateQueue.push(updateAction);
  });
}

function trackTriumph(
  draft: Draft<DimApiState>,
  account: DestinyAccount,
  recordHash: number,
  tracked: boolean,
) {
  const updateAction: ProfileUpdateWithRollback = {
    action: 'track_triumph',
    payload: {
      recordHash: recordHash,
      tracked,
    },
    before: {
      recordHash: recordHash,
      tracked: !tracked,
    },
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function searchUsed(
  draft: Draft<DimApiState>,
  account: DestinyAccount,
  query: string,
  type: SearchType,
) {
  const destinyVersion = account.destinyVersion;
  // Note: memoized
  const filtersMap = buildItemFiltersMap(destinyVersion);

  // Canonicalize the query so we always save it the same way
  const { canonical, saveInHistory } = parseAndValidateQuery(query, filtersMap, {
    customStats: draft.settings.customStats ?? [],
  } as FilterContext);
  if (!saveInHistory) {
    errorLog('searchUsed', 'Query not eligible to be saved in history', query);
    return;
  }
  query = canonical;

  const updateAction: ProfileUpdateWithRollback = {
    action: 'search',
    payload: {
      query,
      type,
    },
    destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);

  // Trim excess searches

  // TODO: maybe this should be max per type?
  const searches = draft.searches[destinyVersion];
  if (searches.length > MAX_SEARCH_HISTORY) {
    const sortedSearches = searches.toSorted(recentSearchComparator);

    const numBuiltinSearches = count(sortedSearches, (s) => s.usageCount <= 0);

    // remove bottom-sorted search until we get to the limit
    while (sortedSearches.length > MAX_SEARCH_HISTORY - numBuiltinSearches) {
      const lastSearch = sortedSearches.pop()!;
      // Never try to delete the built-in searches or saved searches
      if (!lastSearch.saved && lastSearch.usageCount > 0) {
        deleteSearch(draft, destinyVersion, lastSearch.query, lastSearch.type);
      }
    }
  }
}

function saveSearch(
  account: DestinyAccount,
  draft: Draft<DimApiState>,
  query: string,
  saved: boolean,
  type: SearchType,
) {
  const destinyVersion = account.destinyVersion;
  // Note: memoized
  const filtersMap = buildItemFiltersMap(destinyVersion);

  // Canonicalize the query so we always save it the same way
  const { canonical, saveable } = parseAndValidateQuery(query, filtersMap, {
    customStats: draft.settings.customStats ?? [],
  } as FilterContext);
  if (!saveable && saved) {
    errorLog('searchUsed', 'Query not eligible to be saved', query);
    return;
  }
  query = canonical;

  const searches = draft.searches[destinyVersion];
  const existingSearch = searches.find((s) => s.query === query);

  if (!existingSearch && saveable) {
    // Save this as a "used" search first. This may happen if it's a type of
    // search we wouldn't normally save to history like a "simple" filter. We
    // don't go through searchUsed since that errors if the search isn't
    // saveable.
    const searchUsedUpdate: ProfileUpdateWithRollback = {
      action: 'search',
      payload: {
        query,
        type,
      },
      destinyVersion,
    };
    applyUpdateLocally(draft, searchUsedUpdate);
    draft.updateQueue.push(searchUsedUpdate);
  }

  const updateAction: ProfileUpdateWithRollback = {
    action: 'save_search',
    payload: {
      query,
      saved,
      type,
    },
    destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function deleteSearch(
  draft: Draft<DimApiState>,
  destinyVersion: DestinyVersion,
  query: string,
  type: SearchType,
) {
  const updateAction: ProfileUpdateWithRollback = {
    action: 'delete_search',
    payload: {
      query,
      type,
    },
    destinyVersion,
  };
  applyUpdateLocally(draft, updateAction);
  draft.updateQueue.push(updateAction);
}

function cleanupInvalidSearches(draft: Draft<DimApiState>, account: DestinyAccount) {
  // Filter out saved and builtin searches
  const searches = draft.searches[account.destinyVersion].filter(
    (s) => !s.saved && s.usageCount > 0,
  );

  if (!searches.length) {
    return;
  }

  // Note: memoized
  const filtersMap = buildItemFiltersMap(account.destinyVersion);
  for (const search of draft.searches[account.destinyVersion]) {
    if (search.saved || search.usageCount <= 0) {
      continue;
    }

    const { saveInHistory } = parseAndValidateQuery(search.query, filtersMap, {
      customStats: draft.settings.customStats ?? [],
    } as FilterContext);
    if (!saveInHistory) {
      deleteSearch(draft, account.destinyVersion, search.query, search.type);
    }
  }
}

export function parseProfileKey(profileKey: string): [string, DestinyVersion] {
  const match = profileKey.match(/(\d+)-d(1|2)/);
  if (!match) {
    throw new Error("Profile key didn't match expected format");
  }
  return [match[1], parseInt(match[2], 10) as DestinyVersion];
}

function ensureProfile(draft: Draft<DimApiState>, profileKey: string) {
  if (!draft.profiles[profileKey]) {
    draft.profiles[profileKey] = {
      profileLastLoaded: 0,
      loadouts: {},
      tags: {},
      triumphs: [],
    };
  }
  return draft.profiles[profileKey];
}

function applyUpdateLocally(draft: Draft<DimApiState>, update: ProfileUpdateWithRollback) {
  switch (update.action) {
    case 'setting': {
      // Intentionally avoiding Object.assign because of immer
      // for (const [key, value] of Object.entries(update.payload)) {
      //   draft.settings[key] = value;
      // }
      Object.assign(draft.settings, update.payload);
      break;
    }
    case 'search': {
      const { destinyVersion } = update;
      const { query, type } = update.payload;
      const searches = draft.searches[destinyVersion!];
      const existingSearch = searches.find((s) => s.query === query);

      if (existingSearch) {
        existingSearch.lastUsage = Date.now();
        existingSearch.usageCount++;
      } else {
        searches.push({
          query,
          usageCount: 1,
          saved: false,
          lastUsage: Date.now(),
          type,
        });
      }
      break;
    }
    case 'delete_search': {
      const { query } = update.payload;
      const { destinyVersion } = update;
      draft.searches[destinyVersion!] = draft.searches[destinyVersion!].filter(
        (s) => s.query !== query,
      );
      break;
    }
    case 'delete_loadout': {
      const { platformMembershipId, destinyVersion } = update;
      const loadoutId = update.payload;
      const profile = makeProfileKey(platformMembershipId!, destinyVersion!);
      delete draft.profiles[profile]?.loadouts[loadoutId];
      break;
    }
    case 'tag': {
      const itemAnnotation = update.payload;
      const itemId = itemAnnotation.id;
      const { platformMembershipId, destinyVersion } = update;
      const profileKey = makeProfileKey(platformMembershipId!, destinyVersion!);
      const tags = ensureProfile(draft, profileKey).tags;
      const existingAnnotation = tags[itemId];
      if (existingAnnotation) {
        if (itemAnnotation.tag === null) {
          delete existingAnnotation.tag;
        } else if (itemAnnotation.tag) {
          existingAnnotation.tag = itemAnnotation.tag;
        }
        if (itemAnnotation.notes === null) {
          delete existingAnnotation.notes;
        } else if (itemAnnotation.notes) {
          existingAnnotation.notes = itemAnnotation.notes;
        }
        if (!existingAnnotation.tag && !existingAnnotation.notes) {
          delete tags[itemId];
        }
      } else {
        tags[itemId] = itemAnnotation;
      }
      break;
    }
    case 'item_hash_tag': {
      const itemAnnotation = update.payload;
      const tags = draft.itemHashTags;
      const existingAnnotation = tags[itemAnnotation.hash];
      if (existingAnnotation) {
        if (itemAnnotation.tag === null) {
          delete existingAnnotation.tag;
        } else if (itemAnnotation.tag) {
          existingAnnotation.tag = itemAnnotation.tag;
        }
        if (itemAnnotation.notes === null) {
          delete existingAnnotation.notes;
        } else if (itemAnnotation.notes) {
          existingAnnotation.notes = itemAnnotation.notes;
        }
        if (!existingAnnotation.tag && !existingAnnotation.notes) {
          delete tags[itemAnnotation.hash];
        }
      } else {
        tags[itemAnnotation.hash] = itemAnnotation;
      }
      break;
    }
    case 'tag_cleanup': {
      const { platformMembershipId, destinyVersion } = update;
      const profileKey = makeProfileKey(platformMembershipId!, destinyVersion!);
      const profile = ensureProfile(draft, profileKey);
      for (const itemId of update.payload) {
        delete profile.tags[itemId];
      }
      break;
    }
    case 'loadout': {
      const { platformMembershipId, destinyVersion } = update;
      const profileKey = makeProfileKey(platformMembershipId!, destinyVersion!);
      const loadout = update.payload;
      ensureProfile(draft, profileKey).loadouts[loadout.id] = update.payload;
      break;
    }
    case 'track_triumph': {
      const { platformMembershipId, destinyVersion } = update;
      const profileKey = makeProfileKey(platformMembershipId!, destinyVersion!);
      const profile = ensureProfile(draft, profileKey);
      const { recordHash, tracked } = update.payload;

      const triumphs = profile.triumphs.filter((h) => h !== recordHash);
      if (tracked) {
        triumphs.push(recordHash);
      }
      profile.triumphs = triumphs;
      break;
    }
    case 'save_search': {
      const { query, saved } = update.payload;
      const { destinyVersion } = update;
      const searches = draft.searches[destinyVersion!];
      const existingSearch = searches.find((s) => s.query === query);

      // This should always exist
      if (existingSearch) {
        existingSearch.saved = saved;
      }
      break;
    }
  }
}

function reverseUpdateLocally(draft: Draft<DimApiState>, update: ProfileUpdateWithRollback) {
  switch (update.action) {
    case 'delete_loadout': {
      const { platformMembershipId, destinyVersion } = update;
      const loadoutId = update.payload;
      const profileKey = makeProfileKey(platformMembershipId!, destinyVersion!);
      const loadouts = ensureProfile(draft, profileKey).loadouts;
      loadouts[loadoutId] = update.before as Loadout;
      break;
    }
    default:
      applyUpdateLocally(draft, {
        ...update,
        payload: update.before,
        before: update.payload,
      } as ProfileUpdateWithRollback);
      break;
  }
}
