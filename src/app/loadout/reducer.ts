import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { currentAccountSelector } from 'app/accounts/selectors';
import { Loadout, LoadoutItem } from './loadout-types';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { createSelector } from 'reselect';
import {
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
  DestinyVersion,
} from '@destinyitemmanager/dim-api-types';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { emptyArray } from 'app/utils/empty';

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  currentAccountSelector,
  currentProfileSelector,
  (currentAccount, profile) =>
    profile
      ? Object.values(profile.loadouts).map((loadout) =>
          convertDimApiLoadoutToLoadout(
            currentAccount!.membershipId,
            currentAccount!.destinyVersion,
            loadout
          )
        )
      : emptyArray<Loadout>()
);
export const previousLoadoutSelector = (state: RootState, storeId: string): Loadout | undefined => {
  if (state.loadouts.previousLoadouts[storeId]) {
    return _.last(state.loadouts.previousLoadouts[storeId]);
  }
  return undefined;
};

export interface LoadoutsState {
  /** A stack of previous loadouts by character ID, for undo loadout. */
  readonly previousLoadouts: { [characterId: string]: Loadout[] };
}

export type LoadoutsAction = ActionType<typeof actions>;

const initialState: LoadoutsState = {
  previousLoadouts: {},
};

export const loadouts: Reducer<LoadoutsState, LoadoutsAction> = (
  state: LoadoutsState = initialState,
  action: LoadoutsAction
) => {
  switch (action.type) {
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
          [storeId]: previousLoadouts,
        },
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
      ...loadout.unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false)),
    ],
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
    equipped,
  };
}
