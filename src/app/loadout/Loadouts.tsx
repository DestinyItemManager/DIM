import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import ClassIcon from 'app/dim-ui/ClassIcon';
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
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { maxLightLoadout, searchLoadout } from 'app/loadout-drawer/auto-loadouts';
import { GeneratedLoadoutStats } from 'app/loadout-drawer/GeneratedLoadoutStats';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import {
  convertToLoadoutItem,
  extractArmorModHashes,
  getItemsFromLoadoutItems,
  getModsFromLoadout,
  newLoadout,
} from 'app/loadout-drawer/loadout-utils';
import { editLoadout } from 'app/loadout-drawer/LoadoutDrawer';
import { fromEquippedTypes } from 'app/loadout-drawer/LoadoutDrawerContents';
import { loadoutsSelector, previousLoadoutSelector } from 'app/loadout-drawer/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './Loadouts.m.scss';

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
  const [selectedStoreId, setSelectedStoreId] = useState(currentStore.id);
  const selectedStore = getStore(stores, selectedStoreId)!;
  const classType = selectedStore.classType;
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

  // Hmm, I'd really like this to be selected per classtype not per character, but maybe people's brains don't think that way

  const maxLoadout = maxLightLoadout(allItems, selectedStore);
  const queryLoadout =
    query.length > 0 ? searchLoadout(allItems, selectedStore, searchFilter) : undefined;

  const previousLoadout = useSelector((state: RootState) =>
    previousLoadoutSelector(state, selectedStore.id)
  );

  const currentLoadout = useMemo(() => {
    const items = selectedStore.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.type)
    );
    const loadout = newLoadout(
      t('Loadouts.FromEquipped'),
      items.map((i) => convertToLoadoutItem(i, true)),
      items.flatMap((i) => extractArmorModHashes(i))
    );
    loadout.classType = selectedStore.classType;
    return loadout;
  }, [selectedStore]);

  const loadouts = _.compact([
    queryLoadout,
    previousLoadout,
    currentLoadout,
    maxLoadout,
    ...savedLoadouts,
  ]);

  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  return (
    <PageWithMenu>
      <PageWithMenu.Menu>
        <CharacterSelect
          stores={stores}
          selectedStore={selectedStore}
          onCharacterChanged={setSelectedStoreId}
        />
        <Link to="./optimizer">{t('LB.LB')}</Link>
      </PageWithMenu.Menu>

      <PageWithMenu.Contents>
        {loadouts.map((loadout) => (
          <LoadoutRow
            key={loadout.id}
            loadout={loadout}
            store={selectedStore}
            saved={savedLoadoutIds.has(loadout.id)}
          />
        ))}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function LoadoutRow({
  loadout,
  store,
  saved,
}: {
  loadout: Loadout;
  store: DimStore;
  saved: boolean;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const stores = useSelector(storesSelector);
  const buckets = useSelector(bucketsSelector)!;

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subClass, warnitems] = useMemo(() => {
    const [items, warnitems] = getItemsFromLoadoutItems(loadout.items, defs, allItems);
    let equippableItems = items.filter((i) => itemCanBeEquippedBy(i, store, true));
    const subClass = equippableItems.find((i) => i.bucket.hash === BucketHashes.Subclass);
    if (subClass) {
      equippableItems = equippableItems.filter((i) => i !== subClass);
    }
    return [equippableItems, subClass, warnitems];
  }, [loadout.items, defs, allItems, store]);

  const savedMods = getModsFromLoadout(defs, loadout);
  const equippedItemIds = new Set(loadout.items.filter((i) => i.equipped).map((i) => i.id));

  // TODO: group and sort items
  const categories = _.groupBy(items, (i) => i.bucket.sort);
  const sortedCategories = _.sortBy(Object.keys(categories), (c) =>
    Object.keys(D2Categories).indexOf(c)
  );

  return (
    <div className={styles.loadout} onClick={(e) => console.log(loadout, e)}>
      <h2>
        <ClassIcon className={styles.classIcon} classType={loadout.classType} />
        {loadout.name}
        {warnitems.length > 0 && (
          <span className={styles.missingItems}>
            <AppIcon className="warning-icon" icon={faExclamationTriangle} />
            {t('Loadouts.MissingItemsWarning')}
          </span>
        )}
      </h2>
      <div className={styles.subClass}>
        {subClass && <ConnectedInventoryItem item={subClass} ignoreSelectedPerks />}
      </div>
      {sortedCategories.map((category) => (
        <div key={category} className={clsx(styles.itemCategory, `category-${category}`)}>
          {_.partition(categories[category], (i) => equippedItemIds.has(i.id)).map(
            (items, index) =>
              items && (
                <div
                  className={clsx(index === 0 ? styles.equipped : styles.unequipped)}
                  key={index}
                >
                  {_.map(
                    _.groupBy(items, (i) => i.bucket.hash),
                    (items, bucketHash) => (
                      <div key={bucketHash} className={styles.items}>
                        {items.map((item) => (
                          <ConnectedInventoryItem key={item.id} item={item} />
                        ))}
                      </div>
                    )
                  )}
                </div>
              )
          )}
          {category === 'Armor' && (
            <>
              <GeneratedLoadoutStats
                stores={stores}
                buckets={buckets}
                items={items}
                loadout={loadout}
                allItems={allItems}
              />
              <Link className="dim-button" to="./optimizer">
                {t('LB.LB')}
              </Link>
            </>
          )}
        </div>
      ))}
      <div className={styles.mods}>
        {savedMods.map((mod, index) => (
          <div key={index}>
            <SocketDetailsMod itemDef={mod} />
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        {items.length > 0 && (
          <button
            type="button"
            className="dim-button"
            onClick={() => editLoadout(loadout, { isNew: !saved })}
          >
            {t('Loadouts.Edit')}
          </button>
        )}
        {saved && (
          <button type="button" className="dim-button" onClick={() => console.log('Delete!')}>
            {t('Loadouts.Delete')}
          </button>
        )}
      </div>
    </div>
  );
}
