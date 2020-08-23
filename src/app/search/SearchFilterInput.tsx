import './search-filter.scss';

import { AppIcon, disabledIcon, helpIcon, searchIcon } from '../shell/icons';
import React, {
  Suspense,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
} from 'react';

import { Loading } from 'app/dim-ui/Loading';
import ReactDOM from 'react-dom';
import { searchConfigSelector } from './search-config';
import Sheet from 'app/dim-ui/Sheet';
import Textarea from 'textcomplete/lib/textarea';
import Textcomplete from 'textcomplete/lib/textcomplete';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { useSelector } from 'react-redux';

interface ProvidedProps {
  /** Whether the "X" button that clears the selection should always be shown. */
  alwaysShowClearButton?: boolean;
  /** Placeholder text when nothing has been typed */
  placeholder: string;
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
 * announces its query has changed only after some delay.
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

  const searchConfig = useSelector(searchConfigSelector);
  const textcomplete = useRef<Textcomplete>();
  const inputElement = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQuery = useCallback(_.debounce(onQueryChanged, 500), [onQueryChanged]);

  const focusFilterInput = useCallback(() => {
    inputElement.current?.focus();
  }, []);

  const clearFilter = useCallback(() => {
    debouncedUpdateQuery('');
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

  const onQueryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const query = e.currentTarget.value;
    setLiveQuery(query);
    debouncedUpdateQuery(query);
  };

  const showFilterHelp = () => setFilterHelpOpen(true);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 27) {
      e.stopPropagation();
      e.preventDefault();
      clearFilter();
    }
  };

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

  return (
    <div className="search-filter" role="search">
      <AppIcon icon={searchIcon} className="search-bar-icon" />
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
        value={liveQuery}
        onChange={_.noop}
        onInput={onQueryChange}
        onKeyDown={onKeyDown}
        onBlur={() => textcomplete.current?.hide()}
      />

      {liveQuery.length !== 0 && children}

      <span onClick={showFilterHelp} className="filter-bar-button" title={t('Header.Filters')}>
        <AppIcon icon={helpIcon} />
      </span>

      {(liveQuery.length > 0 || alwaysShowClearButton) && (
        <span className="filter-bar-button" onClick={clearFilter} title={t('Header.Clear')}>
          <AppIcon icon={disabledIcon} />
        </span>
      )}
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
    </div>
  );
});
