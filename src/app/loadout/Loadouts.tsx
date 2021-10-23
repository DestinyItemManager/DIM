import { DestinyAccount } from 'app/accounts/destiny-account';
import ClassIcon from 'app/dim-ui/ClassIcon';
import ClassSelect from 'app/dim-ui/ClassSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import {
  allItemsSelector,
  bucketsSelector,
  sortedStoresSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { maxLightLoadout, searchLoadout } from 'app/loadout-drawer/auto-loadouts';
import { GeneratedLoadoutStats } from 'app/loadout-drawer/GeneratedLoadoutStats';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { getItemsFromLoadoutItems, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { editLoadout } from 'app/loadout-drawer/LoadoutDrawer';
import { loadoutsSelector, previousLoadoutSelector } from 'app/loadout-drawer/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { AppIcon, editIcon, faExclamationTriangle } from 'app/shell/icons';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * The Loadouts page is a toplevel page for loadout management. It also provides access to the Loadout Optimizer.
 *
 * This container just shows a loading page while stores are loading.
 */
export default function LoadoutsContainer({ account }: { account: DestinyAccount }) {
  const storesLoaded = useLoadStores(account);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return <Loadouts />;
}

function Loadouts() {
  const stores = useSelector(sortedStoresSelector);
  const currentStore = getCurrentStore(stores)!;
  const [classType, setClassType] = useState(currentStore.classType);
  const selectedStore = stores.find((s) => s.classType === classType)!;
  const allItems = useSelector(allItemsSelector);
  const query = useSelector(querySelector);
  const searchFilter = useSelector(searchFilterSelector);

  const allLoadouts = useSelector(loadoutsSelector);

  const savedLoadouts = useMemo(
    () =>
      _.sortBy(
        allLoadouts.filter(
          (loadout) =>
            classType === DestinyClass.Unknown ||
            loadout.classType === DestinyClass.Unknown ||
            loadout.classType === classType
        ),
        (l) => l.name
      ),
    [allLoadouts, classType]
  );

  const maxLoadout = maxLightLoadout(allItems, selectedStore);
  const queryLoadout =
    query.length > 0 ? searchLoadout(allItems, selectedStore, searchFilter) : undefined;

  const previousLoadout = useSelector((state: RootState) =>
    previousLoadoutSelector(state, selectedStore.id)
  );

  const loadouts = _.compact([queryLoadout, previousLoadout, maxLoadout, ...savedLoadouts]);

  // TODO: Class selector!

  return (
    <PageWithMenu>
      <PageWithMenu.Menu>
        <ClassSelect classType={classType} onClassTypeChanged={setClassType} />
      </PageWithMenu.Menu>

      <PageWithMenu.Contents>
        {loadouts.map((loadout) => (
          <LoadoutRow key={loadout.id} loadout={loadout} />
        ))}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function LoadoutRow({ loadout }: { loadout: Loadout }) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const stores = useSelector(storesSelector);
  const buckets = useSelector(bucketsSelector)!;

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(
    () => getItemsFromLoadoutItems(loadout.items, defs, allItems),
    [loadout.items, defs, allItems]
  );

  const savedMods = getModsFromLoadout(defs, loadout);

  return (
    <div>
      <span title={loadout.name} onClick={(e) => console.log(loadout, e)}>
        {warnitems.length > 0 && <AppIcon className="warning-icon" icon={faExclamationTriangle} />}
        <ClassIcon className="loadout-type-icon" classType={loadout.classType} />
        {loadout.name}
      </span>
      <span title={t('Loadouts.Edit')} onClick={() => editLoadout(loadout, { isNew: false })}>
        <AppIcon icon={editIcon} />
      </span>
      <div>
        <GeneratedLoadoutStats
          stores={stores}
          buckets={buckets}
          items={items}
          loadout={loadout}
          allItems={allItems}
        />
        <div className="sub-bucket">
          {items.map((item) => (
            <div key={item.bucket.hash}>
              <ConnectedInventoryItem item={item} />
            </div>
          ))}
          {savedMods.map((mod) => (
            <div key={mod.hash}>
              <SocketDetailsMod itemDef={mod} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
