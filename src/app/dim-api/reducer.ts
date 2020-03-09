import * as actions from './basic-actions';
import * as settingsActions from '../settings/actions';
import * as loadoutActions from '../loadout/actions';
import * as inventoryActions from '../inventory/actions';
import { clearWishLists } from 'app/wishlists/actions';
import { ActionType, getType } from 'typesafe-actions';
import _ from 'lodash';
import { ProfileUpdateWithRollback } from './api-types';
import { initialState as initialSettingsState, Settings } from '../settings/reducer';
import {
  TagValue,
  GlobalSettings,
  defaultGlobalSettings,
  ProfileUpdateResult,
  Loadout,
  DestinyVersion,
  LoadoutItem,
  ItemAnnotation
} from '@destinyitemmanager/dim-api-types';
import { Loadout as DimLoadout, LoadoutItem as DimLoadoutItem } from '../loadout/loadout-types';
import produce, { Draft } from 'immer';
import { DestinyAccount } from 'app/accounts/destiny-account';

export interface DimApiState {
  globalSettings: GlobalSettings;
  globalSettingsLoaded: boolean;

  /** Has the user granted us permission to store their info? */
  apiPermissionGranted: boolean;

  // TODO: encapsulate async loading state
  profileLoadedFromIndexedDb: boolean;
  profileLoaded: boolean;
  profileLoadedError?: Error;

  // Settings are global, not per-platform-membership
  // TODO: add last account info to settings? we'd have to load them before accounts...
  // TODO: add changelog high water mark
  settings: Settings;

  // Store profile data per account. The key is `${platformMembershipId}-d${destinyVersion}`.
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
    };
  };

  // Updates that haven't yet been flushed to the API. Each one is optimistic - we apply its
  // effects to local state immediately, but if they fail later we undo their effects. This
  // is stored locally to be redriven.
  updateQueue: ProfileUpdateWithRollback[];
}

/**
 * Global DIM platform settings from the DIM API.
 */
export const initialState: DimApiState = {
  globalSettingsLoaded: false,
  globalSettings: {
    ...defaultGlobalSettings,
    // 2019-12-17 we've been asked to disable auto-refresh
    autoRefresh: false
  },

  apiPermissionGranted: localStorage.getItem('dim-api-enabled') === 'true',

  // TODO: don't allow mutations if DIM API is disabled, profile isn't loaded, or API usage isn't agreed to
  profileLoaded: false,
  profileLoadedFromIndexedDb: false,

  // TODO: move to
  settings: initialSettingsState,

  profiles: {},

  updateQueue: []
};

// TODO: gonna have to set this correctly on load...
let updateCounter = 0;

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
          ...action.payload
        }
      };

    case getType(actions.profileLoadedFromIDB): {
      // When loading from IDB, merge with current state
      const newUpdateQueue = action.payload
        ? [...action.payload.updateQueue, ...state.updateQueue]
        : [];
      updateCounter = _.max(newUpdateQueue.map((u) => u.updateId)) || updateCounter;
      return action.payload
        ? {
            ...state,
            profileLoadedFromIndexedDb: true,
            settings: {
              ...state.settings,
              ...action.payload.settings
            },
            profiles: {
              ...state.profiles,
              ...action.payload.profiles
            },
            updateQueue: newUpdateQueue
          }
        : {
            ...state,
            profileLoadedFromIndexedDb: true
          };
    }

    case getType(actions.profileLoaded): {
      const { profileResponse, account } = action.payload;
      return {
        ...state,
        profileLoaded: true,
        settings: {
          ...state.settings,
          ...profileResponse.settings
        },
        profiles: account
          ? {
              ...state.profiles,
              // Overwrite just this account's profile
              // TODO: if there's an update queue, replay it on top!
              [makeProfileKeyFromAccount(account)]: {
                loadouts: _.keyBy(profileResponse.loadouts || [], (l) => l.id),
                tags: _.keyBy(profileResponse.tags || [], (t) => t.id)
              }
            }
          : state.profiles
      };
    }

    case getType(actions.finishedUpdates): {
      return applyFinishedUpdatesToQueue(state, action.payload.updates, action.payload.results);
    }

    // *** Settings ***

    case getType(settingsActions.setSetting):
      return changeSetting(state, action.payload.property, action.payload.value);

    case getType(settingsActions.toggleCollapsedSection):
      return changeSetting(state, 'collapsedSections', {
        ...state.settings.collapsedSections,
        [action.payload]: !state.settings.collapsedSections[action.payload]
      });

    case getType(settingsActions.setCharacterOrder): {
      const order = action.payload;
      return changeSetting(
        state,
        'customCharacterSort',
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

    default:
      return state;
  }
};

