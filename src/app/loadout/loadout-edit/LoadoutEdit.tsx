import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { D2BucketCategory, InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  createItemContextSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ShowItemPickerFn, useItemPicker } from 'app/item-picker/item-picker';
import {
  LoadoutUpdateFunction,
  addItem,
  applySocketOverrides,
  changeClearMods,
  changeIncludeRuntimeStats,
  clearArtifactUnlocks,
  clearBucketCategory,
  clearLoadoutOptimizerParameters,
  clearMods,
  clearSubclass,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  getLoadoutBucketHashesFromCategory,
  randomizeLoadoutItems,
  randomizeLoadoutMods,
  randomizeLoadoutSubclass,
  removeArtifactUnlock,
  removeItem,
  removeMod,
  replaceItem,
  setClearSpace,
  setLoadoutSubclassFromEquipped,
  syncArtifactUnlocksFromEquipped,
  syncLoadoutCategoryFromEquipped,
  syncModsFromEquipped,
  toggleEquipped,
  updateMods,
  updateModsByBucket,
  useLoadoutUpdaters,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import {
  findSameLoadoutItemIndex,
  getUnequippedItemsForLoadout,
} from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout, loadoutPower } from 'app/loadout/LoadoutView';
import { Loadout, ResolvedLoadoutItem, ResolvedLoadoutMod } from 'app/loadout/loadout-types';
import { LoadoutArtifactUnlocks, LoadoutMods } from 'app/loadout/loadout-ui/LoadoutMods';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { count } from 'app/utils/collections';
import { emptyObject } from 'app/utils/empty';
import { stubTrue } from 'app/utils/functions';
import { isItemLoadoutCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SubclassPlugDrawer from '../SubclassPlugDrawer';
import { hasVisibleLoadoutParameters } from '../loadout-ui/LoadoutParametersDisplay';
import { useLoadoutMods } from '../mod-assignment-drawer/selectors';
import { includesRuntimeStatMods } from '../stats';
import * as styles from './LoadoutEdit.m.scss';
import LoadoutEditBucket, { ArmorExtras } from './LoadoutEditBucket';
import LoadoutEditSection from './LoadoutEditSection';
import LoadoutEditSubclass from './LoadoutEditSubclass';

export default function LoadoutEdit({
  loadout,
  store,
  setLoadout,
}: {
  loadout: Loadout;
  store: DimStore;
  setLoadout: (updater: LoadoutUpdateFunction) => void;
}) {
  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);

  const modsByBucket: {
    [bucketHash: number]: number[] | undefined;
  } = loadout.parameters?.modsByBucket ?? emptyObject();

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(
    () =>
      getItemsAndSubclassFromLoadout(
        itemCreationContext,
        loadout.items,
        store,
        allItems,
        modsByBucket,
      ),
    [itemCreationContext, loadout.items, store, allItems, modsByBucket],
  );

  const [allMods, modDefinitions] = useLoadoutMods(loadout, store.id);
  const categories = Object.groupBy(
    items.concat(warnitems),
    (li) => li.item.bucket.sort ?? 'unknown',
  );
  const power = loadoutPower(store, categories);
  const anyClass = loadout.classType === DestinyClass.Unknown;

  return (
    <div className={styles.contents}>
      {!anyClass && (
        <LoadoutEditSubclassSection
          loadout={loadout}
          store={store}
          setLoadout={setLoadout}
          power={power}
          subclass={subclass}
          className={styles.section}
        />
      )}
      {(anyClass
        ? (['Weapons', 'General'] as const)
        : (['Weapons', 'Armor', 'General'] as const)
      ).map((category) => (
        <LoadoutEditCategorySection
          key={category}
          category={category}
          loadout={loadout}
          store={store}
          items={categories[category]}
          subclass={subclass}
          modDefinitions={modDefinitions}
          setLoadout={setLoadout}
        />
      ))}
      <LoadoutEditModsSection
        loadout={loadout}
        store={store}
        setLoadout={setLoadout}
        allMods={allMods}
        className={clsx(styles.section, styles.mods)}
        showClearUnsetModsSetting
        showModPlacementsButton
      />
      <LoadoutArtifactUnlocksSection
        artifactUnlocks={loadout.parameters?.artifactUnlocks}
        classType={loadout.classType}
        storeId={store.id}
        setLoadout={setLoadout}
      />
    </div>
  );
}

