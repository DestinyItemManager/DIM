import { isArmorEnergyLocked } from 'app/loadout/armor-upgrade-utils';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { LockArmorEnergyType } from '../loadout-builder/types';
/**
 * Checks that:
 *   1. The armour piece is Armour 2.0
 *   2. The mod matches the Armour energy OR the mod has the any Energy type
 */
export function doEnergiesMatch(
  mod: PluggableInventoryItemDefinition,
  item: DimItem,
  lockArmorEnergyType?: LockArmorEnergyType
) {
  return (
    item.energy &&
    (!mod.plug.energyCost ||
      mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
      mod.plug.energyCost.energyType === item.energy.energyType ||
      !isArmorEnergyLocked(item, lockArmorEnergyType))
  );
}

/**
 * Checks to see if some mod in a collection of LockedMod or LockedMod,
 * has an elemental (non-Any) energy requirement
 */
export function someModHasEnergyRequirement(mods: PluggableInventoryItemDefinition[]) {
  return mods.some(
    (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
  );
}
