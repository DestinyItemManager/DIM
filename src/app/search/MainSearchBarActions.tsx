import { t } from 'app/i18next-t';
import { toggleSearchResults } from 'app/shell/actions';
import { AppIcon, faList } from 'app/shell/icons';
import { querySelector, searchResultsOpenSelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { motion } from 'framer-motion';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { DimItem } from '../inventory/item-types';
import styles from './MainSearchBarActions.m.scss';
import { filteredItemsSelector, validateQuerySelector } from './search-filter';
import './search-filter.scss';
import SearchResults from './SearchResults';

interface StoreProps {
  searchQuery: string;
  filteredItems: DimItem[];
  searchResultsOpen: boolean;
  queryValid: boolean;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  const searchQuery = querySelector(state);
  return {
    searchQuery,
    queryValid: validateQuerySelector(state)(searchQuery).valid,
    filteredItems: filteredItemsSelector(state),
    searchResultsOpen: searchResultsOpenSelector(state),
  };
}

/**
 * The extra buttons that appear in the main search bar when there are matched items.
 */
function MainSearchBarActions({
  filteredItems,
  queryValid,
  searchQuery,
  searchResultsOpen,
  dispatch,
}: Props) {
  const location = useLocation();
  const onInventory = location.pathname.endsWith('inventory');
  const onProgress = location.pathname.endsWith('progress');
  const onRecords = location.pathname.endsWith('records');
  const onVendors = location.pathname.endsWith('vendors');

  // We don't have access to the selected store so we'd match multiple characters' worth.
  // Just suppress the count for now
  const showSearchResults = onInventory;
  const showSearchCount = Boolean(
    queryValid && searchQuery && !onProgress && !onRecords && !onVendors
  );

  return (
    <>
      {showSearchCount && (
        <motion.div
          key="count"
          layout
          exit={{ scale: 0 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {showSearchResults ? (
            <button
              type="button"
              className={styles.resultButton}
              title={t('Header.SearchResults')}
              onClick={() => dispatch(toggleSearchResults())}
            >
              <span className={styles.count}>
                {t('Header.FilterMatchCount', { count: filteredItems.length })}
              </span>
              <AppIcon icon={faList} />
            </button>
          ) : (
            <span className={styles.count}>
              {t('Header.FilterMatchCount', { count: filteredItems.length })}
            </span>
          )}
        </motion.div>
      )}

      {showSearchResults &&
        searchResultsOpen &&
        ReactDOM.createPortal(
          <SearchResults
            items={filteredItems}
            onClose={() => dispatch(toggleSearchResults(false))}
          />,
          document.body
        )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(MainSearchBarActions);
