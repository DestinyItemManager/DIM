import _ from 'lodash';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { Loadout } from './loadout-types';

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
