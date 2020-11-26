import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { characterOrderSelector } from 'app/settings/character-sort';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import emptyEngram from 'destiny-icons/general/empty-engram.svg';
import { shallowEqual } from 'fast-equals';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { itemSortOrderSelector } from '../settings/item-sort';
import { sortItems } from '../shell/filters';
import { addIcon, AppIcon } from '../shell/icons';
import { InventoryBucket } from './inventory-buckets';
import { DimItem } from './item-types';
import { pullItem } from './move-item';
import { currentStoreSelector, sortedStoresSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import './StoreBucket.scss';
import StoreBucketDropTarget from './StoreBucketDropTarget';
import StoreInventoryItem from './StoreInventoryItem';
import { findItemsByBucket } from './stores-helpers';

// Props provided from parents
interface ProvidedProps {
  store: DimStore;
  bucket: InventoryBucket;
  singleCharacter: boolean;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  destinyVersion: DestinyVersion;
  storeId: string;
  storeName: string;
  storeClassType: DestinyClass;
  isVault: boolean;
  items: DimItem[];
  itemSortOrder: string[];
  storeClassList: DestinyClass[];
  characterOrder: string;
  isPhonePortrait: boolean;
}

/**
 * Generate a function that will produce a new array (by-ref) only if the array's contents change.
 */
function makeInternArray<T>() {
  let _lastItems: T[] = [];
  return (arr: T[]) => {
    if (!shallowEqual(_lastItems, arr)) {
      _lastItems = arr;
    }
    return _lastItems;
  };
}

function mapStateToProps() {
  const internItems = makeInternArray<DimItem>();
  const internClassList = makeInternArray<DestinyClass>();

  return (
    state: RootState,
    props: ProvidedProps
  ): StoreProps & {
    store: DimStore | null;
  } => {
    const { store, bucket, singleCharacter } = props;

    let items = findItemsByBucket(store, bucket.hash);
    if (singleCharacter && store.isVault && bucket.vaultBucket) {
      for (const otherStore of storesSelector(state)) {
        if (!otherStore.current && !otherStore.isVault) {
          items = [...items, ...findItemsByBucket(otherStore, bucket.hash)];
        }
      }
      const currentStore = currentStoreSelector(state)!;
      items = items.filter(
        (i) => i.classType === DestinyClass.Unknown || i.classType === currentStore.classType
      );
    }

    return {
      store: null,
      destinyVersion: store.destinyVersion,
      storeId: store.id,
      storeName: store.name,
      storeClassType: store.classType,
      isVault: store.isVault,
      items: internItems(items),
      itemSortOrder: itemSortOrderSelector(state),
      // We only need this property when this is a vault armor bucket
      storeClassList:
        store.isVault && bucket.inArmor
          ? internClassList(sortedStoresSelector(state).map((s) => s.classType))
          : emptyArray(),
      characterOrder: characterOrderSelector(state),
      isPhonePortrait: isPhonePortraitSelector(state),
    };
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * A single bucket of items (for a single store).
 */
function StoreBucket({
  items,
  itemSortOrder,
  bucket,
  storeId,
  destinyVersion,
  storeName,
  storeClassType,
  isVault,
  storeClassList,
  characterOrder,
  isPhonePortrait,
  singleCharacter,
}: Props) {
  const dispatch = useThunkDispatch();

  const pickEquipItem = useCallback(() => {
    dispatch(pullItem(storeId, bucket));
  }, [bucket, dispatch, storeId]);

  // The vault divides armor by class
  if (isVault && bucket.inArmor && !singleCharacter) {
    const itemsByClass = _.groupBy(items, (item) => item.classType);
    const classTypeOrder = _.sortBy(Object.keys(itemsByClass), (classType) => {
      const classTypeNum = parseInt(classType, 10);
      const index = storeClassList.findIndex((s) => s === classTypeNum);
      return index === -1 ? 999 : characterOrder === 'mostRecentReverse' ? -index : index;
    }).map((c) => parseInt(c, 10) as DestinyClass);

    return (
      <StoreBucketDropTarget
        equip={false}
        bucket={bucket}
        storeId={storeId}
        storeClassType={storeClassType}
        dispatch={dispatch}
      >
        {classTypeOrder.map((classType) => (
          <React.Fragment key={classType}>
            <ClassIcon classType={classType} className="armor-class-icon" />
            {sortItems(itemsByClass[classType], itemSortOrder).map((item) => (
              <StoreInventoryItem key={item.index} item={item} isPhonePortrait={isPhonePortrait} />
            ))}
          </React.Fragment>
        ))}
      </StoreBucketDropTarget>
    );
  }

  const equippedItem = isVault ? undefined : items.find((i) => i.equipped);
  const unequippedItems = isVault
    ? sortItems(items, itemSortOrder)
    : sortItems(
        items.filter((i) => !i.equipped),
        itemSortOrder
      );

  return (
    <>
      {equippedItem && (
        <StoreBucketDropTarget
          equip={true}
          bucket={bucket}
          storeId={storeId}
          storeClassType={storeClassType}
          dispatch={dispatch}
        >
          <div className="equipped-item">
            <StoreInventoryItem
              key={equippedItem.index}
              item={equippedItem}
              isPhonePortrait={isPhonePortrait}
            />
          </div>
          {bucket.hasTransferDestination && (
            <a
              onClick={pickEquipItem}
              className="pull-item-button"
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
        equip={false}
        bucket={bucket}
        storeId={storeId}
        storeClassType={storeClassType}
        className={clsx({ 'not-equippable': !isVault && !equippedItem })}
        dispatch={dispatch}
      >
        {unequippedItems.map((item) => (
          <StoreInventoryItem key={item.index} item={item} isPhonePortrait={isPhonePortrait} />
        ))}
        {destinyVersion === 2 &&
          bucket.hash === BucketHashes.Engrams && // Engrams. D1 uses this same bucket hash for "Missions"
          _.times(bucket.capacity - unequippedItems.length, (index) => (
            <img src={emptyEngram} className="empty-engram" aria-hidden="true" key={index} />
          ))}
      </StoreBucketDropTarget>
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(StoreBucket);
