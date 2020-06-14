import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo, useReducer, useCallback } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2StoresService } from '../inventory/d2-stores';
import { DimStore } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import { isLoadoutBuilderItem, addLockedItem, removeLockedItem } from './generated-sets/utils';
import {
  StatTypes,
  ItemsByBucket,
  LockedMap,
  MinMaxIgnored,
  LockedModBase,
  LockedArmor2ModMap,
  ModPickerCategories,
  LockedItemType,
} from './types';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/selectors';
import { statKeys } from './utils';
import { createSelector } from 'reselect';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  SearchConfig,
  SearchFilters,
  searchConfigSelector,
  searchFiltersConfigSelector,
} from 'app/search/search-filters';
import { DimItem } from 'app/inventory/item-types';
import { refresh$ } from 'app/shell/refresh';
import { queueAction } from 'app/inventory/action-queue';
import { getCurrentStore, getItemAcrossStores } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RouteComponentProps, withRouter, StaticContext } from 'react-router';
import { Loadout } from 'app/loadout/loadout-types';
import { Location } from 'history';
import { useSubscription } from 'app/utils/hooks';
import LoadoutBuilder from './LoadoutBuilder';

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

type Props = ProvidedProps &
  StoreProps &
  RouteComponentProps<{}, StaticContext, { loadout?: Loadout }>;

export interface LBState {
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
  query: string;
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
}

const init = ({
  stores,
  location,
}: {
  stores: DimStore[];
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}): LBState => {
  let lockedMap: LockedMap = {};

  if (stores.length && location.state?.loadout) {
    for (const loadoutItem of location.state.loadout.items) {
      if (loadoutItem.equipped) {
        const item = getItemAcrossStores(stores, loadoutItem);
        if (item && isLoadoutBuilderItem(item)) {
          lockedMap = {
            ...lockedMap,
            [item.bucket.hash]: addLockedItem(
              { type: 'item', item, bucket: item.bucket },
              lockedMap[item.bucket.hash]
            ),
          };
        }
      }
    }
  }
  return {
    lockedMap,
    statFilters: {
      Mobility: { min: 0, max: 10, ignored: false },
      Resilience: { min: 0, max: 10, ignored: false },
      Recovery: { min: 0, max: 10, ignored: false },
      Discipline: { min: 0, max: 10, ignored: false },
      Intellect: { min: 0, max: 10, ignored: false },
      Strength: { min: 0, max: 10, ignored: false },
    },
    lockedSeasonalMods: [],
    lockedArmor2Mods: {
      [ModPickerCategories.general]: [],
      [ModPickerCategories.helmet]: [],
      [ModPickerCategories.gauntlets]: [],
      [ModPickerCategories.chest]: [],
      [ModPickerCategories.leg]: [],
      [ModPickerCategories.classitem]: [],
      [ModPickerCategories.seasonal]: [],
    },
    minimumPower: 750,
    query: '',
    statOrder: statKeys,
    selectedStoreId: getCurrentStore(stores)?.id,
    assumeMasterwork: false,
  };
};

export type LoadoutBuilderAction =
  | { type: 'changeCharacter'; storeId: string }
  | { type: 'statFiltersChanged'; statFilters: LBState['statFilters'] }
  | { type: 'minimumPowerChanged'; minimumPower: number }
  | { type: 'queryChanged'; query: string }
  | { type: 'statOrderChanged'; statOrder: StatTypes[] }
  | { type: 'lockedMapChanged'; lockedMap: LockedMap }
  | { type: 'addItemToLockedMap'; item: LockedItemType }
  | { type: 'removeItemFromLockedMap'; item: LockedItemType }
  | { type: 'lockedSeasonalModsChanged'; lockedSeasonalMods: LockedModBase[] }
  | {
      type: 'lockedMapAndSeasonalModsChanged';
      lockedMap: LockedMap;
      lockedSeasonalMods: LockedModBase[];
    }
  | { type: 'lockedArmor2ModsChanged'; lockedArmor2Mods: LockedArmor2ModMap }
  | { type: 'assumeMasterworkChanged'; assumeMasterwork: boolean };

