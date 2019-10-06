import React from 'react';
import { t } from 'app/i18next-t';
import { AppIcon, tagIcon } from '../shell/icons';
import { faClone } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { itemTags, getItemInfoSource, TagValue } from '../inventory/dim-item-info';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { setSearchQuery } from '../shell/actions';
import _ from 'lodash';
import './search-filter.scss';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { SearchConfig, searchFilterSelector, searchConfigSelector } from './search-filters';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2StoresService } from '../inventory/d2-stores';
import { D1StoresService } from '../inventory/d1-stores';
import { DimItem } from '../inventory/item-types';
import { StoreServiceType } from '../inventory/store-types';
import { loadingTracker } from '../shell/loading-tracker';
import SearchFilterInput from './SearchFilterInput';
import { showNotification } from '../notifications/notifications';
import NotificationButton from '../notifications/NotificationButton';
import { CompareService } from '../compare/compare.service';

const bulkItemTags = Array.from(itemTags) as any[];
// t('Tags.TagItems')
// t('Tags.ClearTag')
// t('Tags.LockAll')
// t('Tags.UnlockAll')

bulkItemTags.shift();
bulkItemTags.unshift({ label: 'Tags.TagItems' });
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
        const itemInfoService = await getItemInfoSource(this.props.account!);
        const selectedTagString = bulkItemTags.find(
          (tagInfo) => tagInfo.type && tagInfo.type === selectedTag
        ).label;
        const tagItems = this.getStoresService()
          .getAllItems()
          .filter((i) => i.taggable && this.props.searchFilter(i));
        // existing tags are later passed to buttonEffect so the notif button knows what to revert
        const previousState = tagItems.map((item) => {
          return { item, setTag: item.dimInfo.tag as TagValue | 'clear' | 'lock' | 'unlock' };
        });
        await itemInfoService.bulkSaveByKeys(
          tagItems.map((item) => ({
            key: item.id,
            tag: selectedTag === 'clear' ? undefined : (selectedTag as TagValue)
          }))
        );
        showNotification({
          type: 'success',
          duration: 30000,
          title: t('Header.BulkTag'),
          // t('Filter.BulkClear', { count: tagItems.length })
          // t('Filter.BulkTag', { count: tagItems.length })
          body: (
            <>
              {t(selectedTagString === 'Tags.ClearTag' ? 'Filter.BulkClear' : 'Filter.BulkTag', {
                count: tagItems.length,
                tag: t(selectedTagString)
              })}
              <NotificationButton
                onClick={async () => {
                  await itemInfoService.bulkSaveByKeys(
                    previousState.map(({ item, setTag }) => ({
                      key: item.id,
                      tag: selectedTag === 'clear' ? undefined : (setTag as TagValue)
                    }))
                  );
                  showNotification({
                    type: 'success',
                    title: t('Header.BulkTag'),
                    body: t('Filter.BulkRevert', { count: previousState.length })
                  });
                }}
              >
                <AppIcon icon={faUndo} /> {t('Filter.Undo')}
              </NotificationButton>
            </>
          )
        });
      }
    }
  );

  render() {
    const { isPhonePortrait, mobile, searchConfig, setSearchQuery } = this.props;
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
    this.input.current && this.input.current.focusFilterInput();
  };

  private compareMatching = () => {
    const comparableItems = this.getStoresService()
      .getAllItems()
      .filter(this.props.searchFilter);
    CompareService.addItemsToCompare(comparableItems);
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
  { forwardRef: true }
)(SearchFilter);
