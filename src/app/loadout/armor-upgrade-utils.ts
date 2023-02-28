import { AssumeArmorMasterwork } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { ArmorEnergyRules } from 'app/loadout-builder/types';

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function calculateAssumedItemEnergy(
  item: DimItem,
  { assumeArmorMasterwork, minItemEnergy }: ArmorEnergyRules
) {
  const itemEnergy = item.energy?.energyCapacity || minItemEnergy;
  const assumedEnergy =
    assumeArmorMasterwork === AssumeArmorMasterwork.All ||
    (assumeArmorMasterwork === AssumeArmorMasterwork.Legendary && !item.isExotic)
      ? 10
      : minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}