// TODO: Move more logic inside the reducer
function stateReducer(state: LBState, action: LoadoutBuilderAction): LBState {
  switch (action.type) {
    case 'changeCharacter':
      return {
        ...state,
        selectedStoreId: action.storeId,
        lockedMap: {},
        statFilters: {
          Mobility: { min: 0, max: 10, ignored: false },
          Resilience: { min: 0, max: 10, ignored: false },
          Recovery: { min: 0, max: 10, ignored: false },
          Discipline: { min: 0, max: 10, ignored: false },
          Intellect: { min: 0, max: 10, ignored: false },
          Strength: { min: 0, max: 10, ignored: false },
        },
        minimumPower: 0,
      };
    case 'statFiltersChanged':
      return { ...state, statFilters: action.statFilters };
    case 'minimumPowerChanged':
      return { ...state, minimumPower: action.minimumPower };
    case 'queryChanged':
      return { ...state, query: action.query };
    case 'statOrderChanged':
      return { ...state, statOrder: action.statOrder };
    case 'lockedMapChanged':
      return { ...state, lockedMap: action.lockedMap };
    case 'addItemToLockedMap': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        lockedMap: {
          ...state.lockedMap,
          [bucketHash]: addLockedItem(item, state.lockedMap[bucketHash]),
        },
      };
    }
    case 'removeItemFromLockedMap': {
      const { item } = action;
      const bucketHash = item.bucket.hash;
      return {
        ...state,
        lockedMap: {
          ...state.lockedMap,
          [bucketHash]: removeLockedItem(item, state.lockedMap[bucketHash]),
        },
      };
    }
    case 'lockedSeasonalModsChanged':
      return { ...state, lockedSeasonalMods: action.lockedSeasonalMods };
    case 'lockedMapAndSeasonalModsChanged':
      return {
        ...state,
        lockedMap: action.lockedMap,
        lockedSeasonalMods: action.lockedSeasonalMods,
      };
    case 'lockedArmor2ModsChanged':
      return { ...state, lockedArmor2Mods: action.lockedArmor2Mods };
    case 'assumeMasterworkChanged':
      return { ...state, assumeMasterwork: action.assumeMasterwork };
  }
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
    filters: searchFiltersConfigSelector(state),
  });
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilderContainer({
  account,
  stores,
  isPhonePortrait,
  items,
  defs,
  searchConfig,
  filters,
  location,
}: Props) {
  const [
    {
      lockedMap,
      lockedSeasonalMods,
      lockedArmor2Mods,
      selectedStoreId,
      statFilters,
      minimumPower,
      query,
      statOrder,
      assumeMasterwork,
    },
    stateDispatch,
  ] = useReducer(stateReducer, { stores, location }, init);

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

  const enabledStats = useMemo(
    () => new Set(statKeys.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const store = stores.find((s) => s.id === selectedStoreId)!;

  if (!store || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <LoadoutBuilder
      stores={stores}
      selectedStore={store}
      isPhonePortrait={isPhonePortrait}
      items={items}
      defs={defs}
      searchConfig={searchConfig}
      filters={filters}
      lockedMap={lockedMap}
      lockedSeasonalMods={lockedSeasonalMods}
      lockedArmor2Mods={lockedArmor2Mods}
      selectedStoreId={selectedStoreId}
      statFilters={statFilters}
      minimumPower={minimumPower}
      query={query}
      statOrder={statOrder}
      assumeMasterwork={assumeMasterwork}
      enabledStats={enabledStats}
      lbDispatch={stateDispatch}
    />
  );
}

export default withRouter(connect<StoreProps>(mapStateToProps)(LoadoutBuilderContainer));
