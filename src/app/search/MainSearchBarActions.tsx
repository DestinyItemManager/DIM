import React, { useState, useMemo, useEffect } from 'react';
import { t, tl } from 'app/i18next-t';
import { AppIcon, tagIcon, faClone } from '../shell/icons';
import { itemTagSelectorList, isTagValue, TagValue } from '../inventory/dim-item-info';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import './search-filter.scss';
import { searchFilterSelector } from './search-filter';
import { DimItem } from '../inventory/item-types';
import { loadingTracker } from '../shell/loading-tracker';
import { CompareService } from '../compare/compare.service';
import { bulkTagItems, bulkLockItems } from 'app/inventory/bulk-actions';
import { storesSelector, bucketsSelector } from 'app/inventory/selectors';
import { getAllItems } from 'app/inventory/stores-helpers';
import { useLocation } from 'react-router';
import { emptyArray, emptySet } from 'app/utils/empty';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { querySelector } from 'app/shell/reducer';

const bulkItemTags = Array.from(itemTagSelectorList);
bulkItemTags.push({ type: 'clear', label: tl('Tags.ClearTag') });
bulkItemTags.push({ type: 'lock', label: tl('Tags.LockAll') });
bulkItemTags.push({ type: 'unlock', label: tl('Tags.UnlockAll') });

interface ProvidedProps {
  onClear?(): void;
}

interface StoreProps {
  searchQuery: string;
  stores: DimStore[];
  buckets?: InventoryBuckets;
  searchFilter(item: DimItem): boolean;
}

type DispatchProps = {
  bulkTagItems(items: DimItem[], tag: TagValue): void;
  bulkLockItems(items: DimItem[], locked: boolean): void;
};

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, StoreProps> = (dispatch) => ({
  bulkTagItems: (items, tag) => dispatch(bulkTagItems(items, tag) as any),
  bulkLockItems: (items, locked) => dispatch(bulkLockItems(items, locked) as any),
});

type Props = ProvidedProps & StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    searchQuery: querySelector(state),
    searchFilter: searchFilterSelector(state),
    stores: storesSelector(state),
    buckets: bucketsSelector(state),
  };
}

/**
 * The extra buttons that appear in the main search bar when there are matched items.
 *
 * TODO: Replace with a dropdown of even more actions!
 */
function MainSearchBarActions({
  searchQuery,
  stores,
  buckets,
  searchFilter,
  bulkTagItems,
  bulkLockItems,
}: Props) {
  const location = useLocation();

  // Re-hide the tagging dropdown when the query is cleared
  const [showSelect, setShowSelect] = useState(false);
  useEffect(() => {
    if (!searchQuery && showSelect) {
      setShowSelect(false);
    }
  }, [searchQuery, showSelect]);

  // We don't have access to the selected store so we'd match multiple characters' worth.
  // Just suppress the count for now
  const onProgress = location.pathname.endsWith('progress');

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
      !onProgress && displayableBuckets.size
        ? getAllItems(
            stores,
            (item: DimItem) => displayableBuckets.has(item.bucket.hash) && searchFilter(item)
          )
        : emptyArray<DimItem>(),
    [displayableBuckets, onProgress, searchFilter, stores]
  );

  let isComparable = false;
  if (filteredItems.length && !CompareService.dialogOpen) {
    const type = filteredItems[0].typeName;
    isComparable = filteredItems.every((i) => i.typeName === type);
  }

  const bulkTag: React.ChangeEventHandler<HTMLSelectElement> = loadingTracker.trackPromise(
    async (e) => {
      setShowSelect(false);

      const selectedTag = e.currentTarget.value;

      if (selectedTag === 'lock' || selectedTag === 'unlock') {
        // Bulk locking/unlocking
        const state = selectedTag === 'lock';
        const lockables = filteredItems.filter((i) => i.lockable);
        bulkLockItems(lockables, state);
      } else {
        // Bulk tagging
        const tagItems = filteredItems.filter((i) => i.taggable);

        if (isTagValue(selectedTag)) {
          bulkTagItems(tagItems, selectedTag);
        }
      }
    }
  );

  const compareMatching = () => {
    CompareService.addItemsToCompare(filteredItems, false);
  };

  const onTagClicked = () => setShowSelect(true);

  return (
    <>
      {!onProgress && (
        <span className="filter-match-count">
          {t('Header.FilterMatchCount', { count: filteredItems.length })}
        </span>
      )}
      {isComparable && (
        <span
          onClick={compareMatching}
          className="filter-bar-button"
          title={t('Header.CompareMatching')}
        >
          <AppIcon icon={faClone} />
        </span>
      )}

      {showSelect ? (
        <select className="bulk-tag-select filter-bar-button" onChange={bulkTag}>
          {bulkItemTags.map((tag) => (
            <option key={tag.type || 'default'} value={tag.type}>
              {t(tag.label)}
            </option>
          ))}
        </select>
      ) : (
        <span className="filter-bar-button" onClick={onTagClicked} title={t('Header.BulkTag')}>
          <AppIcon icon={tagIcon} />
        </span>
      )}
    </>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(MainSearchBarActions);
