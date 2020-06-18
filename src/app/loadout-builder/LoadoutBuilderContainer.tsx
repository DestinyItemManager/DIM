import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2StoresService } from '../inventory/d2-stores';
import { DimStore } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import { isLoadoutBuilderItem } from './generated-sets/utils';
import { ItemsByBucket } from './types';
import { sortedStoresSelector, storesLoadedSelector, storesSelector } from '../inventory/selectors';
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
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RouteComponentProps, withRouter, StaticContext } from 'react-router';
import { Loadout } from 'app/loadout/loadout-types';
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
  useSubscription(
    useCallback(
      () =>
        D2StoresService.getStoresStream(account).subscribe((stores) => {
          if (!stores || !stores.length) {
            return;
          }
        }),
      [account]
    )
  );

  useSubscription(
    useCallback(
      () => refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores())),
      []
    )
  );

  if (!stores || !stores.length || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <LoadoutBuilder
      stores={stores}
      isPhonePortrait={isPhonePortrait}
      items={items}
      defs={defs}
      searchConfig={searchConfig}
      filters={filters}
      location={location}
    />
  );
}

export default withRouter(connect<StoreProps>(mapStateToProps)(LoadoutBuilderContainer));
