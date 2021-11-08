import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { showItemPicker } from 'app/item-picker/item-picker';
import LockedModIcon from 'app/loadout/loadout-ui/LockedModIcon';
import { getModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { addIcon, AppIcon, faTimesCircle, pinIcon } from 'app/shell/icons';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import anyExoticIcon from 'images/anyExotic.svg';
import noExoticIcon from 'images/noExotic.svg';
import _ from 'lodash';
import React, { Dispatch, memo, useState } from 'react';
import ReactDom from 'react-dom';
import { useSelector } from 'react-redux';
import { isLoadoutBuilderItem } from '../../loadout/item-utils';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBucketDropTarget from '../LoadoutBucketDropTarget';
import {
  ExcludedItems,
  LockableBucketHashes,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LOCKED_EXOTIC_NO_EXOTIC,
  PinnedItems,
} from '../types';
import ArmorUpgradePicker, { SelectedArmorUpgrade } from './ArmorUpgradePicker';
import ExoticPicker from './ExoticPicker';
import styles from './LockArmorAndPerks.m.scss';
import LockedItem from './LockedItem';

interface Props {
  selectedStore: DimStore;
  pinnedItems: PinnedItems;
  excludedItems: ExcludedItems;
  lockedMods: PluggableInventoryItemDefinition[];
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
  lockedExoticHash?: number;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

/**
 * A control section that allows for locking items and perks, or excluding items from generated sets.
 */
export default memo(function LockArmorAndPerks({
  selectedStore,
  pinnedItems,
  excludedItems,
  lockedMods,
  upgradeSpendTier,
  lockItemEnergyType,
  lockedExoticHash,
  lbDispatch,
}: Props) {
  const [showExoticPicker, setShowExoticPicker] = useState(false);
  const [showArmorUpgradePicker, setShowArmorUpgradePicker] = useState(false);
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const stores = useSelector(storesSelector);

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  const lockEquipped = () =>
    lbDispatch({
      type: 'setPinnedItems',
      items: selectedStore.items.filter((item) => item.equipped && isLoadoutBuilderItem(item)),
    });

  const chooseItem =
    (updateFunc: (item: DimItem) => void, filter?: (item: DimItem) => boolean) =>
    async (e: React.MouseEvent) => {
      e.preventDefault();

      try {
        const { item } = await showItemPicker({
          filterItems: (item: DimItem) =>
            isLoadoutBuilderItem(item) &&
            itemCanBeEquippedBy(item, selectedStore, true) &&
            (!filter || filter(item)),
          sortBy: (item) => LockableBucketHashes.indexOf(item.bucket.hash),
        });

        updateFunc(item);
      } catch (e) {}
    };

  const onModClicked = (mod: PluggableInventoryItemDefinition) =>
    lbDispatch({
      type: 'removeLockedMod',
      mod,
    });

  const pinItem = (item: DimItem) => lbDispatch({ type: 'pinItem', item });
  const unpinItem = (item: DimItem) => lbDispatch({ type: 'unpinItem', item });
  const excludeItem = (item: DimItem) => lbDispatch({ type: 'excludeItem', item });
  const unExcludeItem = (item: DimItem) => lbDispatch({ type: 'unexcludeItem', item });

  const chooseLockItem = chooseItem(
    pinItem,
    // Exclude types that already have a locked item represented
    (item) => !pinnedItems[item.bucket.hash]
  );
  const chooseExcludeItem = chooseItem(excludeItem);

  const allPinnedItems = _.sortBy(_.compact(Object.values(pinnedItems)), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );
  const allExcludedItems = _.sortBy(_.compact(Object.values(excludedItems)).flat(), (i) =>
    LockableBucketHashes.indexOf(i.bucket.hash)
  );

  const storeIds = stores.filter((s) => !s.isVault).map((s) => s.id);
  const bucketTypes = buckets.byCategory.Armor.map((b) => b.type!);

  const modCounts: Record<number, number> = {};

  return (
    <>
      <div className={styles.area}>
        <SelectedArmorUpgrade
          defs={defs}
          upgradeSpendTier={upgradeSpendTier}
          lockItemEnergyType={lockItemEnergyType}
        />
        <div className={styles.buttons}>
          <button
            type="button"
            className="dim-button"
            onClick={() => setShowArmorUpgradePicker(true)}
          >
            <AppIcon icon={addIcon} /> {t('LoadoutBuilder.SelectArmorUpgrade')}
          </button>
        </div>
      </div>
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
        {lockedExoticHash && (
          <div className={styles.itemGrid}>
            <ClosableContainer
              showCloseIconOnHover={true}
              onClose={() => lbDispatch({ type: 'removeLockedExotic' })}
            >
              {lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC ? (
                <img src={noExoticIcon} className="item-img" />
              ) : lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC ? (
                <img src={anyExoticIcon} className="item-img" />
              ) : (
                <DefItemIcon itemDef={defs.InventoryItem.get(lockedExoticHash)} />
              )}
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
        onItemLocked={pinItem}
      >
        {Boolean(allPinnedItems.length) && (
          <div className={styles.itemGrid}>
            {allPinnedItems.map((lockedItem) => (
              <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unpinItem} />
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
        onItemLocked={excludeItem}
      >
        {Boolean(allExcludedItems.length) && (
          <div className={styles.itemGrid}>
            {allExcludedItems.map((lockedItem) => (
              <LockedItem key={lockedItem.id} lockedItem={lockedItem} onRemove={unExcludeItem} />
            ))}
          </div>
        )}
        <div className={styles.buttons}>
          <button type="button" className="dim-button" onClick={chooseExcludeItem}>
            <AppIcon icon={faTimesCircle} /> {t('LoadoutBuilder.ExcludeItem')}
          </button>
        </div>
      </LoadoutBucketDropTarget>
      {showExoticPicker &&
        ReactDom.createPortal(
          <ExoticPicker
            lockedExoticHash={lockedExoticHash}
            classType={selectedStore.classType}
            onSelected={(exotic) => lbDispatch({ type: 'lockExotic', lockedExoticHash: exotic })}
            onClose={() => setShowExoticPicker(false)}
          />,
          document.body
        )}
      {showArmorUpgradePicker &&
        ReactDom.createPortal(
          <ArmorUpgradePicker
            currentUpgradeSpendTier={upgradeSpendTier}
            lockItemEnergyType={lockItemEnergyType}
            onLockItemEnergyTypeChanged={(checked) =>
              lbDispatch({ type: 'lockItemEnergyTypeChanged', lockItemEnergyType: checked })
            }
            onUpgradeSpendTierChanged={(upgradeSpendTier) =>
              lbDispatch({ type: 'upgradeSpendTierChanged', upgradeSpendTier })
            }
            onClose={() => setShowArmorUpgradePicker(false)}
          />,
          document.body
        )}
    </>
  );
});
