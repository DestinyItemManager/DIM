import {
  DestinyVersion,
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
} from '@destinyitemmanager/dim-api-types';
import { currentAccountSelector } from 'app/accounts/selectors';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { Loadout, LoadoutItem } from './loadout-types';

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  currentAccountSelector,
  currentProfileSelector,
  (currentAccount, profile) =>
    profile && currentAccount
      ? Object.values(profile.loadouts).map((loadout) =>
          convertDimApiLoadoutToLoadout(
            currentAccount.membershipId,
            currentAccount.destinyVersion,
            loadout
          )
        )
      : emptyArray<Loadout>()
);
export const previousLoadoutSelector = (state: RootState, storeId: string): Loadout | undefined => {
  if (state.loadouts.previousLoadouts[storeId]) {
    return _.last(state.loadouts.previousLoadouts[storeId]);
  }
  return undefined;
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
  return {
    id: loadout.id,
    classType: loadout.classType,
    name: loadout.name,
    clearSpace: loadout.clearSpace || false,
    membershipId: platformMembershipId,
    destinyVersion,
    items: [
      ...loadout.equipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, true)),
      ...loadout.unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false)),
    ],
    parameters: loadout.parameters,
  };
}

/**
 * Converts DimApiLoadoutItem to real loadout items.
 */
export function convertDimApiLoadoutItemToLoadoutItem(
  item: DimApiLoadoutItem,
  equipped: boolean
): LoadoutItem {
  return {
    id: item.id || '0',
    hash: item.hash,
    amount: item.amount || 1,
    equipped,
  };
}