// TODO: it'd be great to be able to compact the list, but we'd have to handle when some are already inflight
function changeSetting<V extends keyof Settings>(state: DimApiState, prop: V, value: Settings[V]) {
  return produce(state, (draft) => {
    const beforeValue = draft.settings[prop];
    draft.settings[prop] = value;
    draft.updateQueue.push({
      updateId: updateCounter++,
      action: 'setting',
      payload: {
        [prop]: value
      },
      before: {
        [prop]: beforeValue
      }
    });
  });
}

/**
 * Record the result of an update call to the API
 */
function applyFinishedUpdatesToQueue(
  state: DimApiState,
  updates: ProfileUpdateWithRollback[],
  results: ProfileUpdateResult[]
) {
  return produce(state, (draft) => {
    if (updates.length !== results.length) {
      console.error(
        '[applyFinishedUpdatesToQueue] Updates and results are different lengths',
        updates.length,
        results.length
      );
    }
    const total = Math.min(updates.length, results.length);

    // Actually maybe remove all the updates... do it range-based instead of IDs

    for (let i = 0; i < total; i++) {
      const update = updates[i];
      const result = results[i];
      const index = draft.updateQueue.findIndex((u) => u.updateId === update.updateId);

      if (result.status === 'Success') {
        draft.updateQueue.splice(index, 1);
      } else {
        console.error(
          '[applyFinishedUpdatesToQueue] failed to update:',
          result.status,
          ':',
          result.message,
          update
        );
        draft.updateQueue.splice(index, 1);
        reverseEffects(draft, update);
      }
    }
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
      updateId: updateCounter++,
      action: 'delete_loadout',
      payload: loadoutId,
      before: loadoutId,
      deletedLoadout: loadout,
      platformMembershipId,
      destinyVersion
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
      updateId: updateCounter++,
      action: 'loadout',
      payload: newLoadout,
      platformMembershipId: loadout.membershipId,
      destinyVersion: loadout.destinyVersion || 2
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
  const profileKey = makeProfileKeyFromAccount(account);
  const profile = ensureProfile(draft, profileKey);
  const tags = profile.tags;
  const existingTag = tags[itemId];

  const updateAction: ProfileUpdateWithRollback = {
    updateId: updateCounter++,
    action: 'tag',
    payload: {
      id: itemId,
      tag: tag ?? null
    },
    before: {
      id: itemId,
      tag: existingTag?.tag
    },
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion
  };

  if (tag) {
    if (existingTag) {
      existingTag.tag = tag;
    } else {
      tags[itemId] = {
        id: itemId,
        tag
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

function setNote(
  draft: Draft<DimApiState>,
  itemId: string,
  notes: string | undefined,
  account: DestinyAccount
) {
  const profileKey = makeProfileKeyFromAccount(account);
  const profile = ensureProfile(draft, profileKey);
  const tags = profile.tags;
  const existingTag = tags[itemId];

  const updateAction: ProfileUpdateWithRollback = {
    updateId: updateCounter++,
    action: 'tag',
    payload: {
      id: itemId,
      notes: notes && notes.length > 0 ? notes : null
    },
    before: {
      id: itemId,
      notes: existingTag?.notes
    },
    platformMembershipId: account.membershipId,
    destinyVersion: account.destinyVersion
  };

  if (notes && notes.length > 0) {
    if (existingTag) {
      existingTag.notes = notes;
    } else {
      tags[itemId] = {
        id: itemId,
        notes
      };
    }
  } else {
    delete existingTag?.notes;
    if (!existingTag?.tag && !existingTag?.notes) {
      delete profile.tags[itemId];
    }
  }

  draft.updateQueue.push(updateAction);
}

function tagCleanup(state: DimApiState, itemIdsToRemove: string[], account: DestinyAccount) {
  return produce(state, (draft) => {
    const profileKey = makeProfileKeyFromAccount(account);
    const profile = ensureProfile(draft, profileKey);
    for (const itemId of itemIdsToRemove) {
      delete profile.tags[itemId];
    }

    draft.updateQueue.push({
      updateId: updateCounter++,
      action: 'tag_cleanup',
      payload: itemIdsToRemove,
      platformMembershipId: account.membershipId,
      destinyVersion: account.destinyVersion
    });
  });
}

function reverseEffects(draft: Draft<DimApiState>, update: ProfileUpdateWithRollback) {
  // TODO: put things back the way they were
  console.log('TODO: Reversing', draft, update);
}

export function makeProfileKeyFromAccount(account: DestinyAccount) {
  return makeProfileKey(account.membershipId, account.destinyVersion);
}
function makeProfileKey(platformMembershipId: string, destinyVersion: DestinyVersion) {
  return `${platformMembershipId}-d${destinyVersion}`;
}

function parseProfileKey(profileKey: string): [string, DestinyVersion] {
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
    unequipped
  };
}

function convertDimLoadoutItemToLoadoutItem(item: DimLoadoutItem): LoadoutItem {
  const result: LoadoutItem = {
    hash: item.hash
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
      tags: {}
    };
  }
  return draft.profiles[profileKey];
}
