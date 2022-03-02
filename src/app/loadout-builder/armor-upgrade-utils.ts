import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';

/** Gets the max energy allowed from the passed in UpgradeSpendTier */
export function calculateAssumedItemEnergy(
  item: DimItem,
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined,
  minItemEnergy: number
) {
  const itemEnergy = item.energy?.energyCapacity || minItemEnergy;
  const assumedEnergy =
    assumeArmorMasterwork === AssumeArmorMasterwork.All ||
    (assumeArmorMasterwork === AssumeArmorMasterwork.Legendary && !item.isExotic)
      ? 10
      : minItemEnergy;
  return Math.max(itemEnergy, assumedEnergy);
}

export function isArmorEnergyLocked(
  item: DimItem,
  lockArmorEnergyType: LockArmorEnergyType | undefined
) {
  return (
    lockArmorEnergyType === LockArmorEnergyType.All ||
    (item.masterwork && lockArmorEnergyType === LockArmorEnergyType.Masterworked)
  );
}
