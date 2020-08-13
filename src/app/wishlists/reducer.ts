import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { getInventoryWishListRolls } from './wishlists';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { WishListAndInfo } from './types';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/selectors';

export const wishListsSelector = (state: RootState) => state.wishLists;

export const wishListsLastFetchedSelector = (state: RootState) =>
  wishListsSelector(state).lastFetched;

const wishListsByHashSelector = createSelector(wishListsSelector, (wls) =>
  _.groupBy(wls.wishListAndInfo.wishListRolls?.filter(Boolean), (r) => r.itemHash)
);

export const wishListsEnabledSelector = (state: RootState) =>
  (wishListsSelector(state)?.wishListAndInfo?.wishListRolls?.length || 0) > 0;

export const inventoryWishListsSelector = createSelector(
  storesSelector,
  wishListsByHashSelector,
  getInventoryWishListRolls
);

export interface WishListsState {
  loaded: boolean;
  wishListAndInfo: WishListAndInfo;
  lastFetched?: Date;
}

export type WishListAction = ActionType<typeof actions>;

const initialState: WishListsState = {
  loaded: false,
  wishListAndInfo: { title: undefined, description: undefined, wishListRolls: [] },
  lastFetched: undefined,
};

export const wishLists: Reducer<WishListsState, WishListAction> = (
  state: WishListsState = initialState,
  action: WishListAction
) => {
  switch (action.type) {
    case getType(actions.loadWishLists):
      return {
        ...state,
        wishListAndInfo: { ...initialState.wishListAndInfo, ...action.payload.wishListAndInfo },
        loaded: true,
        lastFetched: action.payload.lastFetched || new Date(),
      };
    case getType(actions.clearWishLists): {
      return {
        ...state,
        wishListAndInfo: {
          title: undefined,
          description: undefined,
          wishListRolls: [],
          source: '',
        },
        lastFetched: undefined,
        wishListSource: undefined,
        loaded: true,
      };
    }
    case getType(actions.touchWishLists): {
      return {
        ...state,
        lastFetched: new Date(),
      };
    }
    default:
      return state;
  }
};
