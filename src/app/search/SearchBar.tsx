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
} from '../shell/icons';
import React, {
  Suspense,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  useMemo,
} from 'react';

import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { Loading } from 'app/dim-ui/Loading';
import ReactDOM from 'react-dom';
import Sheet from 'app/dim-ui/Sheet';
import Textarea from 'textcomplete/lib/textarea';
import Textcomplete from 'textcomplete/lib/textcomplete';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { useDispatch, useSelector } from 'react-redux';
import { searchConfigSelector } from './search-filter';
import { recentSearchesSelector } from 'app/dim-api/selectors';
import { searchUsed } from 'app/dim-api/basic-actions';
import { useCombobox } from 'downshift';
import styles from './SearchBar.m.scss';
import clsx from 'clsx';

/** The autocompleter/dropdown will suggest different types of searches */
const enum SearchItemType {
  /** Searches from your history */
  Recent,
  /** Explicitly saved searches */
  Saved,
  /** Searches suggested by DIM Sync but not part of your history */
  Suggested,
  /** Generated autocomplete searches */
  Autocomplete,
  /** Open help */
  Help,
}

/** An item in the search autocompleter */
interface SearchItem {
  type: SearchItemType;
  /** The suggested query */
  query: string;
  /** An optional part of the query that will be highlighted */
  highlightRange?: [number, number];
  /** Help text */
  helpText?: React.ReactNode;
}

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

/** matches a keyword that's probably a math comparison */
const mathCheck = /[\d<>=]/;

/** if one of these has been typed, stop guessing which filter and just offer this filter's values */
const filterNames = [
  'is',
  'not',
  'tag',
  'notes',
  'stat',
  'stack',
  'count',
  'source',
  'perk',
  'perkname',
  'name',
  'description',
];

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
  const searchConfig = useSelector(searchConfigSelector);
  const recentSearches = useSelector(recentSearchesSelector);

  const textcomplete = useRef<Textcomplete>();
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
    textcomplete.current?.hide();
    if (liveQuery) {
      // save this to the recent searches only on blur
      dispatch(searchUsed(liveQuery));
    }
  };

  const clearFilter = useCallback(() => {
    debouncedUpdateQuery('');
    debouncedUpdateQuery.flush();
    setLiveQuery('');
    textcomplete.current?.trigger('');
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

  // Initial input items are recent searches, from DIM Sync data
  // TODO: this should be a function of query text
  // TODO: don't show results that exactly match the input
  const inputItems: SearchItem[] = useMemo(
    () => [
      ..._.take(
        _.compact([
          liveQuery && {
            type: SearchItemType.Autocomplete,
            query: liveQuery,
          },
          ...recentSearches.map((s) => ({
            type: s.usageCount > 0 ? SearchItemType.Recent : SearchItemType.Suggested,
            query: s.query,
          })),
        ]),
        6
      ),
      // Add an item for opening the filter help
      {
        type: SearchItemType.Help,
        query: liveQuery || '', // use the live query as the text so we don't change text when selecting it
      },
    ],
    [liveQuery, recentSearches]
  );

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
    //isOpen: true,
    inputValue: liveQuery,
    items: inputItems,
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
      } else {
        clearFilter();
      }
    },
  });

  // TODO: remove the textcomplete

  // Set up the textcomplete
  useEffect(() => {
    if (!inputElement.current) {
      return;
    }

    const editor = new Textarea(inputElement.current);
    textcomplete.current = new Textcomplete(editor);
    textcomplete.current.register(
      [
        {
          words: searchConfig.keywords,
          match: /\b([\w:"']{3,})$/i,
          search(term: string, callback: (terms: string[]) => void) {
            if (term) {
              let words: string[] = term.includes(':') // with a colon, only match from beginning
                ? // ("stat:" matches "stat:" but not "basestat:")
                  searchConfig.keywords.filter((word: string) =>
                    word.startsWith(term.toLowerCase())
                  )
                : // ("stat" matches "stat:" and "basestat:")
                  searchConfig.keywords.filter((word: string) => word.includes(term.toLowerCase()));

              words = words.sort(
                chainComparator(
                  // tags are UGC and therefore important
                  compareBy((word: string) => !word.startsWith('tag:')),
                  // prioritize is: & not: because a pair takes up only 2 slots at the top,
                  // vs filters that end in like 8 statnames
                  compareBy((word: string) => !(word.startsWith('is:') || word.startsWith('not:'))),
                  // sort incomplete terms (ending with ':') to the front
                  compareBy((word: string) => !word.endsWith(':')),
                  // sort more-basic incomplete terms (fewer colons) to the front
                  compareBy((word: string) => word.split(':').length),
                  // prioritize strings we are typing the beginning of
                  compareBy((word: string) => word.indexOf(term.toLowerCase()) !== 0),
                  // prioritize words with less left to type
                  compareBy(
                    (word: string) => word.length - (term.length + word.indexOf(term.toLowerCase()))
                  ),
                  // push math operators to the front for things like "masterwork:"
                  compareBy((word: string) => !mathCheck.test(word))
                )
              );
              if (filterNames.includes(term.split(':')[0])) {
                callback(words);
              } else if (words.length) {
                const deDuped = new Set([term, ...words]);
                deDuped.delete(term);
                callback([...deDuped]);
              } else {
                callback([]);
              }
            }
          },
          // TODO: use "template" to include help text
          index: 1,
          replace(word: string) {
            word = word.toLowerCase();
            return word.startsWith('is:') && word.startsWith('not:') ? `${word} ` : word;
          },
        },
      ],
      {
        zIndex: 1000,
      }
    );

    textcomplete.current.on('rendered', () => {
      if (textcomplete.current.dropdown.items.length) {
        // Activate the first item by default
        textcomplete.current.dropdown.items[0].activate();
      }
    });
    textcomplete.current.dropdown.on('select', (selectEvent) => {
      if (selectEvent.detail.searchResult.data.endsWith(':')) {
        setTimeout(() => {
          textcomplete.current.editor.onInput();
        }, 200);
      }
    });

    return () => {
      if (textcomplete.current) {
        textcomplete.current.destroy();
        textcomplete.current = null;
      }
    };
  }, [searchConfig.keywords]);

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLiveQuery(searchQuery);
    }
  }, [searchQueryVersion, searchQuery]);

  // TODO: move the global hotkeys to SearchFilter so they don't apply everywhere
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
        ref={inputElement}
        className="filter-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder={placeholder}
        type="text"
        name="filter"
        {...getInputProps({ onBlur })}
      />

      {liveQuery.length !== 0 && children}

      {(liveQuery.length > 0 || alwaysShowClearButton) && (
        <span className="filter-bar-button" onClick={clearFilter} title={t('Header.Clear')}>
          <AppIcon icon={disabledIcon} />
        </span>
      )}

      <button
        type="button"
        className={styles.openButton}
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
              {item.type === SearchItemType.Help ? t('Header.FilterHelpMenuItem') : item.query}
            </li>
          ))}
      </ul>
    </div>
  );
});
