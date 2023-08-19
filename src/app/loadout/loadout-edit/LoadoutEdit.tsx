import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  createItemContextSelector,
  profileResponseSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { ShowItemPickerFn, useItemPicker } from 'app/item-picker/item-picker';
import {
  LoadoutUpdateFunction,
  addItem,
  applySocketOverrides,
  changeClearMods,
  clearArtifactUnlocks,
  clearBucketCategory,
  clearLoadoutParameters,
  clearMods,
  clearSubclass,
  equipItem,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  randomizeLoadoutItems,
  randomizeLoadoutMods,
  randomizeLoadoutSubclass,
  removeArtifactUnlock,
  removeItem,
  removeMod,
  setClearSpace,
  setLoadoutSubclassFromEquipped,
  syncArtifactUnlocksFromEquipped,
  syncModsFromEquipped,
  updateMods,
  updateModsByBucket,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import {
  findSameLoadoutItemIndex,
  getUnequippedItemsForLoadout,
} from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout, loadoutPower } from 'app/loadout/LoadoutView';
import { LoadoutArtifactUnlocks, LoadoutMods } from 'app/loadout/loadout-ui/LoadoutMods';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { emptyObject } from 'app/utils/empty';
import { isClassCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SubclassPlugDrawer from '../SubclassPlugDrawer';
import { pickSubclass } from '../item-utils';
import { hasVisibleLoadoutParameters } from '../loadout-ui/LoadoutParametersDisplay';
import { useLoadoutMods } from '../mod-assignment-drawer/selectors';
import styles from './LoadoutEdit.m.scss';
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
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const allItems = useSelector(allItemsSelector);
  const missingSockets = allItems.some((i) => i.missingSockets);
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);
  const itemCreationContext = useSelector(createItemContextSelector);
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(store.id));
  const unlockedArtifactMods = useSelector(artifactUnlocksSelector(store.id));
  const searchFilter = useSelector(searchFilterSelector);
  const showItemPicker = useItemPicker();

  const handleAddItem = withDefsUpdater(addItem);

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
      store
    );
  };

  const handleRemoveItem = withDefsUpdater(removeItem);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (li: ResolvedLoadoutItem) => {
    const warnItem = li.item;

    try {
      const { item } = await showItemPicker({
        filterItems: (item: DimItem) =>
          (warnItem.bucket.inArmor
            ? item.bucket.hash === warnItem.bucket.hash
            : item.hash === warnItem.hash) &&
          itemCanBeInLoadout(item) &&
          isClassCompatible(item.classType, loadout.classType),
        prompt: t('Loadouts.FindAnother', {
          name: warnItem.bucket.inArmor ? warnItem.bucket.name : warnItem.name,
        }),
      });

      handleAddItem(item);
      handleRemoveItem(li);
    } catch (e) {
      // user canceled item picker without a selection
    }
  };

  const handleClickSubclass = () =>
    pickLoadoutSubclass(showItemPicker, loadout, store.id, handleAddItem);

  // Don't show the artifact unlocks section unless there are artifact mods saved in this loadout
  // or there are unlocked artifact mods we could copy into this loadout.
  const showArtifactUnlocks = Boolean(
    unlockedArtifactMods?.unlockedItemHashes.length ||
      loadout.parameters?.artifactUnlocks?.unlockedItemHashes.length
  );

  // TODO: filter down by usable mods?
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
        modsByBucket
      ),
    [itemCreationContext, loadout.items, store, allItems, modsByBucket]
  );

  const artifactUnlocks = useSelector(artifactUnlocksSelector(store.id));

  const [allMods, modDefinitions] = useLoadoutMods(loadout, store.id);
  const clearUnsetMods = loadout.parameters?.clearMods;
  const categories = _.groupBy(items.concat(warnitems), (li) => li.item.bucket.sort);
  const power = loadoutPower(store, categories);
  const anyClass = loadout.classType === DestinyClass.Unknown;

  // Some helpers that bind our updater functions to the current environment
  function withUpdater<T extends unknown[]>(fn: (...args: T) => LoadoutUpdateFunction) {
    return (...args: T) => setLoadout(fn(...args));
  }
  function withDefsUpdater<T extends unknown[]>(
    fn: (defs: D1ManifestDefinitions | D2ManifestDefinitions, ...args: T) => LoadoutUpdateFunction
  ) {
    return (...args: T) => setLoadout(fn(defs, ...args));
  }
  function withDefsStoreUpdater<T extends unknown[]>(
    fn: (
      defs: D1ManifestDefinitions | D2ManifestDefinitions,
      store: DimStore,
      ...args: T
    ) => LoadoutUpdateFunction
  ) {
    return (...args: T) => setLoadout(fn(defs, store, ...args));
  }

  const handleUpdateMods = (newMods: number[]) => setLoadout(updateMods(newMods));
  const handleRemoveMod = withUpdater(removeMod);
  const handleClearCategory = withDefsUpdater(clearBucketCategory);
  const handleModsByBucketUpdated = withUpdater(updateModsByBucket);
  const handleApplySocketOverrides = withUpdater(applySocketOverrides);
  const handleToggleEquipped = withDefsUpdater(equipItem);
  const handleClearUnsetModsChanged = withUpdater(changeClearMods);
  const handleClearLoadoutParameters = withUpdater(clearLoadoutParameters);
  const handleFillSubclassFromEquipped = withDefsStoreUpdater(setLoadoutSubclassFromEquipped);
  const handleFillCategoryFromUnequipped = withDefsStoreUpdater(fillLoadoutFromUnequipped);
  const handleFillCategoryFromEquipped = withDefsStoreUpdater(fillLoadoutFromEquipped);
  const handleRandomizeSubclass = withDefsStoreUpdater(randomizeLoadoutSubclass);
  const handleRandomizeCategory = withDefsStoreUpdater(randomizeLoadoutItems);
  const handleRandomizeMods = withDefsStoreUpdater(randomizeLoadoutMods);
  const handleClearMods = withUpdater(clearMods);
  const onRemoveItem = withDefsUpdater(removeItem);
  const handleClearSubclass = withDefsUpdater(clearSubclass);
  const handleSyncModsFromEquipped = () => setLoadout(syncModsFromEquipped(store));
  const handleSyncArtifactUnlocksFromEquipped = () =>
    setLoadout(syncArtifactUnlocksFromEquipped(unlockedArtifactMods));
  const handleClearArtifactUnlocks = withUpdater(clearArtifactUnlocks);
  const handleRemoveArtifactUnlock = withUpdater(removeArtifactUnlock);
  const handleSetClear = withUpdater(setClearSpace);

  const artifactTitle = loadout.parameters?.artifactUnlocks
    ? t('Loadouts.ArtifactUnlocksWithSeason', {
        seasonNumber: loadout.parameters?.artifactUnlocks?.seasonNumber,
      })
    : t('Loadouts.ArtifactUnlocks');

  // TODO: dedupe styles/code
  return (
    <div className={styles.contents}>
      {!anyClass && (
        <LoadoutEditSection
          className={styles.section}
          title={t('Bucket.Class')}
          onClear={handleClearSubclass}
          onRandomize={handleRandomizeSubclass}
          onFillFromEquipped={handleFillSubclassFromEquipped}
        >
          <LoadoutEditSubclass
            defs={defs}
            subclass={subclass}
            classType={loadout.classType}
            power={power}
            onRemove={handleClearSubclass}
            onPick={handleClickSubclass}
          />
          {subclass && (
            <div className={styles.buttons}>
              {subclass.item.sockets ? (
                <button
                  type="button"
                  className="dim-button"
                  onClick={() => setPlugDrawerOpen(true)}
                >
                  {t('LB.SelectSubclassOptions')}
                </button>
              ) : (
                <div>{t('Loadouts.CannotCustomizeSubclass')}</div>
              )}
            </div>
          )}
          {plugDrawerOpen && subclass && (
            <Portal>
              <SubclassPlugDrawer
                subclass={subclass.item}
                socketOverrides={subclass.loadoutItem.socketOverrides ?? {}}
                onClose={() => setPlugDrawerOpen(false)}
                onAccept={(overrides) => handleApplySocketOverrides(subclass, overrides)}
              />
            </Portal>
          )}
        </LoadoutEditSection>
      )}
      {(anyClass
        ? (['Weapons', 'General'] as const)
        : (['Weapons', 'Armor', 'General'] as const)
      ).map((category) => (
        <LoadoutEditSection
          key={category}
          className={styles.section}
          title={t(`Bucket.${category}`, { metadata: { keys: 'buckets' } })}
          onClear={() => handleClearCategory(category)}
          onRandomize={() => handleRandomizeCategory(allItems, category, searchFilter)}
          hasRandomizeQuery={searchFilter !== _.stubTrue}
          onFillFromEquipped={() => handleFillCategoryFromEquipped(artifactUnlocks, category)}
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
            items={categories[category]}
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
                items={categories[category]}
                allMods={modDefinitions}
                onModsByBucketUpdated={handleModsByBucketUpdated}
              />
            )}
            {(category === 'Armor' || category === 'Weapons') &&
              Boolean(categories[category]?.length) && (
                <CheckButton
                  className={styles.clearButton}
                  name={`clearSpace${category}`}
                  checked={Boolean(
                    category === 'Armor'
                      ? loadout.parameters?.clearArmor
                      : loadout.parameters?.clearWeapons
                  )}
                  onChange={(clear) => handleSetClear(clear, category)}
                >
                  {t('Loadouts.ClearSpace')}
                </CheckButton>
              )}
          </LoadoutEditBucket>
        </LoadoutEditSection>
      ))}
      <LoadoutEditSection
        title={t('Loadouts.Mods')}
        className={clsx(styles.section, styles.mods)}
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
          onClearUnsetModsChanged={handleClearUnsetModsChanged}
        />
      </LoadoutEditSection>
      {showArtifactUnlocks && (
        <LoadoutEditSection
          title={artifactTitle}
          titleInfo={t('Loadouts.ArtifactUnlocksDesc')}
          className={styles.section}
          onClear={handleClearArtifactUnlocks}
          onSyncFromEquipped={profileResponse ? handleSyncArtifactUnlocksFromEquipped : undefined}
        >
          <LoadoutArtifactUnlocks
            loadout={loadout}
            storeId={store.id}
            onRemoveMod={handleRemoveArtifactUnlock}
            onSyncFromEquipped={profileResponse ? handleSyncArtifactUnlocksFromEquipped : undefined}
          />
        </LoadoutEditSection>
      )}
    </div>
  );
}

