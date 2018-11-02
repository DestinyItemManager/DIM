import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { AccountsAction } from '../accounts/reducer';
import { Loadout } from './loadout.service';
import { RootState } from '../store/reducers';
import * as _ from 'lodash';

export const loadoutsSelector = (state: RootState) => state.loadouts.loadouts;
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

    case getType(actions.updateLoadout):
      const loadout = action.payload;
      return {
        ...state,
        loadouts: [...state.loadouts.filter((l) => l.id !== loadout.id), loadout]
      };

    case getType(actions.savePreviousLoadout):
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

    default:
      return state;
  }
};
