import { UIViewInjectedProps } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account.service';
import CharacterSelect from '../character-select/CharacterSelect';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { Loading } from '../dim-ui/Loading';
import { D2StoresService } from '../inventory/d2-stores.service';
import { InventoryBucket, InventoryBuckets } from '../inventory/inventory-buckets';
import { D2Item } from '../inventory/item-types';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import {
  filterPlugs,
  toggleLockedItem,
  filterGeneratedSets,
  getFilteredAndSelectedPerks
} from './generated-sets/utils';
import './loadoutbuilder.scss';
import LockedArmor from './locked-armor/LockedArmor';
import { ArmorSet, LockableBuckets, LockedItemType, StatTypes, MinMax } from './types';
import PerkAutoComplete from './PerkAutoComplete';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/reducer';
import { Subscription } from 'rxjs';
import { computeSets } from './process';
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

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  stores: DimStore[];
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  perks: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: readonly DestinyInventoryItemDefinition[];
    }>;
  }>;
  items: Readonly<{
    [classType: number]: Readonly<{
      [bucketHash: number]: Readonly<{ [itemHash: number]: readonly D2Item[] }>;
    }>;
  }>;
  defs?: D2ManifestDefinitions;
  searchConfig: SearchConfig;
  filters: SearchFilters;
}

type Props = ProvidedProps & StoreProps;

interface State {
  requirePerks: boolean;
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>;
  selectedStore?: DimStore;
  statFilters: Readonly<{ [statType in StatTypes]: MinMax }>;
  minimumPower: number;
  query: string;
}

function mapStateToProps() {
  const perksSelector = createSelector(
    storesSelector,
    (stores) => {
      const perks: {
        [classType: number]: { [bucketHash: number]: DestinyInventoryItemDefinition[] };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!perks[item.classType]) {
            perks[item.classType] = {};
          }
          if (!perks[item.classType][item.bucket.hash]) {
            perks[item.classType][item.bucket.hash] = [];
          }

          // build the filtered unique perks item picker
          item.sockets.sockets.filter(filterPlugs).forEach((socket) => {
            socket.plugOptions.forEach((option) => {
              perks[item.classType][item.bucket.hash].push(option.plugItem);
            });
          });
        }
      }

      // sort exotic perks first, then by index
      Object.keys(perks).forEach((classType) =>
        Object.keys(perks[classType]).forEach((bucket) => {
          const bucketPerks = _.uniq<DestinyInventoryItemDefinition>(perks[classType][bucket]);
          bucketPerks.sort((a, b) => b.index - a.index);
          bucketPerks.sort((a, b) => b.inventory.tierType - a.inventory.tierType);
          perks[classType][bucket] = bucketPerks;
        })
      );

      return perks;
    }
  );

  const itemsSelector = createSelector(
    storesSelector,
    (stores) => {
      const items: {
        [classType: number]: { [bucketHash: number]: { [itemHash: number]: D2Item[] } };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !item.sockets || !item.bucket.inArmor) {
            continue;
          }
          if (!items[item.classType]) {
            items[item.classType] = {};
          }
          if (!items[item.classType][item.bucket.hash]) {
            items[item.classType][item.bucket.hash] = [];
          }
          if (!items[item.classType][item.bucket.hash][item.hash]) {
            items[item.classType][item.bucket.hash][item.hash] = [];
          }
          items[item.classType][item.bucket.hash][item.hash].push(item);
        }
      }

      return items;
    }
  );

  return (state: RootState): StoreProps => {
    return {
      buckets: state.inventory.buckets!,
      storesLoaded: storesLoadedSelector(state),
      stores: sortedStoresSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait,
      perks: perksSelector(state),
      items: itemsSelector(state),
      defs: state.manifest.d2Manifest,
      searchConfig: searchConfigSelector(state),
      filters: searchFiltersConfigSelector(state)
    };
  };
}

/**
 * The Loadout Builder screen
 */
