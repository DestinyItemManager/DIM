import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
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
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadoutFromEquipped, resolveLoadoutModHashes } from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import {
  LoadoutEditModsSection,
  LoadoutEditSubclassSection,
} from 'app/loadout/loadout-edit/LoadoutEdit';
import { autoAssignmentPCHs } from 'app/loadout/loadout-ui/LoadoutMods';
import { categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, disabledIcon, redoIcon, refreshIcon, undoIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { emptyObject } from 'app/utils/empty';
import { isClassCompatible, itemCanBeEquippedBy } from 'app/utils/item-utils';
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
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import styles from './LoadoutBuilder.m.scss';
import NoBuildsFoundExplainer from './NoBuildsFoundExplainer';
import EnergyOptions from './filter/EnergyOptions';
import LoadoutOptimizerExotic from './filter/LoadoutOptimizerExotic';
import {
  LoadoutOptimizerExcludedItems,
  LoadoutOptimizerPinnedItems,
} from './filter/LoadoutOptimizerMenuItems';
import StatConstraintEditor from './filter/StatConstraintEditor';
import CompareLoadoutsDrawer from './generated-sets/CompareLoadoutsDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { ReferenceTiers } from './generated-sets/SetStats';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { LoadoutBuilderAction, useLbState } from './loadout-builder-reducer';
import { useLoVendorItems } from './loadout-builder-vendors';
import { useProcess } from './process/useProcess';
import {
  ArmorEnergyRules,
  LOCKED_EXOTIC_ANY_EXOTIC,
  LockableBucketHashes,
  ResolvedStatConstraint,
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
      isEditingExistingLoadout,
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

  const hasPreloadedLoadout = Boolean(preloadedLoadout);
  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  useSaveLoadoutParameters(hasPreloadedLoadout, loadoutParameters);
  useSaveStatConstraints(
    hasPreloadedLoadout,
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
  const { result, processing } = useProcess({
    selectedStore,
    filteredItems,
    lockedModMap,
    modStatChanges,
    armorEnergyRules,
    desiredStatRanges,
    anyExotic: lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC,
    autoStatMods,
    strictUpgrades: Boolean(strictUpgradesStatConstraints && !mergedConstraintsImplyStrictUpgrade),
  });

  const resultSets = result?.sets;

  const sortedSets = useMemo(
    () => resultSets && sortGeneratedSets(resultSets, desiredStatRanges),
    [desiredStatRanges, resultSets],
  );

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
          sortBy: (item) => LockableBucketHashes.indexOf(item.bucket.hash),
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
      <StatConstraintEditor
        resolvedStatConstraints={resolvedStatConstraints}
        statRangesFiltered={result?.statRangesFiltered}
        lbDispatch={lbDispatch}
        equippedHashes={equippedHashes}
        store={selectedStore}
        className={styles.loadoutEditSection}
      />
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
            <li>{t('LoadoutBuilder.OptimizerExplanationSearch')}</li>
          </ol>
          <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
        </div>
      )}
    </>
  );

  // TODO: replace character select with horizontal choice?

  return (
    <PageWithMenu className={styles.page}>
      <PageWithMenu.Menu
        className={clsx(styles.menuContent, { [styles.wide]: $featureFlags.statConstraintEditor })}
      >
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
              <span>
                {t('LoadoutBuilder.ProcessingSets', {
                  character: selectedStore.name,
                })}
              </span>
            </span>
          ) : (
            result && (
              <span className={styles.speedReport} role="status">
                {t('LoadoutBuilder.SpeedReport', {
                  combos: result.combos,
                  time: (result.processTime / 1000).toFixed(2),
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
            isEditingExistingLoadout={isEditingExistingLoadout}
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
  hasPreloadedLoadout: boolean,
  loadoutParameters: LoadoutParameters,
) {
  const setSetting = useSetSetting();
  const firstRun = useRef(true);
  useEffect(() => {
    // If the user is playing with an existing loadout (potentially one they
    // received from a loadout share) or a direct /optimizer link, do not
    // overwrite the global saved loadout parameters. If they decide to save
    // that loadout, these will still be saved with the loadout.
    if (hasPreloadedLoadout) {
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
    hasPreloadedLoadout,
    loadoutParameters.includeRuntimeStatBenefits,
  ]);
}

/**
 * Save stat constraints (stat order / enablement) per class when it changes
 */
function useSaveStatConstraints(
  hasPreloadedLoadout: boolean,
  statConstraints: StatConstraint[],
  savedStatConstraintsByClass: {
    [key: number]: StatConstraint[];
  },
  classType: DestinyClass,
) {
  const setSetting = useSetSetting();
  const firstRun = useRef(true);

  useEffect(() => {
    // If the user is playing with an existing loadout (potentially one they
    // received from a loadout share) or a direct /optimizer link, do not
    // overwrite the global saved loadout parameters. If they decide to save
    // that loadout, these will still be saved with the loadout.
    if (hasPreloadedLoadout) {
      return;
    }

    // Don't save the settings when we first load, since they won't have changed.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // Strip out min/max tiers and just save the order
    const newStatConstraints = statConstraints.map(({ statHash }) => ({ statHash }));
    if (!deepEqual(newStatConstraints, savedStatConstraintsByClass[classType])) {
      setSetting('loStatConstraintsByClass', {
        ...savedStatConstraintsByClass,
        [classType]: newStatConstraints,
      });
    }
  }, [setSetting, statConstraints, savedStatConstraintsByClass, classType, hasPreloadedLoadout]);
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
        <ReferenceTiers resolvedStatConstraints={statConstraints} />
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
