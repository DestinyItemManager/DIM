import React from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, tagIcon, faClone } from '../shell/icons';
import { itemTagSelectorList, isTagValue } from '../inventory/dim-item-info';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import { RootState } from '../store/reducers';
import { setSearchQuery } from '../shell/actions';
import _ from 'lodash';
import './search-filter.scss';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { SearchConfig, searchFilterSelector, searchConfigSelector } from './search-filters';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2StoresService } from '../inventory/d2-stores';
import { D1StoresService } from '../inventory/d1-stores';
import { DimItem } from '../inventory/item-types';
import { StoreServiceType } from '../inventory/store-types';
import { loadingTracker } from '../shell/loading-tracker';
import SearchFilterInput from './SearchFilterInput';
import { showNotification } from '../notifications/notifications';
import { CompareService } from '../compare/compare.service';
import { bulkTagItems } from 'app/inventory/tag-items';
import { searchQueryVersionSelector, querySelector } from 'app/shell/reducer';
import { setItemLockState } from 'app/inventory/item-move-service';

// these exist in comments so i18n       t('Tags.TagItems') t('Tags.ClearTag')
// doesn't delete the translations       t('Tags.LockAll') t('Tags.UnlockAll')
const bulkItemTags = Array.from(itemTagSelectorList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });
bulkItemTags.push({ type: 'lock', label: 'Tags.LockAll' });
bulkItemTags.push({ type: 'unlock', label: 'Tags.UnlockAll' });

interface ProvidedProps {
  mobile?: boolean;
  ref?: React.Ref<SearchFilterInput>;
  onClear?(): void;
}

interface StoreProps {
  isPhonePortrait: boolean;
  destinyVersion: 1 | 2;
  account?: DestinyAccount;
  searchConfig: SearchConfig;
  searchQueryVersion: number;
  searchQuery: string;
  searchFilter(item: DimItem): boolean;
}

type DispatchProps = {
  setSearchQuery(query: string): void;
};

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, StoreProps> = (dispatch) => ({
  setSearchQuery: (query) => dispatch(setSearchQuery(query, true))
});

type Props = ProvidedProps & StoreProps & DispatchProps;

interface State {
  showSelect: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    destinyVersion: destinyVersionSelector(state),
    account: currentAccountSelector(state),
    searchConfig: searchConfigSelector(state),
    searchFilter: searchFilterSelector(state),
    searchQuery: querySelector(state),
    searchQueryVersion: searchQueryVersionSelector(state)
  };
}

class SearchFilter extends React.Component<Props, State> {
  state: State = { showSelect: false };
  private input = React.createRef<SearchFilterInput>();

  private bulkTag: React.ChangeEventHandler<HTMLSelectElement> = loadingTracker.trackPromise(
    async (e) => {
      this.setState({ showSelect: false });

      const selectedTag = e.currentTarget.value;

      if (selectedTag === 'lock' || selectedTag === 'unlock') {
        // Bulk locking/unlocking

        const state = selectedTag === 'lock';
        const lockables = this.getStoresService()
          .getAllItems()
          .filter((i) => i.lockable && this.props.searchFilter(i));
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
            lockables[0].getStoresService().touch();
          }
        }
      } else {
        // Bulk tagging
        const tagItems = this.getStoresService()
          .getAllItems()
          .filter((i) => i.taggable && this.props.searchFilter(i));

        if (isTagValue(selectedTag)) {
          bulkTagItems(this.props.account, tagItems, selectedTag);
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
      searchQueryVersion
    } = this.props;
    const { showSelect } = this.state;

    const filteredItems = this.getStoresService()
      .getAllItems()
      .filter(this.props.searchFilter);

    let isComparable = false;
    if (filteredItems.length && !CompareService.dialogOpen) {
      const type = filteredItems[0].typeName;
      isComparable = filteredItems.every((i) => i.typeName === type);
    }

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
    const comparableItems = this.getStoresService()
      .getAllItems()
      .filter(this.props.searchFilter);
    CompareService.addItemsToCompare(comparableItems, false);
  };

  private onTagClicked = () => {
    this.setState({ showSelect: true });
  };

  private onClearFilter = () => {
    this.setState({ showSelect: false });
    this.props.onClear?.();
  };

  private getStoresService = (): StoreServiceType =>
    this.props.destinyVersion === 2 ? D2StoresService : D1StoresService;
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true
})(SearchFilter);
