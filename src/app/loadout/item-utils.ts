import { DimItem } from 'app/inventory/item-types';
import { isSunset } from 'app/utils/item-utils';
import { armorStatHashes } from './known-values';

/** Checks if the item is non-sunset Armor 2.0 and whether it has stats present for all 6 armor stats. */
export function isLoadoutBuilderItem(item: DimItem) {
  return (
    item.bucket.inArmor &&
    item.energy &&
    armorStatHashes.every((statHash) =>
      item.stats?.some((dimStat) => dimStat.statHash === statHash)
    ) &&
    !isSunset(item)
  );
}