async function pickLoadoutItem(
  showItemPicker: ShowItemPickerFn,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  store: DimStore,
) {
  const loadoutHasItem = (item: DimItem) =>
    findSameLoadoutItemIndex(defs, loadout.items, item) !== -1;

  const item = await showItemPicker({
    filterItems: (item: DimItem) =>
      item.bucket.hash === bucket.hash &&
      isItemLoadoutCompatible(item.classType, loadout.classType) &&
      itemCanBeInLoadout(item) &&
      !loadoutHasItem(item) &&
      (!item.notransfer || item.owner === store.id),
    prompt: t('Loadouts.ChooseItem', { name: bucket.name }),
  });

  if (item) {
    add(item);
  }
}

export function LoadoutEditSubclassSection({
  loadout,
  store,
  setLoadout,
  power = 0,
  subclass,
  className,
}: {
  loadout: Loadout;
  store: DimStore;
  setLoadout: (updater: LoadoutUpdateFunction) => void;
  power?: number;
  subclass: ResolvedLoadoutItem | undefined;
  className?: string;
}) {
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);

  const { useUpdater, useDefsUpdater, useDefsStoreUpdater } = useLoadoutUpdaters(store, setLoadout);

  const handleAddItem = useDefsUpdater(addItem);

  const handleApplySocketOverrides = useUpdater(applySocketOverrides);
  const handleSyncSubclassFromEquipped = useDefsStoreUpdater(setLoadoutSubclassFromEquipped);
  const handleRandomizeSubclass = useDefsStoreUpdater(randomizeLoadoutSubclass);
  const handleClearSubclass = useDefsUpdater(clearSubclass);
  const handleOpenPlugDrawer = () => setPlugDrawerOpen(true);

  return (
    <LoadoutEditSection
      className={className}
      title={t('Bucket.Class')}
      onClear={handleClearSubclass}
      onRandomize={handleRandomizeSubclass}
      onSyncFromEquipped={handleSyncSubclassFromEquipped}
    >
      <LoadoutEditSubclass
        subclass={subclass}
        classType={loadout.classType}
        storeId={store.id}
        power={power}
        onClick={handleOpenPlugDrawer}
        onPick={handleAddItem}
      />
      {subclass && (
        <div className={styles.buttons}>
          {subclass.item.sockets ? (
            <button type="button" className="dim-button" onClick={handleOpenPlugDrawer}>
              {t('LB.SelectSubclassOptions')}
            </button>
          ) : (
            <div>{t('Loadouts.CannotCustomizeSubclass')}</div>
          )}
        </div>
      )}
      {plugDrawerOpen && subclass && (
        <SubclassPlugDrawer
          subclass={subclass.item}
          socketOverrides={subclass.loadoutItem.socketOverrides ?? {}}
          onClose={() => setPlugDrawerOpen(false)}
          onAccept={(overrides) => handleApplySocketOverrides(subclass, overrides)}
        />
      )}
    </LoadoutEditSection>
  );
}

