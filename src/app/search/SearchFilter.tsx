import * as React from 'react';
import { t } from 'i18next';
import { AppIcon, tagIcon } from '../shell/icons';
import { itemTags, getItemInfoSource, TagValue } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { setSearchQuery } from '../shell/actions';
import * as _ from 'lodash';
import { toaster } from '../ngimport-more';
import './search-filter.scss';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { SearchConfig, searchFilterSelector, searchConfigSelector } from './search-filters';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D2StoresService } from '../inventory/d2-stores.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { DimItem } from '../inventory/item-types';
import { StoreServiceType } from '../inventory/store-types';
import { loadingTracker } from '../shell/loading-tracker';
import SearchFilterInput from './SearchFilterInput';

const bulkItemTags = Array.from(itemTags) as any[];
bulkItemTags.shift();
bulkItemTags.unshift({ label: 'Tags.TagItems' });
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });
bulkItemTags.push({ type: 'lock', label: 'Tags.LockAll' });
bulkItemTags.push({ type: 'unlock', label: 'Tags.UnlockAll' });

interface ProvidedProps {
  mobile?: boolean;
  onClear?(): void;
}

interface StoreProps {
  isPhonePortrait: boolean;
  destinyVersion: 1 | 2;
  account?: DestinyAccount;
  searchConfig: SearchConfig;
  searchFilter(item: DimItem): boolean;
}

const mapDispatchToProps = {
  setSearchQuery
};

type DispatchProps = typeof mapDispatchToProps;

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
    searchFilter: searchFilterSelector(state)
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
            const store =
              item.owner === 'vault'
                ? item.getStoresService().getActiveStore()!
                : item.getStoresService().getStore(item.owner)!;

            if (item.isDestiny2()) {
              await d2SetLockState(store, item, state);
            } else if (item.isDestiny1()) {
              await d1SetItemState(item, store, state, 'lock');
            }

            // TODO: Gotta do this differently in react land
            item.locked = state;
          }
          toaster.pop(
            'success',
            t(state ? 'Filter.LockAllSuccess' : 'Filter.UnlockAllSuccess', {
              num: lockables.length
            })
          );
        } catch (e) {
          toaster.pop(
            'error',
            t(state ? 'Filter.LockAllFailed' : 'Filter.UnlockAllFailed'),
            e.message
          );
        } finally {
          // Touch the stores service to update state
          if (lockables.length) {
            lockables[0].getStoresService().touch();
          }
        }
      } else {
        // Bulk tagging
        const itemInfoService = await getItemInfoSource(this.props.account!);
        const tagItems = this.getStoresService()
          .getAllItems()
          .filter((i) => i.taggable && this.props.searchFilter(i));
        await itemInfoService.bulkSave(
          tagItems.map((item) => {
            item.dimInfo.tag = selectedTag === 'clear' ? undefined : (selectedTag as TagValue);
            return item;
          })
        );
      }
    }
  );

  render() {
    const { isPhonePortrait, mobile, searchConfig, setSearchQuery } = this.props;
    const { showSelect } = this.state;

    // TODO: since we no longer take in the query as a prop, we can't set it from outside (filterhelp, etc)

    const placeholder = isPhonePortrait
      ? t('Header.FilterHelpBrief')
      : t('Header.FilterHelp', { example: 'is:dupe' });

    return (
      <SearchFilterInput
        ref={this.input}
        onQueryChanged={setSearchQuery}
        alwaysShowClearButton={mobile}
        placeholder={placeholder}
        searchConfig={searchConfig}
        onClear={this.clearFilter}
      >
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
      </SearchFilterInput>
    );
  }

  focusFilterInput = () => {
    this.input.current && this.input.current.focusFilterInput();
  };

  private onTagClicked = () => {
    this.setState({ showSelect: true });
  };

  private clearFilter = () => {
    this.setState({ showSelect: false });
    this.props.onClear && this.props.onClear();
  };

  private getStoresService = (): StoreServiceType => {
    return this.props.destinyVersion === 2 ? D2StoresService : D1StoresService;
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { withRef: true }
)(SearchFilter);
