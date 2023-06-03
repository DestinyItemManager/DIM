import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { savedLoStatConstraintsByClassSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadoutFromEquipped, resolveLoadoutModHashes } from 'app/loadout-drawer/loadout-utils';
import { useSavedLoadoutsForClassType } from 'app/loadout/loadout-ui/menu-hooks';
import { categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, redoIcon, refreshIcon, undoIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { emptyArray } from 'app/utils/empty';
import { isClassCompatible } from 'app/utils/item-utils';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { AnimatePresence, motion } from 'framer-motion';
import { Draft } from 'immer';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  allItemsSelector,
  sortedStoresSelector,
  unlockedPlugSetItemsSelector,
} from '../inventory/selectors';
import ModPicker from '../loadout/ModPicker';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import styles from './LoadoutBuilder.m.scss';
import NoBuildsFoundExplainer from './NoBuildsFoundExplainer';
import EnergyOptions from './filter/EnergyOptions';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import TierSelect from './filter/TierSelect';
import CompareLoadoutsDrawer from './generated-sets/CompareLoadoutsDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { useLbState } from './loadout-builder-reducer';
import { buildLoadoutParams } from './loadout-params';
import { useAutoMods, useProcess } from './process/useProcess';
import {
  ArmorEnergyRules,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LockableBucketHash,
  loDefaultArmorEnergyRules,
} from './types';

/** Do not allow the user to choose artifice mods manually in Loadout Optimizer since we're supposed to be doing that */
const autoAssignmentPCHs = [PlugCategoryHashes.EnhancementsArtifice];

/**
 * The Loadout Optimizer screen
 */
