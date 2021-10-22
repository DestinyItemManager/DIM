import { Search } from '@destinyitemmanager/dim-api-types';
import { saveSearch, searchDeleted } from 'app/dim-api/basic-actions';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { AppIcon, closeIcon, starIcon, starOutlineIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './SearchHistory.m.scss';

const searchComparator = reverseComparator(
  chainComparator<Search>(
    // Saved searches before recents
    compareBy((s) => s.saved),
    compareBy((s) => s.lastUsage)
  )
);

export default function SearchHistory() {
  const dispatch = useThunkDispatch();
  const recentSearches = useSelector(recentSearchesSelector);

  const deleteSearch = (e: React.MouseEvent, item: Search) => {
    e.stopPropagation();
    dispatch(searchDeleted(item.query));
  };

  const toggleSaved = (item: Search) => {
    dispatch(saveSearch({ query: item.query, saved: !item.saved }));
  };

  const onDeleteAll = () => {
    for (const s of recentSearches.filter((s) => !s.saved)) {
      dispatch(searchDeleted(s.query));
    }
  };

  return (
    <div className={styles.searchHistory}>
      <p className={styles.instructions}>
        {t('SearchHistory.Description')}
        <button type="button" className="dim-button" onClick={onDeleteAll}>
          {t('SearchHistory.DeleteAll')}
        </button>
      </p>
      <table>
        <thead>
          <tr>
            <th />
            <th>{t('SearchHistory.Date')}</th>
            <th>{t('SearchHistory.UsageCount')}</th>
            <th />
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
                <td className={styles.date}>{new Date(search.lastUsage).toLocaleString()}</td>
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
