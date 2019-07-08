import React from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, helpIcon, disabledIcon, searchIcon } from '../shell/icons';
import _ from 'lodash';
import './search-filter.scss';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { SearchConfig } from './search-filters';
import { UISref } from '@uirouter/react';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';

interface ProvidedProps {
  alwaysShowClearButton?: boolean;
  placeholder: string;
  searchConfig: SearchConfig;
  /** Children are used as optional extra action buttons when there is a query. */
  children?: React.ReactChild;
  /** TODO: have an initialQuery prop */
  onQueryChanged(query: string): void;
  onClear?(): void;
}

type Props = ProvidedProps;

interface State {
  liveQuery: string;
}

/**
 * A reusable, autocompleting item search input. This is an uncontrolled input that
 * announces its query has changed only after some delay.
 */
export default class SearchFilterInput extends React.Component<Props, State> {
  state: State = { liveQuery: '' };
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
  }

  render() {
    const { alwaysShowClearButton, placeholder, children } = this.props;
    const { liveQuery } = this.state;

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
            },
            {
              combo: 'esc',
              description: t('Hotkey.ClearSearch'),
              allowIn: ['INPUT'],
              callback: () => {
                this.blurFilterInputIfEmpty();
                this.clearFilter();
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
          placeholder={placeholder}
          type="text"
          name="filter"
          value={liveQuery}
          onChange={() => {
            return;
          }}
          onInput={this.onQueryChange}
        />

        {liveQuery.length === 0 ? (
          <UISref to="filters">
            <span className="filter-help" title={t('Header.Filters')}>
              <AppIcon icon={helpIcon} />
            </span>
          </UISref>
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
      </div>
    );
  }

  focusFilterInput = () => {
    this.inputElement.current && this.inputElement.current.focus();
  };

  private blurFilterInputIfEmpty = () => {
    if (this.state.liveQuery === '') {
      this.blurFilterInput();
    }
  };

  private blurFilterInput = () => {
    this.inputElement.current && this.inputElement.current.blur();
  };

  private onQueryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!this.textcomplete) {
      this.setupTextcomplete();
    }
    const query = e.currentTarget.value;
    this.setState({ liveQuery: query });
    this.debouncedUpdateQuery(query);
  };

  private clearFilter = () => {
    this.props.onQueryChanged('');
    this.setState({ liveQuery: '' });
    this.textcomplete && this.textcomplete.trigger('');
    this.props.onClear && this.props.onClear();
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
          search(term, callback) {
            if (term) {
              let words = this.words.filter((word: string) => word.includes(term.toLowerCase()));
              words = _.sortBy(words, (word: string) => word.indexOf(term.toLowerCase()));
              if (
                term.match(
                  /\b((is:|not:|tag:|notes:|stat:|stack:|count:|source:|perk:|perkname:|name:|description:)\w*)$/i
                )
              ) {
                callback(words);
              } else if (words.length) {
                callback([term, ...words]);
              } else {
                callback([]);
              }
            }
          },
          // TODO: use "template" to include help text
          index: 1,
          replace(word) {
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
        // Activate the first item by default.
        this.textcomplete.dropdown.items[0].activate();
      }
    });
  };
}
