import {
  defaultGlobalSettings,
  DestinyVersion,
  GlobalSettings,
  ItemAnnotation,
  ItemHashTag,
  Loadout,
  ProfileUpdateResult,
  Search,
  TagValue,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { convertDimLoadoutToApiLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { recentSearchComparator } from 'app/search/autocomplete';
import { searchConfigSelector } from 'app/search/search-config';
import { parseAndValidateQuery } from 'app/search/search-utils';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { errorLog, infoLog, timer } from 'app/utils/log';
import { count } from 'app/utils/util';
import { clearWishLists } from 'app/wishlists/actions';
import { deepEqual } from 'fast-equals';
import produce, { Draft } from 'immer';
import _ from 'lodash';
import { ActionType, getType } from 'typesafe-actions';
import * as inventoryActions from '../inventory/actions';
import * as loadoutActions from '../loadout-drawer/actions';
import { Loadout as DimLoadout } from '../loadout-drawer/loadout-types';
import * as settingsActions from '../settings/actions';
import { initialSettingsState, Settings } from '../settings/initial-settings';
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
  account?: DestinyAccount
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
      const newUpdateQueue = action.payload
        ? [...action.payload.updateQueue, ...state.updateQueue]
        : [];
      return action.payload
        ? {
            ...state,
            profileLoadedFromIndexedDb: true,
            settings: migrateSettings({
              ...state.settings,
              ...action.payload.settings,
            }),
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
          }
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
      const newState: DimApiState = {
        ...state,
        profileLoaded: true,
        profileLoadedError: undefined,
        profileLastLoaded: Date.now(),
        settings: migrateSettings({
          ...state.settings,
          ...profileResponse.settings,
        }),
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
      };

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
        state.settings.customCharacterSort.filter((id) => !order.includes(id)).concat(order)
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

    case getType(inventoryActions.setItemTag):
      return produce(state, (draft) => {
        setTag(draft, action.payload.itemId, action.payload.tag as TagValue, account!);
      });

    case getType(inventoryActions.setItemTagsBulk):
      return produce(state, (draft) => {
        for (const info of action.payload) {
          setTag(draft, info.itemId, info.tag as TagValue, account!);
        }
      });

    case getType(inventoryActions.setItemNote):
      return produce(state, (draft) => {
        setNote(draft, action.payload.itemId, action.payload.note, account!);
      });

    case getType(inventoryActions.tagCleanup):
      return tagCleanup(state, action.payload, account!);

    case getType(inventoryActions.setItemHashTag):
      return produce(state, (draft) => {
        setItemHashTag(draft, action.payload.itemHash, action.payload.tag as TagValue, account!);
      });

    case getType(inventoryActions.setItemHashNote):
      return produce(state, (draft) => {
        setItemHashNote(draft, action.payload.itemHash, action.payload.note, account!);
      });

    // *** Searches ***

    case getType(actions.searchUsed):
      return produce(state, (draft) => {
        searchUsed(draft, account!, action.payload);
      });

    case getType(actions.saveSearch):
      return produce(state, (draft) => {
        saveSearch(account!, draft, action.payload.query, action.payload.saved);
      });

    case getType(actions.searchDeleted):
      return produce(state, (draft) => {
        deleteSearch(draft, account!.destinyVersion, action.payload);
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

function migrateSettings(settings: Settings) {
  // Fix some integer settings being stored as strings
  if (typeof settings.charCol === 'string') {
    settings = { ...settings, charCol: parseInt(settings.charCol, 10) };
  }
  if (typeof settings.charColMobile === 'string') {
    settings = { ...settings, charColMobile: parseInt(settings.charColMobile, 10) };
  }
  if (typeof settings.inventoryClearSpaces === 'string') {
    settings = { ...settings, inventoryClearSpaces: parseInt(settings.inventoryClearSpaces, 10) };
  }
  if (typeof settings.itemSize === 'string') {
    settings = { ...settings, itemSize: parseInt(settings.itemSize, 10) };
  }

  // Replace 'element' sort with 'elementWeapon' and 'elementArmor'
  const sortOrder = settings.itemSortOrderCustom || [];
  const reversals = settings.itemSortReversals || [];

  if (sortOrder.includes('element')) {
    sortOrder.splice(sortOrder.indexOf('element'), 1, 'elementWeapon', 'elementArmor');
  }

  if (reversals.includes('element')) {
    reversals.splice(sortOrder.indexOf('element'), 1, 'elementWeapon', 'elementArmor');
  }

  settings = { ...settings, itemSortOrderCustom: sortOrder, itemSortReversals: reversals };

  return settings;
}

function changeSetting<V extends keyof Settings>(state: DimApiState, prop: V, value: Settings[V]) {
  // Don't worry about changing settings to their current value
  if (deepEqual(state.settings[prop], value)) {
    return state;
  }

  return produce(state, (draft) => {
    const beforeValue = draft.settings[prop];
    draft.settings[prop] = value;
    draft.updateQueue.push({
      action: 'setting',
      payload: {
        [prop]: value,
      },
      before: {
        [prop]: beforeValue,
      },
    });
  });
}

/**
 * This prepares the update queue to be flushed to the DIM API. It first
 * compacts the updates so that there aren't redundant actions, and then sets
 * the update watermark.
 */
function prepareUpdateQueue(state: DimApiState) {
  const stopTimer = timer('prepareUpdateQueue');
  try {
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
  } finally {
    stopTimer();
  }
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
  update: ProfileUpdateWithRollback
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
          if (payload[key] === before[key]) {
            delete payload[key];
            delete before[key];
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
  return produce(state, (draft) => {
    const total = Math.min(state.updateInProgressWatermark, results?.length || 0);

    for (let i = 0; i < total; i++) {
      const update = state.updateQueue[i];
      const result = results[i];

      if (!(result.status === 'Success' || result.status === 'NotFound')) {
        errorLog(
          'applyFinishedUpdatesToQueue',
          'failed to update:',
          result.status,
          ':',
          result.message,
          update
        );
        reverseEffects(draft, update);
      }
    }

    // There's currently no error that would leave them in the array
    draft.updateQueue.splice(0, state.updateInProgressWatermark);
    draft.updateInProgressWatermark = 0;
  });
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
        delete loadouts[loadoutId];
        break;
      }
    }

    if (!loadout || !profileWithLoadout) {
      return;
    }

    const [platformMembershipId, destinyVersion] = parseProfileKey(profileWithLoadout);

    draft.updateQueue.push({
      action: 'delete_loadout',
      payload: loadoutId,
      before: loadout,
      platformMembershipId,
      destinyVersion,
    });
  });
}

function updateLoadout(state: DimApiState, loadout: DimLoadout, account: DestinyAccount) {
  return produce(state, (draft) => {
    const profileKey = makeProfileKey(account.membershipId, account.destinyVersion);
    const profile = ensureProfile(draft, profileKey);
    const loadouts = profile.loadouts;
    const newLoadout = convertDimLoadoutToApiLoadout(loadout);
    const updateAction: ProfileUpdateWithRollback = {
      action: 'loadout',
      payload: newLoadout,
      platformMembershipId: account.membershipId,
      destinyVersion: account.destinyVersion,
    };

    if (loadouts[loadout.id]) {
      updateAction.before = loadouts[loadout.id];
      loadouts[loadout.id] = newLoadout;
      draft.updateQueue.push(updateAction);
    } else {
      loadouts[loadout.id] = newLoadout;
      draft.updateQueue.push(updateAction);
    }
  });
}

function setTag(
  draft: Draft<DimApiState>,
  itemId: string,
  tag: TagValue | undefined,
  account: DestinyAccount
) {
  if (!itemId || itemId === '0') {
    errorLog('setTag', 'Cannot tag a non-instanced item. Use setItemHashTag instead');
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
      tag: tag ?? null,
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };

  if (tag) {
    if (existingTag) {
      if (existingTag.tag === tag) {
        return; // nothing to do
      }
      existingTag.tag = tag;
    } else {
      tags[itemId] = {
        id: itemId,
        tag,
      };
    }
  } else {
    if (existingTag?.tag) {
      delete existingTag.tag;
      if (!existingTag.notes) {
        delete tags[itemId];
      }
    } else {
      return; // nothing to do
    }
  }

  draft.updateQueue.push(updateAction);
}

function setItemHashTag(
  draft: Draft<DimApiState>,
  itemHash: number,
  tag: TagValue | undefined,
  account: DestinyAccount
) {
  const tags = draft.itemHashTags;
  const existingTag = tags[itemHash];

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

  if (tag) {
    if (existingTag) {
      existingTag.tag = tag;
    } else {
      tags[itemHash] = {
        hash: itemHash,
        tag,
      };
    }
  } else {
    delete existingTag?.tag;
    if (!existingTag?.tag && !existingTag?.notes) {
      delete tags[itemHash];
    }
  }

  draft.updateQueue.push(updateAction);
}

function setNote(
  draft: Draft<DimApiState>,
  itemId: string,
  notes: string | undefined,
  account: DestinyAccount
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
    },
    before: existingTag ? { ...existingTag } : undefined,
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion,
  };

  if (notes && notes.length > 0) {
    if (existingTag) {
      existingTag.notes = notes;
    } else {
      tags[itemId] = {
        id: itemId,
        notes,
      };
    }
  } else {
    delete existingTag?.notes;
    if (!existingTag?.tag && !existingTag?.notes) {
      delete tags[itemId];
    }
  }

  draft.updateQueue.push(updateAction);
}

