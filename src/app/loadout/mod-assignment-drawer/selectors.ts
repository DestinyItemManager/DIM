import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { armorBuckets } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import _ from 'lodash';
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
  const stores = useSelector(sortedStoresSelector);

  const loadoutItemSelector = useCallback(
    (state: RootState) => {
      const currentStore = getCurrentStore(stores)!;
      // TODO (ryan) how do we handle multiple chars with the same store? Does it matter?
      const storeToHydrateFrom =
        currentStore.classType === loadout.classType
          ? currentStore
          : stores.find((store) => store.classType === loadout.classType);
      const currentItems = storeToHydrateFrom?.items.filter(
        (item) => item.equipped && item.bucket.inArmor
      );
      const equippedLoadoutItems = loadout.items.filter((item) => item.equipped);
      const allItems = allItemsSelector(state);
      const loadoutDimItems: DimItem[] = [];

      // TODO: if there's not an item in one of the slots, pick the current equipped!
      for (const item of allItems) {
        if (
          item.bucket.inArmor &&
          equippedLoadoutItems.some((loadoutItem) => loadoutItem.id === item.id)
        ) {
          loadoutDimItems.push(item);
        }
      }

      return _.compact(
        bucketOrder.map(
          (bucketHash) =>
            loadoutDimItems.find((item) => item.bucket.hash === bucketHash) ||
            currentItems?.find((item) => item.bucket.hash === bucketHash)
        )
      );
    },
    [loadout, stores]
  );

  return useSelector(loadoutItemSelector, shallowEqual);
}
