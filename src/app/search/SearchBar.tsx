import './search-filter.scss';

import {
  AppIcon,
  disabledIcon,
  helpIcon,
  searchIcon,
  faClock,
  starIcon,
  moveUpIcon,
  moveDownIcon,
  unTrackedIcon,
  closeIcon,
  starOutlineIcon,
} from '../shell/icons';
import React, {
  Suspense,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  useLayoutEffect,
} from 'react';

import { Loading } from 'app/dim-ui/Loading';
import ReactDOM from 'react-dom';
import Sheet from 'app/dim-ui/Sheet';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { connect } from 'react-redux';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import { searchUsed, saveSearch, searchDeleted } from 'app/dim-api/basic-actions';
import { useCombobox } from 'downshift';
import styles from './SearchBar.m.scss';
import clsx from 'clsx';
import { parseQuery, canonicalizeQuery } from './query-parser';
import createAutocompleter, { SearchItemType, SearchItem } from './autocomplete';
import HighlightedText from './HighlightedText';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { searchConfigSelector } from './search-config';
import { isPhonePortraitSelector } from 'app/inventory/selectors';
import { createSelector } from 'reselect';
import { Search } from '@destinyitemmanager/dim-api-types';

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

function mapStateToProps(state: RootState): StoreProps {
  return {
    recentSearches: recentSearchesSelector(state),
    isPhonePortrait: isPhonePortraitSelector(state),
    autocompleter: autoCompleterSelector(state),
  };
}

const LazyFilterHelp = React.lazy(() =>
  import(/* webpackChunkName: "filter-help" */ './FilterHelp')
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
  const [items, setItems] = useState(() => autocompleter(liveQuery, 0, recentSearches));
  // TODO: this isn't great. We need https://github.com/downshift-js/downshift/issues/1144
  useEffect(() => {
    setItems(autocompleter(liveQuery, inputElement.current?.selectionStart || 0, recentSearches));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentSearches]);

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

  const setQuery = useCallback(
    (query: string, immediate = false) => {
      setLiveQuery(query);
      debouncedUpdateQuery(query);
      if (immediate) {
        debouncedUpdateQuery.flush();
      }
      setItems(
        autocompleter(query, inputElement.current!.selectionStart || query.length, recentSearches)
      );
    },
    [autocompleter, debouncedUpdateQuery, recentSearches]
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
    reset,
    openMenu,
  } = useCombobox<SearchItem>({
    items,
    inputValue: liveQuery,
    defaultIsOpen: isPhonePortrait,
    defaultHighlightedIndex: liveQuery ? 0 : -1,
    itemToString: (i) => i?.query || '',
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        // Handle selecting the special "help" item
        if (selectedItem.type === SearchItemType.Help) {
          setFilterHelpOpen(true);
        } else {
          setQuery(selectedItem.query, true);
        }
      }
    },
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.FunctionReset:
          // Keep the menu open when we clear the input
          return changes.inputValue !== undefined
            ? {
                ...changes, // default Downshift new state changes on item selection.
                isOpen: state.isOpen, // but keep menu open
              }
            : changes;
        case useCombobox.stateChangeTypes.InputKeyDownEscape: {
          // Reimplement clear - we are controlling the input which break this
          // See https://github.com/downshift-js/downshift/issues/1108
          setQuery('', true);
          return changes;
        }
        default:
          return changes; // otherwise business as usual.
      }
    },
  });

  // This is a hack to fix https://github.com/downshift-js/downshift/issues/1108
  const onChange = (e) => {
    const inputValue = e.target.value;
    setQuery(inputValue || '');
  };

  const onFocus = () => {
    if (!liveQuery && !isOpen) {
      openMenu();
    }
  };

  const clearFilter = useCallback(() => {
    setQuery('', true);
    onClear?.();
    reset();
    openMenu();
  }, [setQuery, onClear, reset, openMenu]);

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLiveQuery(searchQuery);
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
    if (e.key === 'Tab' && tabAutocompleteItem) {
      e.preventDefault();
      setQuery(tabAutocompleteItem.query, true);
      if (tabAutocompleteItem.highlightRange) {
        selectionRef.current = tabAutocompleteItem.highlightRange[1];
      }
    }
  };

  return (
    <div
      className={clsx('search-filter', styles.searchBar, { [styles.open]: isOpen })}
      role="search"
      enterkeyhint="search"
      {...getComboboxProps()}
    >
      <AppIcon icon={searchIcon} className="search-bar-icon" {...getLabelProps()} />
      <input
        {...getInputProps({
          onBlur,
          onFocus,
          onKeyDown,
          onChange,
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

      {liveQuery.length > 0 && children}

      {liveQuery.length > 0 && (
        <button
          type="button"
          className="filter-bar-button"
          onClick={toggleSaved}
          title={t('Header.SaveSearch')}
        >
          <AppIcon icon={saved ? starIcon : starOutlineIcon} />
        </button>
      )}

      {(liveQuery.length > 0 || isPhonePortrait) && (
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
            header={<h1>{t('Header.Filters')}</h1>}
            sheetClassName="filterHelp"
          >
            <Suspense fallback={<Loading message={t('Loading.FilterHelp')} />}>
              <LazyFilterHelp />
            </Suspense>
          </Sheet>,
          document.body
        )}

      <ul {...getMenuProps()} className={clsx(styles.menu, { [styles.menuOpen]: isOpen })}>
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
      {item.helpText && <span className={styles.menuItemHelp}>{item.helpText}</span>}
      {!isPhonePortrait && isTabAutocompleteItem && (
        <span className={styles.keyHelp}>{t('Hotkey.Tab')}</span>
      )}
      {!isPhonePortrait && highlighted && (
        <span className={styles.keyHelp}>{t('Hotkey.Enter')}</span>
      )}
      {(highlighted || isPhonePortrait) &&
        (item.type === SearchItemType.Recent || item.type === SearchItemType.Saved) && (
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
