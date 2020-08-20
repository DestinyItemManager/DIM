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
import { searchUsed, saveSearch, searchDeleted } from 'app/dim-api/basic-actions';
import { useCombobox } from 'downshift';
import styles from './SearchBar.m.scss';
import clsx from 'clsx';
import { parseQuery, canonicalizeQuery } from './query-parser';
import createAutocompleter, { SearchItemType, SearchItem } from './autocomplete';
import HighlightedText from './HighlightedText';
import { RootState } from 'app/store/types';
import { searchConfigSelector } from './search-config';
import { isPhonePortraitSelector } from 'app/inventory/selectors';

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
  const isPhonePortrait = useSelector(isPhonePortraitSelector);
  const recentSearches = useSelector(recentSearchesSelector);
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

  const focusFilterInput = useCallback(() => {
    inputElement.current?.focus();
  }, []);

  const onBlur = () => {
    if (liveQuery) {
      // save this to the recent searches only on blur
      dispatch(searchUsed(liveQuery));
    }
  };

  // Is the current search saved?
  const canonical = canonicalizeQuery(parseQuery(liveQuery));
  const saved = recentSearches.find((s) => s.query === canonical)?.saved;

  const toggleSaved = () => {
    // TODO: keep track of the last search, if you search for something more narrow immediately after then replace?
    dispatch(saveSearch({ query: liveQuery, saved: !saved }));
  };

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
  } = useCombobox<SearchItem>({
    items,
    isOpen: true,
    defaultIsOpen: isPhonePortrait,
    defaultHighlightedIndex: liveQuery ? 0 : -1,
    itemToString: (i) => i?.query || '',
    onSelectedItemChange: ({ selectedItem }) => {
      // Handle selecting the special "help" item
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
        // TODO: this isn't great - needs https://github.com/downshift-js/downshift/issues/1144
        setItems(
          autocompleter(
            inputValue,
            inputElement.current!.selectionStart || liveQuery.length,
            recentSearches
          )
        );
      } else {
        autocompleter('', 0, recentSearches);
      }
    },
  });

  const clearFilter = useCallback(() => {
    debouncedUpdateQuery('');
    debouncedUpdateQuery.flush();
    onClear?.();
    reset();
  }, [debouncedUpdateQuery, onClear, reset]);

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLiveQuery(searchQuery);
    }
  }, [searchQueryVersion, searchQuery]);

  const deleteSearch = (e: React.MouseEvent, item: SearchItem) => {
    e.stopPropagation();
    dispatch(searchDeleted(item.query));
  };

  // Add some methods for refs to use
  useImperativeHandle(
    ref,
    () => ({
      focusFilterInput,
      clearFilter,
    }),
    [focusFilterInput, clearFilter]
  );

  // TODO: move the global hotkeys to SearchFilter so they don't apply everywhere
  // TODO: break this stuff uppppp
  // TODO: memoize hotkeys
  return (
    <div
      className={clsx('search-filter', styles.searchBar, { [styles.open]: isOpen })}
      role="search"
      enterkeyhint="search"
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
              {(highlightedIndex === index || isPhonePortrait) &&
                (item.type === SearchItemType.Recent || item.type === SearchItemType.Saved) && (
                  <button
                    type="button"
                    className={styles.deleteIcon}
                    onClick={(e) => deleteSearch(e, item)}
                    title={t('Header.DeleteSearch')}
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
