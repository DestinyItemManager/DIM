import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import ClassIcon from 'app/dim-ui/ClassIcon';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector, bucketsSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { SelectedArmorUpgrade } from 'app/loadout-builder/filter/ArmorUpgradePicker';
import ExoticArmorChoice from 'app/loadout-builder/filter/ExoticArmorChoice';
import { deleteLoadout } from 'app/loadout-drawer/actions';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import {
  getLight,
  getLoadoutStats,
  getModsFromLoadout,
  newLoadout,
  newLoadoutFromEquipped,
} from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { useSetting } from 'app/settings/hooks';
import { LoadoutSort } from 'app/settings/initial-settings';
import {
  addIcon,
  AppIcon,
  faCalculator,
  faExclamationTriangle,
  powerActionIcon,
  searchIcon,
} from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { copyString } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PlugDef from './loadout-ui/PlugDef';
import styles from './Loadouts.m.scss';
import ModAssignmentDrawer from './mod-assignment-drawer/ModAssignmentDrawer';
import { createGetModRenderKey } from './mod-utils';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

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
  const allLoadouts = useSelector(loadoutsSelector);
  const [loadoutSort, setLoadoutSort] = useSetting('loadoutSort');
  const isPhonePortrait = useIsPhonePortrait();
  const query = useSelector(querySelector);
  const language = useSelector(languageSelector);

  const searchRegexp = startWordRegexp(query, language);

  const savedLoadouts = useMemo(
    () =>
      _.sortBy(
        allLoadouts.filter(
          (loadout) =>
            classType === DestinyClass.Unknown ||
            loadout.classType === DestinyClass.Unknown ||
            loadout.classType === classType
        ),
        loadoutSort === LoadoutSort.ByEditTime ? (l) => -(l.lastUpdatedAt ?? 0) : (l) => l.name
      ),
    [allLoadouts, classType, loadoutSort]
  );

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
    [selectedStore]
  );

  const loadouts = [currentLoadout, ...savedLoadouts].filter(
    (loadout) =>
      !query ||
      searchRegexp.test(loadout.name) ||
      (loadout.notes && searchRegexp.test(loadout.notes))
  );

  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const handleNewLoadout = () => {
    const loadout = newLoadout('', []);
    loadout.classType = selectedStore.classType;
    editLoadout(loadout, { isNew: true });
  };

  const sortOptions = [
    {
      key: 'time',
      content: t('Loadouts.SortByEditTime'),
      value: LoadoutSort.ByEditTime,
    },
    {
      key: 'name',
      content: t('Loadouts.SortByName'),
      value: LoadoutSort.ByName,
    },
  ];

  return (
    <PageWithMenu>
      <PageWithMenu.Menu className={styles.menu}>
        <CharacterSelect
          stores={stores}
          selectedStore={selectedStore}
          onCharacterChanged={setSelectedStoreId}
        />
        <div className={styles.menuButtons}>
          <select
            value={loadoutSort}
            onChange={(e) => setLoadoutSort(parseInt(e.target.value, 10))}
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.value}>
                {option.content}
              </option>
            ))}
          </select>
          <button type="button" className={styles.menuButton} onClick={handleNewLoadout}>
            <AppIcon icon={addIcon} /> <span>{t('Loadouts.Create')}</span>
          </button>
          <Link className={styles.menuButton} to={`../optimizer?class=${selectedStore.classType}`}>
            <AppIcon icon={faCalculator} /> {t('LB.LB')}
          </Link>
        </div>
        {!isPhonePortrait &&
          loadouts.map((loadout) => (
            <PageWithMenu.MenuButton anchor={loadout.id} key={loadout.id}>
              <span>{loadout.name}</span>
            </PageWithMenu.MenuButton>
          ))}
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className={styles.page}>
        {loadouts.map((loadout) => (
          <LoadoutRow
            key={loadout.id}
            loadout={loadout}
            store={selectedStore}
            saved={savedLoadoutIds.has(loadout.id)}
            equippable={loadout !== currentLoadout}
          />
        ))}
        {loadouts.length === 0 && <p>{t('Loadouts.NoneMatch', { query })}</p>}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function LoadoutRow({
  loadout,
  store,
  saved,
  equippable,
}: {
  loadout: Loadout;
  store: DimStore;
  saved: boolean;
  equippable: boolean;
}) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const getModRenderKey = createGetModRenderKey();
  const [showModAssignmentDrawer, setShowModAssignmentDrawer] = useState(false);

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(() => {
    const [items, warnitems] = getItemsFromLoadoutItems(loadout.items, defs, buckets, allItems);
    let equippableItems = items.filter((i) => itemCanBeEquippedBy(i, store, true));
    const subclass = equippableItems.find((i) => i.bucket.hash === BucketHashes.Subclass);
    if (subclass) {
      equippableItems = equippableItems.filter((i) => i !== subclass);
    }
    return [equippableItems, subclass, warnitems];
  }, [loadout.items, defs, buckets, allItems, store]);

  const savedMods = getModsFromLoadout(defs, loadout);
  const equippedItemIds = new Set(loadout.items.filter((i) => i.equipped).map((i) => i.id));

  const categories = _.groupBy(items.concat(warnitems), (i) => i.bucket.sort);

  const showPower = categories.Weapons?.length === 3 && categories.Armor?.length === 5;
  const power = showPower
    ? Math.floor(getLight(store, [...categories.Weapons, ...categories.Armor]))
    : 0;

  const handleDeleteClick = (loadout: Loadout) => {
    if (confirm(t('Loadouts.ConfirmDelete', { name: loadout.name }))) {
      dispatch(deleteLoadout(loadout.id));
    }
  };

  const canShare = Boolean(loadout.parameters && !_.isEmpty(loadout.parameters));
  const shareBuild = () => {
    const p: Record<string, string> = {
      class: loadout.classType.toString(),
      p: JSON.stringify(loadout.parameters),
    };
    if (loadout.notes) {
      p.n = loadout.notes;
    }
    const urlParams = new URLSearchParams(p);
    const url = `${location.origin}/optimizer?${urlParams}`;
    copyString(url);
    showNotification({
      type: 'success',
      title: t('LoadoutBuilder.CopiedBuild'),
    });
  };

  const handleApply = () =>
    dispatch(applyLoadout(store, loadout, { allowUndo: true, onlyMatchingClass: true }));

  const handleEdit = () => editLoadout(loadout, { isNew: !saved });

  return (
    <div className={styles.loadout} id={loadout.id}>
      <div className={styles.title}>
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
        <div className={styles.actions}>
          {equippable && (
            <button type="button" className="dim-button" onClick={handleApply}>
              {t('Loadouts.Apply')}
            </button>
          )}
          <button type="button" className="dim-button" onClick={handleEdit}>
            {saved ? t('Loadouts.EditBrief') : t('Loadouts.SaveLoadout')}
          </button>
          {canShare && (
            <button type="button" className="dim-button" onClick={shareBuild}>
              {t('LoadoutBuilder.ShareBuild')}
            </button>
          )}
          {saved && (
            <button type="button" className="dim-button" onClick={() => handleDeleteClick(loadout)}>
              {t('Loadouts.Delete')}
            </button>
          )}
        </div>
      </div>
      {loadout.notes && <div className={styles.loadoutNotes}>{loadout.notes}</div>}
      <div className={styles.contents}>
        {(items.length > 0 || subclass || savedMods.length > 0) && (
          <>
            <div>
              <Subclass defs={defs} subclass={subclass} power={power} />
            </div>
            {['Weapons', 'Armor', 'General'].map((category) => (
              <ItemCategory
                key={category}
                category={category}
                subclass={subclass}
                items={categories[category]}
                savedMods={savedMods}
                equippedItemIds={equippedItemIds}
                loadout={loadout}
              />
            ))}
            {savedMods.length > 0 ? (
              <div className={styles.mods}>
                <div className={styles.modsGrid}>
                  {savedMods.map((mod) => (
                    <div key={getModRenderKey(mod)}>
                      <PlugDef plug={mod} />
                    </div>
                  ))}
                </div>
                <button
                  className={clsx('dim-button', styles.showModPlacementButton)}
                  type="button"
                  title="Show mod placement"
                  onClick={() => setShowModAssignmentDrawer(true)}
                >
                  {t('Loadouts.ShowModPlacement')}
                </button>
              </div>
            ) : (
              <div className={styles.modsPlaceholder}>{t('Loadouts.Mods')}</div>
            )}
          </>
        )}
      </div>
      {showModAssignmentDrawer &&
        ReactDOM.createPortal(
          <ModAssignmentDrawer
            loadout={loadout}
            onClose={() => setShowModAssignmentDrawer(false)}
          />,
          document.body
        )}
    </div>
  );
}

