import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { getInventoryWishListRolls } from './wishlists';
import { RootState, ThunkResult } from '../store/reducers';
import _ from 'lodash';
import { observeStore } from '../utils/redux-utils';
import { set, get } from 'idb-keyval';
import { WishListAndInfo } from './types';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';

const wishListsSelector = (state: RootState) => state.wishLists;

const wishListsByHashSelector = createSelector(
  wishListsSelector,
  (cais) => _.groupBy(cais.wishListAndInfo.wishListRolls.filter(Boolean), (r) => r.itemHash)
);

export const wishListsEnabledSelector = (state: RootState) =>
  wishListsSelector(state).wishListAndInfo.wishListRolls.length > 0;

export const inventoryWishListsSelector = createSelector(
  storesSelector,
  wishListsByHashSelector,
  getInventoryWishListRolls
);

export interface WishListsState {
  loaded: boolean;
  wishListAndInfo: WishListAndInfo;
}

export type WishListAction = ActionType<typeof actions>;

const initialState: WishListsState = {
  loaded: false,
  wishListAndInfo: { title: undefined, description: undefined, wishListRolls: [] }
};

export const wishLists: Reducer<WishListsState, WishListAction> = (
  state: WishListsState = initialState,
  action: WishListAction
) => {
  switch (action.type) {
    case getType(actions.loadWishLists):
      return {
        ...state,
        wishListAndInfo: action.payload,
        loaded: true
      };
    case getType(actions.clearWishLists): {
      return {
        ...state,
        wishListAndInfo: {
          title: undefined,
          description: undefined,
          wishListRolls: []
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
        set('wishlist', nextState.wishListAndInfo);
      }
    }
  );
}

export function loadWishListAndInfoFromIndexedDB(): ThunkResult<Promise<void>> {
  return async (dispatch, getState) => {
    if (!getState().wishLists.loaded) {
      const curationsAndInfo = await get<WishListsState['wishListAndInfo']>('wishlist');

      // easing the transition from the old state (just an array) to the new state
      // (object containing an array)
      if (Array.isArray(curationsAndInfo)) {
        dispatch(
          actions.loadWishLists({
            title: undefined,
            description: undefined,
            wishListRolls: curationsAndInfo
          })
        );

        return;
      }

      dispatch(
        actions.loadWishLists(
          curationsAndInfo || {
            title: undefined,
            description: undefined,
            wishListRolls: []
          }
        )
      );
    }
  };
}
