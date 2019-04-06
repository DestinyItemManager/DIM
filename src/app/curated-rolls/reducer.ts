import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { getInventoryCuratedRolls } from './curatedRollService';
import { RootState, ThunkResult } from '../store/reducers';
import _ from 'lodash';
import { observeStore } from '../redux-utils';
import { set, get } from 'idb-keyval';
import { CuratedRoll } from './curatedRoll';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';

const curationsSelector = (state: RootState) => state.curations.curations;

const curationsByHashSelector = createSelector(
  curationsSelector,
  (curatedRolls) => _.groupBy(curatedRolls, (r) => r.itemHash)
);
export const curationsEnabledSelector = (state: RootState) => curationsSelector(state).length > 0;
export const inventoryCuratedRollsSelector = createSelector(
  storesSelector,
  curationsByHashSelector,
  getInventoryCuratedRolls
);

export interface CurationsState {
  loaded: boolean;
  curations: CuratedRoll[];
}

export type CurationsAction = ActionType<typeof actions>;

const initialState: CurationsState = {
  loaded: false,
  curations: []
};

export const curations: Reducer<CurationsState, CurationsAction> = (
  state: CurationsState = initialState,
  action: CurationsAction
) => {
  switch (action.type) {
    case getType(actions.loadCurations):
      return {
        ...state,
        curations: action.payload,
        loaded: true
      };
    case getType(actions.clearCurations): {
      return {
        ...state,
        curations: []
      };
    }
    default:
      return state;
  }
};

export function saveCurationsToIndexedDB() {
  return observeStore(
    (state) => state.curations,
    (_, nextState) => {
      if (nextState.loaded) {
        set('wishlist', nextState.curations);
      }
    }
  );
}

export function loadCurationsFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().curations.loaded) {
      const curations = await get<CurationsState['curations']>('wishlist');
      dispatch(actions.loadCurations(curations || []));
    }
  };
}