function Subclass({
  defs,
  subclass,
  power,
}: {
  defs: D2ManifestDefinitions;
  subclass?: DimLoadoutItem;
  power: number;
}) {
  const getModRenderKey = createGetModRenderKey();
  const plugs = useMemo(() => {
    const plugs: PluggableInventoryItemDefinition[] = [];

    if (subclass?.sockets?.categories) {
      for (const category of subclass.sockets.categories) {
        const showInitial =
          category.category.hash !== SocketCategoryHashes.Aspects &&
          category.category.hash !== SocketCategoryHashes.Fragments;
        const sockets = getSocketsByIndexes(subclass.sockets, category.socketIndexes);

        for (const socket of sockets) {
          const override = subclass.socketOverrides?.[socket.socketIndex];
          const initial = socket.socketDefinition.singleInitialItemHash;
          const hash = override || (showInitial && initial);
          const plug = hash && defs.InventoryItem.get(hash);
          if (plug && isPluggableItem(plug)) {
            plugs.push(plug);
          }
        }
      }
    }

    return plugs;
  }, [subclass, defs]);

  return (
    <div className={styles.subclassContainer}>
      <div className={styles.subclass}>
        {subclass ? (
          <ItemPopupTrigger item={subclass}>
            {(ref, onClick) => (
              <ConnectedInventoryItem
                innerRef={ref}
                // Disable the popup when plugs are available as we are showing
                // plugs in the loadout and they may be different to the popup
                onClick={plugs.length ? undefined : onClick}
                item={subclass}
                ignoreSelectedPerks
              />
            )}
          </ItemPopupTrigger>
        ) : (
          <EmptyClassItem />
        )}
        {power !== 0 && (
          <div className={styles.power}>
            <AppIcon icon={powerActionIcon} />
            <span>{power}</span>
          </div>
        )}
      </div>
      {plugs.length ? (
        <div className={styles.subclassMods}>
          {plugs?.map((plug) => (
            <PlugDef key={getModRenderKey(plug)} plug={plug} />
          ))}
        </div>
      ) : (
        <div className={styles.modsPlaceholder}>{t('Loadouts.Abilities')}</div>
      )}
    </div>
  );
}

