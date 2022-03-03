import { XurLocation } from '@d2api/d2api-types';
import { setCurrentAccount } from 'app/accounts/actions';
import type { AccountsAction } from 'app/accounts/reducer';
import { DestinyVendorsResponse } from 'bungie-api-ts/destiny2';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from './actions';

// TODO: This may really belong in InventoryState
// TODO: Save to IDB?
export interface VendorsState {
  vendorsByCharacter: {
    [characterId: string]: {
      vendorsResponse?: DestinyVendorsResponse;
      lastLoaded?: Date;
      error?: Error;
    };
  };

  xurLocation?: XurLocation;
}

export type VendorsAction = ActionType<typeof actions>;

const initialState: VendorsState = {
  vendorsByCharacter: {},
};

export const vendors: Reducer<VendorsState, VendorsAction | AccountsAction> = (
  state: VendorsState = initialState,
  action: VendorsAction | AccountsAction
) => {
  switch (action.type) {
    case getType(actions.loadedAll): {
      const { characterId, vendorsResponse } = action.payload;
      return {
        ...state,
        vendorsByCharacter: {
          ...state.vendorsByCharacter,
          [characterId]: {
            vendorsResponse: vendorsResponse,
            lastLoaded: new Date(),
            error: undefined,
          },
        },
      };
    }

    case getType(actions.loadedError): {
      const { characterId, error } = action.payload;
      return {
        ...state,
        vendorsByCharacter: {
          ...state.vendorsByCharacter,
          [characterId]: {
            ...state.vendorsByCharacter[characterId],
            error,
          },
        },
      };
    }

    case getType(actions.loadedXur): {
      return {
        ...state,
        xurLocation: action.payload,
      };
    }

    case getType(setCurrentAccount):
      return initialState;

    default:
      return state;
  }
};
