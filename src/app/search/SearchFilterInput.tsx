import * as React from 'react';
import { t } from 'i18next';
import { AppIcon, helpIcon, disabledIcon } from '../shell/icons';
import { itemTags } from '../inventory/dim-item-info';
import * as _ from 'lodash';
import './search-filter.scss';
import Textcomplete from 'textcomplete/lib/textcomplete';
import Textarea from 'textcomplete/lib/textarea';
import { SearchConfig } from './search-filters';
import { $rootScope } from 'ngimport';
import { UISref } from '@uirouter/react';
import { hotkeys } from '../ngimport-more';

const bulkItemTags = Array.from(itemTags) as any[];
bulkItemTags.shift();
bulkItemTags.unshift({ label: 'Tags.TagItems' });
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });
bulkItemTags.push({ type: 'lock', label: 'Tags.LockAll' });
bulkItemTags.push({ type: 'unlock', label: 'Tags.UnlockAll' });

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
  private $scope = $rootScope.$new(true);
  private debouncedUpdateQuery = _.debounce(this.props.onQueryChanged, 500);

  componentDidMount() {
    hotkeys
      .bindTo(this.$scope)
      .add({
        combo: ['f'],
        description: t('Hotkey.StartSearch'),
        callback: (event) => {
          this.focusFilterInput();
          event.preventDefault();
          event.stopPropagation();
        }
      })
      .add({
        combo: ['shift+f'],
        description: t('Hotkey.StartSearchClear'),
        callback: (event) => {
          this.clearFilter();
          this.focusFilterInput();
          event.preventDefault();
          event.stopPropagation();
        }
      })
      .add({
        combo: ['esc'],
        allowIn: ['INPUT'],
        callback: () => {
          this.blurFilterInputIfEmpty();
          this.clearFilter();
        }
      });
  }

  componentWillUnmount() {
    if (this.textcomplete) {
      this.textcomplete.destroy();
      this.textcomplete = null;
    }
    this.$scope.$destroy();
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
      <div className="search-filter">
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
            <a onClick={this.clearFilter}>
              <AppIcon icon={disabledIcon} title={t('Header.Filters')} />
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
              if (term.match(/\b((is:|not:|tag:|notes:|stat:|stack:|count:|source:|perk:)\w*)$/i)) {
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