function ItemCategory({
  category,
  subclass,
  items,
  savedMods,
  equippedItemIds,
  loadout,
}: {
  category: string;
  subclass?: DimLoadoutItem;
  items?: DimItem[];
  savedMods: PluggableInventoryItemDefinition[];
  equippedItemIds: Set<string>;
  loadout: Loadout;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.type);
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category].map((b) => b.type!)
      : _.sortBy(Object.keys(itemsByBucket), (bucketType) =>
          buckets.byCategory[category].findIndex((b) => b.type === bucketType)
        );

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      {items ? (
        <div className={styles.itemsInCategory}>
          {bucketOrder.map((bucketType) => (
            <ItemBucket
              key={bucketType}
              items={itemsByBucket[bucketType]}
              equippedItemIds={equippedItemIds}
            />
          ))}
        </div>
      ) : (
        <>
          <div className={clsx(styles.placeholder, `category-${category}`)}>
            {t(`Bucket.${category}`)}
          </div>
          {category === 'Armor' && loadout.parameters && <OptimizerButton loadout={loadout} />}
        </>
      )}
      {category === 'Armor' && items && (
        <>
          {items.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
                stats={getLoadoutStats(defs, loadout.classType, subclass, items, savedMods)}
                characterClass={loadout.classType}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          <OptimizerButton loadout={loadout} />
        </>
      )}
    </div>
  );
}

