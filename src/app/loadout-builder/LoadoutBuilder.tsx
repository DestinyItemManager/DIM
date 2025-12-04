import {
  LoadoutParameters,
  SetBonusCounts,
  StatConstraint,
} from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { savedLoStatConstraintsByClassSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { useHideItemPicker, useItemPicker } from 'app/item-picker/item-picker';
import { mergeStrictUpgradeStatConstraints } from 'app/loadout-analyzer/utils';
import { LoadoutUpdateFunction } from 'app/loadout-drawer/loadout-drawer-reducer';
import { newLoadoutFromEquipped, resolveLoadoutModHashes } from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import {
  LoadoutEditModsSection,
  LoadoutEditSubclassSection,
} from 'app/loadout/loadout-edit/LoadoutEdit';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, disabledIcon, redoIcon, refreshIcon, undoIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { filterMap } from 'app/utils/collections';
import { emptyObject } from 'app/utils/empty';
import { isClassCompatible, itemCanBeEquippedBy } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { getMaxParallelCores } from 'app/utils/parallel-cores';
import { timerDurationFromMs } from 'app/utils/time';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { deepEqual } from 'fast-equals';
import { Dispatch, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  createItemContextSelector,
  sortedStoresSelector,
  unlockedPlugSetItemsSelector,
} from '../inventory/selectors';
import ModPicker from '../loadout/ModPicker';
import { isLoadoutBuilderItem } from '../loadout/loadout-item-utils';
import * as styles from './LoadoutBuilder.m.scss';
import NoBuildsFoundExplainer from './NoBuildsFoundExplainer';
import { exampleLOSearch } from './example-search';
import EnergyOptions from './filter/EnergyOptions';
import LoadoutOptimizerExotic from './filter/LoadoutOptimizerExotic';
import {
  LoadoutOptimizerExcludedItems,
  LoadoutOptimizerPinnedItems,
} from './filter/LoadoutOptimizerMenuItems';
import LoadoutOptimizerSetBonus from './filter/LoadoutOptimizerSetBonus';
import NewFeaturedGearFilter from './filter/NewFeaturedGearFilter';
import TierlessStatConstraintEditor from './filter/TierlessStatConstraintEditor';
import CompareLoadoutsDrawer from './generated-sets/CompareLoadoutsDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { ReferenceConstraints } from './generated-sets/SetStats';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { LoadoutBuilderAction, useLbState } from './loadout-builder-reducer';
import { useLoVendorItems } from './loadout-builder-vendors';
import { ProcessArmorSet } from './process-worker/types';
import { useProcess } from './process/useProcess';
import {
  ArmorBucketHashes,
  ArmorEnergyRules,
  ArmorSet,
  LOCKED_EXOTIC_ANY_EXOTIC,
  ResolvedStatConstraint,
  autoAssignmentPCHs,
  loDefaultArmorEnergyRules,
} from './types';
import useEquippedHashes from './useEquippedHashes';

/**
 * The Loadout Optimizer screen
 */
export default memo(function LoadoutBuilder({
  preloadedLoadout,
  preloadedStrictStatConstraints,
  storeId,
}: {
  /**
   * A specific loadout to optimize, chosen from the Loadouts or Loadout Edit
   * page.
   */
  preloadedLoadout: Loadout | undefined;
  preloadedStrictStatConstraints: ResolvedStatConstraint[] | undefined;
  /**
   *A preselected store ID, used when navigating from the Loadouts page.
   */
  storeId: string | undefined;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const defs = useD2Definitions()!;
  const showItemPicker = useItemPicker();
  const hideItemPicker = useHideItemPicker();
  const stores = useSelector(sortedStoresSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const searchQuery = useSelector(querySelector);
  const savedStatConstraintsByClass = useSelector(savedLoStatConstraintsByClassSelector);

  // All Loadout Optimizer state is managed via this hook/reducer
  const [
    {
      loadout,
      resolvedStatConstraints,
      strictUpgradesStatConstraints,
      pinnedItems,
      excludedItems,
      selectedStoreId,
      modPicker,
      compareSet,
      canRedo,
      canUndo,
    },
    lbDispatch,
  ] = useLbState(stores, defs, preloadedLoadout, storeId, preloadedStrictStatConstraints);
  // For compatibility with LoadoutEdit components
  const setLoadout = (updateFn: LoadoutUpdateFunction) =>
    lbDispatch({ type: 'setLoadout', updateFn });

  // TODO: if we're editing a loadout, grey out incompatible classes?

  const loadoutParameters = loadout.parameters!;
  const lockedExoticHash = loadoutParameters.exoticArmorHash;
  const statConstraints = loadoutParameters.statConstraints!;
  const autoStatMods = Boolean(loadoutParameters.autoStatMods);
  const includeRuntimeStatBenefits = loadoutParameters.includeRuntimeStatBenefits ?? true;
  const assumeArmorMasterwork = loadoutParameters.assumeArmorMasterwork;
  const setBonuses = loadoutParameters.setBonuses ?? emptyObject<SetBonusCounts>();
  const classType = loadout.classType;

  const selectedStore = stores.find((store) => store.id === selectedStoreId)!;
  const loadouts = useRelevantLoadouts(selectedStore);

  const resolvedMods = useResolvedMods(defs, loadoutParameters.mods, selectedStoreId);

  const itemCreationContext = useSelector(createItemContextSelector);
  const allItems = useSelector(allItemsSelector);
  const modsByBucket: {
    [bucketHash: number]: number[];
  } = loadoutParameters.modsByBucket ?? emptyObject();

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [_items, subclass, _warnitems] = useMemo(
    () =>
      getItemsAndSubclassFromLoadout(
        itemCreationContext,
        loadout.items,
        selectedStore,
        allItems,
        modsByBucket,
      ),
    [itemCreationContext, loadout.items, selectedStore, allItems, modsByBucket],
  );

  // The list of mod items that need to be assigned to armor items
  const modsToAssign = useMemo(
    () =>
      resolvedMods
        .filter(
          (mod) =>
            // If auto stat mods are enabled, ignore any saved stat mods
            !(
              autoStatMods &&
              mod.resolvedMod.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsV2General
            ),
        )
        .map((mod) => mod.resolvedMod),
    [resolvedMods, autoStatMods],
  );

  const { vendorItems } = useLoVendorItems(selectedStoreId);
  const armorItems = useArmorItems(classType, vendorItems);

  const { modMap: lockedModMap, unassignedMods } = useMemo(
    () => categorizeArmorMods(modsToAssign, armorItems),
    [armorItems, modsToAssign],
  );

  // If the user is playing with an existing loadout (potentially one they
  // received from a loadout share) or a direct /optimizer link, do not
  // overwrite the global saved loadout parameters. If they decide to save that
  // loadout, these will still be saved with the loadout. For these purposes we
  // won't consider the equipped loadout to be a preloaded loadout.
  const saveParamsAsDefaults = !(preloadedLoadout && preloadedLoadout.id !== 'equipped');
  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  useSaveLoadoutParameters(saveParamsAsDefaults, loadoutParameters);
  useSaveStatConstraints(
    saveParamsAsDefaults,
    statConstraints,
    savedStatConstraintsByClass,
    classType,
  );

  const onCharacterChanged = useCallback(
    (storeId: string) =>
      lbDispatch({
        type: 'changeCharacter',
        store: getStore(stores, storeId)!,
        savedStatConstraintsByClass,
      }),
    [lbDispatch, savedStatConstraintsByClass, stores],
  );

  // Write the search query into the loadout
  useEffect(() => {
    if ((searchQuery || undefined) !== loadoutParameters.query) {
      lbDispatch({ type: 'setSearchQuery', query: searchQuery });
    }
  }, [lbDispatch, loadoutParameters.query, searchQuery]);

  // TODO: build a bundled up context object to pass to GeneratedSets?

  const [armorEnergyRules, filteredItems, filterInfo] = useMemo(() => {
    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
    };
    if (assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork = assumeArmorMasterwork;
    }
    const [items, filterInfo] = filterItems({
      defs,
      items: armorItems,
      pinnedItems,
      excludedItems,
      lockedModMap,
      unassignedMods,
      lockedExoticHash,
      armorEnergyRules,
      searchFilter,
      setBonuses,
    });
    return [armorEnergyRules, items, filterInfo];
  }, [
    assumeArmorMasterwork,
    defs,
    armorItems,
    pinnedItems,
    excludedItems,
    lockedModMap,
    unassignedMods,
    lockedExoticHash,
    searchFilter,
    setBonuses,
  ]);

  const modStatChanges = useMemo(
    () =>
      getTotalModStatChanges(defs, modsToAssign, subclass, classType, includeRuntimeStatBenefits),
    [classType, defs, includeRuntimeStatBenefits, modsToAssign, subclass],
  );

  const { mergedDesiredStatRanges: desiredStatRanges, mergedConstraintsImplyStrictUpgrade } =
    useMemo(
      () =>
        mergeStrictUpgradeStatConstraints(strictUpgradesStatConstraints, resolvedStatConstraints),
      [resolvedStatConstraints, strictUpgradesStatConstraints],
    );

  // Run the actual loadout generation process in a web worker
  const { result, processing, totalCombos, completedCombos, startTime } = useProcess({
    selectedStore,
    filteredItems,
    setBonuses,
    lockedModMap,
    modStatChanges,
    armorEnergyRules,
    desiredStatRanges,
    anyExotic: lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC,
    autoStatMods,
    strictUpgrades: Boolean(strictUpgradesStatConstraints && !mergedConstraintsImplyStrictUpgrade),
  });

  const resultSets = result?.sets;

  const sortedSets = useMemo(() => {
    const itemsById = new Map<string, DimItem>();
    for (const item of armorItems) {
      itemsById.set(item.id, item);
    }
    function hydrateArmorSet(processed: ProcessArmorSet): ArmorSet {
      const armor: DimItem[] = [];
      for (const itemId of processed.armor) {
        const item = itemsById.get(itemId);
        if (!item) {
          throw new Error(`Couldn't find item ${itemId} in filtered items`);
        }
        armor.push(item);
      }
      return {
        armor,
        stats: processed.stats,
        armorStats: processed.armorStats,
        statMods: processed.statMods,
      };
    }
    return (
      resultSets &&
      sortGeneratedSets(
        filterMap(resultSets, (s) => {
          try {
            return hydrateArmorSet(s);
          } catch (e) {
            errorLog('loadout optimizer', 'Error hydrating armor set', e);
            return undefined;
          }
        }),
        desiredStatRanges,
      )
    );
  }, [desiredStatRanges, resultSets, armorItems]);

  useEffect(() => hideItemPicker(), [hideItemPicker, selectedStore.classType]);

  const chooseItem = useCallback(
    (updateFunc: (item: DimItem) => void, filter?: (item: DimItem) => boolean) =>
      async (e: React.MouseEvent) => {
        e.preventDefault();

        const item = await showItemPicker({
          filterItems: (item: DimItem) =>
            isLoadoutBuilderItem(item) &&
            itemCanBeEquippedBy(item, selectedStore, true) &&
            (!filter || filter(item)),
          sortBy: (item) => ArmorBucketHashes.indexOf(item.bucket.hash),
        });

        if (item) {
          updateFunc(item);
        }
      },
    [selectedStore, showItemPicker],
  );

  const handleAutoStatModsChanged = (autoStatMods: boolean) =>
    lbDispatch({ type: 'autoStatModsChanged', autoStatMods });

  const equippedHashes = useEquippedHashes(loadout.parameters!, subclass);

  // I don't think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <>
      <UndoRedoControls canRedo={canRedo} canUndo={canUndo} lbDispatch={lbDispatch} />
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol>
            <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
          </ol>
        </div>
      )}
      <TierlessStatConstraintEditor
        key={storeId}
        resolvedStatConstraints={resolvedStatConstraints}
        statRangesFiltered={result?.statRangesFiltered}
        lbDispatch={lbDispatch}
        equippedHashes={equippedHashes}
        store={selectedStore}
        className={styles.loadoutEditSection}
        processing={processing}
      />
      <NewFeaturedGearFilter className={styles.loadoutEditSection} />
      <EnergyOptions
        assumeArmorMasterwork={assumeArmorMasterwork}
        lbDispatch={lbDispatch}
        className={styles.loadoutEditSection}
      />
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol start={2}>
            <li>{t('LoadoutBuilder.OptimizerExplanationMods')}</li>
          </ol>
        </div>
      )}
      <LoadoutOptimizerExotic
        lockedExoticHash={lockedExoticHash}
        classType={selectedStore.classType}
        vendorItems={vendorItems}
        lbDispatch={lbDispatch}
        storeId={selectedStore.id}
        className={styles.loadoutEditSection}
      />
      <LoadoutOptimizerSetBonus
        storeId={selectedStore.id}
        classType={selectedStore.classType}
        vendorItems={vendorItems}
        lbDispatch={lbDispatch}
        setBonuses={setBonuses}
        className={styles.loadoutEditSection}
      />
      <LoadoutEditModsSection
        loadout={loadout}
        setLoadout={setLoadout}
        store={selectedStore}
        autoStatMods={autoStatMods}
        allMods={resolvedMods}
        className={styles.loadoutEditSection}
        onAutoStatModsChanged={handleAutoStatModsChanged}
      />
      <LoadoutEditSubclassSection
        loadout={loadout}
        store={selectedStore}
        subclass={subclass}
        setLoadout={setLoadout}
        className={styles.subclassSection}
      />
      <div className={styles.fineprint}>{t('LoadoutBuilder.PinnedItemsFinePrint')}</div>
      <LoadoutOptimizerPinnedItems
        chooseItem={chooseItem}
        selectedStore={selectedStore}
        pinnedItems={pinnedItems}
        searchFilter={searchFilter}
        lbDispatch={lbDispatch}
        className={styles.subclassSection}
      />
      <LoadoutOptimizerExcludedItems
        chooseItem={chooseItem}
        excludedItems={excludedItems}
        searchFilter={searchFilter}
        lbDispatch={lbDispatch}
        className={styles.subclassSection}
      />
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol start={3}>
            <li>
              {t('LoadoutBuilder.OptimizerExplanationSearch', {
                example: exampleLOSearch,
              })}
            </li>
          </ol>
          <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
        </div>
      )}
    </>
  );

  // TODO: replace character select with horizontal choice?
  const elapsed = Date.now() - startTime;
  const speed = completedCombos / elapsed;
  const remainingCombos = (totalCombos || 1) - completedCombos;
  const eta = remainingCombos / speed;

  return (
    <PageWithMenu className={styles.page}>
      <PageWithMenu.Menu className={clsx(styles.menuContent, styles.wide)}>
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
        <div className={styles.toolbar}>
          <UserGuideLink topic="Loadout-Optimizer" />
          {processing ? (
            <span className={styles.speedReport} role="status">
              <AppIcon icon={refreshIcon} spinning={true} />
              <div className={styles.speedReportInner}>
                <span>
                  {t('LoadoutBuilder.ProcessingSets', {
                    character: selectedStore.name,
                  })}
                </span>
                <progress value={completedCombos} max={totalCombos || 1} />
                {elapsed > 5000 &&
                  completedCombos > 1 &&
                  elapsed + eta > 10000 && ( // Show an ETA when expected time >10s and there's been a few sec to measure speed.
                    <span>
                      {timerDurationFromMs(
                        ((totalCombos || 1) - completedCombos) /
                          (completedCombos / (Date.now() - startTime)),
                        2,
                      )}
                    </span>
                  )}
              </div>
            </span>
          ) : (
            result && (
              <span className={styles.speedReport} role="status">
                {t('LoadoutBuilder.SpeedReport', {
                  combos: result.combos,
                  time: (result.processTime / 1000).toFixed(2),
                  cpus: getMaxParallelCores(),
                })}
              </span>
            )
          )}
        </div>
        {!isPhonePortrait && (
          <div className={styles.guide}>
            <ol>
              <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
              <li>{t('LoadoutBuilder.OptimizerExplanationMods')}</li>
              <li>
                {t('LoadoutBuilder.OptimizerExplanationSearch', {
                  example: exampleLOSearch,
                })}
              </li>
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
        {strictUpgradesStatConstraints && (
          <ExistingLoadoutStats
            lbDispatch={lbDispatch}
            statConstraints={strictUpgradesStatConstraints}
          />
        )}
        {result && sortedSets?.length ? (
          <GeneratedSets
            loadout={loadout}
            sets={sortedSets}
            lockedMods={result.mods}
            pinnedItems={pinnedItems}
            selectedStore={selectedStore}
            lbDispatch={lbDispatch}
            desiredStatRanges={desiredStatRanges}
            modStatChanges={result.modStatChanges}
            loadouts={loadouts}
            armorEnergyRules={result.armorEnergyRules}
            autoStatMods={autoStatMods}
            equippedHashes={equippedHashes}
          />
        ) : (
          !processing && (
            <NoBuildsFoundExplainer
              defs={defs}
              classType={classType}
              dispatch={lbDispatch}
              params={loadoutParameters}
              resolvedMods={resolvedMods}
              lockedModMap={lockedModMap}
              alwaysInvalidMods={unassignedMods}
              armorEnergyRules={armorEnergyRules}
              pinnedItems={pinnedItems}
              filterInfo={filterInfo}
              processInfo={result?.processInfo}
            />
          )
        )}
        {modPicker.open && (
          <ModPicker
            classType={classType}
            owner={selectedStore.id}
            lockedMods={resolvedMods}
            plugCategoryHashWhitelist={modPicker.plugCategoryHashWhitelist}
            plugCategoryHashDenyList={
              autoStatMods
                ? // Exclude stat mods from the mod picker when they're auto selected
                  [...autoAssignmentPCHs, PlugCategoryHashes.EnhancementsV2General]
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
        )}
        {compareSet && (
          <CompareLoadoutsDrawer
            compareSet={compareSet}
            selectedStore={selectedStore}
            loadout={loadout}
            loadouts={loadouts}
            lockedMods={modsToAssign}
            onClose={() => lbDispatch({ type: 'closeCompareDrawer' })}
          />
        )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
});

/**
 * Get a list of all loadouts that could be shown as "matching loadouts" or
 * used to compare loadouts. This is all loadouts specific to the selected store's
 * class plus the currently equipped loadout.
 */
function useRelevantLoadouts(selectedStore: DimStore) {
  const allSavedLoadouts = useSelector(loadoutsSelector);
  const artifactUnlocks = useSelector(artifactUnlocksSelector(selectedStore.id));

  // TODO: consider using fullyResolvedLoadoutsSelector
  const loadouts = useMemo(() => {
    const classLoadouts = allSavedLoadouts.filter((l) => l.classType === selectedStore.classType);

    // TODO: use a selector / weakMemoize for this?
    const equippedLoadout = newLoadoutFromEquipped(
      t('Loadouts.CurrentlyEquipped'),
      selectedStore,
      artifactUnlocks,
    );
    return [...classLoadouts, equippedLoadout];
  }, [allSavedLoadouts, selectedStore, artifactUnlocks]);

  return loadouts;
}

/**
 * Get a list of "resolved" mods given a list of mod hashes (presumably the ones selected by the user).
 * Resolved mods may be substituted with more appropriate choices.
 */
function useResolvedMods(
  defs: D2ManifestDefinitions,
  modHashes: number[] | undefined,
  selectedStoreId: string | undefined,
) {
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(selectedStoreId));
  return useMemo(
    () => resolveLoadoutModHashes(defs, modHashes, unlockedPlugs),
    [defs, modHashes, unlockedPlugs],
  );
}

/**
 * Gets all armor items that could be used to build loadouts for the specified class.
 */
function useArmorItems(classType: DestinyClass, vendorItems: DimItem[]): DimItem[] {
  const allItems = useSelector(allItemsSelector);
  return useMemo(
    () =>
      allItems
        .concat(vendorItems)
        .filter(
          (item) => isClassCompatible(item.classType, classType) && isLoadoutBuilderItem(item),
        ),
    [allItems, vendorItems, classType],
  );
}

/**
 * Save a subset of the loadout parameters to settings in order to remember them between sessions
 */
function useSaveLoadoutParameters(
  saveParamsAsDefaults: boolean,
  loadoutParameters: LoadoutParameters,
) {
  const setSetting = useSetSetting();
  const firstRun = useRef(true);
  useEffect(() => {
    if (!saveParamsAsDefaults) {
      return;
    }

    // Don't save the settings when we first load, since they won't have changed.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setSetting('loParameters', {
      assumeArmorMasterwork: loadoutParameters.assumeArmorMasterwork,
      autoStatMods: loadoutParameters.autoStatMods,
      includeRuntimeStatBenefits: loadoutParameters.includeRuntimeStatBenefits,
    });
  }, [
    setSetting,
    loadoutParameters.assumeArmorMasterwork,
    loadoutParameters.autoStatMods,
    saveParamsAsDefaults,
    loadoutParameters.includeRuntimeStatBenefits,
  ]);
}

