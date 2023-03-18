import StaticPage from 'app/dim-ui/StaticPage';
import { t } from 'app/i18next-t';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FilterDefinition } from './filter-types';
import styles from './FilterHelp.m.scss';
import { searchConfigSelector } from './search-config';
import { SearchInput } from './SearchInput';
import { generateGroupedSuggestionsForFilter } from './suggestions-generation';

function keywordsString(keywords: string | string[]) {
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }
  return keywords;
}

export default function FilterHelp() {
  const searchConfig = useSelector(searchConfigSelector);
  const [search, setSearch] = useState('');

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
    <StaticPage className={styles.filterView}>
      <div>
        <p>
          {t('Filter.Combine', {
            example: '(is:weapon and is:legendary) or (is:armor and stat:total:<55)',
          })}{' '}
          {t('Filter.Negate', { notexample: '-is:tagged', notexample2: 'not is:tagged' })}{' '}
          <a href="/search-history">{t('SearchHistory.Link')}</a>
        </p>
        <div className={clsx(styles.search)}>
          <SearchInput
            query={search}
            onQueryChanged={setSearch}
            placeholder={t('Filter.SearchPrompt')}
            autoFocus
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
    </StaticPage>
  );
}

function FilterExplanation({ filter }: { filter: FilterDefinition }) {
  const dispatch = useDispatch();
  const additionalSuggestions = filter.suggestionsGenerator?.({}) ?? [];
  const suggestions = Array.from(
    new Set([
      ...generateGroupedSuggestionsForFilter(filter, true),
      ...additionalSuggestions.map((keyword) => ({ keyword, ops: undefined })),
    ])
  );
  const localDesc = Array.isArray(filter.description)
    ? t(...filter.description)
    : t(filter.description);

  const applySuggestion = (e: React.MouseEvent<HTMLAnchorElement>, k: string) => {
    e.preventDefault();
    dispatch(toggleSearchQueryComponent(k));
  };

  return (
    <tr>
      <td>
        {suggestions.map((k, i) => (
          <div key={i} className={clsx(styles.entry)}>
            <a href="." onClick={(e) => applySuggestion(e, k.keyword)}>
              {k.ops ? `${k.keyword}` : k.keyword}
            </a>
            {k.ops?.map((op, j) => {
              const x = `${k.keyword}${op}`;
              return (
                <div key={j}>
                  <span className={clsx(styles.separator)}>| </span>
                  <a href="." onClick={(e) => applySuggestion(e, x)}>
                    {op}
                  </a>
                </div>
              );
            })}
          </div>
        ))}
      </td>
      <td>{localDesc}</td>
    </tr>
  );
}