function LoadoutEditCategorySection({
  category,
  loadout,
  store,
  items,
  subclass,
  modDefinitions,
  setLoadout,
}: {
  category: 'Weapons' | 'Armor' | 'General';
  loadout: Loadout;
  store: DimStore;
  items: ResolvedLoadoutItem[];
  subclass: ResolvedLoadoutItem | undefined;
  modDefinitions: PluggableInventoryItemDefinition[];
  setLoadout: (updater: LoadoutUpdateFunction) => void;
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const showItemPicker = useItemPicker();

  const { useUpdater, useDefsUpdater, useDefsStoreUpdater } = useLoadoutUpdaters(store, setLoadout);

  const handleAddItem = useDefsUpdater(addItem);
  const handleReplaceItem = useUpdater(replaceItem);

  const handleClickPlaceholder = ({
    bucket,
    equip,
  }: {
    bucket: InventoryBucket;
    equip: boolean;
  }) => {
    pickLoadoutItem(
      showItemPicker,
      defs,
      loadout,
      bucket,
      (item) => handleAddItem(item, equip),
      store,
    );
  };

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (li: ResolvedLoadoutItem) => {
    const warnItem = li.item;

    const item = await showItemPicker({
      filterItems: (item: DimItem) =>
        (warnItem.bucket.inArmor
          ? item.bucket.hash === warnItem.bucket.hash
          : item.hash === warnItem.hash) &&
        itemCanBeInLoadout(item) &&
        isItemLoadoutCompatible(item.classType, loadout.classType),
      prompt: t('Loadouts.FindAnother', {
        name: warnItem.bucket.inArmor ? warnItem.bucket.name : warnItem.name,
      }),
    });

    if (item) {
      handleReplaceItem(li, item);
    }
  };

  const modsByBucket: {
    [bucketHash: number]: number[] | undefined;
  } = loadout.parameters?.modsByBucket ?? emptyObject();

  const artifactUnlocks = useSelector(artifactUnlocksSelector(store.id));

  const handleClearCategory = useDefsUpdater(clearBucketCategory);
  const handleModsByBucketUpdated = useUpdater(updateModsByBucket);
  const handleToggleEquipped = useDefsUpdater(toggleEquipped);
  const handleClearLoadoutParameters = useUpdater(clearLoadoutOptimizerParameters);
  const handleFillCategoryFromUnequipped = useDefsStoreUpdater(fillLoadoutFromUnequipped);
  const handleFillCategoryFromEquipped = useDefsStoreUpdater(fillLoadoutFromEquipped);
  const handleSyncCategoryFromEquipped = useDefsStoreUpdater(syncLoadoutCategoryFromEquipped);
  const handleRandomizeCategory = useDefsStoreUpdater(randomizeLoadoutItems);
  const onRemoveItem = useDefsUpdater(removeItem);
  const handleSetClear = useUpdater(setClearSpace);

  return (
    <LoadoutEditSection
      className={styles.section}
      title={t(`Bucket.${category}`, { metadata: { keys: 'buckets' } })}
      onClear={() => handleClearCategory(category)}
      onRandomize={() => handleRandomizeCategory(allItems, category, searchFilter)}
      hasRandomizeQuery={searchFilter !== stubTrue}
      onFillFromEquipped={() => handleFillCategoryFromEquipped(artifactUnlocks, category)}
      fillFromEquippedDisabled={disableFillInForCategory(defs, items, category)}
      onSyncFromEquipped={() => handleSyncCategoryFromEquipped(category)}
      fillFromInventoryCount={getUnequippedItemsForLoadout(store, category).length}
      onFillFromInventory={() => handleFillCategoryFromUnequipped(category)}
      onClearLoadoutParameters={
        category === 'Armor' && hasVisibleLoadoutParameters(loadout.parameters)
          ? handleClearLoadoutParameters
          : undefined
      }
    >
      <LoadoutEditBucket
        category={category}
        storeId={store.id}
        classType={loadout.classType}
        items={items}
        modsByBucket={modsByBucket}
        onClickPlaceholder={handleClickPlaceholder}
        onClickWarnItem={fixWarnItem}
        onRemoveItem={onRemoveItem}
        onToggleEquipped={handleToggleEquipped}
      >
        {category === 'Armor' && (
          <ArmorExtras
            loadout={loadout}
            storeId={store.id}
            subclass={subclass}
            items={items}
            allMods={modDefinitions}
            onModsByBucketUpdated={handleModsByBucketUpdated}
          />
        )}
        {(category === 'Armor' || category === 'Weapons') && Boolean(items?.length) && (
          <CheckButton
            className={styles.clearButton}
            name={`clearSpace${category}`}
            checked={Boolean(
              category === 'Armor'
                ? loadout.parameters?.clearArmor
                : loadout.parameters?.clearWeapons,
            )}
            onChange={(clear) => handleSetClear(clear, category)}
          >
            {t('Loadouts.ClearSpace')}
          </CheckButton>
        )}
      </LoadoutEditBucket>
    </LoadoutEditSection>
  );
}

export function LoadoutEditModsSection({
  loadout,
  store,
  autoStatMods,
  setLoadout,
  allMods,
  className,
  showClearUnsetModsSetting,
  showModPlacementsButton,
  onAutoStatModsChanged,
}: {
  loadout: Loadout;
  store: DimStore;
  autoStatMods?: boolean;
  setLoadout: (updater: LoadoutUpdateFunction) => void;
  allMods: ResolvedLoadoutMod[];
  className?: string;
  showModPlacementsButton?: boolean;
  showClearUnsetModsSetting?: boolean;
  /** Show the auto stat mods checkbox if this is defined */
  onAutoStatModsChanged?: (checked: boolean) => void;
}) {
  const allItems = useSelector(allItemsSelector);
  const missingSockets = allItems.some((i) => i.missingSockets);
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(store.id));

  const { useUpdater, useDefsStoreUpdater } = useLoadoutUpdaters(store, setLoadout);
  const clearUnsetMods = loadout.parameters?.clearMods;
  const includeRuntimeStats = loadout.parameters?.includeRuntimeStatBenefits ?? true;

  const handleUpdateMods = useUpdater(updateMods);
  const handleRemoveMod = useUpdater(removeMod);
  const handleClearUnsetModsChanged = useUpdater(changeClearMods);
  const handleRandomizeMods = useDefsStoreUpdater(randomizeLoadoutMods);
  const handleClearMods = useUpdater(clearMods);
  const handleIncludeRuntimeStats = useUpdater(changeIncludeRuntimeStats);
  const handleSyncModsFromEquipped = () => setLoadout(syncModsFromEquipped(store));

  return (
    <LoadoutEditSection
      title={t('Loadouts.Mods')}
      className={className}
      onClear={handleClearMods}
      onRandomize={() => handleRandomizeMods(allItems, unlockedPlugs)}
      onSyncFromEquipped={missingSockets ? undefined : handleSyncModsFromEquipped}
    >
      <LoadoutMods
        loadout={loadout}
        storeId={store.id}
        allMods={allMods}
        onUpdateMods={handleUpdateMods}
        onRemoveMod={handleRemoveMod}
        clearUnsetMods={clearUnsetMods}
        onClearUnsetModsChanged={
          showClearUnsetModsSetting ? handleClearUnsetModsChanged : undefined
        }
        hideShowModPlacements={!showModPlacementsButton}
        autoStatMods={autoStatMods}
        onAutoStatModsChanged={onAutoStatModsChanged}
        includeRuntimeStats={includeRuntimeStats}
        onIncludeRuntimeStatsChanged={
          loadout.parameters?.mods && includesRuntimeStatMods(loadout.parameters.mods)
            ? handleIncludeRuntimeStats
            : undefined
        }
      />
    </LoadoutEditSection>
  );
}

