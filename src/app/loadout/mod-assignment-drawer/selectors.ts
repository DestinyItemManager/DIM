import { allItemsSelector } from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { armorBuckets } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

const bucketOrder = [
  armorBuckets.helmet,
  armorBuckets.gauntlets,
  armorBuckets.chest,
  armorBuckets.leg,
  armorBuckets.classitem,
];

export function useEquippedLoadoutArmor(loadout: Loadout) {
  const loadoutItemSelector = useCallback(
    (state: RootState) => {
      const equippedLoadoutItems = loadout.items.filter((item) => item.equipped);
      const allItems = allItemsSelector(state);
      const loadoutDimItems = [];

      for (const item of allItems) {
        if (
          item.bucket.inArmor &&
          equippedLoadoutItems.some((loadoutItem) => loadoutItem.id === item.id)
        ) {
          loadoutDimItems.push(item);
        }
      }

      return loadoutDimItems.sort(compareBy((item) => bucketOrder.indexOf(item.bucket.hash)));
    },
    [loadout]
  );

  return useSelector(loadoutItemSelector, shallowEqual);
}

export function useLoadoutMods(loadout: Loadout) {
  const loadoutModsSelector = useCallback(
    (state: RootState) => {
      const defs = d2ManifestSelector(state);
      const loadoutMods = loadout.parameters?.mods;

      if (!defs || !loadoutMods?.length) {
        return [];
      }

      return loadoutMods.map((hash) => defs.InventoryItem.get(hash)).filter(isPluggableItem);
    },
    [loadout]
  );

  return useSelector(loadoutModsSelector, shallowEqual);
}
