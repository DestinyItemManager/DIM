import {
  Loadout as DimApiLoadout,
  LoadoutItem as DimApiLoadoutItem,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { currentProfileSelector } from 'app/dim-api/selectors';
import { AssumeArmorMasterwork, LockArmorEnergyType } from 'app/loadout-builder/types';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import { createSelector } from 'reselect';
import { Loadout, LoadoutItem } from './loadout-types';

/** All loadouts relevant to the current account */
export const loadoutsSelector = createSelector(
  (state: RootState) => currentProfileSelector(state)?.loadouts,
  (loadouts) =>
    loadouts
      ? Object.values(loadouts).map((loadout) => convertDimApiLoadoutToLoadout(loadout))
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
function convertDimApiLoadoutToLoadout(loadout: DimApiLoadout): Loadout {
  const { equipped, unequipped, clearSpace, parameters, ...rest } = loadout;
  return {
    ...rest,
    parameters: migrateUpgradeSpendTierAndLockItemEnergy(parameters),
    clearSpace: clearSpace || false,
    items: [
      ...equipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, true)),
      ...unequipped.map((i) => convertDimApiLoadoutItemToLoadoutItem(i, false)),
    ],
  };
}

function migrateUpgradeSpendTierAndLockItemEnergy(parameters: DimApiLoadout['parameters']): {
  assumeArmorMasterwork: AssumeArmorMasterwork;
  lockArmorEnergyType: LockArmorEnergyType;
} {
  const migrated = { ...parameters };
  const { upgradeSpendTier, lockItemEnergyType } = migrated;

  delete migrated.upgradeSpendTier;
  delete migrated.lockItemEnergyType;

  switch (upgradeSpendTier) {
    case UpgradeSpendTier.AscendantShards:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
        lockArmorEnergyType: lockItemEnergyType
          ? LockArmorEnergyType.All
          : LockArmorEnergyType.None,
      };
    case UpgradeSpendTier.AscendantShardsNotExotic:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.Legendary,
        lockArmorEnergyType: lockItemEnergyType
          ? LockArmorEnergyType.All
          : LockArmorEnergyType.None,
      };
    case UpgradeSpendTier.AscendantShardsNotMasterworked:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
        lockArmorEnergyType: lockItemEnergyType
          ? LockArmorEnergyType.All
          : LockArmorEnergyType.Masterworked,
      };
    case UpgradeSpendTier.AscendantShardsLockEnergyType:
    case UpgradeSpendTier.EnhancementPrisms:
    case UpgradeSpendTier.LegendaryShards:
    case UpgradeSpendTier.Nothing:
    default:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.None,
        lockArmorEnergyType: lockItemEnergyType
          ? LockArmorEnergyType.All
          : LockArmorEnergyType.None,
      };
  }
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
    socketOverrides: item.socketOverrides,
    equipped,
  };
}
