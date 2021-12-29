import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import { armorStats } from 'app/search/d2-known-values';
import { isSunset } from 'app/utils/item-utils';

/** Checks if the item is non-sunset Armor 2.0 and whether it has stats present for all 6 armor stats. */
export function isLoadoutBuilderItem(item: DimItem) {
  return Boolean(
    item.bucket.inArmor &&
      item.energy &&
      armorStats.every((statHash) =>
        item.stats?.some((dimStat) => dimStat.statHash === statHash)
      ) &&
      !isSunset(item)
  );
}

export async function pickSubclass(filterItems: (item: DimItem) => boolean) {
  try {
    const { item } = await showItemPicker({
      filterItems: (item: DimItem) => item.bucket.type === 'Class' && filterItems(item),
      // We can only sort so that the classes are grouped and stasis comes first
      sortBy: (item) => `${item.classType}-${item.energy?.energyType}`,
      prompt: t('Loadouts.ChooseItem', { name: t('Bucket.Class') }),

      // don't show information related to selected perks so we don't give the impression
      // that we will update perk selections when applying the loadout
      ignoreSelectedPerks: true,
    });

    return item;
  } catch (e) {}
}
