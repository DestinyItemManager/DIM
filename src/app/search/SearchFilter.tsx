import { t } from 'app/i18next-t';
import { querySelector, searchQueryVersionSelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { setSearchQuery } from '../shell/actions';
import ItemSearchBar, { SearchFilterRef } from './ItemSearchBar';
import MainSearchBarActions from './MainSearchBarActions';
import MainSearchBarMenu from './MainSearchBarMenu';
import { SearchInput } from './SearchInput';

/**
 * The main search filter that's in the header.
 */
export default React.forwardRef(function SearchFilter(
  {
    onClear,
  }: {
    onClear?: () => void;
  },
  ref: React.Ref<SearchFilterRef>
) {
  const searchQuery = useSelector(querySelector);
  const searchQueryVersion = useSelector(searchQueryVersionSelector);
  const isPhonePortrait = useIsPhonePortrait();
  const onClearFilter = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const location = useLocation();

  const dispatch = useThunkDispatch();
  const onQueryChanged = useCallback(
    (query: string) => dispatch(setSearchQuery(query, false)),
    [dispatch]
  );

  // We don't have access to the selected store so we'd match multiple characters' worth.
  // Just suppress the count for now
  const onRecords = location.pathname.endsWith('records');
  const onProgress = location.pathname.endsWith('progress');
  const onOptimizer = location.pathname.endsWith('optimizer');
  const onLoadouts = location.pathname.endsWith('loadouts');

  const placeholder = useMemo(
    () =>
      onRecords
        ? t('Header.FilterHelpRecords')
        : onProgress
        ? t('Header.FilterHelpProgress')
        : onOptimizer
        ? t('Header.FilterHelpOptimizer', { example: '-is:exotic, modslot:nightmare' })
        : onLoadouts
        ? t('Header.FilterHelpLoadouts')
        : isPhonePortrait
        ? t('Header.FilterHelpBrief')
        : t('Header.FilterHelp', { example: 'is:dupe, is:maxpower, -is:blue' }),
    [isPhonePortrait, onRecords, onProgress, onOptimizer, onLoadouts]
  );

  const extras = useMemo(() => <MainSearchBarActions key="actions" />, []);
  const menu = useMemo(() => <MainSearchBarMenu key="actions-menu" />, []);

  const itemSearch = !onLoadouts;

  return itemSearch ? (
    <ItemSearchBar
      ref={ref}
      onQueryChanged={onQueryChanged}
      placeholder={placeholder}
      onClear={onClearFilter}
      searchQueryVersion={searchQueryVersion}
      searchQuery={searchQuery}
      mainSearchBar={true}
      menu={menu}
    >
      {extras}
    </ItemSearchBar>
  ) : (
    <SearchInput onQueryChanged={onQueryChanged} placeholder={placeholder} query={searchQuery} />
  );
});