function OptimizerButton({ loadout }: { loadout: Loadout }) {
  return (
    <Link className="dim-button" to="../optimizer" state={{ loadout }}>
      <AppIcon icon={faCalculator} /> {t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}

function ItemBucket({
  items,
  equippedItemIds,
}: {
  items: DimItem[] | undefined;
  equippedItemIds: Set<string>;
}) {
  if (!items) {
    return <div className={styles.items} />;
  }

  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

  return (
    <div className={styles.itemBucket}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map((item) => (
              <ItemPopupTrigger item={item} key={item.id}>
                {(ref, onClick) => (
                  <div className={clsx({ [styles.missingItem]: item.owner === 'unknown' })}>
                    <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                  </div>
                )}
              </ItemPopupTrigger>
            ))}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(
                styles.items,
                styles.empty,
                index === 0 ? styles.equipped : styles.unequipped
              )}
              key={index}
            />
          )
        )
      )}
    </div>
  );
}

function LoadoutParametersDisplay({ params }: { params: LoadoutParameters }) {
  const defs = useD2Definitions()!;
  const { query, exoticArmorHash, upgradeSpendTier, statConstraints, lockItemEnergyType } = params;
  const show =
    params.query ||
    params.exoticArmorHash ||
    params.upgradeSpendTier !== undefined ||
    params.statConstraints?.some((s) => s.maxTier !== undefined || s.minTier !== undefined);
  if (!show) {
    return null;
  }

  return (
    <div className={styles.loParams}>
      {query && (
        <div className={styles.loQuery}>
          <AppIcon icon={searchIcon} />
          {query}
        </div>
      )}
      {exoticArmorHash && (
        <div className={styles.loExotic}>
          <ExoticArmorChoice lockedExoticHash={exoticArmorHash} />
        </div>
      )}
      {upgradeSpendTier !== undefined && (
        <div className={styles.loSpendTier}>
          <SelectedArmorUpgrade
            defs={defs}
            upgradeSpendTier={upgradeSpendTier}
            lockItemEnergyType={lockItemEnergyType ?? false}
          />
        </div>
      )}
      {statConstraints && (
        <div className={styles.loStats}>
          {statConstraints.map((s) => (
            <div key={s.statHash} className={styles.loStat}>
              <BungieImage src={defs.Stat.get(s.statHash).displayProperties.icon} />
              {s.minTier !== undefined && s.minTier !== 0 ? (
                <span>
                  {t('LoadoutBuilder.TierNumber', {
                    tier: s.minTier,
                  })}
                  {(s.maxTier === 10 || s.maxTier === undefined) && s.minTier !== 10
                    ? '+'
                    : s.maxTier !== undefined && s.maxTier !== s.minTier
                    ? `-${s.maxTier}`
                    : ''}
                </span>
              ) : s.maxTier !== undefined ? (
                <span>T{s.maxTier}-</span>
              ) : (
                t('LoadoutBuilder.TierNumber', {
                  tier: 10,
                }) + '-'
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyClassItem() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect
        transform="rotate(-45)"
        y="17.470564"
        x="-16.470564"
        height="32.941124"
        width="32.941124"
        fill="rgba(255, 255, 255, 0.05)"
        strokeWidth="1"
        strokeMiterlimit="4"
      />
    </svg>
  );
}
