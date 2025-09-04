import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  currentStoreSelector,
  sortedStoresSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { ArmorBucketHashes } from 'app/loadout-builder/types';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { filterMap } from 'app/utils/collections';
import { BucketHashes } from 'data/d2/generated-enums';
import { keyBy } from 'es-toolkit';
import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

/**
 * Returns two bits of information:
 *  - for each armor slot, a real DIM item that either corresponds to the
 *    equipped item from the loadout, or the currently equipped armor item if
 *    the loadout didn't have one in that bucket
 *  - a loadout item (a real DIM item plus some other info?) representing the
 *    selected subclass for the loadout
 */
// TODO: Why are these in the same selector? Why isn't it memoized?
export function useEquippedLoadoutArmorAndSubclass(
  loadout: Loadout,
  storeId: string | undefined,
): { armor: DimItem[]; subclass: ResolvedLoadoutItem | undefined } {
  const loadoutItemSelector = useMemo(
    () =>
      createSelector(
        sortedStoresSelector,
        currentStoreSelector,
        allItemsSelector,
        createItemContextSelector,
        (
          stores,
          currentStore,
          allItems,
          itemCreationContext,
        ): { armor: DimItem[]; subclass: ResolvedLoadoutItem | undefined } => {
          const storeToHydrateFrom = storeId
            ? getStore(stores, storeId)
            : currentStore!.classType === loadout.classType
              ? currentStore
              : stores.find((store) => store.classType === loadout.classType);
          const currentlyEquippedArmor =
            storeToHydrateFrom?.items.filter((item) => item.equipped && item.bucket.inArmor) ?? [];
          const classType = storeToHydrateFrom?.classType ?? loadout.classType;
          const modsByBucket = loadout.parameters?.modsByBucket;

          const [loadoutItems] = getItemsFromLoadoutItems(
            itemCreationContext,
            loadout.items.filter((i) => i.equip),
            storeId,
            allItems,
            modsByBucket,
          );

          const loadoutItemsByBucket = keyBy(
            loadoutItems.filter((i) => i.item.classType === classType),
            (i) => i.item.bucket.hash,
          );

          const subclass = loadoutItemsByBucket[BucketHashes.Subclass];
          const armor = filterMap(
            ArmorBucketHashes,
            (bucketHash) =>
              loadoutItemsByBucket[bucketHash]?.item ??
              currentlyEquippedArmor.find((item) => item.bucket.hash === bucketHash),
          );

          return { armor, subclass };
        },
      ),
    [loadout, storeId],
  );

  return useSelector(loadoutItemSelector, shallowEqual);
}

/**
 * Returns a list of resolved loadout mods for the loadout, for convenience paired
 * with a (memoized) list of just the defs (for the components that need it).
 * Loadout mod resolution may choose different versions of mods depending on artifact unlocks
 * and may replace defs that no longer exist with a placeholder deprecated mod.
 */
export function useLoadoutMods(loadout: Loadout, storeId: string) {
  const defs = useD2Definitions();
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(storeId));

  return useMemo(() => {
    const allMods = getModsFromLoadout(defs, loadout, unlockedPlugs);
    const modDefinitions = allMods.map((mod) => mod.resolvedMod);
    return [allMods, modDefinitions] as const;
  }, [defs, loadout, unlockedPlugs]);
}
