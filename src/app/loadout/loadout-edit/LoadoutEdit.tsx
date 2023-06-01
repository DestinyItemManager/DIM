import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  createItemContextSelector,
  profileResponseSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import {
  LoadoutUpdateFunction,
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
  removeArtifactUnlock,
  removeItem,
  removeMod,
  setLoadoutSubclassFromEquipped,
  syncArtifactUnlocksFromEquipped,
  syncModsFromEquipped,
  updateMods,
  updateModsByBucket,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getUnequippedItemsForLoadout } from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout, loadoutPower } from 'app/loadout/LoadoutView';
import { LoadoutArtifactUnlocks, LoadoutMods } from 'app/loadout/loadout-ui/LoadoutMods';
import { useD2Definitions } from 'app/manifest/selectors';
import { emptyObject } from 'app/utils/empty';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import SubclassPlugDrawer from '../SubclassPlugDrawer';
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
  onClickSubclass,
  onClickPlaceholder,
  onClickWarnItem,
}: {
  loadout: Loadout;
  store: DimStore;
  setLoadout: (updater: LoadoutUpdateFunction) => void;
  onClickSubclass: (subclass: DimItem | undefined) => void;
  onClickPlaceholder: (params: { bucket: InventoryBucket; equip: boolean }) => void;
  onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
}) {
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const allItems = useSelector(allItemsSelector);
  const missingSockets = allItems.some((i) => i.missingSockets);
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);
  const itemCreationContext = useSelector(createItemContextSelector);

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
  const handleClearMods = withUpdater(clearMods);
  const onRemoveItem = withDefsUpdater(removeItem);
  const handleClearSubclass = withDefsUpdater(clearSubclass);
  const handleSyncModsFromEquipped = () => setLoadout(syncModsFromEquipped(store));
  const handleSyncArtifactUnlocksFromEquipped = () =>
    setLoadout(syncArtifactUnlocksFromEquipped(store, profileResponse));
  const handleClearArtifactUnlocks = withUpdater(clearArtifactUnlocks);
  const handleRemoveArtifactUnlock = withUpdater(removeArtifactUnlock);

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
          onFillFromEquipped={handleFillSubclassFromEquipped}
        >
          <LoadoutEditSubclass
            defs={defs}
            subclass={subclass}
            classType={loadout.classType}
            power={power}
            onRemove={handleClearSubclass}
            onPick={() => onClickSubclass(subclass?.item)}
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
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
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
          </LoadoutEditBucket>
        </LoadoutEditSection>
      ))}
      <LoadoutEditSection
        title={t('Loadouts.Mods')}
        className={clsx(styles.section, styles.mods)}
        onClear={handleClearMods}
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
    </div>
  );
}
