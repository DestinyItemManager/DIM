import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { RootState } from 'app/store/types';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

export function useEquippedLoadoutArmorAndSubclass(loadout: Loadout) {
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
      let subclass: DimLoadoutItem | undefined;

      // TODO: if there's not an item in one of the slots, pick the current equipped!
      for (const item of allItems) {
        if (
          item.bucket.inArmor &&
          equippedLoadoutItems.some((loadoutItem) => loadoutItem.id === item.id)
        ) {
          loadoutDimItems.push(item);
        } else if (item.bucket.hash === BucketHashes.Subclass) {
          const loadoutItem = equippedLoadoutItems.find(
            (loadoutItem) => loadoutItem.id === item.id
          );
          if (loadoutItem) {
            subclass = { ...item, socketOverrides: loadoutItem.socketOverrides };
          }
        }
      }

      const armor = _.compact(
        LockableBucketHashes.map(
          (bucketHash) =>
            loadoutDimItems.find((item) => item.bucket.hash === bucketHash) ||
            currentItems?.find((item) => item.bucket.hash === bucketHash)
        )
      );

      return { armor, subclass };
    },
    [loadout, stores]
  );

  return useSelector(loadoutItemSelector, shallowEqual);
}
