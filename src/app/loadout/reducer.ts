import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { currentAccountSelector } from '../accounts/reducer';
import { Loadout, classTypeToLoadoutClass } from './loadout-types';
import { RootState } from '../store/reducers';
import _ from 'lodash';
import { createSelector } from 'reselect';
import {
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
  DestinyVersion
} from '@destinyitemmanager/dim-api-types';
import { StoreServiceType } from 'app/inventory/store-types';
import copy from 'fast-copy';
import { DimItem } from 'app/inventory/item-types';
import { D2StoresService } from 'app/inventory/d2-stores';
import { D1StoresService } from 'app/inventory/d1-stores';
import { currentProfileSelector } from 'app/dim-api/selectors';

const EMPTY_ARRAY = [];

const reportOldLoadout = _.once(() => ga('send', 'event', 'Loadouts', 'No Membership ID'));

/** All loadouts relevant to the current account */
export const loadoutsSelector = $featureFlags.dimApi
  ? createSelector(
      currentAccountSelector,
      currentProfileSelector,
      (currentAccount, profile) =>
        profile?.loadouts?.map((loadout) =>
          convertDimApiLoadoutToLoadout(
            currentAccount!.membershipId,
            currentAccount!.destinyVersion,
            loadout
          )
        ) || EMPTY_ARRAY
    )
  : createSelector(
      (state: RootState) => state.loadouts.loadouts,
      currentAccountSelector,
      (allLoadouts, currentAccount) =>
        currentAccount
          ? allLoadouts.filter((loadout) => {
              if (loadout.membershipId !== undefined) {
                return loadout.membershipId === currentAccount.membershipId;
              } else if (loadout.platform !== undefined) {
                reportOldLoadout();
                if (loadout.platform === currentAccount.platformLabel) {
                  // Take this opportunity to fix up the membership ID
                  loadout.membershipId = currentAccount.membershipId;
                  return true;
                } else {
                  return false;
                }
              } else {
                return true;
              }
            })
          : EMPTY_ARRAY
    );
export const previousLoadoutSelector = (state: RootState, storeId: string): Loadout | undefined => {
  if (state.loadouts.previousLoadouts[storeId]) {
    return _.last(state.loadouts.previousLoadouts[storeId]);
  }
  return undefined;
};

export interface LoadoutsState {
  readonly loadouts: Loadout[];
  /** A stack of previous loadouts by character ID, for undo loadout. */
  readonly previousLoadouts: { [characterId: string]: Loadout[] };
}

export type LoadoutsAction = ActionType<typeof actions>;

const initialState: LoadoutsState = {
  loadouts: [],
  previousLoadouts: {}
};

export const loadouts: Reducer<LoadoutsState, LoadoutsAction> = (
  state: LoadoutsState = initialState,
  action: LoadoutsAction
) => {
  switch (action.type) {
    case getType(actions.loaded):
      return {
        ...state,
        loadouts: action.payload
      };

    case getType(actions.deleteLoadout):
      return {
        ...state,
        loadouts: state.loadouts.filter((l) => l.id !== action.payload)
      };

    case getType(actions.updateLoadout): {
      const loadout = action.payload;
      return {
        ...state,
        loadouts: [...state.loadouts.filter((l) => l.id !== loadout.id), loadout]
      };
    }

    case getType(actions.savePreviousLoadout): {
      const { storeId, loadoutId, previousLoadout } = action.payload;
      let previousLoadouts = state.previousLoadouts[storeId] || [];
      const lastPreviousLoadout = _.last(previousLoadouts);
      previousLoadouts =
        lastPreviousLoadout && loadoutId === lastPreviousLoadout.id
          ? // Pop the previous loadout since we're reapplying it
            previousLoadouts.filter((l) => l.id !== loadoutId)
          : // Push the previous loadout
            [...previousLoadouts, previousLoadout];
      return {
        ...state,
        previousLoadouts: {
          ...state.previousLoadouts,
          [storeId]: previousLoadouts
        }
      };
    }

    default:
      return state;
  }
};

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. This converts the API
 * storage format to the old loadout format.
 */
function convertDimApiLoadoutToLoadout(
  platformMembershipId: string,
  destinyVersion: DestinyVersion,
  loadout: DimApiLoadout
): Loadout {
  const result: Loadout = {
    id: loadout.id,
    classType: classTypeToLoadoutClass[loadout.classType],
    name: loadout.name,
    clearSpace: loadout.clearSpace || false,
    membershipId: platformMembershipId,
    destinyVersion,
    items: {
      unknown: []
    }
  };

  // It'll be great to stop using this stuff
  const storesService = getStoresService(destinyVersion);
  convertItemsToLoadoutItems(storesService, result, loadout.equipped, true);
  convertItemsToLoadoutItems(storesService, result, loadout.unequipped, false);
  return result;
}

function convertItemsToLoadoutItems(
  storesService: StoreServiceType,
  result: Loadout,
  items: DimApiLoadoutItem[],
  equipped: boolean
) {
  for (const item of items) {
    const LoadoutItem = copy(
      storesService.getItemAcrossStores({
        id: item.id || '0',
        hash: item.hash
      })
    );

    if (LoadoutItem) {
      const discriminator = LoadoutItem.type.toLowerCase();
      LoadoutItem.equipped = equipped;
      LoadoutItem.amount = item.amount || 1;

      result.items[discriminator] = result.items[discriminator] || [];
      result.items[discriminator].push(LoadoutItem);
    } else {
      const loadoutItem = {
        id: item.id || '0',
        hash: item.hash,
        amount: item.amount,
        equipped
      };

      result.items.unknown.push(loadoutItem as DimItem);
    }
  }
}

function getStoresService(destinyVersion) {
  // TODO: this needs to use account, store, or item version
  return destinyVersion === 2 ? D2StoresService : D1StoresService;
}
