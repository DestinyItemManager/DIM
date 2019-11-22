import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { AccountsAction, currentAccountSelector } from '../accounts/reducer';
import { Loadout } from './loadout-types';
import { RootState } from '../store/reducers';
import _ from 'lodash';
import { createSelector } from 'reselect';

const EMPTY_ARRAY = [];

// TODO: Enable this once the membership ID saving code has been out a while, so we can track how often it happens.
// const reportOldLoadout = _.once(() => ga('send', 'event', 'Loadouts', 'No Membership ID'));

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => state.loadouts.loadouts,
  currentAccountSelector,
  (allLoadouts, currentAccount) =>
    currentAccount
      ? allLoadouts.filter((loadout) => {
          if (loadout.membershipId !== undefined) {
            return loadout.membershipId === currentAccount.membershipId;
          } else if (loadout.platform !== undefined) {
            // reportOldLoadout();
            if (loadout.platform === currentAccount.platformLabel) {
              // Take this opportunity to fix up the membership ID
              loadout.membershipId = currentAccount.membershipId;
              return true;
            } else {
              return false;
            }
          } else {
            return true;
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

export const loadouts: Reducer<LoadoutsState, LoadoutsAction | AccountsAction> = (
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