function setItemHashNote(
  draft: Draft<DimApiState>,
  itemHash: number,
  notes: string | undefined,
  account: DestinyAccount
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

  if (notes && notes.length > 0) {
    if (existingTag) {
      existingTag.notes = notes;
    } else {
      tags[itemHash] = {
        hash: itemHash,
        notes,
      };
    }
  } else {
    delete existingTag?.notes;
    if (!existingTag?.tag && !existingTag?.notes) {
      delete tags[itemHash];
    }
  }

  draft.updateQueue.push(updateAction);
}

function tagCleanup(state: DimApiState, itemIdsToRemove: string[], account: DestinyAccount) {
  if (!state.profileLoaded) {
    // Don't try to cleanup anything if we haven't loaded yet
    return state;
  }
  return produce(state, (draft) => {
    const profileKey = makeProfileKeyFromAccount(account);
    const profile = ensureProfile(draft, profileKey);
    for (const itemId of itemIdsToRemove) {
      delete profile.tags[itemId];
    }

    draft.updateQueue.push({
      action: 'tag_cleanup',
      payload: itemIdsToRemove,
      // "before" isn't really valuable here
      platformMembershipId: account.membershipId,
      destinyVersion: account.destinyVersion,
    });
  });
}

function trackTriumph(
  draft: Draft<DimApiState>,
  account: DestinyAccount,
  recordHash: number,
  tracked: boolean
) {
  const profileKey = makeProfileKeyFromAccount(account);
  const profile = ensureProfile(draft, profileKey);

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

  const triumphs = profile.triumphs.filter((h) => h !== recordHash);
  if (tracked) {
    triumphs.push(recordHash);
  }
  profile.triumphs = triumphs;

  draft.updateQueue.push(updateAction);
}

