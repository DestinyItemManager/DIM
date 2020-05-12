import React from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, tagIcon, faClone } from '../shell/icons';
import { itemTagSelectorList, isTagValue, TagValue } from '../inventory/dim-item-info';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import { RootState } from '../store/reducers';
import { setSearchQuery } from '../shell/actions';
import _ from 'lodash';
import './search-filter.scss';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { SearchConfig, searchFilterSelector, searchConfigSelector } from './search-filters';
import { DestinyAccount } from '../accounts/destiny-account';
import { DimItem } from '../inventory/item-types';
import { loadingTracker } from '../shell/loading-tracker';
import SearchFilterInput from './SearchFilterInput';
import { showNotification } from '../notifications/notifications';
import { CompareService } from '../compare/compare.service';
import { bulkTagItems } from 'app/inventory/tag-items';
import { searchQueryVersionSelector, querySelector } from 'app/shell/reducer';
import { setItemLockState } from 'app/inventory/item-move-service';
import { storesSelector } from 'app/inventory/selectors';
import { getAllItems } from 'app/inventory/stores-helpers';
import { touch } from 'app/inventory/actions';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';

// these exist in comments so i18n       t('Tags.TagItems') t('Tags.ClearTag')
// doesn't delete the translations       t('Tags.LockAll') t('Tags.UnlockAll')
const bulkItemTags = Array.from(itemTagSelectorList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });
bulkItemTags.push({ type: 'lock', label: 'Tags.LockAll' });
bulkItemTags.push({ type: 'unlock', label: 'Tags.UnlockAll' });

interface ProvidedProps {
  mobile?: boolean;
  onClear?(): void;
}

interface StoreProps {
  isPhonePortrait: boolean;
  destinyVersion: DestinyVersion;
  account?: DestinyAccount;
  searchConfig: SearchConfig;
  searchQueryVersion: number;
  searchQuery: string;
  filteredItems: DimItem[];
  isComparable: boolean;
  searchFilter(item: DimItem): boolean;
}

type DispatchProps = {
  setSearchQuery(query: string): void;
  bulkTagItems(items: DimItem[], tag: TagValue): void;
  touchStores(): void;
};

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, StoreProps> = (dispatch) => ({
  setSearchQuery: (query) => dispatch(setSearchQuery(query, true)),
  bulkTagItems: (items, tag) => dispatch(bulkTagItems(items, tag) as any),
  touchStores: touch
});

type Props = ProvidedProps & StoreProps & DispatchProps;

interface State {
  showSelect: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  const searchFilter = searchFilterSelector(state);
  // TODO: Narrow this down by screen?
  const filteredItems = getAllItems(storesSelector(state), searchFilter);

  let isComparable = false;
  if (filteredItems.length && !CompareService.dialogOpen) {
    const type = filteredItems[0].typeName;
    isComparable = filteredItems.every((i) => i.typeName === type);
  }

  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    destinyVersion: destinyVersionSelector(state),
    account: currentAccountSelector(state),
    searchConfig: searchConfigSelector(state),
    searchFilter,
    searchQuery: querySelector(state),
    searchQueryVersion: searchQueryVersionSelector(state),
    filteredItems,
    isComparable
  };
}

export class SearchFilter extends React.Component<Props, State> {
  state: State = { showSelect: false };
  private input = React.createRef<SearchFilterInput>();

  private bulkTag: React.ChangeEventHandler<HTMLSelectElement> = loadingTracker.trackPromise(
    async (e) => {
      this.setState({ showSelect: false });

      const selectedTag = e.currentTarget.value;

      if (selectedTag === 'lock' || selectedTag === 'unlock') {
        // Bulk locking/unlocking

        const state = selectedTag === 'lock';
        const lockables = this.props.filteredItems.filter((i) => i.lockable);
        try {
          for (const item of lockables) {
            await setItemLockState(item, state);

            // TODO: Gotta do this differently in react land
            item.locked = state;
          }
          showNotification({
            type: 'success',
            title: state
              ? t('Filter.LockAllSuccess', { num: lockables.length })
              : t('Filter.UnlockAllSuccess', { num: lockables.length })
          });
        } catch (e) {
          showNotification({
            type: 'error',
            title: state ? t('Filter.LockAllFailed') : t('Filter.UnlockAllFailed'),
            body: e.message
          });
        } finally {
          // Touch the stores service to update state
          if (lockables.length) {
            this.props.touchStores();
          }
        }
      } else {
        // Bulk tagging
        const tagItems = this.props.filteredItems.filter((i) => i.taggable);

        if (isTagValue(selectedTag)) {
          this.props.bulkTagItems(tagItems, selectedTag);
        }
      }
    }
  );

  render() {
    const {
      isPhonePortrait,
      mobile,
      searchConfig,
      setSearchQuery,
      searchQuery,
      searchQueryVersion,
      filteredItems,
      isComparable
    } = this.props;
    const { showSelect } = this.state;

    // TODO: since we no longer take in the query as a prop, we can't set it from outside (filterhelp, etc)

    const placeholder = isPhonePortrait
      ? t('Header.FilterHelpBrief')
      : t('Header.FilterHelp', { example: 'is:dupe, is:maxpower, not:blue' });

    return (
      <SearchFilterInput
        ref={this.input}
        onQueryChanged={setSearchQuery}
        alwaysShowClearButton={mobile}
        placeholder={placeholder}
        searchConfig={searchConfig}
        onClear={this.onClearFilter}
        searchQueryVersion={searchQueryVersion}
        searchQuery={searchQuery}
      >
        <>
          <span className="filter-match-count">
            {t('Header.FilterMatchCount', { count: filteredItems.length })}
          </span>
          {isComparable && (
            <span className="filter-help">
              <a onClick={this.compareMatching}>
                <AppIcon icon={faClone} title={t('Header.CompareMatching')} />
              </a>
            </span>
          )}
          <span className="filter-help">
            {showSelect ? (
              <select className="bulk-tag-select" onChange={this.bulkTag}>
                {bulkItemTags.map((tag) => (
                  <option key={tag.type || 'default'} value={tag.type}>
                    {t(tag.label)}
                  </option>
                ))}
              </select>
            ) : (
              <a onClick={this.onTagClicked}>
                <AppIcon icon={tagIcon} title={t('Header.BulkTag')} />
              </a>
            )}
          </span>
        </>
      </SearchFilterInput>
    );
  }

  focusFilterInput = () => {
    this.input.current?.focusFilterInput();
  };

  clearFilter = () => {
    this.input.current?.clearFilter();
  };

  private compareMatching = () => {
    CompareService.addItemsToCompare(this.props.filteredItems, false);
  };

  private onTagClicked = () => {
    this.setState({ showSelect: true });
  };

  private onClearFilter = () => {
    this.setState({ showSelect: false });
    this.props.onClear?.();
  };
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true
})(SearchFilter);
