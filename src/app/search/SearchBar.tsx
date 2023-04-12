import { Search } from '@destinyitemmanager/dim-api-types';
import BungieImage from 'app/dim-ui/BungieImage';
import KeyHelp from 'app/dim-ui/KeyHelp';
import { Loading } from 'app/dim-ui/Loading';
import Sheet from 'app/dim-ui/Sheet';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import {
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
} from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Portal } from 'app/utils/temp-container';
import clsx from 'clsx';
import { UseComboboxState, UseComboboxStateChangeOptions, useCombobox } from 'downshift';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import _ from 'lodash';
import {
  Suspense,
  forwardRef,
  lazy,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import HighlightedText from './HighlightedText';
import styles from './SearchBar.m.scss';
import { SearchItem, SearchItemType } from './autocomplete';
import { canonicalizeQuery, parseQuery } from './query-parser';
import { validateQuerySelector } from './search-filter';

interface Props {
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
  recentSearches: Search[];
  validateQuery: ReturnType<typeof validateQuerySelector>;
  /** Fired whenever the query changes (already debounced) */
  onQueryChanged: (query: string) => void;
  onSearchUsed: (liveQuery: string) => void;
  onSetQuerySaved: (query: string, saved: boolean) => void;
  onSearchDeleted: (query: string) => void;
  onToggleSearchResults: () => void;
  /** Special handling for enter keydown on search items. Not every event needs to be handled. */
  onInputEnterDown: (searchItem: SearchItem) => { keepSelectedItem: boolean };
  /** Fired whenever the query has been cleared */
  onClear?: () => void;
  autocompleter: (query: string, caretIndex: number, recentSearches: Search[]) => SearchItem[];
}

/** An interface for interacting with the search filter through a ref */
export interface SearchFilterRef {
  /** Switch focus to the filter field */
  focusFilterInput: () => void;
  /** Clear the filter field */
  clearFilter: () => void;
}

const searchItemIcons: { [key in SearchItemType]: string } = {
  [SearchItemType.Recent]: faClock,
  [SearchItemType.Saved]: starIcon,
  [SearchItemType.Suggested]: unTrackedIcon, // TODO: choose a real icon
  [SearchItemType.Autocomplete]: searchIcon, // TODO: choose a real icon
  [SearchItemType.Help]: helpIcon,
  [SearchItemType.ArmoryEntry]: helpIcon, // TODO: remove armory knowledge from this as it is item item specific
};

const LazyFilterHelp = lazy(() => import(/* webpackChunkName: "filter-help" */ './FilterHelp'));

const RowContents = memo(({ item }: { item: SearchItem }) => {
  function highlight(text: string, section: string) {
    return item.highlightRange?.section === section ? (
      <HighlightedText
        text={text}
        startIndex={item.highlightRange.range[0]}
        endIndex={item.highlightRange.range[1]}
        className={styles.textHighlight}
      />
    ) : (
      text
    );
  }

  switch (item.type) {
    case SearchItemType.Help:
      return <>{t('Header.FilterHelpMenuItem')}</>;
    case SearchItemType.ArmoryEntry:
      // TODO: remove armory knowledge from this as it is item item specific
      return (
        <>
          {item.armoryItem.name}
          <span className={styles.openInArmoryLabel}>{` - ${t('Armory.OpenInArmory')}`}</span>
          <span className={styles.namedQueryBody}>
            {`${item.armoryItem.seasonName} (${t('Armory.Season', {
              season: item.armoryItem.season,
              year: item.armoryItem.year,
            })})`}
          </span>
        </>
      );
    default:
      return (
        <>
          {item.query.header && highlight(item.query.header, 'header')}
          <span
            className={clsx({
              [styles.namedQueryBody]: item.query.header !== undefined,
            })}
          >
            {highlight(item.query.body, 'body')}
          </span>
        </>
      );
  }
});

const Row = memo(
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
    onClick: (e: React.MouseEvent, item: SearchItem) => void;
  }) => (
    <>
      {/* TODO: remove armory knowledge from this component as it is item specific */}
      {item.type === SearchItemType.ArmoryEntry ? (
        <BungieImage className={styles.armoryItemIcon} src={item.armoryItem.icon} />
      ) : (
        <AppIcon className={styles.menuItemIcon} icon={searchItemIcons[item.type]} />
      )}
      <p className={styles.menuItemQuery}>
        <RowContents item={item} />
      </p>
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

export const SearchBar = forwardRef(function SearchBar(
  {
    searchQueryVersion,
    searchQuery,
    mainSearchBar,
    placeholder,
    children,
    onQueryChanged,
    onSearchUsed,
    onSetQuerySaved,
    onSearchDeleted,
    onToggleSearchResults,
    onInputEnterDown,
    instant,
    onClear,
    validateQuery,
    autocompleter,
    recentSearches,
    className,
    menu,
  }: Props,
  ref: React.Ref<SearchFilterRef>
) {
  const isPhonePortrait = useIsPhonePortrait();

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus = !mainSearchBar && !isPhonePortrait && !isiOSBrowser();

  const [liveQueryLive, setLiveQuery] = useState(searchQuery ?? '');
  const [filterHelpOpen, setFilterHelpOpen] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState<undefined | number>();
  const inputElement = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQuery = useCallback(
    instant
      ? onQueryChanged
      : _.debounce((query: string) => {
          onQueryChanged(query);
        }, 500),
    [onQueryChanged]
  );

  const liveQuery = useDeferredValue(liveQueryLive);

  const { valid, saveable } = validateQuery(liveQuery);

  const lastBlurQuery = useRef<string>();
  const onBlur = () => {
    if (valid && liveQuery && liveQuery !== lastBlurQuery.current) {
      // save this to the recent searches only on blur
      // we use the ref to only fire if the query changed since the last blur
      // dispatch(searchUsed(liveQuery));
      onSearchUsed(liveQuery);
      lastBlurQuery.current = liveQuery;
    }
  };

  // Is the current search saved?
  const canonical = liveQuery ? canonicalizeQuery(parseQuery(liveQuery)) : '';
  const saved = canonical ? recentSearches.find((s) => s.query === canonical)?.saved : false;

  const toggleSaved = () => {
    // TODO: keep track of the last search, if you search for something more narrow immediately after then replace?
    onSetQuerySaved(liveQuery, !saved);
  };

  const caretPosition = inputElement.current?.selectionStart || liveQuery.length;
  const items = useMemo(
    () => autocompleter(liveQuery, caretPosition, recentSearches),
    [autocompleter, caretPosition, liveQuery, recentSearches]
  );

  // special click handling for filter helper
  const stateReducer = (
    state: UseComboboxState<SearchItem>,
    actionAndChanges: UseComboboxStateChangeOptions<SearchItem>
  ) => {
    const { type, changes } = actionAndChanges;
    switch (type) {
      // FIXME: Do not act on focus because it interacts badly with autofocus
      // Downshift will likely switch away from using focus because too
      // https://github.com/downshift-js/downshift/issues/1439
      // (Also see onFocus below)
      case useCombobox.stateChangeTypes.InputFocus:
        return state;
      case useCombobox.stateChangeTypes.ItemClick:
      case useCombobox.stateChangeTypes.InputKeyDownEnter: {
        if (!changes.selectedItem) {
          return changes;
        }
        // Allows us to keep the previously selected item in the event a help like item was selected
        let keepSelectedItem = false;
        if (changes.selectedItem.type === SearchItemType.Help) {
          setFilterHelpOpen(true);
          keepSelectedItem = true;
        } else if (changes.selectedItem) {
          ({ keepSelectedItem } = onInputEnterDown(changes.selectedItem));
        }
        if (keepSelectedItem) {
          // helper click, open FilterHelper and modify state
          return {
            ...changes,
            selectedItem: state.selectedItem, // keep the last selected item (i.e. the edit field stays unchanged)
          };
        }
        return changes;
      }
      default:
        return changes; // no handling for other types
    }
  };

  // useCombobox from Downshift manages the state of the dropdown
  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getLabelProps,
    highlightedIndex,
    getItemProps,
    setInputValue,
    reset: clearFilter,
    openMenu,
  } = useCombobox<SearchItem>({
    items,
    stateReducer,
    initialInputValue: liveQuery,
    initialIsOpen: isPhonePortrait && mainSearchBar,
    defaultHighlightedIndex: liveQuery ? 0 : -1,
    itemToString: (i) => i?.query.fullText || '',
    onInputValueChange: ({ inputValue, type }) => {
      setLiveQuery(inputValue || '');
      debouncedUpdateQuery(inputValue || '');
      if (type === useCombobox.stateChangeTypes.FunctionReset) {
        onClear?.();
      }
    },
  });

  // FIXME: Maybe follow suit when Downshift changes opening behavior to
  // just use clicks and not focus (see stateReducer above)
  const onFocus = () => {
    if (!liveQuery && !isOpen && !autoFocus) {
      openMenu();
    }
  };

  // Reset live query when search version changes
  useEffect(() => {
    if (searchQuery !== undefined && (searchQueryVersion || 0) > 0) {
      setInputValue(searchQuery);
    }
    // This should only happen when the query version changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQueryVersion]);

  // Determine a maximum height for the results menu
  useEffect(() => {
    if (inputElement.current && window.visualViewport) {
      const { y, height } = inputElement.current.getBoundingClientRect();
      const { height: viewportHeight } = window.visualViewport;
      // pixels remaining in viewport minus offset minus 10px for padding
      const pxAvailable = viewportHeight - y - height - 10;
      const resultItemHeight = 30;

      // constrain to size that would allow only whole items to be seen
      setMenuMaxHeight(Math.floor(pxAvailable / resultItemHeight) * resultItemHeight);
    }
  }, [isOpen]);

  const deleteSearch = useCallback(
    (e: React.MouseEvent, item: SearchItem) => {
      e.stopPropagation();
      onSearchDeleted(item.query.fullText);
    },
    [onSearchDeleted]
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

  // Implement tab completion on the tab key. If the highlighted item is an autocomplete suggestion,
  // accept it. Otherwise, we scan from the beginning to find the first autocomplete suggestion and
  // accept that. If there's nothing to accept, the tab key does its normal thing, which is to switch
  // focus. The tabAutocompleteItem is computed as part of render so we can offer keyboard help.
  const tabAutocompleteItem =
    highlightedIndex > 0 && items[highlightedIndex]?.type === SearchItemType.Autocomplete
      ? items[highlightedIndex]
      : items.find((s) => s.type === SearchItemType.Autocomplete && s.query.fullText !== liveQuery);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && tabAutocompleteItem && isOpen) {
      e.preventDefault();
      if (inputElement.current) {
        // Use execCommand to make the insertion as if the user typed it, so it can be undone with Ctrl-Z
        inputElement.current.setSelectionRange(0, inputElement.current.value.length);
        document.execCommand('insertText', false, tabAutocompleteItem.query.fullText);
        if (tabAutocompleteItem.highlightRange) {
          const cursorPos = tabAutocompleteItem.highlightRange.range[1];
          inputElement.current.setSelectionRange(cursorPos, cursorPos);
        }
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
      onSearchDeleted(items[highlightedIndex].query.fullText);
    } else if (e.key === 'Enter' && !isOpen && liveQuery) {
      // Show search results on "Enter" with a closed menu
      onToggleSearchResults();
    }
  };

  const autocompleteMenu = useMemo(
    () => (
      <ul
        {...getMenuProps()}
        className={styles.menu}
        style={{
          maxHeight: menuMaxHeight,
        }}
      >
        {isOpen &&
          items.map((item, index) => (
            <li
              className={clsx(styles.menuItem, {
                [styles.highlightedItem]: highlightedIndex === index,
              })}
              key={`${item.type}${item.query.fullText}${
                item.type === SearchItemType.ArmoryEntry && item.armoryItem.hash
              }`}
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
    ),
    [
      deleteSearch,
      getItemProps,
      getMenuProps,
      highlightedIndex,
      isOpen,
      isPhonePortrait,
      items,
      tabAutocompleteItem,
      menuMaxHeight,
    ]
  );

  return (
    <>
      <div
        className={clsx(className, 'search-filter', styles.searchBar, { [styles.open]: isOpen })}
        role="search"
      >
        <AppIcon icon={searchIcon} className="search-bar-icon" {...getLabelProps()} />
        <input
          {...getInputProps({
            onBlur,
            onFocus,
            onKeyDown,
            ref: inputElement,
            className: clsx({ [styles.invalid]: !valid }),
            autoComplete: 'off',
            autoCorrect: 'off',
            autoCapitalize: 'off',
            spellCheck: false,
            autoFocus,
            placeholder,
            type: 'text',
            name: 'filter',
          })}
          enterKeyHint="search"
        />
        <LayoutGroup>
          <AnimatePresence>
            {children}

            {liveQuery.length > 0 && (saveable || saved) && !isPhonePortrait && (
              <motion.button
                layout
                exit={{ scale: 0 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key="save"
                type="button"
                className={clsx(styles.filterBarButton, styles.saveSearchButton)}
                onClick={toggleSaved}
                title={t('Header.SaveSearch')}
              >
                <AppIcon icon={saved ? starIcon : starOutlineIcon} />
              </motion.button>
            )}

            {(liveQuery.length > 0 || (isPhonePortrait && mainSearchBar)) && (
              <motion.button
                layout
                exit={{ scale: 0 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key="clear"
                type="button"
                className={styles.filterBarButton}
                onClick={clearFilter}
                title={t('Header.Clear')}
              >
                <AppIcon icon={disabledIcon} />
              </motion.button>
            )}

            {menu}

            <motion.button
              layout
              key="menu"
              type="button"
              className={clsx(styles.filterBarButton, styles.openButton)}
              {...getToggleButtonProps()}
              aria-label="toggle menu"
            >
              <AppIcon icon={isOpen ? moveUpIcon : moveDownIcon} />
            </motion.button>
          </AnimatePresence>
        </LayoutGroup>

        {filterHelpOpen && (
          <Portal>
            <Sheet
              onClose={() => setFilterHelpOpen(false)}
              header={
                <>
                  <h1>{t('Header.Filters')}</h1>
                  <UserGuideLink topic="Item-Search" />
                </>
              }
              freezeInitialHeight
              sheetClassName={styles.filterHelp}
            >
              <Suspense fallback={<Loading message={t('Loading.FilterHelp')} />}>
                <LazyFilterHelp />
              </Suspense>
            </Sheet>
          </Portal>
        )}

        {autocompleteMenu}
      </div>
    </>
  );
});
