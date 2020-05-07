import './search-filter.scss';

import { AppIcon, disabledIcon, helpIcon, searchIcon } from '../shell/icons';
import React, { Suspense } from 'react';

import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { Loading } from 'app/dim-ui/Loading';
import ReactDOM from 'react-dom';
import { SearchConfig } from './search-filters';
import Sheet from 'app/dim-ui/Sheet';
import Textarea from 'textcomplete/lib/textarea';
import Textcomplete from 'textcomplete/lib/textcomplete';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import { chainComparator, compareBy } from 'app/utils/comparators';

interface ProvidedProps {
  alwaysShowClearButton?: boolean;
  placeholder: string;
  searchConfig: SearchConfig;
  autoFocus?: boolean;
  searchQueryVersion?: number;
  searchQuery?: string;
  /** Children are used as optional extra action buttons when there is a query. */
  children?: React.ReactChild;
  /** TODO: have an initialQuery prop */
  onQueryChanged(query: string): void;
  onClear?(): void;
}

type Props = ProvidedProps;

interface State {
  liveQuery: string;
  filterHelpOpen: boolean;
}

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
  'description'
];

/**
 * A reusable, autocompleting item search input. This is an uncontrolled input that
 * announces its query has changed only after some delay.
 */
export default class SearchFilterInput extends React.Component<Props, State> {
  state: State = { liveQuery: '', filterHelpOpen: false };
  private textcomplete: Textcomplete;
  private inputElement = React.createRef<HTMLInputElement>();
  private debouncedUpdateQuery = _.debounce(this.props.onQueryChanged, 500);

  componentWillUnmount() {
    if (this.textcomplete) {
      this.textcomplete.destroy();
      this.textcomplete = null;
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.searchConfig !== this.props.searchConfig) {
      this.setupTextcomplete();
    }
    if (
      prevProps.searchQueryVersion !== this.props.searchQueryVersion &&
      this.props.searchQuery !== undefined
    ) {
      this.setState({ liveQuery: this.props.searchQuery });
    }
  }

  render() {
    const { alwaysShowClearButton, placeholder, children, autoFocus } = this.props;
    const { liveQuery, filterHelpOpen } = this.state;

    return (
      <div className="search-filter" role="search">
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'f',
              description: t('Hotkey.StartSearch'),
              callback: (event) => {
                this.focusFilterInput();
                event.preventDefault();
                event.stopPropagation();
              }
            },
            {
              combo: 'shift+f',
              description: t('Hotkey.StartSearchClear'),
              callback: (event) => {
                this.clearFilter();
                this.focusFilterInput();
                event.preventDefault();
                event.stopPropagation();
              }
            }
          ]}
        />
        <AppIcon icon={searchIcon} />
        <input
          ref={this.inputElement}
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
          onInput={this.onQueryChange}
          onKeyDown={this.onKeyDown}
          onBlur={() => this.textcomplete?.hide()}
        />

        {liveQuery.length === 0 ? (
          <span onClick={this.showFilterHelp} className="filter-help" title={t('Header.Filters')}>
            <AppIcon icon={helpIcon} />
          </span>
        ) : (
          children
        )}
        {(liveQuery.length > 0 || alwaysShowClearButton) && (
          <span className="filter-help">
            <a onClick={this.clearFilter} title={t('Header.Clear')}>
              <AppIcon icon={disabledIcon} />
            </a>
          </span>
        )}
        {filterHelpOpen &&
          ReactDOM.createPortal(
            <Sheet
              onClose={() => this.setState({ filterHelpOpen: false })}
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
  }

  focusFilterInput = () => {
    this.inputElement.current?.focus();
  };

  clearFilter = () => {
    this.debouncedUpdateQuery('');
    this.setState({ liveQuery: '' });
    this.textcomplete?.trigger('');
    this.props.onClear?.();
  };

  private onQueryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!this.textcomplete) {
      this.setupTextcomplete();
    }
    const query = e.currentTarget.value;
    this.setState({ liveQuery: query });
    this.debouncedUpdateQuery(query);
  };

  private showFilterHelp = () => {
    this.setState({ filterHelpOpen: true });
  };

  private onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 27) {
      e.stopPropagation();
      e.preventDefault();
      this.clearFilter();
    }
  };

  private setupTextcomplete = () => {
    if (!this.inputElement.current) {
      return;
    }

    if (this.textcomplete) {
      this.textcomplete.destroy();
      this.textcomplete = null;
    }
    const editor = new Textarea(this.inputElement.current);
    this.textcomplete = new Textcomplete(editor);
    this.textcomplete.register(
      [
        {
          words: this.props.searchConfig.keywords,
          match: /\b([\w:"']{3,})$/i,
          search(term: string, callback: (terms: string[]) => void) {
            if (term) {
              let words: string[] = term.includes(':') // with a colon, only match from beginning
                ? // ("stat:" matches "stat:" but not "basestat:")
                  this.words.filter((word: string) => word.startsWith(term.toLowerCase()))
                : // ("stat" matches "stat:" and "basestat:")
                  this.words.filter((word: string) => word.includes(term.toLowerCase()));

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
          }
        }
      ],
      {
        zIndex: 1000
      }
    );

    this.textcomplete.on('rendered', () => {
      if (this.textcomplete.dropdown.items.length) {
        // Activate the first item by default
        this.textcomplete.dropdown.items[0].activate();
      }
    });
    this.textcomplete.dropdown.on('select', (selectEvent) => {
      if (selectEvent.detail.searchResult.data.endsWith(':')) {
        setTimeout(() => {
          this.textcomplete.editor.onInput();
        }, 200);
      }
    });
  };
}