export class LoadoutBuilder extends React.Component<Props & UIViewInjectedProps, State> {
  private storesSubscription: Subscription;
  private computeSetsMemoized = memoizeOne(computeSets);
  private filterSetsMemoized = memoizeOne(filterGeneratedSets);
  private getFilteredAndSelectedPerksMemoized = memoizeOne(getFilteredAndSelectedPerks);

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
      query: ''
    };
  }

  componentDidMount() {
    this.storesSubscription = D2StoresService.getStoresStream(this.props.account).subscribe(
      (stores) => {
        if (!stores) {
          return;
        }

        this.setState({ selectedStore: stores.find((s) => s.current) });

        if (!this.state.selectedStore) {
          this.onCharacterChanged(stores.find((s) => s.current)!.id);
        } else {
          const selectedStore = stores.find((s) => s.id === this.state.selectedStore!.id)!;
          this.setState({ selectedStore });
        }
      }
    );
  }

  componentWillUnmount() {
    this.storesSubscription.unsubscribe();
  }

  render() {
    const {
      storesLoaded,
      stores,
      buckets,
      isPhonePortrait,
      perks,
      items,
      defs,
      searchConfig,
      filters
    } = this.props;
    const { lockedMap, selectedStore, statFilters, minimumPower, requirePerks, query } = this.state;

    if (!storesLoaded || !defs) {
      return <Loading />;
    }

    let store = selectedStore;
    if (!store) {
      store = stores.find((s) => s.current)!;
    }

    if (!perks[store.classType]) {
      return <Loading />;
    }

    const filter = filters.filterFunction(query);

    let processedSets: readonly ArmorSet[] = [];
    let filteredSets: readonly ArmorSet[] = [];
    let processError;
    try {
      processedSets = this.computeSetsMemoized(
        items,
        store.classType,
        requirePerks,
        lockedMap,
        filter
      );
      filteredSets = this.filterSetsMemoized(processedSets, minimumPower, lockedMap, statFilters);
    } catch (e) {
      console.error(e);
      processError = e;
    }

    const { selectedPerks, filteredPerks } = this.getFilteredAndSelectedPerksMemoized(
      store.classType,
      lockedMap,
      items
    );

    return (
      <PageWithMenu className="loadout-builder">
        <PageWithMenu.Menu>
          <CharacterSelect
            selectedStore={store}
            stores={stores}
            vertical={!isPhonePortrait}
            isPhonePortrait={isPhonePortrait}
            onCharacterChanged={this.onCharacterChanged}
          />

          <SearchFilterInput
            searchConfig={searchConfig}
            placeholder="Search items"
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
          />

          <CollapsibleTitle
            title={t('LoadoutBuilder.SelectLockedItems')}
            sectionId="loadoutbuilder-locked"
          >
            <div className="loadout-builder-row mr4 flex space-between">
              <div className="locked-items">
                {Object.values(LockableBuckets).map((armor) => (
                  <LockedArmor
                    key={armor}
                    locked={lockedMap[armor]}
                    bucket={buckets.byId[armor]}
                    items={items[store!.classType][armor]}
                    perks={perks[store!.classType][armor]}
                    filteredPerks={filteredPerks}
                    onLockChanged={this.updateLockedArmor}
                  />
                ))}
              </div>
              <div className="flex column mb4">
                <button className="dim-button" onClick={this.lockEquipped}>
                  {t('LoadoutBuilder.LockEquipped')}
                </button>
                <button className="dim-button" onClick={this.resetLocked}>
                  {t('LoadoutBuilder.ResetLocked')}
                </button>
                <PerkAutoComplete
                  perks={perks[store.classType]}
                  selectedPerks={selectedPerks}
                  bucketsById={buckets.byId}
                  onSelect={(bucket, item) =>
                    toggleLockedItem(
                      { type: 'perk', item },
                      bucket,
                      this.updateLockedArmor,
                      lockedMap[bucket.hash]
                    )
                  }
                />
              </div>
            </div>
          </CollapsibleTitle>
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
              lockedMap={lockedMap}
              selectedStore={store}
              onLockChanged={this.updateLockedArmor}
              defs={defs}
            />
          )}
        </PageWithMenu.Contents>

        <LoadoutDrawer />
      </PageWithMenu>
    );
  }

  /**
   * Reset all locked items and recompute for all sets
   * Recomputes matched sets
   */
  private resetLocked = () => {
    this.setState({ lockedMap: {} });
  };

  /**
   * Recomputes matched sets and includes items without additional perks
   */
  private setRequiredPerks = () => {
    this.setState({ requirePerks: false });
  };

  /**
   * Lock currently equipped items on a character
   * Recomputes matched sets
   */
  private lockEquipped = () => {
    const lockedMap: { [bucketHash: number]: LockedItemType[] } = {};
    this.state.selectedStore!.items.forEach((item) => {
      if (item.isDestiny2() && item.equipped && item.bucket.inArmor) {
        lockedMap[item.bucket.hash] = [
          {
            type: 'item',
            item
          }
        ];
      }
    });

    this.setState((state) => ({ lockedMap: { ...state.lockedMap, ...lockedMap } }));
  };

  /**
   * Handle when selected character changes
   * Recomputes matched sets
   */
  private onCharacterChanged = (storeId: string) => {
    const selectedStore = this.props.stores.find((s) => s.id === storeId)!;
    this.setState({ selectedStore, lockedMap: {}, requirePerks: true });
  };

  private onStatFiltersChanged = (statFilters: State['statFilters']) =>
    this.setState({ statFilters });

  private onMinimumPowerChanged = (minimumPower: number) => this.setState({ minimumPower });

  private onQueryChanged = (query: string) => this.setState({ query });

  /**
   * Adds an item to the locked map bucket
   * Recomputes matched sets
   */
  private updateLockedArmor = (bucket: InventoryBucket, locked: LockedItemType[]) =>
    this.setState((state) => ({ lockedMap: { ...state.lockedMap, [bucket.hash]: locked } }));
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
