import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import { addIcon, AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import _ from 'lodash';
import React, { Dispatch, useState } from 'react';
import ReactDom from 'react-dom';
import { connect } from 'react-redux';
import ClosableContainer from '../ClosableContainer';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import { getModRenderKey } from '../mod-utils';
import {
  LockableBuckets,
  LockedExclude,
  LockedExotic,
  LockedItemCase,
  LockedItemType,
  LockedMap,
} from '../types';
import { addLockedItem, isLoadoutBuilderItem, removeLockedItem } from '../utils';
import ExoticPicker from './ExoticPicker';
import styles from './LockArmorAndPerks.m.scss';
import LockedItem from './LockedItem';
import LockedModIcon from './LockedModIcon';

interface ProvidedProps {
  selectedStore: DimStore;
  lockedMap: LockedMap;
  lockedMods: PluggableInventoryItemDefinition[];
  lockedExotic?: LockedExotic;
  availableExotics?: DimItem[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

interface StoreProps {
  isPhonePortrait: boolean;
  buckets: InventoryBuckets;
  stores: DimStore[];
  language: string;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: bucketsSelector(state)!,
    stores: storesSelector(state),
    language: settingsSelector(state).language,
  });
}

/**
 * A control section that allows for locking items and perks, or excluding items from generated sets.
 */
function LockArmorAndPerks({
  selectedStore,
  lockedMap,
  lockedMods,
  buckets,
  stores,
  availableExotics,
  lockedExotic,
  isPhonePortrait,
  language,
  lbDispatch,
}: Props) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);
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

  const onModClicked = (mod: PluggableInventoryItemDefinition) => {
    lbDispatch({
      type: 'removeLockedMod',
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

  const storeIds = stores.filter((s) => !s.isVault).map((s) => s.id);
  const bucketTypes = buckets.byCategory.Armor.map((b) => b.type!);

  const anyLocked = Object.values(lockedMap).some((lockedItems) => Boolean(lockedItems?.length));
  const modCounts: Record<number, number> = {};

  const renderLockedItem = (lockedItem: LockedExclude) => (
    <LockedItem key={lockedItem.item.id} lockedItem={lockedItem} onRemove={removeLockedItemType} />
  );
  return (
    <div>
      <div className={styles.area}>
        {Boolean(lockedMods.length) && (
          <div className={styles.itemGrid}>
            {lockedMods.map((mod) => (
              <LockedModIcon
                key={getModRenderKey(mod, modCounts)}
                mod={mod}
                onModClicked={() => onModClicked(mod)}
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
        {lockedExotic && (
          <div className={styles.itemGrid}>
            <ClosableContainer
              showCloseIconOnHover={true}
              onClose={() => lbDispatch({ type: 'removeLockedExotic' })}
            >
              <DefItemIcon itemDef={lockedExotic.def} />
            </ClosableContainer>
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={() => setShowExoticPicker(true)}>
            <AppIcon icon={addIcon} /> {t('LB.SelectExotic')}
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
          <div className={styles.itemGrid}>{flatLockedMap.item.map(renderLockedItem)}</div>
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
          <div className={styles.itemGrid}>{flatLockedMap.exclude.map(renderLockedItem)}</div>
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
      {showExoticPicker &&
        ReactDom.createPortal(
          <ExoticPicker
            availableExotics={availableExotics}
            isPhonePortrait={isPhonePortrait}
            language={language}
            lbDispatch={lbDispatch}
            onClose={() => setShowExoticPicker(false)}
          />,
          document.body
        )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(LockArmorAndPerks);