export default memo(function LoadoutBuilder({
  preloadedLoadout,
}: {
  preloadedLoadout: Loadout | undefined;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const defs = useD2Definitions()!;
  const stores = useSelector(sortedStoresSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const searchQuery = useSelector(querySelector);
  const savedStatConstraintsByClass = useSelector(savedLoStatConstraintsByClassSelector);

  const optimizingLoadoutId = preloadedLoadout?.id;

  // All Loadout Optimizer state is managed via this hook/reducer
  const [
    {
      loadoutParameters,
      statOrder,
      pinnedItems,
      excludedItems,
      subclass,
      selectedStoreId,
      statFilters,
      modPicker,
      compareSet,
      canRedo,
      canUndo,
    },
    lbDispatch,
  ] = useLbState(stores, defs, preloadedLoadout);

  const modHashes = loadoutParameters.mods ?? emptyArray();
  const lockedExoticHash = loadoutParameters.exoticArmorHash;
  const autoStatMods = loadoutParameters.autoStatMods ?? false;

  const selectedStore = stores.find((store) => store.id === selectedStoreId)!;
  const classType = selectedStore.classType;
  const loadouts = useRelevantLoadouts(selectedStore);

  const resolvedMods = useResolvedMods(defs, modHashes, selectedStoreId);

  const modsToAssign = useMemo(
    // If auto stat mods are enabled, ignore any saved stat mods
    () =>
      resolvedMods
        .filter(
          (mod) =>
            !(
              autoStatMods &&
              mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General
            )
        )
        .map((mod) => mod.resolvedMod),
    [resolvedMods, autoStatMods]
  );

  /** Gets items for the loadout builder and creates a mapping of classType -> bucketHash -> item array. */
  const armorByBucketHash = useArmorByBucketHash(classType);

  const { modMap: lockedModMap, unassignedMods } = useMemo(
    () =>
      categorizeArmorMods(
        modsToAssign,
        armorByBucketHash ? Object.values(armorByBucketHash).flat() : []
      ),
    [armorByBucketHash, modsToAssign]
  );

  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  const setSetting = useSetSetting();
  const hasPreloadedLoadout = Boolean(preloadedLoadout);
  useEffect(() => {
    // If the user is playing with an existing loadout (potentially one they
    // received from a loadout share), do not overwrite the global saved loadout
    // parameters. If they decide to save that loadout, these will still be
    // saved with the loadout.
    if (hasPreloadedLoadout) {
      return;
    }

    const newLoadoutParameters = buildLoadoutParams(
      loadoutParameters,
      '', // and the search query
      // and don't save stat ranges either, just whether they're ignored
      _.mapValues(statFilters, (m) => ({
        ignored: m.ignored,
        min: 0,
        max: 10,
      })),
      statOrder
    );

    // Only these properties will be saved between sessions
    const newSavedLoadoutParams = _.pick(
      newLoadoutParameters,
      'assumeArmorMasterwork',
      'autoStatMods'
    );

    setSetting('loParameters', newSavedLoadoutParams);
    setSetting('loStatConstraintsByClass', {
      ...savedStatConstraintsByClass,
      [classType]: newLoadoutParameters.statConstraints,
    });
  }, [
    setSetting,
    statFilters,
    statOrder,
    loadoutParameters,
    optimizingLoadoutId,
    savedStatConstraintsByClass,
    classType,
    hasPreloadedLoadout,
  ]);

  const onCharacterChanged = useCallback(
    (storeId: string) =>
      lbDispatch({
        type: 'changeCharacter',
        store: stores.find((store) => store.id === storeId)!,
        savedStatConstraintsByClass,
      }),
    [lbDispatch, savedStatConstraintsByClass, stores]
  );

  // TODO: maybe load from URL state async and fire a dispatch?
  // TODO: save params to URL when they change? or leave it for the share...

  const enabledStats = useMemo(
    () => new Set(armorStats.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const autoMods = useAutoMods(selectedStore.id);
  // Half tier mods in stat order so that the quick-add button automatically adds them,
  // but for stats we care about (and only if we're not adding mods ourselves)
  const halfTierMods = useMemo(
    () =>
      (!loadoutParameters.autoStatMods &&
        _.compact(
          statOrder.map(
            (statHash) => enabledStats.has(statHash) && autoMods.generalMods[statHash]?.minorMod
          )
        )) ||
      [],
    [autoMods.generalMods, enabledStats, loadoutParameters.autoStatMods, statOrder]
  );

  const [armorEnergyRules, filteredItems, filterInfo] = useMemo(() => {
    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
    };
    if (loadoutParameters.assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork = loadoutParameters.assumeArmorMasterwork;
    }
    const [items, filterInfo] = filterItems({
      defs,
      items: armorByBucketHash,
      pinnedItems,
      excludedItems,
      lockedModMap,
      unassignedMods,
      lockedExoticHash,
      armorEnergyRules,
      searchFilter,
    });
    return [armorEnergyRules, items, filterInfo];
  }, [
    loadoutParameters.assumeArmorMasterwork,
    defs,
    armorByBucketHash,
    pinnedItems,
    excludedItems,
    lockedModMap,
    unassignedMods,
    lockedExoticHash,
    searchFilter,
  ]);

  const modStatChanges = useMemo(
    () => getTotalModStatChanges(defs, modsToAssign, subclass, classType, true),
    [classType, defs, modsToAssign, subclass]
  );

  const { result, processing, remainingTime } = useProcess({
    defs,
    selectedStore,
    filteredItems,
    lockedModMap,
    subclass,
    modStatChanges,
    armorEnergyRules,
    statOrder,
    statFilters,
    anyExotic: lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC,
    autoStatMods,
  });

  // A representation of the current loadout optimizer parameters that can be saved with generated loadouts
  // TODO: replace some of these individual params with this object
  const params = useMemo(
    () => buildLoadoutParams(loadoutParameters, searchQuery, statFilters, statOrder),
    [loadoutParameters, searchQuery, statFilters, statOrder]
  );

  const resultSets = result?.sets;

  const filteredSets = useMemo(
    () => resultSets && sortGeneratedSets(resultSets, statOrder, enabledStats),
    [statOrder, enabledStats, resultSets]
  );

  // I don't think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <>
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol>
            <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
          </ol>
        </div>
      )}
      <div className={styles.undoRedo}>
        <button
          className="dim-button"
          onClick={() => lbDispatch({ type: 'undo' })}
          type="button"
          disabled={!canUndo}
        >
          <AppIcon icon={undoIcon} /> {t('Loadouts.Undo')}
        </button>
        <button
          className="dim-button"
          onClick={() => lbDispatch({ type: 'redo' })}
          type="button"
          disabled={!canRedo}
        >
          <AppIcon icon={redoIcon} /> {t('Loadouts.Redo')}
        </button>
      </div>
      <TierSelect
        stats={statFilters}
        statRangesFiltered={result?.statRangesFiltered}
        order={statOrder}
        onStatFiltersChanged={(statFilters) =>
          lbDispatch({ type: 'statFiltersChanged', statFilters })
        }
        onStatOrderChanged={(sortOrder) => lbDispatch({ type: 'sortOrderChanged', sortOrder })}
      />
      <EnergyOptions
        assumeArmorMasterwork={loadoutParameters.assumeArmorMasterwork}
        lbDispatch={lbDispatch}
      />
      <LockArmorAndPerks
        selectedStore={selectedStore}
        pinnedItems={pinnedItems}
        excludedItems={excludedItems}
        lockedMods={resolvedMods}
        subclass={subclass}
        lockedExoticHash={lockedExoticHash}
        searchFilter={searchFilter}
        autoStatMods={autoStatMods}
        lbDispatch={lbDispatch}
      />
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol start={3}>
            <li>{t('LoadoutBuilder.OptimizerExplanationSearch')}</li>
          </ol>
          <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
        </div>
      )}
    </>
  );

  return (
    <PageWithMenu className={styles.page}>
      <PageWithMenu.Menu className={styles.menuContent}>
        <CharacterSelect
          selectedStore={selectedStore}
          stores={stores}
          onCharacterChanged={onCharacterChanged}
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
        <AnimatePresence>
          {processing && (
            <motion.div
              className={styles.processing}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ ease: 'easeInOut', duration: 0.5 }}
            >
              <div>
                {t('LoadoutBuilder.ProcessingSets', {
                  character: selectedStore.name,
                  remainingTime: remainingTime || '??',
                })}
              </div>
              <AppIcon icon={refreshIcon} spinning={true} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className={styles.toolbar}>
          <UserGuideLink topic="Loadout-Optimizer" />
          {result && (
            <div className={styles.speedReport}>
              {t('LoadoutBuilder.SpeedReport', {
                combos: result.combos,
                time: (result.processTime / 1000).toFixed(2),
              })}
            </div>
          )}
        </div>
        {!isPhonePortrait && (
          <div className={styles.guide}>
            <ol>
              <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
              <li>{t('LoadoutBuilder.OptimizerExplanationMods')}</li>
              <li>{t('LoadoutBuilder.OptimizerExplanationSearch')}</li>
            </ol>
            <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
          </div>
        )}
        {preloadedLoadout?.notes && (
          <div className={styles.guide}>
            <p>
              <b>{t('MovePopup.Notes')}</b> {preloadedLoadout?.notes}
            </p>
          </div>
        )}
        {result && filteredSets?.length ? (
          <GeneratedSets
            sets={filteredSets}
            subclass={subclass}
            lockedMods={result.mods}
            pinnedItems={pinnedItems}
            selectedStore={selectedStore}
            lbDispatch={lbDispatch}
            statOrder={statOrder}
            enabledStats={enabledStats}
            modStatChanges={result.modStatChanges}
            loadouts={loadouts}
            params={params}
            halfTierMods={halfTierMods}
            armorEnergyRules={result.armorEnergyRules}
            notes={preloadedLoadout?.notes}
          />
        ) : (
          !processing && (
            <NoBuildsFoundExplainer
              defs={defs}
              classType={classType}
              dispatch={lbDispatch}
              resolvedMods={resolvedMods}
              lockedModMap={lockedModMap}
              alwaysInvalidMods={unassignedMods}
              autoAssignStatMods={autoStatMods}
              armorEnergyRules={armorEnergyRules}
              lockedExoticHash={lockedExoticHash}
              statFilters={statFilters}
              pinnedItems={pinnedItems}
              filterInfo={filterInfo}
              processInfo={result?.processInfo}
            />
          )
        )}
        {modPicker.open && (
          <Portal>
            <ModPicker
              classType={classType}
              owner={selectedStore.id}
              lockedMods={resolvedMods}
              plugCategoryHashWhitelist={modPicker.plugCategoryHashWhitelist}
              plugCategoryHashDenyList={
                autoStatMods
                  ? [...autoAssignmentPCHs, PlugCategoryHashes.EnhancementsV2General]
                  : autoAssignmentPCHs
              }
              onAccept={(newLockedMods) =>
                lbDispatch({
                  type: 'lockedModsChanged',
                  lockedMods: newLockedMods,
                })
              }
              onClose={() => lbDispatch({ type: 'closeModPicker' })}
            />
          </Portal>
        )}
        {compareSet && (
          <Portal>
            <CompareLoadoutsDrawer
              set={compareSet}
              selectedStore={selectedStore}
              loadouts={loadouts}
              initialLoadoutId={optimizingLoadoutId}
              subclass={subclass}
              classType={classType}
              params={params}
              notes={preloadedLoadout?.notes}
              lockedMods={modsToAssign}
              onClose={() => lbDispatch({ type: 'closeCompareDrawer' })}
            />
          </Portal>
        )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
});

