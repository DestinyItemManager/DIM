import { Search, SearchType } from '@destinyitemmanager/dim-api-types';
import { saveSearch, searchDeleted } from 'app/dim-api/basic-actions';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import RadioButtons, { Option } from 'app/dim-ui/RadioButtons';
import { ColumnSort, SortDirection, useTableColumnSorts } from 'app/dim-ui/table-columns';
import { t } from 'app/i18next-t';
import {
  AppIcon,
  closeIcon,
  faCaretDown,
  faCaretUp,
  starIcon,
  starOutlineIcon,
} from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Comparator, chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { useShiftHeld } from 'app/utils/hooks';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './SearchHistory.m.scss';

function comparatorFor(id: string): Comparator<Search> {
  switch (id) {
    case 'last_used':
      return compareBy((s) => s.lastUsage);
    case 'starred':
      return compareBy((s) => s.saved);
    case 'times_used':
      return compareBy((s) => s.usageCount);
    case 'query':
      return compareBy((s) => s.query);
    default:
      throw new Error(`internal error, unhandled column ${id}`);
  }
}

export default function SearchHistory() {
  const dispatch = useThunkDispatch();
  const [searchType, setSearchType] = useState(SearchType.Item);
  const recentSearches = useSelector(recentSearchesSelector(searchType));

  const [columnSorts, toggleColumnSort] = useTableColumnSorts([
    { columnId: 'starred', sort: SortDirection.DESC },
    { columnId: 'last_used', sort: SortDirection.DESC },
  ]);

  const shiftHeld = useShiftHeld();

  const deleteSearch = (e: React.MouseEvent, item: Search) => {
    e.stopPropagation();
    dispatch(searchDeleted({ query: item.query, type: item.type }));
  };

  const toggleSaved = (item: Search) => {
    dispatch(saveSearch({ query: item.query, saved: !item.saved, type: item.type }));
  };

  const onDeleteAll = () => {
    for (const s of recentSearches.filter((s) => !s.saved)) {
      dispatch(searchDeleted({ query: s.query, type: s.type }));
    }
  };

  const onToggleSort = (columnId: string, defaultDirection: SortDirection) =>
    toggleColumnSort(columnId, shiftHeld, defaultDirection);

  const headers: [string, React.ReactNode, SortDirection][] = [
    ['last_used', t('SearchHistory.Date'), SortDirection.DESC],
    ['times_used', t('SearchHistory.UsageCount'), SortDirection.DESC],
    ['starred', <AppIcon key="star" icon={starIcon} />, SortDirection.DESC],
    ['query', t('SearchHistory.Query'), SortDirection.ASC],
  ];

  const searchComparator = chainComparator(
    ...columnSorts.map((sort) =>
      sort.sort === SortDirection.DESC
        ? reverseComparator(comparatorFor(sort.columnId))
        : comparatorFor(sort.columnId),
    ),
  );

  const radioOptions: Option<SearchType>[] = [
    { label: t('SearchHistory.Item'), value: SearchType.Item },
    { label: t('SearchHistory.Loadout'), value: SearchType.Loadout },
  ];

  // TODO: Tabs
  return (
    <div className={styles.searchHistory}>
      <p className={styles.instructions}>
        {t('SearchHistory.Description')}
        <button type="button" className="dim-button" onClick={onDeleteAll}>
          {t('SearchHistory.DeleteAll')}
        </button>
        <RadioButtons
          className={styles.tabs}
          options={radioOptions}
          value={searchType}
          onChange={setSearchType}
        />
      </p>
      <table>
        <thead>
          <tr>
            <th />
            {headers.map(([id, contents, defaultDirection]) => (
              <ColumnHeader
                columnSorts={columnSorts}
                defaultDirection={defaultDirection}
                toggleColumnSort={onToggleSort}
                columnId={id}
                key={id}
              >
                {contents}
              </ColumnHeader>
            ))}
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

function ColumnHeader({
  columnId,
  children,
  defaultDirection,
  columnSorts,
  toggleColumnSort,
}: {
  columnId: string;
  children: React.ReactNode;
  defaultDirection: SortDirection;
  columnSorts: ColumnSort[];
  toggleColumnSort: (columnId: string, direction: SortDirection) => () => void;
}) {
  const sort = columnSorts.find((c) => c.columnId === columnId);
  return (
    <th onClick={toggleColumnSort(columnId, defaultDirection)}>
      {children}
      {sort && (
        <AppIcon
          className={styles.sorter}
          icon={sort.sort === SortDirection.DESC ? faCaretDown : faCaretUp}
        />
      )}
    </th>
  );
}
