import {
  AssumeArmorMasterwork,
  Loadout,
  LoadoutItem,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { emptyObject } from 'app/utils/empty';
import { DestinyLoadoutComponent, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import {
  Loadout as DimLoadout,
  LoadoutItem as DimLoadoutItem,
  InGameLoadout,
} from './loadout-types';

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
  if (item.craftedDate) {
    result.craftedDate = item.craftedDate;
  }
  return result;
}

function migrateUpgradeSpendTierAndLockItemEnergy(
  parameters: DimLoadout['parameters']
): DimLoadout['parameters'] {
  const migrated = { ...parameters };
  const { upgradeSpendTier, assumeArmorMasterwork, lockArmorEnergyType } = migrated;

  delete migrated.upgradeSpendTier;
  delete migrated.lockItemEnergyType;
  delete migrated.lockArmorEnergyType;
  delete migrated.assumeMasterworked;

  if (assumeArmorMasterwork || lockArmorEnergyType) {
    return migrated;
  }

  switch (upgradeSpendTier) {
    case UpgradeSpendTier.AscendantShards:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      };
    case UpgradeSpendTier.AscendantShardsNotExotic:
    case UpgradeSpendTier.AscendantShardsNotMasterworked:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.Legendary,
      };
    case UpgradeSpendTier.AscendantShardsLockEnergyType:
    case UpgradeSpendTier.EnhancementPrisms:
    case UpgradeSpendTier.LegendaryShards:
    case UpgradeSpendTier.Nothing:
    default:
      return {
        ...migrated,
        assumeArmorMasterwork: AssumeArmorMasterwork.None,
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
    ...item,
    id: item.id || '0',
    amount: item.amount || 1,
    equip: equipped,
  };
}

export const processInGameLoadouts = (
  profileResponse: DestinyProfileResponse,
  defs: D2ManifestDefinitions
): { [characterId: string]: InGameLoadout[] } => {
  const characterLoadouts = profileResponse?.characterLoadouts?.data;
  if (characterLoadouts) {
    return _.mapValues(characterLoadouts, (c, characterId) =>
      _.compact(
        c.loadouts.map((l, i) =>
          convertDestinyLoadoutComponentToInGameLoadout(l, i, characterId, defs)
        )
      )
    );
  }
  return emptyObject();
};

/**
 * Given what the API returns for loadouts, return an enhanced object that tells us a little more about the loadout.
 */
function convertDestinyLoadoutComponentToInGameLoadout(
  loadoutComponent: DestinyLoadoutComponent,
  index: number,
  characterId: string,
  defs: D2ManifestDefinitions
): InGameLoadout | undefined {
  const name = defs.LoadoutName.get(loadoutComponent.nameHash)?.name ?? 'Unknown';
  const colorIcon = defs.LoadoutColor.get(loadoutComponent.colorHash)?.colorImagePath ?? '';
  const icon = defs.LoadoutIcon.get(loadoutComponent.iconHash)?.iconImagePath ?? '';

  if (
    loadoutComponent.items === undefined ||
    loadoutComponent.items.length === 0 ||
    loadoutComponent.items.every((i) => i.itemInstanceId === '0')
  ) {
    return undefined;
  }

  return {
    ...loadoutComponent,
    characterId,
    index,
    name,
    colorIcon,
    icon,
    id: `ingame-${characterId}-${index}`,
  };
}
