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

const curationsSelector = (state: RootState) => state.curations.curationsAndInfo;

const curationsByHashSelector = createSelector(
  curationsSelector,
  (curationsAndInfo) => _.groupBy(curationsAndInfo.curatedRolls, (r) => r.itemHash)
);
export const curationsEnabledSelector = (state: RootState) =>
  curationsSelector(state).curatedRolls.length > 0;
export const inventoryCuratedRollsSelector = createSelector(
  storesSelector,
  curationsByHashSelector,
  getInventoryCuratedRolls
);

export interface CurationsState {
  loaded: boolean;
  curationsAndInfo: {
    description: string | undefined;
    title: string | undefined;
    curatedRolls: CuratedRoll[];
  };
}

export type CurationsAction = ActionType<typeof actions>;

const initialState: CurationsState = {
  loaded: false,
  curationsAndInfo: {
    description: undefined,
    title: undefined,
    curatedRolls: []
  }
};

export const curations: Reducer<CurationsState, CurationsAction> = (
  state: CurationsState = initialState,
  action: CurationsAction
) => {
  switch (action.type) {
    case getType(actions.loadCurationsAndInfo):
      return {
        ...state,
        curationsAndInfo: action.payload,
        loaded: true
      };
    case getType(actions.clearCurationsAndInfo): {
      return {
        ...state,
        curationsAndInfo: {
          description: undefined,
          title: undefined,
          curatedRolls: []
        }
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
        set('wishlist', nextState.curationsAndInfo.curatedRolls);
      }
    }
  );
}

export function loadCurationsFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().curations.loaded) {
      const curationsAndInfo = await get<CurationsState['curationsAndInfo']>('wishlist');
      dispatch(
        actions.loadCurationsAndInfo(
          curationsAndInfo || {
            curatedRolls: []
          }
        )
      );
    }
  };
}
