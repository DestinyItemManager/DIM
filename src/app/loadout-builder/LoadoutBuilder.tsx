import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { D2StoresService } from '../inventory/d2-stores';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets, isLoadoutBuilderItem } from './generated-sets/utils';
import { ArmorSet, StatTypes, ItemsByBucket, MinMaxIgnored } from './types';
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
  searchFiltersConfigSelector,
} from 'app/search/search-filters';
import memoizeOne from 'memoize-one';
import styles from './LoadoutBuilder.m.scss';
import LockArmorAndPerks from './LockArmorAndPerks';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import ErrorPanel from 'app/shell/ErrorPanel';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RouteComponentProps, withRouter, StaticContext } from 'react-router';
import { Loadout } from 'app/loadout/loadout-types';
import { useSubscription } from 'app/utils/hooks';
import { LoadoutBuilderState, useLbState } from './loadoutBuilderReducer';

export const statHashToType: { [hash: number]: StatTypes } = {
  2996146975: 'Mobility',
  392767087: 'Resilience',
  1943323491: 'Recovery',
  1735777505: 'Discipline',
  144602215: 'Intellect',
  4244567218: 'Strength',
};

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  stores: DimStore[];
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
  minimumPower: number;
  minimumStatTotal: number;
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  defs?: D2ManifestDefinitions;
  searchConfig: SearchConfig;
  filters: SearchFilters;
}

type Props = ProvidedProps &
  StoreProps &
  RouteComponentProps<{}, StaticContext, { loadout?: Loadout }>;

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
    statOrder: state.dimApi.settings.loStatSortOrder.map((hash) => statHashToType[hash]),
    assumeMasterwork: state.dimApi.settings.loAssumeMasterwork,
    minimumPower: state.dimApi.settings.loMinPower,
    minimumStatTotal: state.dimApi.settings.loMinStatTotal,
    isPhonePortrait: state.shell.isPhonePortrait,
    items: itemsSelector(state),
    defs: state.manifest.d2Manifest,
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state),
  });
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilder({
  account,
  storesLoaded,
  stores,
  statOrder,
  assumeMasterwork,
  minimumPower,
  minimumStatTotal,
  isPhonePortrait,
  items,
  defs,
  searchConfig,
  filters,
  location,
}: Props) {
  // Memoizing to ensure these functions are only created once
  const [filterItemsMemoized, filterSetsMemoized, processMemoized, getEnabledStats] = useMemo(
    () => [
      memoizeOne(filterItems),
      memoizeOne(filterGeneratedSets),
      memoizeOne(process),
      memoizeOne(
        (statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>) =>
          new Set(statKeys.filter((statType) => !statFilters[statType].ignored))
      ),
    ],
    []
  );

  const [
    { lockedMap, lockedSeasonalMods, lockedArmor2Mods, selectedStoreId, statFilters, query },
    stateDispatch,
  ] = useLbState(stores, location);

  useSubscription(
    useCallback(
      () =>
        D2StoresService.getStoresStream(account).subscribe((stores) => {
          if (!stores || !stores.length) {
            return;
          }

          if (!selectedStoreId) {
            stateDispatch({ type: 'changeCharacter', storeId: getCurrentStore(stores)!.id });
          }
        }),
      /* do not include selectedStoreId in dependencies, it triggers two process rounds after changing store */
      /* eslint-disable react-hooks/exhaustive-deps */
      [account]
    )
  );

  useSubscription(
    useCallback(
      () => refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores())),
      []
    )
  );

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
  const enabledStats = getEnabledStats(statFilters);
  try {
    filteredItems = filterItemsMemoized(
      items[store.classType],
      lockedMap,
      lockedArmor2Mods,
      minimumStatTotal,
      assumeMasterwork,
      filter
    );

    const result = processMemoized(
      filteredItems,
      lockedMap,
      lockedArmor2Mods,
      store.id,
      assumeMasterwork
    );
    processedSets = result.sets;
    combos = result.combos;
    combosWithoutCaps = result.combosWithoutCaps;
    filteredSets = filterSetsMemoized(
      processedSets,
      minimumPower,
      lockedMap,
      lockedArmor2Mods,
      lockedSeasonalMods,
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
        onQueryChanged={(query: string) => stateDispatch({ type: 'queryChanged', query })}
      />

      <FilterBuilds
        sets={processedSets}
        selectedStore={store as D2Store}
        minimumPower={minimumPower}
        minimumStatTotal={minimumStatTotal}
        stats={statFilters}
        onStatFiltersChanged={(statFilters: LoadoutBuilderState['statFilters']) =>
          stateDispatch({ type: 'statFiltersChanged', statFilters })
        }
        defs={defs}
        order={statOrder}
        assumeMasterwork={assumeMasterwork}
      />

      <LockArmorAndPerks
        items={filteredItems}
        selectedStore={store}
        lockedMap={lockedMap}
        lockedSeasonalMods={lockedSeasonalMods}
        lockedArmor2Mods={lockedArmor2Mods}
        lbDispatch={stateDispatch}
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
          onCharacterChanged={(storeId: string) =>
            stateDispatch({ type: 'changeCharacter', storeId })
          }
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
            lbDispatch={stateDispatch}
            defs={defs}
            statOrder={statOrder}
            enabledStats={enabledStats}
            lockedArmor2Mods={lockedArmor2Mods}
          />
        )}
      </PageWithMenu.Contents>

      <LoadoutDrawer />
    </PageWithMenu>
  );
}

export default withRouter(connect<StoreProps>(mapStateToProps)(LoadoutBuilder));
