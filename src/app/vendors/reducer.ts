import { LimitedDestinyVendorsResponse } from 'app/bungie-api/destiny2-api';
import _ from 'lodash';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import { setCurrentAccount } from '../accounts/actions';
import type { AccountsAction } from '../accounts/reducer';
import * as actions from './actions';

// TODO: This may really belong in InventoryState
// TODO: Save to IDB?
export interface VendorsState {
  vendorsByCharacter: Partial<{
    [characterId: string]: {
      vendorsResponse?: LimitedDestinyVendorsResponse;
      /** ms epoch time */
      lastLoaded?: number;
      error?: Error;
    };
  }>;
  showUnacquiredOnly: boolean;
}

export type VendorsAction = ActionType<typeof actions>;

const initialState: VendorsState = {
  vendorsByCharacter: {},
  showUnacquiredOnly: false,
};

export const vendors: Reducer<VendorsState, VendorsAction | AccountsAction> = (
  state: VendorsState = initialState,
  action: VendorsAction | AccountsAction,
): VendorsState => {
  switch (action.type) {
    case getType(actions.loadedAll): {
      const { characterId, vendorsResponse } = action.payload;
      return {
        ...state,
        vendorsByCharacter: {
          ...state.vendorsByCharacter,
          [characterId]: {
            vendorsResponse: vendorsResponse,
            lastLoaded: Date.now(),
            error: undefined,
          },
        },
      };
    }

    // augments the storedoverall all-vendors response,
    // by inserting the item components from a single-vendor api response
    case getType(actions.loadedSingle): {
      const { characterId, vendorResponse, vendorHash } = action.payload;
      const { vendorsByCharacter } = state;
      const oldVendorsResponse = vendorsByCharacter[characterId]?.vendorsResponse;

      // nothing about state needs changing if we didn't get back components
      // (maybe sockets/etc are disabled at bnet right now?)
      if (_.isEmpty(vendorResponse.itemComponents) || !oldVendorsResponse) {
        return state;
      }

      const newItemComponents = vendorResponse.itemComponents; // big combined set, keyed by vendor hash
      const existingItemComponents = oldVendorsResponse?.itemComponents; // set for a single vendor
      const itemComponents = { ...existingItemComponents, [vendorHash]: newItemComponents }; // big set again

      return {
        ...state,
        vendorsByCharacter: {
          ...vendorsByCharacter,
          [characterId]: {
            vendorsResponse: { ...oldVendorsResponse, itemComponents },
            lastLoaded: Date.now(),
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

    case getType(actions.setShowUnacquiredOnly): {
      return { ...state, showUnacquiredOnly: action.payload };
    }

    case getType(setCurrentAccount):
      return initialState;

    default:
      return state;
  }
};
