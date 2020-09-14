import { Search } from '@destinyitemmanager/dim-api-types';
import { saveSearch, searchDeleted } from 'app/dim-api/basic-actions';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { AppIcon, closeIcon, starIcon, starOutlineIcon } from 'app/shell/icons';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import React from 'react';
import { connect } from 'react-redux';
import styles from './SearchHistory.m.scss';

interface StoreProps {
  recentSearches: Search[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    recentSearches: recentSearchesSelector(state),
  };
}

type Props = StoreProps & ThunkDispatchProp;

const searchComparator = reverseComparator(
  chainComparator<Search>(
    // Saved searches before recents
    compareBy((s) => s.saved),
    compareBy((s) => s.lastUsage)
  )
);

function SearchHistory({ recentSearches, dispatch }: Props) {
  const deleteSearch = (e: React.MouseEvent, item: Search) => {
    e.stopPropagation();
    dispatch(searchDeleted(item.query));
  };

  const toggleSaved = (item: Search) => {
    dispatch(saveSearch({ query: item.query, saved: !item.saved }));
  };

  return (
    <div className="dim-page">
      <p>{t('SearchHistory.Description')}</p>
      <table className={styles.searchHistory}>
        <thead>
          <tr>
            <th></th>
            <th>{t('SearchHistory.Date')}</th>
            <th>{t('SearchHistory.UsageCount')}</th>
            <th></th>
            <th>{t('SearchHistory.Query')}</th>
          </tr>
        </thead>
        <tbody>
          {recentSearches
            .filter((s) => s.usageCount > 0)
            .sort(searchComparator)
            .map((search) => (
              <tr key={search.query}>
                <td>
                  <button
                    type="button"
                    onClick={(e) => deleteSearch(e, search)}
                    title={t('Header.DeleteSearch')}
                    className={styles.iconButton}
                  >
                    <AppIcon icon={closeIcon} />
                  </button>
                </td>
                <td>{new Date(search.lastUsage).toLocaleString()}</td>
                <td>{search.usageCount}</td>
                <td>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => toggleSaved(search)}
                    title={t('Header.SaveSearch')}
                  >
                    <AppIcon icon={search.saved ? starIcon : starOutlineIcon} />
                  </button>
                </td>
                <td>{search.query}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(SearchHistory);
