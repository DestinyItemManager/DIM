import {
  AssumeArmorMasterwork,
  Loadout,
  LoadoutItem,
  LockArmorEnergyType,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { Loadout as DimLoadout, LoadoutItem as DimLoadoutItem } from './loadout-types';

/**
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. These functions convert
 * back and forth.
 */
export function convertDimLoadoutToApiLoadout(dimLoadout: DimLoadout): Loadout {
  const { items, name, clearSpace, parameters, ...rest } = dimLoadout;
  const equipped = items.filter((i) => i.equip).map(convertDimLoadoutItemToLoadoutItem);
  const unequipped = items.filter((i) => !i.equip).map(convertDimLoadoutItemToLoadoutItem);

  const loadout: Loadout = {
    ...rest,
    name: name.trim(),
    clearSpace: clearSpace || false,
    parameters: migrateUpgradeSpendTierAndLockItemEnergy(parameters),
    equipped,
    unequipped,
    lastUpdatedAt: Date.now(),
  };
  if (!loadout.notes) {
    delete loadout.notes;
  }
  return loadout;
}

function convertDimLoadoutItemToLoadoutItem(item: DimLoadoutItem): LoadoutItem {
  const result: LoadoutItem = {
    hash: item.hash,
  };
  if (item.id && item.id !== '0') {
    result.id = item.id;
  }
  if (item.amount > 1) {
    result.amount = item.amount;
  }
  if (item.socketOverrides) {
    result.socketOverrides = item.socketOverrides;
  }
  return result;
}

function migrateUpgradeSpendTierAndLockItemEnergy(parameters: DimLoadout['parameters']): {
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
 * DIM API stores loadouts in a new format, but the app still uses the old format everywhere. This converts the API
 * storage format to the old loadout format.
 */
export function convertDimApiLoadoutToLoadout(loadout: Loadout): DimLoadout {
  const { equipped = [], unequipped = [], clearSpace, parameters, ...rest } = loadout;
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

/**
 * Converts DimApiLoadoutItem to real loadout items.
 */
function convertDimApiLoadoutItemToLoadoutItem(
  item: LoadoutItem,
  equipped: boolean
): DimLoadoutItem {
  return {
    id: item.id || '0',
    hash: item.hash,
    amount: item.amount || 1,
    socketOverrides: item.socketOverrides,
    equip: equipped,
  };
}
