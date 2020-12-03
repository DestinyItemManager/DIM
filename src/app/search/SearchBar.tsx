import { Search } from '@destinyitemmanager/dim-api-types';
import { saveSearch, searchDeleted, searchUsed } from 'app/dim-api/basic-actions';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import KeyHelp from 'app/dim-ui/KeyHelp';
import { Loading } from 'app/dim-ui/Loading';
import Sheet from 'app/dim-ui/Sheet';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import _ from 'lodash';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
  AppIcon,
  closeIcon,
  disabledIcon,
  faClock,
  helpIcon,
  moveDownIcon,
  moveUpIcon,
  searchIcon,
  starIcon,
  starOutlineIcon,
  unTrackedIcon,
} from '../shell/icons';
import createAutocompleter, { SearchItem, SearchItemType } from './autocomplete';
import HighlightedText from './HighlightedText';
import { canonicalizeQuery, parseQuery } from './query-parser';
import { searchConfigSelector } from './search-config';
import './search-filter.scss';
import styles from './SearchBar.m.scss';

const searchItemIcons: { [key in SearchItemType]: string } = {
  [SearchItemType.Recent]: faClock,
  [SearchItemType.Saved]: starIcon,
  [SearchItemType.Suggested]: unTrackedIcon, // TODO: choose a real icon
  [SearchItemType.Autocomplete]: searchIcon, // TODO: choose a real icon
  [SearchItemType.Help]: helpIcon,
};

interface ProvidedProps {
  /** Placeholder text when nothing has been typed */
  placeholder: string;
  /** Is this the main search bar in the header? It behaves somewhat differently. */
  mainSearchBar?: boolean;
  /** Whether to autofocus this on mount */
  autoFocus?: boolean;
  /** A fake property that can be used to force the "live" query to be replaced with the one from props */
  searchQueryVersion?: number;
  /** The search query to fill in the input. This is used only initially, or when searchQueryVersion changes */
  searchQuery?: string;
  /** Children are used as optional extra action buttons only when there is a query. */
  children?: React.ReactChild;
  /** Fired whenever the query changes (already debounced) */
  onQueryChanged(query: string): void;
  /** Fired whenever the query has been cleared */
  onClear?(): void;
}

interface StoreProps {
  recentSearches: Search[];
  isPhonePortrait: boolean;
  autocompleter: (query: string, caretIndex: number, recentSearches: Search[]) => SearchItem[];
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
    if (searchQueryVersion !== prevSearchQueryVersion) {
      manipulatedSearchQuery = searchQuery;
      prevSearchQuery = searchQuery;
      prevSearchQueryVersion = searchQueryVersion;
    }

    return {
      recentSearches: recentSearchesSelector(state),
      isPhonePortrait: isPhonePortraitSelector(state),
      autocompleter: autoCompleterSelector(state),
      searchQuery: manipulatedSearchQuery,
    };
  };
}

const LazyFilterHelp = React.lazy(
  () => import(/* webpackChunkName: "filter-help" */ './FilterHelp')
);

const Row = React.memo(
  ({
    highlighted,
    item,
    isPhonePortrait,
    isTabAutocompleteItem,
    onClick,
  }: {
    highlighted: boolean;
    item: SearchItem;
    isPhonePortrait: boolean;
    isTabAutocompleteItem: boolean;
    onClick(e: React.MouseEvent, item: SearchItem);
  }) => (
    <>
      <AppIcon className={styles.menuItemIcon} icon={searchItemIcons[item.type]} />
      <span className={styles.menuItemQuery}>
        {item.type === SearchItemType.Help ? (
          t('Header.FilterHelpMenuItem')
        ) : item.highlightRange ? (
          <HighlightedText
            text={item.query}
            startIndex={item.highlightRange[0]}
            endIndex={item.highlightRange[1]}
            className={styles.textHighlight}
          />
        ) : (
          item.query
        )}
      </span>
      <span className={styles.menuItemHelp} />
      {!isPhonePortrait && isTabAutocompleteItem && (
        <KeyHelp className={styles.keyHelp} combo="tab" />
      )}
      {!isPhonePortrait && highlighted && <KeyHelp className={styles.keyHelp} combo="enter" />}
      {(item.type === SearchItemType.Recent || item.type === SearchItemType.Saved) && (
        <button
          type="button"
          className={styles.deleteIcon}
          onClick={(e) => onClick(e, item)}
          title={t('Header.DeleteSearch')}
        >
          <AppIcon icon={closeIcon} />
        </button>
      )}
    </>
  )
);

