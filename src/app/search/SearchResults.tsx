import React, { useState, useRef, useEffect } from 'react';
import { DimItem } from '../inventory/item-types';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { connect, MapStateToProps } from 'react-redux';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/selectors';
import { searchFilterSelector } from '../search/search-filter';
import { sortItems } from '../shell/filters';
import { itemSortOrderSelector } from '../settings/item-sort';
import { t } from 'app/i18next-t';
import './ItemPicker.scss';
import _ from 'lodash';
import { emptySet, emptyArray } from 'app/utils/empty';
import { getAllItems } from 'app/inventory/stores-helpers';

interface StoreProps {
  items: DimItem[];
  itemSortOrder: string[];
  isPhonePortrait: boolean;
}

function mapStateToProps(): MapStateToProps<StoreProps, RootState> {
  const displayableBucketsSelector = createSelector(
    (state: RootState) => state.inventory.buckets,
    (buckets) =>
      buckets
        ? new Set(
            Object.keys(buckets.byCategory).flatMap((category) =>
              buckets.byCategory[category].map((b) => b.hash)
            )
          )
        : emptySet<number>()
  );

  const filteredItemsSelector = createSelector(
    storesSelector,
    displayableBucketsSelector,
    searchFilterSelector,
    (stores, displayableBuckets, searchFilter) =>
      !displayableBuckets.size
        ? getAllItems(
            stores,
            (item: DimItem) => displayableBuckets.has(item.bucket.hash) && searchFilter(item)
          )
        : emptyArray<DimItem>()
  );

  return (state: RootState) => ({
    items: filteredItemsSelector(state),
    itemSortOrder: itemSortOrderSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
  });
}

type Props = StoreProps;

/**
 * This displays all the items that match the given search - it is shown by default when a search is active
 * on mobile, and as a sheet when you hit "enter" on desktop.
 */
function SearchResults({ items, itemSortOrder }: Props) {
  const [height, setHeight] = useState<number | undefined>(undefined);

  const itemContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemContainer.current && !height) {
      setHeight(itemContainer.current.clientHeight);
    }
  }, [height]);

  const header = (
    <div>
      <h1 className="destiny">{t('Header.FilterMatchCount', { count: items.length })}</h1>
    </div>
  );

  // TODO: close
  const onSheetClosedFn = () => {
    console.log('closed');
  };

  return (
    <Sheet onClose={onSheetClosedFn} header={header} sheetClassName="item-picker">
      <div className="sub-bucket" ref={itemContainer} style={{ height }}>
        {sortItems(items, itemSortOrder).map((item) => (
          <ConnectedInventoryItem key={item.index} item={item} />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(SearchResults);
