import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import { addIcon, AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { connect } from 'react-redux';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import {
  knownModPlugCategoryHashes,
  LockableBuckets,
  LockedExclude,
  LockedItemCase,
  LockedItemType,
  LockedMap,
  LockedMod,
  LockedMods,
  LockedPerk,
} from '../types';
import { addLockedItem, isLoadoutBuilderItem, removeLockedItem } from '../utils';
import styles from './LockArmorAndPerks.m.scss';
import LockedItem from './LockedItem';
import LockedModIcon from './LockedModIcon';

interface ProvidedProps {
  selectedStore: DimStore;
  lockedMap: LockedMap;
  lockedMods: LockedMods;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

interface StoreProps {
  buckets: InventoryBuckets;
  stores: DimStore[];
  language: string;
  defs: D2ManifestDefinitions;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    buckets: bucketsSelector(state)!,
    stores: storesSelector(state),
    language: settingsSelector(state).language,
    defs: state.manifest.d2Manifest!,
  });
}

/**
 * A control section that allows for locking items and perks, or excluding items from generated sets.
 */
function LockArmorAndPerks({
  selectedStore,
  defs,
  lockedMap,
  lockedMods,
  buckets,
  stores,
  lbDispatch,
}: Props) {
  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () => {
    const newLockedMap: { [bucketHash: number]: LockedItemType[] } = {};
    selectedStore.items.forEach((item) => {
      if (item.equipped && isLoadoutBuilderItem(item)) {
        newLockedMap[item.bucket.hash] = [
          {
            type: 'item',
            item,
            bucket: item.bucket,
          },
        ];
      }
    });
    lbDispatch({ type: 'lockedMapChanged', lockedMap: { ...lockedMap, ...newLockedMap } });
  };

  /**
   * Reset all locked items and recompute for all sets
   * Recomputes matched sets
   */
  const resetLocked = () => {
    lbDispatch({ type: 'lockedMapChanged', lockedMap: {} });
  };

  const chooseItem = (
    updateFunc: (item: DimItem) => void,
    filter?: (item: DimItem) => boolean
  ) => async (e: React.MouseEvent) => {
    e.preventDefault();

    const order = Object.values(LockableBuckets);
    try {
      const { item } = await showItemPicker({
        filterItems: (item: DimItem) =>
          Boolean(
            isLoadoutBuilderItem(item) &&
              itemCanBeEquippedBy(item, selectedStore, true) &&
              (!filter || filter(item))
          ),
        sortBy: (item) => order.indexOf(item.bucket.hash),
      });

      updateFunc(item);
    } catch (e) {}
  };

  const addLockedItemType = (item: LockedItemType) => {
    if (item.bucket) {
      lbDispatch({
        type: 'lockedMapChanged',
        lockedMap: {
          ...lockedMap,
          [item.bucket.hash]: addLockedItem(item, lockedMap[item.bucket.hash]),
        },
      });
    }
  };

  const removeLockedItemType = (item: LockedItemType) => {
    if (item.bucket) {
      lbDispatch({
        type: 'lockedMapChanged',
        lockedMap: {
          ...lockedMap,
          [item.bucket.hash]: removeLockedItem(item, lockedMap[item.bucket.hash]),
        },
      });
    }
  };

  const onModClicked = (mod: LockedMod) => {
    lbDispatch({
      type: 'removeLockedArmor2Mod',
      mod,
    });
  };

  const addLockItem = (item: DimItem) =>
    addLockedItemType({ type: 'item', item, bucket: item.bucket });
  const addExcludeItem = (item: DimItem) =>
    addLockedItemType({ type: 'exclude', item, bucket: item.bucket });

  const chooseLockItem = chooseItem(
    addLockItem,
    // Exclude types that already have a locked item represented
    (item) =>
      !lockedMap[item.bucket.hash] || !lockedMap[item.bucket.hash]!.some((li) => li.type === 'item')
  );
  const chooseExcludeItem = chooseItem(addExcludeItem);

  let flatLockedMap = _.groupBy(
    Object.values(lockedMap).flatMap((items) => items || []),
    (item) => item.type
  );

  const order = Object.values(LockableBuckets);
  flatLockedMap = _.mapValues(flatLockedMap, (items) =>
    _.sortBy(items, (i: LockedItemCase) => order.indexOf(i.bucket.hash))
  );

  let flatLockedMods: LockedMod[] = knownModPlugCategoryHashes.flatMap(
    (plugCategoryHash) => lockedMods[plugCategoryHash] || []
  );

  for (const [plugCategoryHashAsString, mods] of Object.entries(lockedMods)) {
    if (mods && !knownModPlugCategoryHashes.includes(Number(plugCategoryHashAsString))) {
      flatLockedMods = flatLockedMods.concat(mods);
    }
  }

  const storeIds = stores.filter((s) => !s.isVault).map((s) => s.id);
  const bucketTypes = buckets.byCategory.Armor.map((b) => b.type!);

  const anyLocked = Object.values(lockedMap).some((lockedItems) => Boolean(lockedItems?.length));

  return (
    <div>
      <div className={styles.area}>
        {Boolean(flatLockedMods.length) && (
          <div className={styles.itemGrid}>
            {flatLockedMods.map((item) => (
              <LockedModIcon
                key={item.key}
                mod={item.modDef}
                defs={defs}
                onModClicked={() => onModClicked(item)}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button
            type="button"
            className="dim-button"
            onClick={() => lbDispatch({ type: 'openModPicker' })}
          >
            <AppIcon icon={addIcon} /> {t('LB.ModLockButton')}
          </button>
        </div>
      </div>
      <div className={styles.area}>
        {(Boolean(flatLockedMap.perk?.length) ||
          Boolean(flatLockedMap.mod?.length) ||
          Boolean(flatLockedMap.burn?.length)) && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.perk || []).map((lockedItem: LockedPerk) => (
              <LockedItem
                key={`${lockedItem.bucket?.hash}.${lockedItem.perk.hash}`}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button
            type="button"
            className="dim-button"
            onClick={() => lbDispatch({ type: 'openPerkPicker' })}
          >
            <AppIcon icon={addIcon} /> {t('LoadoutBuilder.LockPerk')}
          </button>
        </div>
      </div>
      <LoadoutBucketDropTarget
        className={styles.area}
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={addLockItem}
      >
        {Boolean(flatLockedMap.item?.length) && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.item || []).map((lockedItem: LockedItemCase) => (
              <LockedItem
                key={lockedItem.item.id}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={chooseLockItem}>
            <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockItem')}
          </button>
          <button type="button" className="dim-button" onClick={lockEquipped}>
            <AppIcon icon={pinIcon} /> {t('LoadoutBuilder.LockEquipped')}
          </button>
        </div>
      </LoadoutBucketDropTarget>
      <LoadoutBucketDropTarget
        className={styles.area}
        storeIds={storeIds}
        bucketTypes={bucketTypes}
        onItemLocked={addExcludeItem}
      >
        {Boolean(flatLockedMap.exclude?.length) && (
          <div className={styles.itemGrid}>
            {(flatLockedMap.exclude || []).map((lockedItem: LockedExclude) => (
              <LockedItem
                key={lockedItem.item.id}
                lockedItem={lockedItem}
                onRemove={removeLockedItemType}
              />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={chooseExcludeItem}>
            <AppIcon icon={faTimesCircle} /> {t('LoadoutBuilder.ExcludeItem')}
          </button>
        </div>
      </LoadoutBucketDropTarget>
      {anyLocked && (
        <button type="button" className="dim-button" onClick={resetLocked}>
          {t('LoadoutBuilder.ResetLocked')}
        </button>
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(LockArmorAndPerks);
