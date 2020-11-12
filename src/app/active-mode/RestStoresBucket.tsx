import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import StoreBucketDropTarget from 'app/inventory/StoreBucketDropTarget';
import StoreInventoryItem from 'app/inventory/StoreInventoryItem';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useMemo } from 'react';
import { connect, MapStateToProps, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { searchFiltersConfigSelector } from '../search/search-filter';
import { itemSortOrderSelector } from '../settings/item-sort';
import { sortItems } from '../shell/filters';

type ProvidedProps = {
  currentStore: DimStore;
  bucket: InventoryBucket;
};

interface StoreProps {
  restItems: DimItem[];
  itemSortOrder: string[];
}

function mapStateToProps(): MapStateToProps<StoreProps, ProvidedProps, RootState> {
  const filteredItemsSelector = createSelector(
    allItemsSelector,
    (_: RootState, ownProps: ProvidedProps) => (item) =>
      item.bucket.type === ownProps.bucket.type &&
      item.owner !== ownProps.currentStore.id &&
      (!item.bucket.inArmor ||
        (item.bucket.inArmor && ownProps.currentStore.classType === item.classType)),
    (allItems, filterItems) => (filterItems ? allItems.filter(filterItems) : allItems)
  );

  return (state, ownProps) => ({
    restItems: filteredItemsSelector(state, ownProps),
    filters: searchFiltersConfigSelector(state),
    itemSortOrder: itemSortOrderSelector(state),
  });
}

type Props = ProvidedProps & StoreProps;

/** a `StoreBucket` for items not on the currently selected store */
function RestStoresBucket({ restItems, bucket, itemSortOrder }: Props) {
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();
  const items = useMemo(() => sortItems(restItems, itemSortOrder), [restItems, itemSortOrder]);

  if (!bucket.hasTransferDestination) {
    return null;
  }

  return (
    <StoreBucketDropTarget
      equip={false}
      bucket={bucket}
      storeId={'vault'}
      storeClassType={DestinyClass.Unknown}
      dispatch={dispatch}
    >
      {items.map((item) => (
        <StoreInventoryItem key={item.index} item={item} />
      ))}
    </StoreBucketDropTarget>
  );
}

export default connect<StoreProps>(mapStateToProps)(RestStoresBucket);