// Real hack to fake out enough store to select out the search configs
function stubSearchRootState(account: DestinyAccount) {
  return {
    accounts: {
      accounts: [account],
      currentAccount: 0,
    },
    inventory: { stores: [] },
    dimApi: { profiles: {} },
    manifest: {},
  } as any as RootState;
}

function searchUsed(draft: Draft<DimApiState>, account: DestinyAccount, query: string) {
  const destinyVersion = account.destinyVersion;
  const searchConfigs = searchConfigSelector(stubSearchRootState(account));

  // Canonicalize the query so we always save it the same way
  const { canonical, saveInHistory } = parseAndValidateQuery(query, searchConfigs);
  if (!saveInHistory) {
    errorLog('searchUsed', 'Query not eligible to be saved in history', query);
    return;
  }
  query = canonical;

  const updateAction: ProfileUpdateWithRollback = {
    action: 'search',
    payload: {
      query,
    },
    destinyVersion,
  };

  const searches = draft.searches[destinyVersion];
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
    });
  }

  if (searches.length > MAX_SEARCH_HISTORY) {
    const sortedSearches = [...searches].sort(recentSearchComparator);

    const numBuiltinSearches = count(sortedSearches, (s) => s.usageCount <= 0);

    // remove bottom-sorted search until we get to the limit
    while (sortedSearches.length > MAX_SEARCH_HISTORY - numBuiltinSearches) {
      const lastSearch = sortedSearches.pop()!;
      // Never try to delete the built-in searches or saved searches
      if (!lastSearch.saved && lastSearch.usageCount > 0) {
        deleteSearch(draft, destinyVersion, lastSearch.query);
      }
    }
  }

  draft.updateQueue.push(updateAction);
}