function LoadoutArtifactUnlocksSection({
  artifactUnlocks,
  classType,
  storeId,
  setLoadout,
}: {
  artifactUnlocks: LoadoutParameters['artifactUnlocks'];
  classType: DestinyClass;
  storeId: string;
  setLoadout: (updater: LoadoutUpdateFunction) => void;
}) {
  const unlockedArtifactMods = useSelector(artifactUnlocksSelector(storeId));

  function useUpdater<T extends unknown[]>(fn: (...args: T) => LoadoutUpdateFunction) {
    return useCallback((...args: T) => setLoadout(fn(...args)), [fn]);
  }

  const handleSyncArtifactUnlocksFromEquipped = useCallback(
    () => setLoadout(syncArtifactUnlocksFromEquipped(unlockedArtifactMods)),
    [setLoadout, unlockedArtifactMods],
  );
  const handleClearArtifactUnlocks = useUpdater(clearArtifactUnlocks);
  const handleRemoveArtifactUnlock = useUpdater(removeArtifactUnlock);

  const artifactTitle = artifactUnlocks
    ? t('Loadouts.ArtifactUnlocksWithSeason', {
        seasonNumber: artifactUnlocks?.seasonNumber,
      })
    : t('Loadouts.ArtifactUnlocks');

  // Don't show the artifact unlocks section unless there are artifact mods saved in this loadout
  // or there are unlocked artifact mods we could copy into this loadout.
  const showArtifactUnlocks = Boolean(
    unlockedArtifactMods?.unlockedItemHashes.length || artifactUnlocks?.unlockedItemHashes.length,
  );

  return (
    showArtifactUnlocks && (
      <LoadoutEditSection
        title={artifactTitle}
        titleInfo={t('Loadouts.ArtifactUnlocksDesc')}
        className={styles.section}
        onClear={handleClearArtifactUnlocks}
        onSyncFromEquipped={
          unlockedArtifactMods ? handleSyncArtifactUnlocksFromEquipped : undefined
        }
      >
        <LoadoutArtifactUnlocks
          artifactUnlocks={artifactUnlocks}
          classType={classType}
          storeId={storeId}
          onRemoveMod={handleRemoveArtifactUnlock}
          onSyncFromEquipped={
            unlockedArtifactMods ? handleSyncArtifactUnlocksFromEquipped : undefined
          }
        />
      </LoadoutEditSection>
    )
  );
}

/**
 * Disable the "Fill in" menu item if it wouldn't do anything.
 */
function disableFillInForCategory(
  defs: D2ManifestDefinitions,
  items: ResolvedLoadoutItem[],
  category: D2BucketCategory,
) {
  const currentItems = items ? count(items, (i) => i.loadoutItem.equip) : 0;
  const maxItems = getLoadoutBucketHashesFromCategory(defs, category).length;

  return currentItems >= maxItems;
}