/**
 * Save stat constraints (stat order / enablement) per class when it changes
 */
function useSaveStatConstraints(
  saveParamsAsDefaults: boolean,
  statConstraints: StatConstraint[],
  savedStatConstraintsByClass: {
    [key: number]: StatConstraint[];
  },
  classType: DestinyClass,
) {
  const setSetting = useSetSetting();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!saveParamsAsDefaults) {
      return;
    }

    // Don't save the settings when we first load, since they won't have changed.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (!deepEqual(statConstraints, savedStatConstraintsByClass[classType])) {
      setSetting('loStatConstraintsByClass', {
        ...savedStatConstraintsByClass,
        [classType]: statConstraints,
      });
    }
  }, [setSetting, statConstraints, savedStatConstraintsByClass, classType, saveParamsAsDefaults]);
}

function UndoRedoControls({
  canUndo,
  canRedo,
  lbDispatch,
}: {
  canUndo: boolean;
  canRedo: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  return (
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
  );
}

function ExistingLoadoutStats({
  lbDispatch,
  statConstraints,
}: {
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  statConstraints: ResolvedStatConstraint[];
}) {
  return (
    <div className={styles.referenceTiersInfo}>
      <div className={styles.header}>
        {t('LB.ExistingBuildStats')}
        <ReferenceConstraints resolvedStatConstraints={statConstraints} />
      </div>
      {t('LB.ExistingBuildStatsNote')}
      <button
        className={styles.dismissButton}
        type="button"
        onClick={() => lbDispatch({ type: 'dismissComparisonStats' })}
        aria-label={t('General.Close')}
      >
        <AppIcon icon={disabledIcon} />
      </button>
    </div>
  );
}
