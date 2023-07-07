import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ArmorEnergyRules } from 'app/loadout-builder/types';

/**
 * Gets the max energy we can use on this item, based on its current energy
 * level and the passed in ArmorEnergyRules that allow us to pretend the item
 * has more energy.
 */
export function calculateAssumedItemEnergy(
  item: DimItem,
  { assumeArmorMasterwork, minItemEnergy }: ArmorEnergyRules
) {
  if (!item.energy) {
    return 0;
  }
  const itemEnergy = item.energy.energyCapacity;
  const assumedEnergy =
    assumeArmorMasterwork === AssumeArmorMasterwork.All ||
    (assumeArmorMasterwork === AssumeArmorMasterwork.Legendary && !item.isExotic)
      ? 10
      : minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}
