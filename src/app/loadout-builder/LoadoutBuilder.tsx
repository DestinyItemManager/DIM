import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { createLoadoutShare } from 'app/dim-api/dim-api';
import { savedLoStatConstraintsByClassSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import usePrompt from 'app/dim-ui/usePrompt';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { convertDimLoadoutToApiLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { Loadout, ResolvedLoadoutMod } from 'app/loadout-drawer/loadout-types';
import {
  newLoadout,
  newLoadoutFromEquipped,
  resolveLoadoutModHashes,
} from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { categorizeArmorMods } from 'app/loadout/mod-assignment-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { armorStats } from 'app/search/d2-known-values';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, redoIcon, refreshIcon, undoIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { Portal } from 'app/utils/temp-container';
import { copyString } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { allItemsSelector, unlockedPlugSetItemsSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import ModPicker from '../loadout/ModPicker';
import EnergyOptions from './filter/EnergyOptions';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import TierSelect from './filter/TierSelect';
import CompareLoadoutsDrawer from './generated-sets/CompareLoadoutsDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { useLbState } from './loadout-builder-reducer';
import { buildLoadoutParams } from './loadout-params';
import styles from './LoadoutBuilder.m.scss';
import NoBuildsFoundExplainer from './NoBuildsFoundExplainer';
import { useAutoMods, useProcess } from './process/useProcess';
import {
  ArmorEnergyRules,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  loDefaultArmorEnergyRules,
} from './types';

/** Do not allow the user to choose artifice mods manually in Loadout Optimizer since we're supposed to be doing that */
const autoAssignmentPCHs = [PlugCategoryHashes.EnhancementsArtifice];

/**
 * The Loadout Optimizer screen
 */
export default memo(function LoadoutBuilder({
  account,
  stores,
  initialClassType,
  initialLoadoutParameters,
  notes,
  preloadedLoadout,
}: {
  account: DestinyAccount;
  stores: DimStore[];
  initialClassType: DestinyClass | undefined;
  initialLoadoutParameters: LoadoutParameters | undefined;
  notes: string | undefined;
  preloadedLoadout: Loadout | undefined;
}) {
  const defs = useD2Definitions()!;
  const allLoadouts = useSelector(loadoutsSelector);
  const allItems = useSelector(allItemsSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const searchQuery = useSelector(querySelector);
  const savedStatConstraintsByClass = useSelector(savedLoStatConstraintsByClassSelector);

  /** Gets items for the loadout builder and creates a mapping of classType -> bucketHash -> item array. */
  const items = useMemo(() => {
    const items: {
      [classType: number]: ItemsByBucket;
    } = {};
    for (const item of allItems) {
      if (!item || !isLoadoutBuilderItem(item)) {
        continue;
      }
      const { classType, bucket } = item;
      (items[classType] ??= {
        [BucketHashes.Helmet]: [],
        [BucketHashes.Gauntlets]: [],
        [BucketHashes.ChestArmor]: [],
        [BucketHashes.LegArmor]: [],
        [BucketHashes.ClassArmor]: [],
      })[bucket.hash].push(item);
    }
    return items;
  }, [allItems]);

  const optimizingLoadoutId = preloadedLoadout?.id;

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
  ] = useLbState(stores, defs, preloadedLoadout, initialClassType, initialLoadoutParameters);
  const isPhonePortrait = useIsPhonePortrait();

  const lockedExoticHash = loadoutParameters.exoticArmorHash;

  const autoStatMods = loadoutParameters.autoStatMods ?? false;

  const selectedStore = stores.find((store) => store.id === selectedStoreId)!;
  const classType = selectedStore.classType;
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(selectedStoreId));

  const resolvedMods: ResolvedLoadoutMod[] = useMemo(
    () => resolveLoadoutModHashes(defs, loadoutParameters.mods ?? [], unlockedPlugs),
    [defs, loadoutParameters.mods, unlockedPlugs]
  );
  const modsToAssign = useMemo(() => resolvedMods.map((mod) => mod.resolvedMod), [resolvedMods]);

  const characterItems = items[classType];

  const { modMap: lockedModMap, unassignedMods } = useMemo(
    () =>
      categorizeArmorMods(modsToAssign, characterItems ? Object.values(characterItems).flat() : []),
    [characterItems, modsToAssign]
  );

  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  const setSetting = useSetSetting();
  useEffect(() => {
    // If the user is playing with an existing loadout (potentially one they received from a loadout share)
    // or a direct /optimizer link, do not overwrite the global saved loadout parameters.
    // If they decide to save that loadout, these will still be saved with the loadout.
    if (initialLoadoutParameters) {
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
    const newSavedLoadoutParams = _.pick(newLoadoutParameters, 'assumeArmorMasterwork');

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
    preloadedLoadout,
    initialLoadoutParameters,
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

  const loadouts = useMemo(() => {
    const equippedLoadout: Loadout | undefined = newLoadoutFromEquipped(
      t('Loadouts.CurrentlyEquipped'),
      selectedStore
    );
    const classLoadouts = allLoadouts.filter(
      (l) => l.classType === selectedStore.classType || l.classType === DestinyClass.Unknown
    );
    return equippedLoadout ? [...classLoadouts, equippedLoadout] : classLoadouts;
  }, [allLoadouts, selectedStore]);

  const [armorEnergyRules, filteredItems, filterInfo] = useMemo(() => {
    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
    };
    if (loadoutParameters.assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork = loadoutParameters.assumeArmorMasterwork;
    }
    const [items, filterInfo] = filterItems({
      defs,
      items: characterItems,
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
    characterItems,
    pinnedItems,
    excludedItems,
    lockedModMap,
    unassignedMods,
    lockedExoticHash,
    searchFilter,
  ]);

  const { result, processing, remainingTime } = useProcess({
    defs,
    selectedStore,
    filteredItems,
    lockedModMap,
    subclass,
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

  const shareBuild = async (notes?: string) => {
    // TODO: replace this with a new share tool
    const loadout = newLoadout(t('LoadoutBuilder.ShareBuildTitle'), [], classType);
    loadout.notes = notes;
    loadout.parameters = params;
    const shareUrl = await createLoadoutShare(
      account.membershipId,
      convertDimLoadoutToApiLoadout(loadout)
    );
    copyString(shareUrl);
    showNotification({
      type: 'success',
      title: t('LoadoutBuilder.CopiedBuild'),
    });
  };

  // TODO: replace with rich-text dialog, and an "append" option
  const [promptDialog, prompt] = usePrompt();
  const shareBuildWithNotes = async () => {
    const newNotes = await prompt(t('MovePopup.Notes'), { defaultValue: notes });
    if (newNotes) {
      shareBuild(newNotes);
    }
  };

  // I don't think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <>
      {promptDialog}
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
          <ol start={4}>
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
          <button
            type="button"
            className="dim-button"
            onClick={() => shareBuild(notes)}
            disabled={!filteredSets}
          >
            {t('LoadoutBuilder.ShareBuild')}
          </button>
          <button
            type="button"
            className="dim-button"
            onClick={shareBuildWithNotes}
            disabled={!filteredSets}
          >
            {t('LoadoutBuilder.ShareBuildWithNotes')}
          </button>
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
              <li>{t('LoadoutBuilder.OptimizerExplanationUpgrades')}</li>
              <li>{t('LoadoutBuilder.OptimizerExplanationSearch')}</li>
            </ol>
            <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
          </div>
        )}
        {notes && (
          <div className={styles.guide}>
            <p>
              <b>{t('MovePopup.Notes')}</b> {notes}
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
            loadouts={loadouts}
            params={params}
            halfTierMods={halfTierMods}
            armorEnergyRules={result.armorEnergyRules}
            notes={notes}
          />
        ) : (
          <NoBuildsFoundExplainer
            defs={defs}
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
        )}
        {modPicker.open && (
          <Portal>
            <ModPicker
              classType={classType}
              owner={selectedStore.id}
              lockedMods={resolvedMods}
              plugCategoryHashWhitelist={modPicker.plugCategoryHashWhitelist}
              plugCategoryHashDenyList={autoAssignmentPCHs}
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
              notes={notes}
              onClose={() => lbDispatch({ type: 'closeCompareDrawer' })}
            />
          </Portal>
        )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
});
