import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { savedLoStatConstraintsByClassSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { PressTip } from 'app/dim-ui/PressTip';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadoutFromEquipped, resolveLoadoutModHashes } from 'app/loadout-drawer/loadout-utils';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useSavedLoadoutsForClassType } from 'app/loadout/loadout-ui/menu-hooks';
import { categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting, useSetting } from 'app/settings/hooks';
import { AppIcon, faExclamationTriangle, redoIcon, refreshIcon, undoIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { isClassCompatible } from 'app/utils/item-utils';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { deepEqual } from 'fast-equals';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  allItemsSelector,
  createItemContextSelector,
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
import { useLoVendorItems } from './loadout-builder-vendors';
import {
  buildLoadoutParams,
  statFiltersFromLoadoutParameters,
  statOrderFromLoadoutParameters,
} from './loadout-params';
import { useProcess } from './process/useProcess';
import { ArmorEnergyRules, LOCKED_EXOTIC_ANY_EXOTIC, loDefaultArmorEnergyRules } from './types';

/** Do not allow the user to choose artifice mods manually in Loadout Optimizer since we're supposed to be doing that */
const autoAssignmentPCHs = [PlugCategoryHashes.EnhancementsArtifice];

/**
 * The Loadout Optimizer screen
 */
export default memo(function LoadoutBuilder({
  preloadedLoadout,
  storeId,
}: {
  /**
   * A specific loadout to optimize, chosen from the Loadouts or Loadout Edit
   * page.
   */
  preloadedLoadout: Loadout | undefined;
  /**
   *A preselected store ID, used when navigating from the Loadouts page.
   */
  storeId: string | undefined;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  const defs = useD2Definitions()!;
  const stores = useSelector(sortedStoresSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const searchQuery = useSelector(querySelector);
  const savedStatConstraintsByClass = useSelector(savedLoStatConstraintsByClassSelector);
  const [includeVendorItems, setIncludeVendorItems] = useSetting('loIncludeVendorItems');

  const optimizingLoadoutId = preloadedLoadout?.id;

  // All Loadout Optimizer state is managed via this hook/reducer
  const [
    {
      loadout,
      pinnedItems,
      excludedItems,
      selectedStoreId,
      modPicker,
      compareSet,
      canRedo,
      canUndo,
    },
    lbDispatch,
  ] = useLbState(stores, defs, preloadedLoadout, storeId);

  // TODO: if we're editing a loadout, grey out incompatible classes?

  // TODO: bundle these together into an LO context?
  const loadoutParameters = loadout.parameters!;
  const modHashes = loadoutParameters.mods ?? emptyArray();
  const lockedExoticHash = loadoutParameters.exoticArmorHash;
  const statConstraints = loadoutParameters.statConstraints ?? emptyArray();
  const autoStatMods = loadoutParameters.autoStatMods ?? false;
  const statOrder = useMemo(
    () => statOrderFromLoadoutParameters(loadoutParameters),
    [loadoutParameters]
  );
  const statFilters = useMemo(
    () => statFiltersFromLoadoutParameters(loadoutParameters),
    [loadoutParameters]
  );

  const selectedStore = stores.find((store) => store.id === selectedStoreId)!;
  const classType = selectedStore.classType;
  const loadouts = useRelevantLoadouts(selectedStore);

  const resolvedMods = useResolvedMods(defs, modHashes, selectedStoreId);

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
        modsByBucket
      ),
    [itemCreationContext, loadout.items, selectedStore, allItems, modsByBucket]
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
            )
        )
        .map((mod) => mod.resolvedMod),
    [resolvedMods, autoStatMods]
  );

  const {
    vendorItems,
    vendorItemsLoading,
    error: vendorError,
  } = useLoVendorItems(selectedStoreId, includeVendorItems);
  const armorItems = useArmorItems(classType, vendorItems);

  const { modMap: lockedModMap, unassignedMods } = useMemo(
    () => categorizeArmorMods(modsToAssign, armorItems),
    [armorItems, modsToAssign]
  );

  // TODO: maybe better to combine enabled & statOrder by making this a list in stat order?
  const enabledStats = useMemo(
    () => new Set(armorStats.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const hasPreloadedLoadout = Boolean(preloadedLoadout);
  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  useSaveLoadoutParameters(hasPreloadedLoadout, loadoutParameters);
  useSaveStatConstraints(
    hasPreloadedLoadout,
    statConstraints,
    savedStatConstraintsByClass,
    classType
  );

  const onCharacterChanged = useCallback(
    (storeId: string) =>
      lbDispatch({
        type: 'changeCharacter',
        store: getStore(stores, storeId)!,
        savedStatConstraintsByClass,
      }),
    [lbDispatch, savedStatConstraintsByClass, stores]
  );

  // TODO: build a bundled up context object to pass to GeneratedSets?

  const [armorEnergyRules, filteredItems, filterInfo] = useMemo(() => {
    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
    };
    if (loadoutParameters.assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork = loadoutParameters.assumeArmorMasterwork;
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
    loadoutParameters.assumeArmorMasterwork,
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
    () => getTotalModStatChanges(defs, modsToAssign, subclass, classType, true),
    [classType, defs, modsToAssign, subclass]
  );

  // Run the actual loadout generation process in a web worker
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
  // TODO: replace some of these individual params with this object << what
  // TODO: build a skeleton loadout here?
  const params = useMemo(
    () => buildLoadoutParams(loadoutParameters, searchQuery, statFilters, statOrder),
    [loadoutParameters, searchQuery, statFilters, statOrder]
  );

  const resultSets = result?.sets;

  const sortedSets = useMemo(
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
        statConstraints={statConstraints}
        statRangesFiltered={result?.statRangesFiltered}
        onStatConstraintsChanged={(statConstraints) =>
          lbDispatch({ type: 'statConstraintsChanged', statConstraints })
        }
      />
      <EnergyOptions
        assumeArmorMasterwork={loadoutParameters.assumeArmorMasterwork}
        lbDispatch={lbDispatch}
      />
      <div className={styles.area}>
        <CheckButton
          onChange={setIncludeVendorItems}
          name="includeVendorItems"
          checked={includeVendorItems}
        >
          {vendorError ? (
            <PressTip tooltip={vendorError.message}>
              <span>
                <AppIcon icon={faExclamationTriangle} />
              </span>
            </PressTip>
          ) : (
            vendorItemsLoading && (
              <span>
                <AppIcon icon={refreshIcon} spinning={true} />
              </span>
            )
          )}{' '}
          {t('LoadoutBuilder.IncludeVendorItems')}
        </CheckButton>
      </div>
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
        {result && sortedSets?.length ? (
          <GeneratedSets
            sets={sortedSets}
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
 */
function useArmorItems(classType: DestinyClass, vendorItems: DimItem[]): DimItem[] {
  const allItems = useSelector(allItemsSelector);
  return useMemo(
    () =>
      allItems
        .concat(vendorItems)
        .filter(
          (item) => isClassCompatible(item.classType, classType) && isLoadoutBuilderItem(item)
        ),
    [allItems, vendorItems, classType]
  );
}

/**
 * Save a subset of the loadout parameters to settings in order to remember them between sessions
 */
function useSaveLoadoutParameters(
  hasPreloadedLoadout: boolean,
  loadoutParameters: LoadoutParameters
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
    });
  }, [
    setSetting,
    loadoutParameters.assumeArmorMasterwork,
    loadoutParameters.autoStatMods,
    hasPreloadedLoadout,
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
  classType: DestinyClass
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