async function pickLoadoutItem(
  showItemPicker: ShowItemPickerFn,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  store: DimStore
) {
  const loadoutHasItem = (item: DimItem) =>
    findSameLoadoutItemIndex(defs, loadout.items, item) !== -1;
  try {
    const { item } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.hash === bucket.hash &&
        isClassCompatible(item.classType, loadout.classType) &&
        itemCanBeInLoadout(item) &&
        !loadoutHasItem(item) &&
        (!item.notransfer || item.owner === store.id),
      prompt: t('Loadouts.ChooseItem', { name: bucket.name }),
    });

    add(item);
  } catch (e) {
    // user canceled item picker without a selection
  }
}

async function pickLoadoutSubclass(
  showItemPicker: ShowItemPickerFn,
  loadout: Loadout,
  storeId: string,
  add: (item: DimItem, equip?: boolean) => void
) {
  const loadoutClassType = loadout.classType;
  const loadoutHasItem = (item: DimItem) => loadout.items.some((i) => i.hash === item.hash);

  const subclassItemFilter = (item: DimItem) =>
    item.bucket.hash === BucketHashes.Subclass &&
    item.classType === loadoutClassType &&
    item.owner === storeId &&
    itemCanBeInLoadout(item) &&
    !loadoutHasItem(item);

  const item = await pickSubclass(showItemPicker, subclassItemFilter);
  if (item) {
    add(item, undefined);
  }
}
