import { DimItem } from 'app/inventory/item-types';
import { armorStatHashes } from './known-values';

/** Checks if the item is Armor 2.0 and whether it has stats present for all 6 armor stats. */
export function isArmor2WithStats(item: DimItem) {
  return (
    item.bucket.inArmor &&
    item.energy &&
    armorStatHashes.every((statHash) =>
      item.stats?.some((dimStat) => dimStat.statHash === statHash)
    )
  );
}
