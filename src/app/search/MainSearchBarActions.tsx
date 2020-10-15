import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { t } from 'app/i18next-t';
import { setItemNote } from 'app/inventory/actions';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { allItemsSelector, bucketsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { searchLoadout } from 'app/loadout/auto-loadouts';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { isPhonePortraitSelector, querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { emptyArray, emptySet } from 'app/utils/empty';
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { CompareService } from '../compare/compare.service';
import { isTagValue, itemTagSelectorList, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import {
  AppIcon,
  clearIcon,
  compareIcon,
  lockIcon,
  stickyNoteIcon,
  unlockedIcon,
} from '../shell/icons';
import { loadingTracker } from '../shell/loading-tracker';
import { ItemFilter } from './filter-types';
import styles from './MainSearchBarActions.m.scss';
import { searchFilterSelector } from './search-filter';
import './search-filter.scss';
import SearchResults from './SearchResults';

interface ProvidedProps {
  onClear?(): void;
}

interface StoreProps {
  searchQuery: string;
  allItems: DimItem[];
  stores: DimStore[];
  buckets?: InventoryBuckets;
  searchFilter: ItemFilter;
  isPhonePortrait: boolean;
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    searchQuery: querySelector(state),
    stores: sortedStoresSelector(state),
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
  stores,
  buckets,
  searchFilter,
  searchQuery,
  isPhonePortrait,
  dispatch,
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
  const showSearchCount = searchQuery && !onProgress && !onRecords && !onVendors;
  const showSearchActions = onInventory;

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

  let isComparable = false;
  if (filteredItems.length && !CompareService.dialogOpen) {
    const type = filteredItems[0].typeName;
    isComparable = filteredItems.every((i) => i.typeName === type);
  }

  const bulkTag = loadingTracker.trackPromise(async (selectedTag: TagValue) => {
    // Bulk tagging
    const tagItems = filteredItems.filter((i) => i.taggable);

    if (isTagValue(selectedTag)) {
      dispatch(bulkTagItems(tagItems, selectedTag));
    }
  });

  const bulkLock = loadingTracker.trackPromise(async (selectedTag: TagValue) => {
    // Bulk locking/unlocking
    const state = selectedTag === 'lock';
    const lockables = filteredItems.filter((i) => i.lockable);
    dispatch(bulkLockItems(lockables, state));
  });

  const bulkNote = () => {
    const note = prompt(t('Organizer.NotePrompt'));
    if (note !== null) {
      if (filteredItems.length) {
        for (const item of filteredItems) {
          dispatch(setItemNote({ itemId: item.id, note: note || undefined }));
        }
      }
    }
  };

  const compareMatching = () => {
    CompareService.addItemsToCompare(filteredItems, false);
  };

  // Move items matching the current search. Max 9 per type.
  const applySearchLoadout = async (store: DimStore) => {
    const loadout = searchLoadout(allItems, store, searchFilter);
    dispatch(applyLoadout(store, loadout, true));
  };

  const bulkItemTags = itemTagSelectorList
    .filter((t) => t.type)
    .map((tag) => ({
      ...tag,
      label: t('Header.TagAs', { tag: t(tag.label) }),
    }));
  bulkItemTags.push({ type: 'clear', label: t('Tags.ClearTag'), icon: clearIcon });

  const dropdownOptions: Option[] = showSearchActions
    ? [
        ...stores.map((store) => ({
          key: `move-${store.id}`,
          onSelected: () => applySearchLoadout(store),
          disabled: !showSearchCount,
          content: (
            <>
              <img src={store.icon} width="16" height="16" alt="" className={styles.storeIcon} />{' '}
              {store.isVault
                ? t('MovePopup.SendToVault')
                : t('MovePopup.StoreWithName', { character: store.name })}
            </>
          ),
        })),
        { key: 'characters' },
        {
          key: 'compare',
          onSelected: compareMatching,
          disabled: !isComparable || !showSearchCount,
          content: (
            <>
              <AppIcon icon={compareIcon} /> {t('Header.CompareMatching')}
            </>
          ),
        },
        {
          key: 'note',
          onSelected: () => bulkNote(),
          disabled: !showSearchCount,
          content: (
            <>
              <AppIcon icon={stickyNoteIcon} /> {t('Organizer.Note')}
            </>
          ),
        },
        {
          key: 'lock',
          onSelected: () => bulkLock('lock'),
          disabled: !showSearchCount,
          content: (
            <>
              <AppIcon icon={lockIcon} /> {t('Tags.LockAll')}
            </>
          ),
        },

        {
          key: 'unlock',
          onSelected: () => bulkLock('unlock'),
          disabled: !showSearchCount,
          content: (
            <>
              <AppIcon icon={unlockedIcon} /> {t('Tags.UnlockAll')}
            </>
          ),
        },
        { key: 'tags' },
        ...bulkItemTags.map((tag) => ({
          key: tag.type || 'default',
          onSelected: () => tag.type && bulkTag(tag.type),
          disabled: !showSearchCount,
          content: (
            <>
              {tag.icon && <AppIcon icon={tag.icon} />} {tag.label}
            </>
          ),
        })),
      ]
    : emptyArray();

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
        <Dropdown
          options={dropdownOptions}
          kebab={true}
          className={styles.dropdownButton}
          offset={isPhonePortrait ? 10 : 3}
        />
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
