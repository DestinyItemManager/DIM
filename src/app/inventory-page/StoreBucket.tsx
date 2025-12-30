import { DestinyVersion, VaultWeaponGroupingStyle } from '@destinyitemmanager/dim-api-types';
import ClassIcon from 'app/dim-ui/ClassIcon';
import WeaponGroupingIcon from 'app/dim-ui/WeaponGroupingIcon';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { pullItem } from 'app/inventory/move-item';
import {
  currentStoreSelector,
  sortedStoresSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { useItemPicker } from 'app/item-picker/item-picker';
import { characterOrderSelector } from 'app/settings/character-sort';
import { itemSorterSelector } from 'app/settings/item-sort';
import {
  vaultArmorGroupingStyleSelector,
  vaultWeaponGroupingEnabledSelector,
  vaultWeaponGroupingSelector,
  vaultWeaponGroupingStyleSelector,
} from 'app/settings/vault-grouping';
import { AppIcon, addIcon } from 'app/shell/icons';
import { vaultGroupingValueWithType } from 'app/shell/item-comparators';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { compareBy } from 'app/utils/comparators';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import emptyEngram from 'destiny-icons/general/empty-engram.svg';
import { shallowEqual } from 'fast-equals';
import { memo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import * as styles from './StoreBucket.m.scss';
import './StoreBucket.scss';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import StoreInventoryItem from './StoreInventoryItem';

/**
 * Given an array of objects, return the same version of the array
 * (reference-equal with previous versions) as long as the contents of the
 * passed in array is the same as other arrays. This prevents re-renders when we
 * have to generate new arrays but the contents are the same.
 *
 * This is conceptually similar to useMemo except instead of memoizing on the
 * inputs, it memoizes on the outputs.
 */
function useStableArray<T>(arr: T[]) {
  const lastItems = useRef<T[]>([]);
  if (!shallowEqual(lastItems.current, arr)) {
    lastItems.current = arr;
  }
  return lastItems.current;
}

/**
 * A single bucket of items (for a single store). The arguments for this
 * component are the bare minimum needed, so that we can memoize it to avoid
 * unnecessary re-renders of unaffected buckets when moving items around. The
 * StoreBucket component does the heavy lifting of picking apart these input
 * props for StoreBucketInner.
 */
const StoreBucketInner = memo(function StoreBucketInner({
  items,
  bucket,
  storeId,
  destinyVersion,
  storeName,
  storeClassType,
  isVault,
}: {
  bucket: InventoryBucket;
  destinyVersion: DestinyVersion;
  storeId: string;
  storeName: string;
  storeClassType: DestinyClass;
  isVault: boolean;
  items: DimItem[];
}) {
  const dispatch = useThunkDispatch();
  const sortItems = useSelector(itemSorterSelector);
  const groupWeapons = useSelector(vaultWeaponGroupingSelector);
  const vaultWeaponGroupingEnabled = useSelector(vaultWeaponGroupingEnabledSelector);
  const weaponGroupingStyle = useSelector(vaultWeaponGroupingStyleSelector);

  const showItemPicker = useItemPicker();
  const pickEquipItem = useCallback(() => {
    dispatch(pullItem(storeId, bucket, showItemPicker));
  }, [bucket, dispatch, showItemPicker, storeId]);

  const equippedItem = isVault ? undefined : items.find((i) => i.equipped);
  const unequippedItems =
    isVault && bucket.inWeapons
      ? groupWeapons(sortItems(items))
      : sortItems(isVault ? items : items.filter((i) => !i.equipped));

  // represents whether there's *supposed* to be an equipped item here, aka armor/weapon/artifact, etc
  const isEquippable = Boolean(equippedItem || bucket.equippable);
  // Engrams. D1 uses this same bucket hash for "Missions"
  const isEngrams = destinyVersion === 2 && bucket.hash === BucketHashes.Engrams;
  // Only D2 has special subclass display
  const isSubclass = destinyVersion === 2 && bucket.hash === BucketHashes.Subclass;

  return (
    <>
      {(equippedItem || isEquippable) && !isVault && (
        <StoreBucketDropTarget
          grouped={false}
          equip={true}
          bucket={bucket}
          storeId={storeId}
          storeClassType={storeClassType}
          className={clsx({ [styles.subClass]: isSubclass })}
        >
          {equippedItem && (
            <div className="equipped-item">
              <StoreInventoryItem key={equippedItem.index} item={equippedItem} />
            </div>
          )}
          {bucket.hasTransferDestination && (
            <a
              onClick={pickEquipItem}
              className={styles.pullItemButton}
              title={t('MovePopup.PullItem', {
                bucket: bucket.name,
                store: storeName,
              })}
            >
              <AppIcon icon={addIcon} />
            </a>
          )}
        </StoreBucketDropTarget>
      )}
      <StoreBucketDropTarget
        grouped={isVault && vaultWeaponGroupingEnabled}
        equip={false}
        bucket={bucket}
        storeId={storeId}
        storeClassType={storeClassType}
        // class representing a *character* bucket area that's not equippable
        className={clsx({
          [styles.notEquippable]: !isVault && !isEquippable && !isEngrams,
          [styles.inlineGroups]: weaponGroupingStyle === VaultWeaponGroupingStyle.Inline,
          [styles.engrams]: isEngrams,
          [styles.subClass]: isSubclass,
        })}
      >
        {unequippedItems.map((groupOrItem) =>
          'id' in groupOrItem ? (
            <StoreInventoryItem key={groupOrItem.index} item={groupOrItem} />
          ) : (
            <div
              className={styles.vaultGroup}
              key={vaultGroupingValueWithType(groupOrItem.groupingValue)}
            >
              <WeaponGroupingIcon
                icon={groupOrItem.icon}
                className={styles.weaponGroupingIconWrapper}
              />
              {groupOrItem.items.map((item) => (
                <StoreInventoryItem key={item.index} item={item} />
              ))}
            </div>
          ),
        )}
        {isEngrams &&
          !isVault &&
          Array.from(
            // lower bound of 0, in case this bucket becomes overfilled
            { length: Math.max(0, bucket.capacity - unequippedItems.length) },
            (_, index) => (
              <img
                src={emptyEngram}
                className={styles.emptyEngram}
                aria-hidden="true"
                key={index}
              />
            ),
          )}
      </StoreBucketDropTarget>
    </>
  );
});

/**
 * The classes of each character, in the user's preferred order.
 */
const storeClassListSelector = createSelector(
  sortedStoresSelector,
  (stores) => stores.map((s) => s.classType).filter((c) => c !== DestinyClass.Unknown),
  // Use shallow equality on the returned array so it only changes when the
  // actual list of class types change
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

/**
 * For armor in the vault, we separate items by which class they belong to. The
 * arguments for this component are the bare minimum needed, so that we can
 * memoize it to avoid unnecessary re-renders of unaffected buckets when moving
 * items around. The StoreBucket component does the heavy lifting of picking
 * apart these input props for VaultBucketDividedByClass.
 */
const VaultBucketDividedByClass = memo(function SingleCharacterVaultBucket({
  items,
  bucket,
  storeId,
  storeClassType,
}: {
  bucket: InventoryBucket;
  storeId: string;
  storeClassType: DestinyClass;
  items: DimItem[];
}) {
  const storeClassList = useSelector(storeClassListSelector);
  const characterOrder = useSelector(characterOrderSelector);
  const sortItems = useSelector(itemSorterSelector);
  const armorGroupingStyle = useSelector(vaultArmorGroupingStyleSelector);

  // The vault divides armor by class
  const itemsByClass = Map.groupBy(items, (item) => item.classType);
  const classTypeOrder = [...itemsByClass.keys()].sort(
    compareBy((classType) => {
      const index = storeClassList.findIndex((s) => s === classType);
      return index === -1 ? 999 : characterOrder === 'mostRecentReverse' ? -index : index;
    }),
  );

  return (
    <StoreBucketDropTarget
      grouped={true}
      equip={false}
      bucket={bucket}
      storeId={storeId}
      storeClassType={storeClassType}
      className={clsx({
        [styles.inlineGroups]: armorGroupingStyle === VaultWeaponGroupingStyle.Inline,
      })}
    >
      {classTypeOrder.map((classType) => (
        <div className={styles.vaultGroup} key={classType}>
          <ClassIcon classType={classType} className={styles.armorClassIcon} />
          {sortItems(itemsByClass.get(classType)!).map((item) => (
            <StoreInventoryItem key={item.index} item={item} />
          ))}
        </div>
      ))}
    </StoreBucketDropTarget>
  );
});

/**
 * The items for a single bucket on a single store.
 */
export default function StoreBucket({
  store,
  bucket,
  singleCharacter,
}: {
  store: DimStore;
  bucket: InventoryBucket;
  singleCharacter: boolean;
}) {
  const currentStore = useSelector(currentStoreSelector);
  const stores = useSelector(storesSelector);

  let items = findItemsByBucket(store, bucket.hash);

  // Single character mode collapses all items from other characters into "the
  // vault" (but only those items that could be used by the current character)
  if (singleCharacter && store.isVault && (bucket.vaultBucket || bucket.inPostmaster)) {
    for (const otherStore of stores) {
      if (!otherStore.current && !otherStore.isVault) {
        items = [...items, ...findItemsByBucket(otherStore, bucket.hash)];
      }
    }
    // TODO: When we switch accounts this suffers from the "zombie child" problem where the redux store has already
    // updated (so currentStore is cleared) but the store from props is still around because its redux subscription
    // hasn't fired yet.
    items = items.filter(
      (i) => i.classType === DestinyClass.Unknown || i.classType === currentStore?.classType,
    );
  }

  const stableItems = useStableArray(items);

  // TODO: move grouping here?

  // The vault divides armor by class
  if (store.isVault && bucket.inArmor && !singleCharacter) {
    return (
      <VaultBucketDividedByClass
        bucket={bucket}
        storeId={store.id}
        storeClassType={store.classType}
        items={stableItems}
      />
    );
  }

  return (
    <StoreBucketInner
      bucket={bucket}
      destinyVersion={store.destinyVersion}
      storeId={store.id}
      storeName={store.name}
      storeClassType={store.classType}
      isVault={store.isVault}
      items={stableItems}
    />
  );
}
