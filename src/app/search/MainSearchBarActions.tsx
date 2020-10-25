import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import ItemActionsDropdown from 'app/item-actions/ItemActionsDropdown';
import { isPhonePortraitSelector, querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { emptyArray, emptySet } from 'app/utils/empty';
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { DimItem } from '../inventory/item-types';
import { ItemFilter } from './filter-types';
import styles from './MainSearchBarActions.m.scss';
import { searchFilterSelector } from './search-filter';
import './search-filter.scss';
import SearchResults from './SearchResults';

interface StoreProps {
  searchQuery: string;
  allItems: DimItem[];
  buckets?: InventoryBuckets;
  searchFilter: ItemFilter;
  isPhonePortrait: boolean;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    searchQuery: querySelector(state),
    searchFilter: searchFilterSelector(state),
    allItems: allItemsSelector(state),
    buckets: bucketsSelector(state),
    isPhonePortrait: isPhonePortraitSelector(state),
  };
}

/**
 * The extra buttons that appear in the main search bar when there are matched items.
 */
function MainSearchBarActions({
  allItems,
  buckets,
  searchFilter,
  searchQuery,
  isPhonePortrait,
}: Props) {
  // TODO: how to wire "enter" on a closed menu to this?
  // TODO: default open on mobile
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);

  const location = useLocation();
  const onInventory = location.pathname.endsWith('inventory');
  const onProgress = location.pathname.endsWith('progress');
  const onRecords = location.pathname.endsWith('records');
  const onVendors = location.pathname.endsWith('vendors');
  // We don't have access to the selected store so we'd match multiple characters' worth.
  // Just suppress the count for now
  const showSearchActions = onInventory;
  const showSearchCount = Boolean(searchQuery && !onProgress && !onRecords && !onVendors);

  const hasQuery = searchQuery.length !== 0;
  useEffect(() => {
    if (!$featureFlags.searchResults) {
      return;
    }
    if (!hasQuery && searchResultsOpen) {
      setSearchResultsOpen(false);
    } else if (hasQuery && isPhonePortrait) {
      setSearchResultsOpen(true);
    }
  }, [hasQuery, searchResultsOpen, isPhonePortrait]);

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

      {$featureFlags.searchResults && showSearchCount && (
        <button
          type="button"
          className={styles.resultButton}
          onClick={() => setSearchResultsOpen((s) => !s)}
        >
          {t('Header.SearchResults')}
        </button>
      )}

      {showSearchActions && (
        <ItemActionsDropdown filteredItems={filteredItems} searchActive={showSearchCount} />
      )}

      {$featureFlags.searchResults &&
        searchResultsOpen &&
        ReactDOM.createPortal(
          <SearchResults items={filteredItems} onClose={() => setSearchResultsOpen(false)} />,
          document.body
        )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(MainSearchBarActions);
