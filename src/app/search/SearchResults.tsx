import { t } from 'app/i18next-t';
import StoreInventoryItem from 'app/inventory/StoreInventoryItem';
import { RootState } from 'app/store/types';
import { emptyArray, emptySet } from 'app/utils/empty';
import clsx from 'clsx';
import React from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector } from '../inventory/selectors';
import { searchFilterSelector } from '../search/search-filter';
import { itemSortOrderSelector } from '../settings/item-sort';
import { sortItems } from '../shell/filters';
import styles from './SearchResults.m.scss';

interface StoreProps {
  items: DimItem[];
  itemSortOrder: string[];
  isPhonePortrait: boolean;
}

function mapStateToProps(): MapStateToProps<StoreProps, RootState> {
  const displayableBucketsSelector = createSelector(bucketsSelector, (buckets) =>
    buckets
      ? new Set(
          Object.keys(buckets.byCategory).flatMap((category) =>
            buckets.byCategory[category].map((b) => b.hash)
          )
        )
      : emptySet<number>()
  );

  const filteredItemsSelector = createSelector(
    displayableBucketsSelector,
    searchFilterSelector,
    allItemsSelector,
    (displayableBuckets, searchFilter, allItems) =>
      displayableBuckets.size
        ? allItems.filter((item) => displayableBuckets.has(item.bucket.hash) && searchFilter(item))
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
  const header = (
    <div>
      <h1 className="destiny">{t('Header.FilterMatchCount', { count: items.length })}</h1>
    </div>
  );

  console.log(items);

  // TODO: close
  const onSheetClosedFn = () => {
    console.log('closed');
  };

  return (
    <Sheet
      onClose={onSheetClosedFn}
      header={header}
      sheetClassName={clsx('item-picker', styles.searchResults)}
    >
      <div className="sub-bucket">
        {sortItems(items, itemSortOrder).map((item) => (
          <StoreInventoryItem key={item.index} item={item} />
        ))}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(SearchResults);
