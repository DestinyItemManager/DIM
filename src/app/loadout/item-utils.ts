import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { showItemPicker } from 'app/item-picker/item-picker';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { armorStats } from 'app/search/d2-known-values';
import { isSunset } from 'app/utils/item-utils';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  getDefaultAbilityChoiceHash,
  getSocketsByIndexes,
} from 'app/utils/socket-utils';
import { BucketHashes } from 'data/d2/generated-enums';

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
      filterItems: (item: DimItem) =>
        item.bucket.hash === BucketHashes.Subclass && filterItems(item),
      // We can only sort so that the classes are grouped and stasis comes first
      sortBy: (item) => `${item.classType}-${item.energy?.energyType}`,
      // We only want to show a single instance of a given subclass, we reconcile them by their hash from
      // the appropriate store at render time
      uniqueBy: (item) => item.hash,
      prompt: t('Loadouts.ChooseItem', { name: t('Bucket.Class') }),
    });

    return item;
  } catch (e) {}
}

export function getSubclassPlugs(
  defs: D2ManifestDefinitions,
  subclass: ResolvedLoadoutItem | undefined
) {
  const plugs: { plug: PluggableInventoryItemDefinition; canBeRemoved: boolean }[] = [];

  if (subclass?.item.sockets?.categories) {
    for (const category of subclass.item.sockets.categories) {
      const canBeRemoved =
        aspectSocketCategoryHashes.includes(category.category.hash) ||
        fragmentSocketCategoryHashes.includes(category.category.hash);
      const sockets = getSocketsByIndexes(subclass.item.sockets, category.socketIndexes);

      for (const socket of sockets) {
        const override = subclass.loadoutItem.socketOverrides?.[socket.socketIndex];
        const initial = getDefaultAbilityChoiceHash(socket);
        const hash = override || (!canBeRemoved && initial);
        const plug = hash && defs.InventoryItem.get(hash);
        if (plug && isPluggableItem(plug)) {
          plugs.push({ plug, canBeRemoved });
        }
      }
    }
  }

  return plugs;
}
