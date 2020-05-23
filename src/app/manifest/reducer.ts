import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { AccountsAction } from '../accounts/reducer';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

export interface ManifestState {
  d1Manifest?: D1ManifestDefinitions;
  d2Manifest?: D2ManifestDefinitions;
}

export type ManifestAction = ActionType<typeof actions>;

const initialState: ManifestState = {};

export const manifest: Reducer<ManifestState, ManifestAction | AccountsAction> = (
  state: ManifestState = initialState,
  action: ManifestAction
) => {
  switch (action.type) {
    case getType(actions.setD1Manifest): {
      return {
        ...state,
        d1Manifest: action.payload,
      };
    }

    case getType(actions.setD2Manifest): {
      return {
        ...state,
        d2Manifest: action.payload,
      };
    }

    default:
      return state;
  }
};
