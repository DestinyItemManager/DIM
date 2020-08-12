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
} from 'react';

import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { Loading } from 'app/dim-ui/Loading';
import ReactDOM from 'react-dom';
import Sheet from 'app/dim-ui/Sheet';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { useDispatch, useSelector } from 'react-redux';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import { searchUsed, saveSearch } from 'app/dim-api/basic-actions';
import { useCombobox } from 'downshift';
import styles from './SearchBar.m.scss';
import clsx from 'clsx';
import { parseQuery, canonicalizeQuery } from './query-parser';
import createAutocompleter, { SearchItemType, SearchItem } from './autocomplete';
import { searchConfigSelector } from './search-filter';
import { RootState } from 'app/store/reducers';

const searchItemIcons: { [key in SearchItemType]: string } = {
  [SearchItemType.Recent]: faClock,
  [SearchItemType.Saved]: starIcon,
  [SearchItemType.Suggested]: unTrackedIcon, // TODO: choose a real icon
  [SearchItemType.Autocomplete]: searchIcon, // TODO: choose a real icon
  [SearchItemType.Help]: helpIcon,
};

interface ProvidedProps {
  /** Whether the "X" button that clears the selection should always be shown. */
  alwaysShowClearButton?: boolean;
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

type Props = ProvidedProps;

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
export default React.forwardRef(function SearchFilterInput(
  {
    searchQueryVersion,
    searchQuery,
    alwaysShowClearButton,
    placeholder,
    children,
    autoFocus,
    onQueryChanged,
    onClear,
  }: Props,
  ref: React.Ref<SearchFilterRef>
) {
  const [liveQuery, setLiveQuery] = useState('');
  const [filterHelpOpen, setFilterHelpOpen] = useState(false);
  const dispatch = useDispatch();
  const autocompleter = useSelector((state: RootState) =>
    createAutocompleter(searchConfigSelector(state))
  );
  const recentSearches = useSelector(recentSearchesSelector);
  const [items, setItems] = useState(autocompleter(liveQuery, 0, recentSearches));

  const inputElement = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQuery = useCallback(
    _.debounce((query: string) => {
      onQueryChanged(query);
    }, 500),
    [onQueryChanged]
  );

  const focusFilterInput = useCallback(() => {
    inputElement.current?.focus();
  }, []);

  const onBlur = () => {
    if (liveQuery) {
      // save this to the recent searches only on blur
      dispatch(searchUsed(liveQuery));
    }
  };

  const clearFilter = useCallback(() => {
    debouncedUpdateQuery('');
    debouncedUpdateQuery.flush();
    setLiveQuery('');
    onClear?.();
  }, [debouncedUpdateQuery, onClear]);

  // Add some methods for refs to use
  useImperativeHandle(
    ref,
    () => ({
      focusFilterInput,
      clearFilter,
    }),
    [focusFilterInput, clearFilter]
  );

  // TODO: this seems inefficient
  const canonical = canonicalizeQuery(parseQuery(liveQuery));
  const saved = recentSearches.find((s) => s.query === canonical)?.saved;

  // This depends on blur firing first?
  const toggleSaved = () => {
    // TODO: maybe don't save "trivial" searches (like single keywords?)
    // TODO: keep track of the last search, if you search for something more narrow immediately after then replace?
    dispatch(saveSearch({ query: liveQuery, saved: !saved }));
  };

  // TODO: Some interaction notes:
  // * In chrome, selecting an item via keyboard/mouse replaces the current input value with that, but doesn't apply it until "Enter"
  //   In downshift, focus remains on the input and changing the input would fire onInputValueChanged
  // * On mobile, we should start with the menu open
  // * When the user hits "enter" we should show a sheet of results
  // * Should we not search until they blur/hit enter? no...

  // why does the selection change when stores reload

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
    // openMenu // we can call this on focus?
    // reset
  } = useCombobox<SearchItem>({
    isOpen: true,
    items,
    defaultHighlightedIndex: 0,
    itemToString: (i) => i?.query || '',
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem?.type === SearchItemType.Help) {
        setFilterHelpOpen(true);
        return;
      }
    },
    onInputValueChange: ({ inputValue, selectedItem }) => {
      if (inputValue) {
        setLiveQuery(inputValue);
        debouncedUpdateQuery(inputValue);
        // If we selected an item from the menu, apply it immediately
        if (selectedItem) {
          debouncedUpdateQuery.flush();
        }
        // TODO: this isn't great - it won't re-set items when recentSearches changes. Can fix with a useEffect or https://github.com/downshift-js/downshift/issues/1144
        setItems(
          autocompleter(
            inputValue,
            inputElement.current!.selectionStart || liveQuery.length,
            recentSearches
          )
        );
      } else {
        clearFilter();
        autocompleter('', 0, recentSearches);
      }
    },
  });

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLiveQuery(searchQuery);
    }
  }, [searchQueryVersion, searchQuery]);

  const deleteSearch = (_item: SearchItem) => {
    console.log('This is where item deleting goes');
  };

  // TODO: time to finally make a highlight-text component
  // TODO: editing text earlier on fucks up the setup
  // TODO: maybe don't save "simple" searches w/ one node

  // TODO: move the global hotkeys to SearchFilter so they don't apply everywhere
  // TODO: break this stuff uppppp
  // TODO: memoize hotkeys
  return (
    <div
      className={clsx('search-filter', styles.searchBar, { [styles.open]: isOpen })}
      role="search"
      {...getComboboxProps()}
    >
      <GlobalHotkeys
        hotkeys={[
          {
            combo: 'f',
            description: t('Hotkey.StartSearch'),
            callback: (event) => {
              focusFilterInput();
              event.preventDefault();
              event.stopPropagation();
            },
          },
          {
            combo: 'shift+f',
            description: t('Hotkey.StartSearchClear'),
            callback: (event) => {
              clearFilter();
              focusFilterInput();
              event.preventDefault();
              event.stopPropagation();
            },
          },
        ]}
      />
      <AppIcon icon={searchIcon} className="search-bar-icon" {...getLabelProps()} />
      <input
        {...getInputProps({
          onBlur,
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

      {(liveQuery.length > 0 || alwaysShowClearButton) && (
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
          inputItems.map((item, index) => (
            <li
              className={clsx(styles.menuItem, {
                [styles.highlightedItem]: highlightedIndex === index,
              })}
              key={`${item.type}${item.query}`}
              {...getItemProps({ item, index })}
            >
              <AppIcon className={styles.menuItemIcon} icon={searchItemIcons[item.type]} />
              <span className={styles.menuItemQuery}>
                {item.type === SearchItemType.Help ? t('Header.FilterHelpMenuItem') : item.query}
              </span>
              {highlightedIndex === index &&
                (item.type === SearchItemType.Recent || item.type === SearchItemType.Saved) && (
                  <button
                    type="button"
                    className={styles.deleteIcon}
                    onClick={() => deleteSearch(item)}
                  >
                    <AppIcon icon={closeIcon} />
                  </button>
                )}
            </li>
          ))}
      </ul>
    </div>
  );
});
