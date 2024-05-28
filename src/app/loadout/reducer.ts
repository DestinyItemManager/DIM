import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { Loadout } from './loadout-types';

export interface LoadoutsState {
  /** A stack of previous loadouts by character ID, for undo loadout. */
  readonly previousLoadouts: { [characterId: string]: Loadout[] };
  /** The currently selected store for the loadouts page. */
  readonly selectedLoadoutStoreId: string | undefined;
}

export type LoadoutsAction = ActionType<typeof actions>;

const initialState: LoadoutsState = {
  previousLoadouts: {},
  selectedLoadoutStoreId: undefined,
};

export const loadouts: Reducer<LoadoutsState, LoadoutsAction> = (
  state: LoadoutsState = initialState,
  action: LoadoutsAction,
): LoadoutsState => {
  switch (action.type) {
    case getType(actions.savePreviousLoadout): {
      const { storeId, loadoutId, previousLoadout } = action.payload;
      let previousLoadouts = state.previousLoadouts[storeId] || [];
      const lastPreviousLoadout = previousLoadouts.at(-1);
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

    case getType(actions.updateLoadoutStore): {
      return { ...state, selectedLoadoutStoreId: action.payload.storeId };
    }

    default:
      return state;
  }
};