/**
 * Get a list of all loadouts that could be shown as "matching loadouts" or
 * used to compare loadouts. This is all loadouts usable by the selected store's
 * class plus the currently equipped loadout.
 */
function useRelevantLoadouts(selectedStore: DimStore) {
  const classLoadouts = useSavedLoadoutsForClassType(selectedStore.classType);

  // TODO: consider using fullyResolvedLoadoutsSelector
  const loadouts = useMemo(() => {
    // TODO: use a selector / weakMemoize for this?
    const equippedLoadout = newLoadoutFromEquipped(
      t('Loadouts.CurrentlyEquipped'),
      selectedStore,
      // TODO: pipe in
      undefined
    );
    return [...classLoadouts, equippedLoadout];
  }, [classLoadouts, selectedStore]);

  return loadouts;
}

/**
 * Get a list of "resolved" mods given a list of mod hashes (presumably the ones selected by the user).
 * Resolved mods may be substituted with more appropriate choices.
 */
function useResolvedMods(
  defs: D2ManifestDefinitions,
  modHashes: number[],
  selectedStoreId: string | undefined
) {
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(selectedStoreId));
  return useMemo(
    () => resolveLoadoutModHashes(defs, modHashes, unlockedPlugs),
    [defs, modHashes, unlockedPlugs]
  );
}

/**
 * Gets all armor items that could be used to build loadouts for the specified class.
 * @return a mapping of bucketHash -> items.
 */
function useArmorByBucketHash(classType: DestinyClass): ItemsByBucket {
  const allItems = useSelector(allItemsSelector);
  return useMemo(() => {
    const items: Draft<ItemsByBucket> = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
    };
    for (const item of allItems) {
      if (!isClassCompatible(item.classType, classType) || !isLoadoutBuilderItem(item)) {
        continue;
      }

      items[item.bucket.hash as LockableBucketHash].push(item);
    }
    return items;
  }, [allItems, classType]);
}
