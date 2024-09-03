import { SearchType } from '@destinyitemmanager/dim-api-types';
import StaticPage from 'app/dim-ui/StaticPage';
import { t } from 'app/i18next-t';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { RootState } from 'app/store/types';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './FilterHelp.m.scss';
import { SearchInput } from './SearchInput';
import {
  ItemFilterDefinition,
  ItemSearchConfig,
  SuggestionsContext,
} from './items/item-filter-types';
import { searchConfigSelector, suggestionsContextSelector } from './items/item-search-filter';
import {
  LoadoutFilterDefinition,
  LoadoutSearchConfig,
  LoadoutSuggestionsContext,
} from './loadouts/loadout-filter-types';
import {
  loadoutSearchConfigSelector,
  loadoutSuggestionsContextSelector,
} from './loadouts/loadout-search-filter';
import { generateGroupedSuggestionsForFilter } from './suggestions-generation';

function keywordsString(keywords: string | string[]) {
  if (Array.isArray(keywords)) {
    return keywords.join(', ');
  }
  return keywords;
}

export default function FilterHelp({ searchType = SearchType.Item }: { searchType?: SearchType }) {
  const searchConfig = useSelector<RootState, ItemSearchConfig | LoadoutSearchConfig>(
    searchType === SearchType.Loadout ? loadoutSearchConfigSelector : searchConfigSelector,
  ).filtersMap;
  const suggestionContext = useSelector(
    searchType === SearchType.Loadout
      ? loadoutSuggestionsContextSelector
      : suggestionsContextSelector,
  );
  const [search, setSearch] = useState('');

  const searchLower = search.toLowerCase();
  const filters = search
    ? searchConfig.allFilters.filter((filter) => {
        const keywordsArr = Array.isArray(filter.keywords) ? filter.keywords : [filter.keywords];
        if (keywordsArr.some((k) => k.includes(searchLower))) {
          return true;
        }

        const localDesc: string = Array.isArray(filter.description)
          ? t(...filter.description)
          : t(filter.description);

        return localDesc.toLowerCase().includes(searchLower);
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
        <div className={styles.search}>
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
              <FilterExplanation
                key={keywordsString(filter.keywords)}
                filter={filter}
                suggestionContext={suggestionContext}
              />
            ))}
          </tbody>
        </table>
      </div>
    </StaticPage>
  );
}

function FilterExplanation({
  filter,
  suggestionContext,
}: {
  filter: LoadoutFilterDefinition | ItemFilterDefinition;
  suggestionContext: LoadoutSuggestionsContext | SuggestionsContext;
}) {
  const dispatch = useDispatch();
  let suggestions = Array.from(
    new Set([...generateGroupedSuggestionsForFilter(filter, suggestionContext, true)]),
  );
  if (filter.format === 'freeform' || filter.format?.includes('freeform')) {
    suggestions = suggestions.slice(0, 5);
  }

  const localDesc: string = Array.isArray(filter.description)
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
          <div key={i} className={styles.entry}>
            <a href="." onClick={(e) => applySuggestion(e, k.keyword)}>
              {k.ops ? `${k.keyword}` : k.keyword}
            </a>
            {k.ops?.map((op, j) => {
              const x = `${k.keyword}${op}`;
              return (
                <div key={j}>
                  <span className={styles.separator}>| </span>
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