function saveSearch(
  account: DestinyAccount,
  draft: Draft<DimApiState>,
  query: string,
  saved: boolean
) {
  const destinyVersion = account.destinyVersion;
  const searchConfigs = searchConfigSelector(stubSearchRootState(account));

  // Canonicalize the query so we always save it the same way
  const { canonical, saveable } = parseAndValidateQuery(query, searchConfigs);
  if (!saveable) {
    errorLog('searchUsed', 'Query not eligible to be saved', query);
    return;
  }
  query = canonical;

  const updateAction: ProfileUpdateWithRollback = {
    action: 'save_search',
    payload: {
      query,
      saved,
    },
    destinyVersion,
  };

  const searches = draft.searches[destinyVersion];
  const existingSearch = searches.find((s) => s.query === query);

  if (existingSearch) {
    existingSearch.saved = saved;
  } else {
    // Save this as a "used" search first. This may happen if it's a type of search we
    // wouldn't normally save to history like a "simple" filter.
    searches.push({
      query,
      usageCount: 1,
      saved: true,
      lastUsage: Date.now(),
    });
    draft.updateQueue.push({
      action: 'search',
      payload: {
        query,
      },
      destinyVersion,
    });
  }

  draft.updateQueue.push(updateAction);
}

function deleteSearch(draft: Draft<DimApiState>, destinyVersion: DestinyVersion, query: string) {
  const updateAction: ProfileUpdateWithRollback = {
    action: 'delete_search',
    payload: {
      query,
    },
    destinyVersion,
  };

  draft.searches[destinyVersion] = draft.searches[destinyVersion].filter((s) => s.query !== query);

  draft.updateQueue.push(updateAction);
}

function cleanupInvalidSearches(draft: Draft<DimApiState>, account: DestinyAccount) {
  // Filter out saved and builtin searches
  const searches = draft.searches[account.destinyVersion].filter(
    (s) => !s.saved && s.usageCount > 0
  );

  if (!searches.length) {
    return;
  }

  const searchConfigs = searchConfigSelector(stubSearchRootState(account));
  for (const search of draft.searches[account.destinyVersion]) {
    if (search.saved || search.usageCount <= 0) {
      continue;
    }

    const { saveInHistory } = parseAndValidateQuery(search.query, searchConfigs);
    if (!saveInHistory) {
      deleteSearch(draft, account.destinyVersion, search.query);
    }
  }
}

function reverseEffects(draft: Draft<DimApiState>, update: ProfileUpdateWithRollback) {
  // TODO: put things back the way they were
  infoLog('reverseEffects', 'TODO: Reversing', draft, update);
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
