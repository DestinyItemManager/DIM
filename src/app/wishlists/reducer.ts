import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';
import { WishListAndInfo } from './types';

export interface WishListsState {
  loaded: boolean;
  wishListAndInfo: WishListAndInfo;
  lastFetched?: Date;
}

export type WishListAction = ActionType<typeof actions>;

const initialState: WishListsState = {
  loaded: false,
  wishListAndInfo: { infos: [], wishListRolls: [] },
  lastFetched: undefined,
};

export const wishLists: Reducer<WishListsState, WishListAction> = (
  state: WishListsState = initialState,
  action: WishListAction,
): WishListsState => {
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
          infos: [],
          wishListRolls: [],
          source: '',
        },
        lastFetched: undefined,
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
