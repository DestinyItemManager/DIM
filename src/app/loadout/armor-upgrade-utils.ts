import { DimItem } from 'app/inventory/item-types';

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function calculateAssumedItemEnergy(
  item: DimItem,
  assumeLegendaryMasterwork: boolean,
  assumeExoticMasterwork: boolean,
  minItemEnergy: number
) {
  const itemEnergy = item.energy?.energyCapacity || minItemEnergy;
  const assumedEnergy =
    (item.isExotic && assumeExoticMasterwork) || (!item.isExotic && assumeLegendaryMasterwork)
      ? 10
      : minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}

export function isArmorEnergyLocked({
  item,
  lockItemEnergyType,
  lockMasterworkItemEnergyType,
}: {
  item: DimItem;
  lockItemEnergyType: boolean;
  lockMasterworkItemEnergyType: boolean;
}) {
  return item.energy?.energyCapacity === 10 ? lockMasterworkItemEnergyType : lockItemEnergyType;
}
