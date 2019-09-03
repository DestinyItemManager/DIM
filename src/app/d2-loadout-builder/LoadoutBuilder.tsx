import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account.service';
import CharacterSelect from '../character-select/CharacterSelect';
import { Loading } from '../dim-ui/Loading';
import { D2StoresService } from '../inventory/d2-stores.service';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets, isLoadoutBuilderItem } from './generated-sets/utils';
import { ArmorSet, StatTypes, MinMax, ItemsByBucket, LockedMap } from './types';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/reducer';
import { process, filterItems, statKeys } from './process';
import { createSelector } from 'reselect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './generated-sets/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import SearchFilterInput from 'app/search/SearchFilterInput';
import {
  SearchConfig,
  SearchFilters,
  searchConfigSelector,
  searchFiltersConfigSelector
} from 'app/search/search-filters';
import memoizeOne from 'memoize-one';
import styles from './LoadoutBuilder.m.scss';
import LockArmorAndPerks from './LockArmorAndPerks';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { Subscriptions } from 'app/rx-utils';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  stores: DimStore[];
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  defs?: D2ManifestDefinitions;
  searchConfig: SearchConfig;
  filters: SearchFilters;
}

type Props = ProvidedProps & StoreProps;

interface State {
  requirePerks: boolean;
  lockedMap: LockedMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMax }>;
  minimumPower: number;
  query: string;
  statOrder: StatTypes[];
}

function mapStateToProps() {
  const itemsSelector = createSelector(
    storesSelector,
    (
      stores
    ): Readonly<{
      [classType: number]: ItemsByBucket;
    }> => {
      const items: {
        [classType: number]: { [bucketHash: number]: DimItem[] };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !isLoadoutBuilderItem(item)) {
            continue;
          }
          for (const classType of item.classType === DestinyClass.Unknown
            ? [DestinyClass.Hunter, DestinyClass.Titan, DestinyClass.Warlock]
            : [item.classType]) {
            if (!items[classType]) {
              items[classType] = {};
            }
            if (!items[classType][item.bucket.hash]) {
              items[classType][item.bucket.hash] = [];
            }
            items[classType][item.bucket.hash].push(item);
          }
        }
      }

      return items;
    }
  );

  return (state: RootState): StoreProps => {
    return {
      storesLoaded: storesLoadedSelector(state),
      stores: sortedStoresSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait,
      items: itemsSelector(state),
      defs: state.manifest.d2Manifest,
      searchConfig: searchConfigSelector(state),
      filters: searchFiltersConfigSelector(state)
    };
  };
}

/**
 * The Loadout Optimizer screen
 */
export class LoadoutBuilder extends React.Component<Props & UIViewInjectedProps, State> {
  private subscriptions = new Subscriptions();
  private filterItemsMemoized = memoizeOne(filterItems);
  private filterSetsMemoized = memoizeOne(filterGeneratedSets);
  private processMemoized = memoizeOne(process);

  constructor(props: Props) {
    super(props);
    this.state = {
      requirePerks: true,
      lockedMap: {},
      statFilters: {
        Mobility: { min: 0, max: 10 },
        Resilience: { min: 0, max: 10 },
        Recovery: { min: 0, max: 10 }
      },
      minimumPower: 0,
      query: '',
      statOrder: statKeys
    };
  }

  componentDidMount() {
    this.subscriptions.add(
      D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
        if (!stores) {
          return;
        }

        if (!this.state.selectedStoreId) {
          this.onCharacterChanged(stores.find((s) => s.current)!.id);
        }
      }),

