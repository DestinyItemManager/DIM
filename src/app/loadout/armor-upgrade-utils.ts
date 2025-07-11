import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ArmorEnergyRules } from 'app/loadout-builder/types';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import { isArtifice } from 'app/utils/item-utils';

/**
 * Gets the max energy we can use on this item, based on its current energy
 * level and the passed in ArmorEnergyRules that allow us to pretend the item
 * has more energy.
 */
export function calculateAssumedItemEnergy(
  item: DimItem,
  { assumeArmorMasterwork, minItemEnergy }: ArmorEnergyRules,
) {
  if (!item.energy) {
    return 0;
  }
  const itemEnergy = item.energy.energyCapacity;
  const assumedEnergy =
    assumeArmorMasterwork === AssumeArmorMasterwork.All ||
    assumeArmorMasterwork === AssumeArmorMasterwork.ArtificeExotic ||
    (assumeArmorMasterwork === AssumeArmorMasterwork.Legendary && !item.isExotic)
      ? // TODO: Edge of Fate: Tier 5 armor can have 11 energy - would be great if
        // we could read this from the item's energy info.
        MAX_ARMOR_ENERGY_CAPACITY
      : minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}

/**
 * as of TFS, [relevant, modern] exotics can use artifice stat mods, if the user pays to enhance the armor
 */
export function isAssumedArtifice(item: DimItem, { assumeArmorMasterwork }: ArmorEnergyRules) {
  return (
    (item.isExotic &&
      item.energy &&
      assumeArmorMasterwork === AssumeArmorMasterwork.ArtificeExotic) ||
    isArtifice(item)
  );
}