// TODO: break filter autocomplete into its own object/helpers... with tests

/** An interface for interacting with the search filter through a ref */
export interface SearchFilterRef {
  /** Switch focus to the filter field */
  focusFilterInput(): void;
  /** Clear the filter field */
  clearFilter(): void;
}

/**
 * A reusable, autocompleting item search input. This is an uncontrolled input that
 * announces its query has changed only after some delay. This is the new version of the component
 * that offers a browser-style autocompleting search bar with history.
 *
 * TODO: Should this be the main search bar only, or should it also work for item picker, etc?
 */
function SearchBar(
  {
    searchQueryVersion,
    searchQuery,
    mainSearchBar,
    placeholder,
    children,
    autoFocus,
    onQueryChanged,
    onClear,
    dispatch,
    autocompleter,
    recentSearches,
    isPhonePortrait,
  }: Props,
  ref: React.Ref<SearchFilterRef>
) {
  const [liveQuery, setLiveQuery] = useState('');
  const [filterHelpOpen, setFilterHelpOpen] = useState(false);
  const inputElement = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQuery = useCallback(
    _.debounce((query: string) => {
      onQueryChanged(query);
    }, 500),
    [onQueryChanged]
  );

  const lastBlurQuery = useRef<string>();
  const onBlur = () => {
    if (liveQuery && liveQuery !== lastBlurQuery.current) {
      // save this to the recent searches only on blur
      // we use the ref to only fire if the query changed since the last blur
      dispatch(searchUsed(liveQuery));
      lastBlurQuery.current = liveQuery;
    }
  };

  // Is the current search saved?
  const canonical = liveQuery ? canonicalizeQuery(parseQuery(liveQuery)) : '';
  const saved = canonical ? recentSearches.find((s) => s.query === canonical)?.saved : false;

  const toggleSaved = () => {
    // TODO: keep track of the last search, if you search for something more narrow immediately after then replace?
    dispatch(saveSearch({ query: liveQuery, saved: !saved }));
  };

  const items = useMemo(
    () =>
      autocompleter(
        liveQuery,
        inputElement.current?.selectionStart || liveQuery.length,
        recentSearches
      ),
    [autocompleter, liveQuery, recentSearches]
  );

  // useCombobox from Downshift manages the state of the dropdown
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    setInputValue,
    reset,
    openMenu,
  } = useCombobox<SearchItem>({
    items,
    stateReducer,
    initialIsOpen: isPhonePortrait && mainSearchBar,
    defaultHighlightedIndex: liveQuery ? 0 : -1,
    itemToString: (i) => i?.query || '',
    onInputValueChange: ({ inputValue }) => {
      setLiveQuery(inputValue || '');
      debouncedUpdateQuery(inputValue || '');
    },
  });

  // special click handling for filter helper
  function stateReducer(state, actionAndChanges) {
    const { type, changes } = actionAndChanges;
    switch (type) {
      case useCombobox.stateChangeTypes.ItemClick:
        //exit early if non FilterHelper item was selected
        if (!changes.selectedItem || changes.selectedItem.type !== SearchItemType.Help) {
          return changes;
        }

        // helper click, open FilterHelper and modify state
        setFilterHelpOpen(true);
        return {
          ...changes,
          selectedItem: state.selectedItem, // keep the last selected item (i.e. the edit field stays unchanged)
          closeMenu: true, // close the menu
        };

      default:
        return changes; // no handling for other types
    }
  }

  const onFocus = () => {
    if (!liveQuery && !isOpen && !autoFocus) {
      openMenu();
    }
  };

  const clearFilter = useCallback(() => {
    debouncedUpdateQuery('');
    reset();
    onClear?.();
  }, [onClear, reset, debouncedUpdateQuery]);

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined && (searchQueryVersion || 0) > 0) {
      setInputValue(searchQuery);
    }
    // This should only happen when the query version changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQueryVersion]);

  const deleteSearch = useCallback(
    (e: React.MouseEvent, item: SearchItem) => {
      e.stopPropagation();
      dispatch(searchDeleted(item.query));
    },
    [dispatch]
  );

  // Add some methods for refs to use
  useImperativeHandle(
    ref,
    () => ({
      focusFilterInput: () => {
        inputElement.current?.focus();
      },
      clearFilter,
    }),
    [clearFilter]
  );

  // Setting this ref's value allows us to set the cursor position to a specific index on the next render
  const selectionRef = useRef<number>();
  useLayoutEffect(() => {
    if (selectionRef.current !== undefined && inputElement.current) {
      inputElement.current.setSelectionRange(selectionRef.current, selectionRef.current);
      selectionRef.current = undefined;
    }
  });

  // Implement tab completion on the tab key. If the highlighted item is an autocomplete suggestion,
  // accept it. Otherwise, we scan from the beginning to find the first autocomplete suggestion and
  // accept that. If there's nothing to accept, the tab key does its normal thing, which is to switch
  // focus. The tabAutocompleteItem is computed as part of render so we can offer keyboard help.
  const tabAutocompleteItem =
    highlightedIndex > 0 && items[highlightedIndex]?.type === SearchItemType.Autocomplete
      ? items[highlightedIndex]
      : items.find((s) => s.type === SearchItemType.Autocomplete && s.query !== liveQuery);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && tabAutocompleteItem && isOpen) {
      e.preventDefault();
      setInputValue(tabAutocompleteItem.query);
      if (tabAutocompleteItem.highlightRange) {
        selectionRef.current = tabAutocompleteItem.highlightRange[1];
      }
    } else if (e.key === 'Home' || e.key === 'End') {
      // Disable the use of Home/End to select items in the menu
      // https://github.com/downshift-js/downshift/issues/1162
      (e.nativeEvent as any).preventDownshiftDefault = true;
    } else if (
      (e.key === 'Delete' || e.key === 'Backspace') &&
      e.shiftKey &&
      highlightedIndex >= 0 &&
      items[highlightedIndex]?.query &&
      items[highlightedIndex]?.type === SearchItemType.Recent
    ) {
      e.preventDefault();
      dispatch(searchDeleted(items[highlightedIndex].query));
    }
  };

  return (
    <div
      className={clsx('search-filter', styles.searchBar, { [styles.open]: isOpen })}
      role="search"
      enterKeyHint="search"
      {...getComboboxProps()}
    >
      <AppIcon icon={searchIcon} className="search-bar-icon" {...getLabelProps()} />
      <input
        {...getInputProps({
          onBlur,
          onFocus,
          onKeyDown,
          ref: inputElement,
          className: 'filter-input',
          autoComplete: 'off',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: false,
          autoFocus,
          placeholder,
          type: 'text',
          name: 'filter',
        })}
      />

      {children}

      {liveQuery.length > 0 && (
        <button
          type="button"
          className={clsx('filter-bar-button', styles.saveSearchButton)}
          onClick={toggleSaved}
          title={t('Header.SaveSearch')}
        >
          <AppIcon icon={saved ? starIcon : starOutlineIcon} />
        </button>
      )}

      {(liveQuery.length > 0 || (isPhonePortrait && mainSearchBar)) && (
        <button
          type="button"
          className="filter-bar-button"
          onClick={clearFilter}
          title={t('Header.Clear')}
        >
          <AppIcon icon={disabledIcon} />
        </button>
      )}

      <button
        type="button"
        className={clsx('filter-bar-button', styles.openButton)}
        {...getToggleButtonProps()}
        aria-label="toggle menu"
      >
        <AppIcon icon={isOpen ? moveUpIcon : moveDownIcon} />
      </button>

      {filterHelpOpen &&
        ReactDOM.createPortal(
          <Sheet
            onClose={() => setFilterHelpOpen(false)}
            header={
              <>
                <h1>{t('Header.Filters')}</h1>
                <UserGuideLink topic="Item_Search" />
              </>
            }
            sheetClassName="filterHelp"
          >
            <Suspense fallback={<Loading message={t('Loading.FilterHelp')} />}>
              <LazyFilterHelp />
            </Suspense>
          </Sheet>,
          document.body
        )}

      <ul {...getMenuProps()} className={styles.menu}>
        {isOpen &&
          items.map((item, index) => (
            <li
              className={clsx(styles.menuItem, {
                [styles.highlightedItem]: highlightedIndex === index,
              })}
              key={`${item.type}${item.query}`}
              {...getItemProps({ item, index })}
            >
              <Row
                highlighted={highlightedIndex === index}
                item={item}
                isPhonePortrait={isPhonePortrait}
                isTabAutocompleteItem={item === tabAutocompleteItem}
                onClick={deleteSearch}
              />
            </li>
          ))}
      </ul>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps, null, null, { forwardRef: true })(
  React.forwardRef(SearchBar)
);
