import { t } from 'app/i18next-t';
import { toggleSearchResults } from 'app/shell/actions';
import { AppIcon, faList } from 'app/shell/icons';
import { querySelector, searchResultsOpenSelector } from 'app/shell/selectors';
import { emptyArray } from 'app/utils/empty';
import { Portal } from 'app/utils/temp-container';
import { motion } from 'framer-motion';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import styles from './MainSearchBarActions.m.scss';
import { filteredItemsSelector, queryValidSelector } from './search-filter';
import SearchResults from './SearchResults';

/**
 * The extra buttons that appear in the main search bar when there are matched items.
 */
export default function MainSearchBarActions() {
  const searchQuery = useSelector(querySelector);
  const queryValid = useSelector(queryValidSelector);
  const filteredItems = useSelector(filteredItemsSelector);
  const searchResultsOpen = useSelector(searchResultsOpenSelector);
  const dispatch = useDispatch();

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
  const handleCloseSearchResults = useCallback(
    () => dispatch(toggleSearchResults(false)),
    [dispatch]
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

      {showSearchResults && searchResultsOpen && (
        <Portal>
          <SearchResults
            items={queryValid ? filteredItems : emptyArray()}
            onClose={handleCloseSearchResults}
          />
        </Portal>
      )}
    </>
  );
}
