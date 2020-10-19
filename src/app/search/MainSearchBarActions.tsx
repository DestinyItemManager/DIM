import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { allItemsSelector, bucketsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import ItemActionsDropdown from 'app/item-actions/ItemActionsDropdown';
import { querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { emptyArray, emptySet } from 'app/utils/empty';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { DimItem } from '../inventory/item-types';
import { ItemFilter } from './filter-types';
import styles from './MainSearchBarActions.m.scss';
import { searchFilterSelector } from './search-filter';

interface StoreProps {
  searchQuery: string;
  allItems: DimItem[];
  stores: DimStore[];
  buckets?: InventoryBuckets;
  searchFilter: ItemFilter;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    searchQuery: querySelector(state),
    stores: sortedStoresSelector(state),
    searchFilter: searchFilterSelector(state),
    allItems: allItemsSelector(state),
    buckets: bucketsSelector(state),
  };
}

/**
 * The extra buttons that appear in the main search bar when there are matched items.
 */
function MainSearchBarActions({ allItems, buckets, searchFilter, searchQuery }: Props) {
  const location = useLocation();
  const onInventory = location.pathname.endsWith('inventory');
  const onProgress = location.pathname.endsWith('progress');
  const onRecords = location.pathname.endsWith('records');
  const onVendors = location.pathname.endsWith('vendors');
  // We don't have access to the selected store so we'd match multiple characters' worth.
  // Just suppress the count for now
  const showSearchActions = onInventory;
  const showSearchCount = Boolean(searchQuery && !onProgress && !onRecords && !onVendors);

  const displayableBuckets = useMemo(
    () =>
      buckets
        ? new Set(
            Object.keys(buckets.byCategory).flatMap((category) =>
              buckets.byCategory[category].map((b) => b.hash)
            )
          )
        : emptySet<number>(),
    [buckets]
  );

  const filteredItems = useMemo(
    () =>
      showSearchCount && displayableBuckets.size
        ? allItems.filter(
            (item: DimItem) => displayableBuckets.has(item.bucket.hash) && searchFilter(item)
          )
        : emptyArray<DimItem>(),
    [displayableBuckets, showSearchCount, searchFilter, allItems]
  );

  return (
    <>
      {showSearchCount && (
        <span className={styles.count}>
          {t('Header.FilterMatchCount', { count: filteredItems.length })}
        </span>
      )}

      {showSearchActions && (
        <ItemActionsDropdown filteredItems={filteredItems} searchActive={showSearchCount} />
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(MainSearchBarActions);
