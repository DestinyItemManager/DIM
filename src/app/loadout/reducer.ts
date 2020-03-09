import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { currentAccountSelector } from '../accounts/reducer';
import { Loadout, LoadoutItem } from './loadout-types';
import { RootState } from '../store/reducers';
import _ from 'lodash';
import { createSelector } from 'reselect';
import {
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
  DestinyVersion
} from '@destinyitemmanager/dim-api-types';
import { currentProfileSelector } from 'app/dim-api/selectors';

const EMPTY_ARRAY = [];

const reportOldLoadout = _.once(() => ga('send', 'event', 'Loadouts', 'No Membership ID'));

/** All loadouts relevant to the current account */
export const loadoutsSelector = $featureFlags.dimApi
  ? createSelector(
      currentAccountSelector,
      currentProfileSelector,
      (currentAccount, profile) =>
        profile?.loadouts?.map((loadout) =>
          convertDimApiLoadoutToLoadout(
            currentAccount!.membershipId,
            currentAccount!.destinyVersion,
            loadout
          )
        ) || EMPTY_ARRAY
    )
  : createSelector(
      (state: RootState) => state.loadouts.loadouts,
      currentAccountSelector,
      (allLoadouts, currentAccount) =>
        currentAccount
          ? allLoadouts.filter((loadout) => {
              if (loadout.membershipId !== undefined) {
                return (
                  loadout.membershipId === currentAccount.membershipId &&
                  loadout.destinyVersion === currentAccount.destinyVersion
                );
              } else if (loadout.platform !== undefined) {
                reportOldLoadout();
                if (
                  loadout.platform === currentAccount.platformLabel &&
                  loadout.destinyVersion === currentAccount.destinyVersion
                ) {
                  // Take this opportunity to fix up the membership ID
                  loadout.membershipId = currentAccount.membershipId;
                  return true;
                } else {
                  return false;
                }
              } else {
                // In D1 loadouts could get saved without platform or membership ID
                return currentAccount.destinyVersion === 1;
              }
            })
          : EMPTY_ARRAY
    );
export const previousLoadoutSelector = (state: RootState, storeId: string): Loadout | undefined => {
  if (state.loadouts.previousLoadouts[storeId]) {
    return _.last(state.loadouts.previousLoadouts[storeId]);
  }
  return undefined;
};

export interface LoadoutsState {
  readonly loadouts: Loadout[];
  /** A stack of previous loadouts by character ID, for undo loadout. */
  readonly previousLoadouts: { [characterId: string]: Loadout[] };
}

export type LoadoutsAction = ActionType<typeof actions>;

const initialState: LoadoutsState = {
  loadouts: [],
  previousLoadouts: {}
};

export const loadouts: Reducer<LoadoutsState, LoadoutsAction> = (
  state: LoadoutsState = initialState,
  action: LoadoutsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        loadouts: action.payload
      };

    case getType(actions.deleteLoadout):
      return {
        ...state,
        loadouts: state.loadouts.filter((l) => l.id !== action.payload)
      };

    case getType(actions.updateLoadout): {
      const loadout = action.payload;
      return {
        ...state,
        loadouts: [...state.loadouts.filter((l) => l.id !== loadout.id), loadout]
      };
    }

    case getType(actions.savePreviousLoadout): {
      const { storeId, loadoutId, previousLoadout } = action.payload;
      let previousLoadouts = state.previousLoadouts[storeId] || [];
      const lastPreviousLoadout = _.last(previousLoadouts);
      previousLoadouts =
        lastPreviousLoadout && loadoutId === lastPreviousLoadout.id
          ? // Pop the previous loadout since we're reapplying it
            previousLoadouts.filter((l) => l.id !== loadoutId)
          : // Push the previous loadout
            [...previousLoadouts, previousLoadout];
      return {
        ...state,
        previousLoadouts: {
          ...state.previousLoadouts,
          [storeId]: previousLoadouts
        }
      };
    }

    default:
      return state;
  }
};

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. This converts the API
 * storage format to the old loadout format.
 */
function convertDimApiLoadoutToLoadout(
  platformMembershipId: string,
  destinyVersion: DestinyVersion,
  loadout: DimApiLoadout
): Loadout {
  return {
    id: loadout.id,
    classType: loadout.classType,
    name: loadout.name,
    clearSpace: loadout.clearSpace || false,
    membershipId: platformMembershipId,
    destinyVersion,
    items: [
      ...loadout.equipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, true)),
      ...loadout.unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false))
    ]
  };
}

/**
 * Converts DimApiLoadoutItem to real loadout items.
 */
export function convertDimApiLoadoutItemToLoadoutItem(
  item: DimApiLoadoutItem,
  equipped: boolean
): LoadoutItem {
  return {
    id: item.id || '0',
    hash: item.hash,
    amount: item.amount || 1,
    equipped
  };
}
