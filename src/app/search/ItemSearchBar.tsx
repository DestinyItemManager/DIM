import { Search } from '@destinyitemmanager/dim-api-types';
import Armory from 'app/armory/Armory';
import { saveSearch, searchDeleted, searchUsed } from 'app/dim-api/basic-actions';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import ClickOutsideRoot from 'app/dim-ui/ClickOutsideRoot';
import Sheet from 'app/dim-ui/Sheet';
import { toggleSearchResults } from 'app/shell/actions';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { Portal } from 'app/utils/temp-container';
import React, { Ref, useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './ItemSearchBar.m.scss';
import { SearchBar, SearchFilterRef } from './SearchBar';
import createAutocompleter, { SearchItem, SearchItemType } from './autocomplete';
import { searchConfigSelector } from './search-config';
import { validateQuerySelector } from './search-filter';
import './search-filter.scss';

interface ProvidedProps {
  /** Placeholder text when nothing has been typed */
  placeholder: string;
  /** Is this the main search bar in the header? It behaves somewhat differently. */
  mainSearchBar?: boolean;
  /** A fake property that can be used to force the "live" query to be replaced with the one from props */
  searchQueryVersion?: number;
  /** The search query to fill in the input. This is used only initially, or when searchQueryVersion changes */
  searchQuery?: string;
  /** Children are used as optional extra action buttons only when there is a query. */
  children?: React.ReactNode;
  /** An optional menu of actions that can be executed on the search. Always shown. */
  menu?: React.ReactNode;
  instant?: boolean;
  className?: string;
  /** Fired whenever the query changes (already debounced) */
  onQueryChanged: (query: string) => void;
  /** Fired whenever the query has been cleared */
  onClear?: () => void;
}

interface StoreProps {
  recentSearches: Search[];
  validateQuery: ReturnType<typeof validateQuerySelector>;
  autocompleter: (
    query: string,
    caretIndex: number,
    recentSearches: Search[],
    includeArmory: boolean
  ) => SearchItem[];
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

const autoCompleterSelector = createSelector(searchConfigSelector, createAutocompleter);

function mapStateToProps() {
  let prevSearchQueryVersion: number | undefined;
  let prevSearchQuery: string | undefined;

  return (
    state: RootState,
    { searchQuery, searchQueryVersion }: ProvidedProps
  ): StoreProps & { searchQuery?: string } => {
    // This is a hack that prevents `searchQuery` from changing if `searchQueryVersion`
    // doesn't change, so we don't trigger an update.
    let manipulatedSearchQuery = prevSearchQuery;
    if (searchQueryVersion === undefined) {
      // OK, they didn't even provide searchQueryVersion, just pass through the original query
      manipulatedSearchQuery = searchQuery;
    } else if (searchQueryVersion !== prevSearchQueryVersion) {
      manipulatedSearchQuery = searchQuery;
      prevSearchQuery = searchQuery;
      prevSearchQueryVersion = searchQueryVersion;
    }

    return {
      recentSearches: recentSearchesSelector(state),
      autocompleter: autoCompleterSelector(state),
      validateQuery: validateQuerySelector(state),
      searchQuery: manipulatedSearchQuery,
    };
  };
}

function ArmorySheet({ itemHash, onClose }: { itemHash: number; onClose: () => void }) {
  return (
    <Portal>
      <Sheet onClose={onClose} sheetClassName={styles.armorySheet}>
        <ClickOutsideRoot>
          <Armory itemHash={itemHash} />
        </ClickOutsideRoot>
      </Sheet>
    </Portal>
  );
}

/**
 * A reusable, autocompleting item search input. This is an uncontrolled input that
 * announces its query has changed only after some delay. This is the new version of the component
 * that offers a browser-style autocompleting search bar with history.
 *
 * TODO: Should this be the main search bar only, or should it also work for item picker, etc?
 */
function ItemSearchBar(
  {
    searchQueryVersion,
    searchQuery,
    mainSearchBar,
    placeholder,
    children,
    onQueryChanged,
    instant,
    onClear,
    dispatch,
    validateQuery,
    autocompleter,
    recentSearches,
    className,
    menu,
  }: Props,
  ref: Ref<SearchFilterRef>
) {
  const [armoryItemHash, setArmoryItemHash] = useState<number | undefined>(undefined);

  const autocompleterImpl = useCallback(
    (query: string, caretIndex: number, recentSearches: Search[]) =>
      autocompleter(query, caretIndex, recentSearches, Boolean(mainSearchBar)),
    [autocompleter, mainSearchBar]
  );

  const handleSearchUsed = useCallback(
    (liveQuery: string) => dispatch(searchUsed(liveQuery)),
    [dispatch]
  );

  const handleSearchDeleted = useCallback(
    (query: string) => dispatch(searchDeleted(query)),
    [dispatch]
  );

  const handleSearchSaved = useCallback(
    (query: string, saved: boolean) => dispatch(saveSearch({ query, saved })),
    [dispatch]
  );

  const handleToggleSearchResults = useCallback(() => dispatch(toggleSearchResults()), [dispatch]);

  const handleInputEnterKeydown = useCallback((searchItem: SearchItem) => {
    switch (searchItem.type) {
      case SearchItemType.ArmoryEntry:
        setArmoryItemHash(searchItem.armoryItem.hash);
        return { keepSelectedItem: true };
      default:
        return { keepSelectedItem: false };
    }
  }, []);

  return (
    <>
      <SearchBar
        ref={ref}
        className={className}
        searchQuery={searchQuery}
        searchQueryVersion={searchQueryVersion}
        placeholder={placeholder}
        menu={menu}
        autocompleter={autocompleterImpl}
        instant={instant}
        recentSearches={recentSearches}
        validateQuery={validateQuery}
        onClear={onClear}
        onQueryChanged={onQueryChanged}
        onSearchUsed={handleSearchUsed}
        onSearchDeleted={handleSearchDeleted}
        onSetQuerySaved={handleSearchSaved}
        onToggleSearchResults={handleToggleSearchResults}
        onInputEnterDown={handleInputEnterKeydown}
        mainSearchBar={mainSearchBar}
      >
        {children}
      </SearchBar>
      {armoryItemHash !== undefined && (
        <ArmorySheet itemHash={armoryItemHash} onClose={() => setArmoryItemHash(undefined)} />
      )}
    </>
  );
}

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  React.forwardRef(ItemSearchBar)
);
