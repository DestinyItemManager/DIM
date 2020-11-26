import { Destiny2CoreSettings } from 'bungie-api-ts/core/interfaces';
import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import type { AccountsAction } from '../accounts/reducer';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import * as actions from './actions';

export interface ManifestState {
  d1Manifest?: D1ManifestDefinitions;
  d2Manifest?: D2ManifestDefinitions;

  /**
   * Bungie.net core Destiny settings.
   * We load these remotely, and they're in the "manifest" state because I mostly think they
   * should have been included in the manifest.
   */
  destiny2CoreSettings?: Destiny2CoreSettings;
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

    case getType(actions.coreSettingsLoaded): {
      return {
        ...state,
        destiny2CoreSettings: action.payload,
      };
    }

    default:
      return state;
  }
};
