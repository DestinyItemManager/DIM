import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { D2StoresService } from '../inventory/d2-stores';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets, isLoadoutBuilderItem } from './generated-sets/utils';
import {
  ArmorSet,
  StatTypes,
  ItemsByBucket,
  LockedMap,
  MinMaxIgnored,
  LockedArmor2ModMap,
  ModPickerCategories
} from './types';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/selectors';
import { process, filterItems, statKeys } from './process';
import { createSelector } from 'reselect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './generated-sets/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
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
import { Subscriptions } from 'app/utils/rx-utils';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import ErrorPanel from 'app/shell/ErrorPanel';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

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
  lockedMap: LockedMap;
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
  query: string;
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
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

  return (state: RootState): StoreProps => ({
    storesLoaded: storesLoadedSelector(state),
    stores: sortedStoresSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    items: itemsSelector(state),
    defs: state.manifest.d2Manifest,
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state)
  });
}

/**
 * The Loadout Optimizer screen
 */
class LoadoutBuilder extends React.Component<Props, State> {
  private subscriptions = new Subscriptions();
  private filterItemsMemoized = memoizeOne(filterItems);
  private filterSetsMemoized = memoizeOne(filterGeneratedSets);
  private processMemoized = memoizeOne(process);
  private getEnabledStats = memoizeOne(
    (statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>) =>
      new Set(statKeys.filter((statType) => !statFilters[statType].ignored))
  );

  constructor(props: Props) {
    super(props);
    this.state = {
      lockedMap: {},
      statFilters: {
        Mobility: { min: 0, max: 10, ignored: false },
        Resilience: { min: 0, max: 10, ignored: false },
        Recovery: { min: 0, max: 10, ignored: false },
        Discipline: { min: 0, max: 10, ignored: false },
        Intellect: { min: 0, max: 10, ignored: false },
        Strength: { min: 0, max: 10, ignored: false }
      },
      lockedArmor2Mods: {
        [ModPickerCategories.general]: [],
        [ModPickerCategories.helmet]: [],
        [ModPickerCategories.gauntlets]: [],
        [ModPickerCategories.chest]: [],
        [ModPickerCategories.leg]: [],
        [ModPickerCategories.classitem]: [],
        [ModPickerCategories.seasonal]: []
      },
      minimumPower: 750,
      query: '',
      statOrder: statKeys,
      selectedStoreId: getCurrentStore(props.stores)?.id,
      assumeMasterwork: false
    };
  }

  componentDidMount() {
    this.subscriptions.add(
      D2StoresService.getStoresStream(this.props.account).subscribe((stores) => {
        if (!stores || !stores.length) {
          return;
        }

        if (!this.state.selectedStoreId) {
          this.onCharacterChanged(getCurrentStore(stores)!.id);
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
      lockedArmor2Mods,
      selectedStoreId,
      statFilters,
      minimumPower,
      query,
      statOrder,
      assumeMasterwork
    } = this.state;

    if (!storesLoaded || !defs || !selectedStoreId) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }

    const store = stores.find((s) => s.id === selectedStoreId)!;

    if (!items[store.classType]) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }

    const filter = filters.filterFunction(query);

    let filteredItems: ItemsByBucket = {};
    let processedSets: readonly ArmorSet[] = [];
    let filteredSets: readonly ArmorSet[] = [];
    let combos = 0;
    let combosWithoutCaps = 0;
    let processError;
    const enabledStats = this.getEnabledStats(statFilters);
    try {
      filteredItems = this.filterItemsMemoized(items[store.classType], lockedMap, filter);
      const result = this.processMemoized(
        filteredItems,
        lockedMap,
        lockedArmor2Mods,
        store.id,
        assumeMasterwork
      );
      processedSets = result.sets;
      combos = result.combos;
      combosWithoutCaps = result.combosWithoutCaps;
      filteredSets = this.filterSetsMemoized(
        processedSets,
        minimumPower,
        lockedMap,
        lockedArmor2Mods,
        statFilters,
        statOrder,
        enabledStats
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
          assumeMasterwork={assumeMasterwork}
          onMasterworkAssumptionChange={this.onMasterworkAssumptionChange}
        />

        <LockArmorAndPerks
          items={filteredItems}
          selectedStore={store}
          lockedMap={lockedMap}
          lockedArmor2Mods={lockedArmor2Mods}
          onLockedMapChanged={this.onLockedMapChanged}
          onArmor2ModsChanged={this.onArmor2ModsChanged}
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
            <ErrorPanel error={processError} />
          ) : (
            <GeneratedSets
              sets={filteredSets}
              combos={combos}
              combosWithoutCaps={combosWithoutCaps}
              isPhonePortrait={isPhonePortrait}
              lockedMap={lockedMap}
              selectedStore={store}
              onLockedMapChanged={this.onLockedMapChanged}
              defs={defs}
              statOrder={statOrder}
              enabledStats={enabledStats}
            />
          )}
        </PageWithMenu.Contents>

        <LoadoutDrawer />
      </PageWithMenu>
    );
  }

  /**
   * Handle when selected character changes
   * Recomputes matched sets
   */
  private onCharacterChanged = (storeId: string) => {
    this.setState({
      selectedStoreId: storeId,
      lockedMap: {},
      statFilters: {
        Mobility: { min: 0, max: 10, ignored: false },
        Resilience: { min: 0, max: 10, ignored: false },
        Recovery: { min: 0, max: 10, ignored: false },
        Discipline: { min: 0, max: 10, ignored: false },
        Intellect: { min: 0, max: 10, ignored: false },
        Strength: { min: 0, max: 10, ignored: false }
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

  private onArmor2ModsChanged = (lockedArmor2Mods: LockedArmor2ModMap) =>
    this.setState({ lockedArmor2Mods });

  private onMasterworkAssumptionChange = (assumeMasterwork: boolean) =>
    this.setState({ assumeMasterwork });
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
