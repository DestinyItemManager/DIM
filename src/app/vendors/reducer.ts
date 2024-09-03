import { LimitedDestinyVendorsResponse } from 'app/bungie-api/destiny2-api';
import { produce } from 'immer';
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
      // retain old components so that items don't go back to claiming "no perks or stats"
      // loadedAll being kicked off means that fresh component data is on its way and will replace the old stuff.
      const oldItemComponents =
        state.vendorsByCharacter[characterId]?.vendorsResponse?.itemComponents;

      return produce(state, (draft) => {
        draft.vendorsByCharacter[characterId] = {
          vendorsResponse: vendorsResponse,
          lastLoaded: Date.now(),
          error: undefined,
        };
        if (oldItemComponents) {
          draft.vendorsByCharacter[characterId].vendorsResponse!.itemComponents = oldItemComponents;
        }
      });
    }

    // augments the stored overall all-vendors response,
    // by inserting the item components from a single-vendor api response
    case getType(actions.loadedVendorComponents): {
      const { characterId, vendorResponses } = action.payload;

      return produce(state, (draft) => {
        for (const [vendorHash, vendorResponse] of vendorResponses) {
          const thisCharVendorState = draft.vendorsByCharacter[characterId];

          if (
            // nothing about state needs changing if we didn't get back components
            // (maybe sockets/etc are disabled at bnet right now?)
            _.isEmpty(vendorResponse.itemComponents) ||
            // or if there's no main response to inject these components into
            !thisCharVendorState?.vendorsResponse
          ) {
            continue;
          }

          thisCharVendorState.vendorsResponse.itemComponents ??= {};
          thisCharVendorState.vendorsResponse.itemComponents[vendorHash] =
            vendorResponse.itemComponents;
          thisCharVendorState.lastLoaded = Date.now();
        }
      });
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
