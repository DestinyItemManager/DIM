import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { getInventoryCuratedRolls } from './curatedRollService';
import { RootState, ThunkResult } from '../store/reducers';
import _ from 'lodash';
import { observeStore } from '../redux-utils';
import { set, get } from 'idb-keyval';
import { CuratedRollsAndInfo } from './curatedRoll';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';

const wishListsSelector = (state: RootState) => state.wishLists;

const curationsByHashSelector = createSelector(
  wishListsSelector,
  (cais) => _.groupBy(cais.curationsAndInfo.curatedRolls, (r) => r && r.itemHash)
);
export const wishListsEnabledSelector = (state: RootState) =>
  wishListsSelector(state).curationsAndInfo.curatedRolls.length > 0;
export const inventoryCuratedRollsSelector = createSelector(
  storesSelector,
  curationsByHashSelector,
  getInventoryCuratedRolls
);

export interface WishListsState {
  loaded: boolean;
  curationsAndInfo: CuratedRollsAndInfo;
}

export type WishListAction = ActionType<typeof actions>;

const initialState: WishListsState = {
  loaded: false,
  curationsAndInfo: { title: undefined, description: undefined, curatedRolls: [] }
};

export const wishLists: Reducer<WishListsState, WishListAction> = (
  state: WishListsState = initialState,
  action: WishListAction
) => {
  switch (action.type) {
    case getType(actions.loadWishLists):
      return {
        ...state,
        curationsAndInfo: action.payload,
        loaded: true
      };
    case getType(actions.clearWishLists): {
      return {
        ...state,
        curationsAndInfo: {
          title: undefined,
          description: undefined,
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
    (state) => state.wishLists,
    (_, nextState) => {
      if (nextState.loaded) {
        set('wishlist', nextState.curationsAndInfo);
      }
    }
  );
}

export function loadCurationsFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().wishLists.loaded) {
      const curationsAndInfo = await get<WishListsState['curationsAndInfo']>('wishlist');

      // easing the transition from the old state (just an array) to the new state
      // (object containing an array)
      if (Array.isArray(curationsAndInfo)) {
        dispatch(
          actions.loadWishLists({
            title: undefined,
            description: undefined,
            curatedRolls: curationsAndInfo
          })
        );

        return;
      }

      dispatch(
        actions.loadWishLists(
          curationsAndInfo || {
            title: undefined,
            description: undefined,
            curatedRolls: []
          }
        )
      );
    }
  };
}
