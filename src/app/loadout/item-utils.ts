import { DimItem } from 'app/inventory/item-types';
import { armorStatHashes } from './known-values';

/** Whether this item is eligible for being in loadout builder. Now only armour 2.0 and only items that have all the stats. */

export function isArmor2WithStats(item: DimItem) {
  // Armor and Ghosts
  return (
    item.bucket.inArmor &&
    item.energy &&
    armorStatHashes.every((statHash) =>
      item.stats?.some((dimStat) => dimStat.statHash === statHash)
    )
  );
}
