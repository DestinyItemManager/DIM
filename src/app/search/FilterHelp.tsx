import { t } from 'app/i18next-t';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { FilterDefinition } from './filter-types';
import styles from './FilterHelp.m.scss';
import { SearchConfig, searchConfigSelector } from './search-config';
import { generateSuggestionsForFilter } from './suggestions-generation';

interface StoreProps {
  searchConfig: SearchConfig;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    searchConfig: searchConfigSelector(state),
  };
}

type Props = StoreProps;

function keywordsString(keywords: string | string[]) {
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }
  return keywords;
}

function FilterHelp({ searchConfig }: Props) {
  const [search, setSearch] = useState('');

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const searchLower = search.toLowerCase();
  const filters = search
    ? searchConfig.allFilters.filter((filter) => {
        const keywordsArr = Array.isArray(filter.keywords) ? filter.keywords : [filter.keywords];
        if (keywordsArr.some((k) => k.includes(searchLower))) {
          return true;
        }

        const localDesc = Array.isArray(filter.description)
          ? t(...filter.description)
          : t(filter.description);

        if (localDesc.toLowerCase().includes(searchLower)) {
          return true;
        }
      })
    : searchConfig.allFilters.filter((s) => !s.deprecated);

  return (
    <div className={clsx(styles.filterView, 'dim-page dim-static-page')}>
      <div>
        <p>
          {t('Filter.Combine', {
            example: '(is:weapon and is:legendary) or (is:armor and stat:total:<55)',
          })}{' '}
          {t('Filter.Negate', { notexample: '-is:tagged', notexample2: 'not is:tagged' })}{' '}
          <a href="/search-history">{t('SearchHistory.Link')}</a>
        </p>
        <div className={clsx(styles.search, 'search-filter')} role="search">
          <input
            className="filter-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={t('Filter.SearchPrompt')}
            type="text"
            name="filter"
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('Filter.Filter')}</th>
              <th>{t('Filter.Description')}</th>
            </tr>
          </thead>
          <tbody>
            {filters.map((filter) => (
              <FilterExplanation key={keywordsString(filter.keywords)} filter={filter} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(FilterHelp);

function FilterExplanation({ filter }: { filter: FilterDefinition }) {
  const dispatch = useDispatch();
  const additionalSuggestions = filter.suggestionsGenerator?.({}) || [];
  const suggestions = Array.from(
    new Set(
      [...generateSuggestionsForFilter(filter), ...additionalSuggestions].filter(
        (s) =>
          !s.startsWith('not:') &&
          (filter.format === 'freeform' ||
            filter.format === 'range' ||
            filter.format === 'rangeoverload' ||
            !s.endsWith(':'))
      )
    )
  );
  const localDesc = Array.isArray(filter.description)
    ? t(...filter.description)
    : t(filter.description);

  const applySuggestion = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, k: string) => {
    e.preventDefault();
    dispatch(toggleSearchQueryComponent(k));
  };

  return (
    <tr>
      <td>
        {suggestions.map((k) => (
          <a key={k} href="." onClick={(e) => applySuggestion(e, k)}>
            {k}
          </a>
        ))}
      </td>
      <td>{localDesc}</td>
    </tr>
  );
}
