import * as actions from './basic-actions';
import * as settingsActions from '../settings/actions';
import * as loadoutActions from '../loadout/actions';
import * as inventoryActions from '../inventory/actions';
import { clearWishLists } from 'app/wishlists/actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { ProfileUpdateWithRollback, DeleteLoadoutUpdateWithRollback } from './api-types';
import { initialSettingsState, Settings } from '../settings/initial-settings';
import {
  TagValue,
  GlobalSettings,
  defaultGlobalSettings,
  ProfileUpdateResult,
  Loadout,
  DestinyVersion,
  LoadoutItem,
  ItemAnnotation,
  Search,
  ItemHashTag,
} from '@destinyitemmanager/dim-api-types';
import { Loadout as DimLoadout, LoadoutItem as DimLoadoutItem } from '../loadout/loadout-types';
import produce, { Draft } from 'immer';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { emptyArray } from 'app/utils/empty';
import { parseQuery, canonicalizeQuery } from 'app/search/query-parser';

export interface DimApiState {
  globalSettings: GlobalSettings & { showIssueBanner: boolean };
  globalSettingsLoaded: boolean;

  /** Has the user granted us permission to store their info? */
  apiPermissionGranted: boolean | null;

  profileLoadedFromIndexedDb: boolean;
  profileLoaded: boolean;
  profileLoadedError?: Error;
  // unix timestamp for when the profile was last loaded
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
    showIssueBanner: true,
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
            searches: action.payload.searches || initialState.searches,
          }
        : {
            ...state,
            profileLoadedFromIndexedDb: true,
          };
    }

    case getType(actions.profileLoaded): {
      const { profileResponse, account } = action.payload;
      return {
        ...state,
        profileLoaded: true,
        profileLoadedError: undefined,
        profileLastLoaded: Date.now(),
        settings: {
          ...state.settings,
          ...profileResponse.settings,
        },
        itemHashTags: profileResponse.itemHashTags
          ? _.keyBy(profileResponse.itemHashTags, (t) => t.hash)
          : state.itemHashTags,
        profiles: account
          ? {
              ...state.profiles,
              // Overwrite just this account's profile
              [makeProfileKeyFromAccount(account)]: {
                loadouts: _.keyBy(profileResponse.loadouts || [], (l) => l.id),
                tags: _.keyBy(profileResponse.tags || [], (t) => t.id),
                triumphs: profileResponse.triumphs || [],
              },
            }
          : state.profiles,
        searches: account
          ? {
              ...state.searches,
              [account.destinyVersion]: profileResponse.searches || [],
            }
          : state.searches,
      };
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

    case getType(settingsActions.setSetting):
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
      return updateLoadout(state, action.payload);

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
        searchUsed(draft, account!.destinyVersion, action.payload);
      });

    case getType(actions.saveSearch):
      return produce(state, (draft) => {
        saveSearch(draft, account!.destinyVersion, action.payload.query, action.payload.saved);
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

function changeSetting<V extends keyof Settings>(state: DimApiState, prop: V, value: Settings[V]) {
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
  console.time('prepareUpdateQueue');
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
    console.timeEnd('prepareUpdateQueue');
  }
}

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
  let unique = 0;

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
          payload: Array.from(new Set([...existingUpdate.payload, ...update.payload])),
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
        console.error(
          '[applyFinishedUpdatesToQueue] failed to update:',
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

function updateLoadout(state: DimApiState, loadout: DimLoadout) {
  return produce(state, (draft) => {
    if (!loadout.membershipId) {
      throw new Error('Invalid old loadout missing membership ID');
    }
    const profileKey = makeProfileKey(loadout.membershipId, loadout.destinyVersion);
    const profile = ensureProfile(draft, profileKey);
    const loadouts = profile.loadouts;
    const newLoadout = convertDimLoadoutToApiLoadout(loadout);
    const updateAction: ProfileUpdateWithRollback = {
      action: 'loadout',
      payload: newLoadout,
      platformMembershipId: loadout.membershipId,
      destinyVersion: loadout.destinyVersion || 2,
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
    console.error('Cannot tag a non-instanced item. Use setItemHashTag instead');
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
      existingTag.tag = tag;
    } else {
      tags[itemId] = {
        id: itemId,
        tag,
      };
    }
  } else {
    delete existingTag?.tag;
    if (!existingTag?.tag && !existingTag?.notes) {
      delete tags[itemId];
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
    console.error('Cannot note a non-instanced item. Use setItemHashNote instead');
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

function searchUsed(draft: Draft<DimApiState>, destinyVersion: DestinyVersion, query: string) {
  // Canonicalize the query so we always save it the same way
  try {
    const ast = parseQuery(query);
    if (ast.op === 'filter' && ast.type === 'keyword') {
      // don't save "trivial" single-keyword filters
      // TODO: somehow also reject invalid searches (that don't match real keywords)
      return;
    }
    query = canonicalizeQuery(ast);
  } catch (e) {
    console.error('Query not parseable - not saving', query, e);
    return;
  }

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

  // TODO: this is where we would cap the search history!
  // while (searches.length > MAX_SEARCH_HISTORY) {
  //   remove bottom-sorted search
  // }

  draft.updateQueue.push(updateAction);
}

function saveSearch(
  draft: Draft<DimApiState>,
  destinyVersion: DestinyVersion,
  query: string,
  saved: boolean
) {
  // Canonicalize the query so we always save it the same way
  try {
    query = canonicalizeQuery(parseQuery(query));
  } catch (e) {
    console.error('Query not parseable - not saving', query, e);
    return;
  }

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
    // Hmm, may need to tweak this
    throw new Error("Unable to save a search that's not in your history");
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

function reverseEffects(draft: Draft<DimApiState>, update: ProfileUpdateWithRollback) {
  // TODO: put things back the way they were
  console.log('TODO: Reversing', draft, update);
}

export function makeProfileKeyFromAccount(account: DestinyAccount) {
  return makeProfileKey(account.membershipId, account.destinyVersion);
}
export function makeProfileKey(platformMembershipId: string, destinyVersion: DestinyVersion) {
  return `${platformMembershipId}-d${destinyVersion}`;
}

export function parseProfileKey(profileKey: string): [string, DestinyVersion] {
  const match = profileKey.match(/(\d+)-d(1|2)/);
  if (!match) {
    throw new Error("Profile key didn't match expected format");
  }
  return [match[1], parseInt(match[2], 10) as DestinyVersion];
}

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. These functions convert
 * back and forth.
 */
function convertDimLoadoutToApiLoadout(dimLoadout: DimLoadout): Loadout {
  const equipped = dimLoadout.items
    .filter((i) => i.equipped)
    .map(convertDimLoadoutItemToLoadoutItem);
  const unequipped = dimLoadout.items
    .filter((i) => !i.equipped)
    .map(convertDimLoadoutItemToLoadoutItem);

  return {
    id: dimLoadout.id,
    classType: dimLoadout.classType,
    name: dimLoadout.name,
    clearSpace: dimLoadout.clearSpace || false,
    equipped,
    unequipped,
  };
}

function convertDimLoadoutItemToLoadoutItem(item: DimLoadoutItem): LoadoutItem {
  const result: LoadoutItem = {
    hash: item.hash,
  };
  if (item.id && item.id !== '0') {
    result.id = item.id;
  }
  if (item.amount > 1) {
    result.amount = item.amount;
  }
  return result;
}

function ensureProfile(draft: Draft<DimApiState>, profileKey: string) {
  if (!draft.profiles[profileKey]) {
    draft.profiles[profileKey] = {
      loadouts: {},
      tags: {},
      triumphs: [],
    };
  }
  return draft.profiles[profileKey];
}
