import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
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

export function isArmorEnergyLocked(
  item: DimItem,
  { lockArmorEnergyType, loadouts }: ArmorEnergyRules
) {
  switch (lockArmorEnergyType) {
    case LockArmorEnergyType.None: {
      return false;
    }
    case LockArmorEnergyType.Masterworked: {
      const { loadoutsByItem, optimizingLoadoutId } = loadouts!;
      return loadoutsByItem[item.id]?.some(
        (l) => l.loadoutItem.equip && l.loadout.id !== optimizingLoadoutId
      );
    }
    case LockArmorEnergyType.All: {
      return true;
    }
  }
}
