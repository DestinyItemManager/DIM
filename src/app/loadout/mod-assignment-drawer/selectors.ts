import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  sortedStoresSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

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
  storeId: string | undefined
): { armor: DimItem[]; subclass: ResolvedLoadoutItem | undefined } {
  const loadoutItemSelector = useCallback(
    (state: RootState): { armor: DimItem[]; subclass: ResolvedLoadoutItem | undefined } => {
      const stores = sortedStoresSelector(state);
      const currentStore = getCurrentStore(stores)!;
      const storeToHydrateFrom = storeId
        ? getStore(stores, storeId)
        : currentStore.classType === loadout.classType
        ? currentStore
        : stores.find((store) => store.classType === loadout.classType);
      const currentlyEquippedArmor =
        storeToHydrateFrom?.items.filter((item) => item.equipped && item.bucket.inArmor) ?? [];
      const classType = storeToHydrateFrom?.classType ?? loadout.classType;
      const allItems = allItemsSelector(state);
      const itemCreationContext = createItemContextSelector(state);
      const modsByBucket = loadout.parameters?.modsByBucket;

      const [loadoutItems] = getItemsFromLoadoutItems(
        itemCreationContext,
        loadout.items.filter((i) => i.equip),
        storeId,
        allItems,
        modsByBucket
      );

      const loadoutItemsByBucket = _.keyBy(
        loadoutItems.filter((i) => i.item.classType === classType),
        (i) => i.item.bucket.hash
      );

      const subclass = loadoutItemsByBucket[BucketHashes.Subclass];
      const armor = _.compact(
        LockableBucketHashes.map(
          (bucketHash) =>
            loadoutItemsByBucket[bucketHash]?.item ??
            currentlyEquippedArmor.find((item) => item.bucket.hash === bucketHash)
        )
      );

      return { armor, subclass };
    },
    [loadout, storeId]
  );

  return useSelector(loadoutItemSelector, shallowEqual);
}

/**
 * Returns a list of resolved loadout mods for the loadout, for convenience paired
 * with a (memoized) list of just the defs (for the components that need it).
 * Loadout mod resolution may choose different versions of mods depending on artifact unlocks
 * and may replace defs that no longer exist with a placeholder deprecated mod.
 */
export function useLoadoutMods(loadout: Loadout, storeId: string, includeAutoMods?: boolean) {
  const defs = useD2Definitions();
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(storeId));

  return useMemo(() => {
    const allMods = getModsFromLoadout(defs, loadout, unlockedPlugs, includeAutoMods);
    const modDefinitions = allMods.map((mod) => mod.resolvedMod);
    return [allMods, modDefinitions] as const;
  }, [defs, includeAutoMods, loadout, unlockedPlugs]);
}
