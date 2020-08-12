import React, { useCallback } from 'react';
import { DimItem } from './item-types';
import { sortItems } from '../shell/filters';
import './StoreBucket.scss';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import StoreInventoryItem from './StoreInventoryItem';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { itemSortOrderSelector } from '../settings/item-sort';
import emptyEngram from 'destiny-icons/general/empty-engram.svg';
import _ from 'lodash';
import { sortedStoresSelector } from './selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { globeIcon, hunterIcon, warlockIcon, titanIcon, AppIcon, addIcon } from '../shell/icons';
import { showItemPicker } from '../item-picker/item-picker';
import { moveItemTo } from './move-item';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import { characterOrderSelector } from 'app/settings/character-sort';
import { emptyArray } from 'app/utils/empty';
import { ENGRAMS_BUCKET } from 'app/search/d2-known-values';

// Props provided from parents
interface ProvidedProps {
  store: DimStore;
  bucket: InventoryBucket;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  items: DimItem[];
  itemSortOrder: string[];
  allStores: DimStore[];
  characterOrder: string;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { store, bucket } = props;

  return {
    items: store.buckets[bucket.hash] ?? emptyArray(),
    itemSortOrder: itemSortOrderSelector(state),
    // We only need this property when this is a vault armor bucket
    allStores: store.isVault && bucket.inArmor ? sortedStoresSelector(state) : emptyArray(),
    characterOrder: characterOrderSelector(state),
  };
}

type Props = ProvidedProps & StoreProps;

export const classIcons = {
  [DestinyClass.Unknown]: globeIcon,
  [DestinyClass.Hunter]: hunterIcon,
  [DestinyClass.Warlock]: warlockIcon,
  [DestinyClass.Titan]: titanIcon,
};

/**
 * A single bucket of items (for a single store).
 */
function StoreBucket({ items, itemSortOrder, bucket, store, allStores, characterOrder }: Props) {
  const pickEquipItem = useCallback(async () => {
    try {
      const { item, equip } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.bucket.hash === bucket.hash && item.canBeEquippedBy(store),
        prompt: t('MovePopup.PullItem', {
          bucket: bucket.name,
          store: store.name,
        }),
      });

      moveItemTo(item, store, equip, item.amount);
    } catch (e) {}
  }, [bucket.hash, bucket.name, store]);

  // The vault divides armor by class
  if (store.isVault && bucket.inArmor) {
    const itemsByClass = _.groupBy(items, (item) => item.classType);
    const classTypeOrder = _.sortBy(Object.keys(itemsByClass), (classType) => {
      const classTypeNum = parseInt(classType, 10);
      const index = allStores.findIndex((s) => s.classType === classTypeNum);
      return index === -1 ? 999 : characterOrder === 'mostRecentReverse' ? -index : index;
    });

    return (
      <StoreBucketDropTarget equip={false} bucket={bucket} store={store}>
        {classTypeOrder.map((classType) => (
          <React.Fragment key={classType}>
            <AppIcon icon={classIcons[classType]} className="armor-class-icon" />
            {sortItems(itemsByClass[classType], itemSortOrder).map((item) => (
              <StoreInventoryItem key={item.index} item={item} />
            ))}
          </React.Fragment>
        ))}
      </StoreBucketDropTarget>
    );
  }

  const equippedItem = items.find((i) => i.equipped);
  const unequippedItems = sortItems(
    items.filter((i) => !i.equipped),
    itemSortOrder
  );

  return (
    <>
      {equippedItem && (
        <StoreBucketDropTarget equip={true} bucket={bucket} store={store}>
          <div className="equipped-item">
            <StoreInventoryItem key={equippedItem.index} item={equippedItem} />
          </div>
          {bucket.hasTransferDestination && (
            <a
              onClick={pickEquipItem}
              className="pull-item-button"
              title={t('MovePopup.PullItem', {
                bucket: bucket.name,
                store: store.name,
              })}
            >
              <AppIcon icon={addIcon} />
            </a>
          )}
        </StoreBucketDropTarget>
      )}
      <StoreBucketDropTarget
        equip={false}
        bucket={bucket}
        store={store}
        className={clsx({ 'not-equippable': !store.isVault && !equippedItem })}
      >
        {unequippedItems.map((item) => (
          <StoreInventoryItem key={item.index} item={item} />
        ))}
        {store.isDestiny2() &&
        bucket.hash === ENGRAMS_BUCKET && // Engrams. D1 uses this same bucket hash for "Missions"
          _.times(bucket.capacity - unequippedItems.length, (index) => (
            <img src={emptyEngram} className="empty-engram" aria-hidden="true" key={index} />
          ))}
      </StoreBucketDropTarget>
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(StoreBucket);
