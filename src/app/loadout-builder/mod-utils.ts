import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { canSwapEnergyFromUpgradeSpendTier } from 'app/loadout/armor-upgrade-utils';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory-stores/item-types';

/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export const doEnergiesMatch = (
  defs: D2ManifestDefinitions,
  mod: PluggableInventoryItemDefinition,
  item: DimItem,
  upgradeSpendTier: UpgradeSpendTier,
  lockItemEnergyType: boolean
) =>
  item.energy &&
  (!mod.plug.energyCost ||
    mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
    mod.plug.energyCost.energyType === item.energy.energyType ||
    canSwapEnergyFromUpgradeSpendTier(defs, upgradeSpendTier, item, lockItemEnergyType));

/**
 * Checks to see if some mod in a collection of LockedMod or LockedMod,
 * has an elemental (non-Any) energy requirement
 */
export function someModHasEnergyRequirement(mods: PluggableInventoryItemDefinition[]) {
  return mods.some(
    (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
  );
}