      // Disable refreshing stores, since it resets the scroll offset
      refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()))
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const {
      storesLoaded,
      stores,
      isPhonePortrait,
      items,
      defs,
      searchConfig,
      filters
    } = this.props;
    const {
      lockedMap,
      selectedStoreId,
      statFilters,
      minimumPower,
      requirePerks,
      query,
      statOrder
    } = this.state;

    if (!storesLoaded || !defs) {
      return <Loading />;
    }

    const store = selectedStoreId
      ? stores.find((s) => s.id === selectedStoreId)!
      : stores.find((s) => s.current)!;

    if (!items[store.classType]) {
      return <Loading />;
    }

    const filter = filters.filterFunction(query);

    let filteredItems: ItemsByBucket = {};
    let processedSets: readonly ArmorSet[] = [];
    let filteredSets: readonly ArmorSet[] = [];
    let processError;
    try {
      filteredItems = this.filterItemsMemoized(
        items[store.classType],
        requirePerks,
        lockedMap,
        filter
      );
      processedSets = this.processMemoized(filteredItems);
      filteredSets = this.filterSetsMemoized(
        processedSets,
        minimumPower,
        lockedMap,
        statFilters,
        statOrder
      );
    } catch (e) {
      console.error(e);
      processError = e;
    }

    const menuContent = (
      <div className={styles.menuContent}>
        <SearchFilterInput
          searchConfig={searchConfig}
          placeholder={t('LoadoutBuilder.SearchPlaceholder')}
          onQueryChanged={this.onQueryChanged}
        />

        <FilterBuilds
          sets={processedSets}
          selectedStore={store as D2Store}
          minimumPower={minimumPower}
          stats={statFilters}
          onMinimumPowerChanged={this.onMinimumPowerChanged}
          onStatFiltersChanged={this.onStatFiltersChanged}
          defs={defs}
          order={statOrder}
          onStatOrderChanged={this.onStatOrderChanged}
        />

        <LockArmorAndPerks
          items={filteredItems}
          selectedStore={store}
          lockedMap={lockedMap}
          onLockedMapChanged={this.onLockedMapChanged}
        />
      </div>
    );

    return (
      <PageWithMenu className={styles.page}>
        <PageWithMenu.Menu className={styles.menu}>
          <CharacterSelect
            selectedStore={store}
            stores={stores}
            vertical={!isPhonePortrait}
            isPhonePortrait={isPhonePortrait}
            onCharacterChanged={this.onCharacterChanged}
          />
          {isPhonePortrait ? (
            <CollapsibleTitle sectionId="lb-filter" title={t('LoadoutBuilder.Filter')}>
              {menuContent}
            </CollapsibleTitle>
          ) : (
            menuContent
          )}
        </PageWithMenu.Menu>

        <PageWithMenu.Contents>
          {processError ? (
            <div className="dim-error">
              <h2>{t('ErrorBoundary.Title')}</h2>
              <div>{processError.message}</div>
            </div>
          ) : processedSets.length === 0 && requirePerks ? (
            <>
              <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>
              <button className="dim-button" onClick={this.setRequiredPerks}>
                {t('LoadoutBuilder.RequirePerks')}
              </button>
            </>
          ) : (
            <GeneratedSets
              sets={filteredSets}
              isPhonePortrait={isPhonePortrait}
              lockedMap={lockedMap}
              selectedStore={store}
              onLockedMapChanged={this.onLockedMapChanged}
              defs={defs}
              statOrder={statOrder}
            />
          )}
        </PageWithMenu.Contents>

        <LoadoutDrawer />
      </PageWithMenu>
    );
  }

  /**
   * Recomputes matched sets and includes items without additional perks
   */
  private setRequiredPerks = () => {
    this.setState({ requirePerks: false });
  };

  /**
   * Handle when selected character changes
   * Recomputes matched sets
   */
  private onCharacterChanged = (storeId: string) => {
    this.setState({
      selectedStoreId: storeId,
      lockedMap: {},
      requirePerks: true,
      statFilters: {
        Mobility: { min: 0, max: 10 },
        Resilience: { min: 0, max: 10 },
        Recovery: { min: 0, max: 10 }
      },
      minimumPower: 0
    });
  };

  private onStatFiltersChanged = (statFilters: State['statFilters']) =>
    this.setState({ statFilters });

  private onMinimumPowerChanged = (minimumPower: number) => this.setState({ minimumPower });

  private onQueryChanged = (query: string) => this.setState({ query });

  private onStatOrderChanged = (statOrder: StatTypes[]) => this.setState({ statOrder });

  private onLockedMapChanged = (lockedMap: State['lockedMap']) => this.setState({ lockedMap });
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
