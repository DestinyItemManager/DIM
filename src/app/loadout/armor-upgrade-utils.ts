import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ArmorEnergyRules } from 'app/loadout-builder/types';
import { maxEnergyCapacity } from 'app/search/d2-known-values';
import { isArtifice, isEdgeOfFateArmorMasterwork } from 'app/utils/item-utils';

/**
 * Gets the max energy we can use on this item, based on its current energy
 * level and the passed in ArmorEnergyRules that allow us to pretend the item
 * has more energy.
 */
export function calculateAssumedItemEnergy(item: DimItem, armorEnergyRules: ArmorEnergyRules) {
  if (!item.energy) {
    return 0;
  }
  // Note: Since Edge of Fate, all new armor drops at max energy.
  const itemEnergy = item.energy.energyCapacity;
  const assumedEnergy = isAssumedMasterworked(item, armorEnergyRules)
    ? maxEnergyCapacity(item)
    : armorEnergyRules.minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}

/**
 * As of TFS, [relevant, modern] exotics could be upgraded to have an artifice
 * mod slot. As of Edge of Fate / Armor 3.0, all new drops of exotics *cannot*
 * be enhanced to have artifice stats, and exotic class items have been stripped
 * of their artifice stat slot.
 */
export function isAssumedArtifice(item: DimItem, { assumeArmorMasterwork }: ArmorEnergyRules) {
  return (
    (item.isExotic &&
      item.energy &&
      assumeArmorMasterwork === AssumeArmorMasterwork.ArtificeExotic &&
      !isEdgeOfFateArmorMasterwork(item)) ||
    isArtifice(item)
  );
}

/**
 * Does the armor energy rules mean that this item is assumed to be masterworked?
 */
export function isAssumedMasterworked(item: DimItem, { assumeArmorMasterwork }: ArmorEnergyRules) {
  return (
    assumeArmorMasterwork === AssumeArmorMasterwork.All ||
    assumeArmorMasterwork === AssumeArmorMasterwork.ArtificeExotic ||
    (assumeArmorMasterwork === AssumeArmorMasterwork.Legendary && !item.isExotic)
  );
}
