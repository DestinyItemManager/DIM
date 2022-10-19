import { DestinyAccount } from 'app/accounts/destiny-account';
import { createLoadoutShare } from 'app/dim-api/dim-api';
import {
  savedLoadoutParametersSelector,
  savedLoStatConstraintsByClassSelector,
} from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { convertDimLoadoutToApiLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { loadoutsByItemSelector, loadoutsSelector } from 'app/loadout-drawer/selectors';
import { d2ManifestSelector, useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { armorStats } from 'app/search/d2-known-values';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { Portal } from 'app/utils/temp-container';
import { copyString } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { allItemsSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import ModPicker from '../loadout/ModPicker';
import EnergyOptions from './filter/EnergyOptions';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import TierSelect from './filter/TierSelect';
import CompareDrawer from './generated-sets/CompareDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterItems } from './item-filter';
import { useLbState } from './loadout-builder-reducer';
import { buildLoadoutParams } from './loadout-params';
import styles from './LoadoutBuilder.m.scss';
import { LoUrlParams } from './LoadoutBuilderContainer';
import { useProcess } from './process/useProcess';
import {
  ArmorEnergyRules,
  generalSocketReusablePlugSetHash,
  ItemsByBucket,
  LOCKED_EXOTIC_ANY_EXOTIC,
  loDefaultArmorEnergyRules,
} from './types';

const statOrderSelector = (state: RootState) =>
  savedLoadoutParametersSelector(state).statConstraints!.map((c) => c.statHash);

/** A selector to pull out all half tier general mods so we can quick add them to sets. */
const halfTierModsSelector = createSelector(
  statOrderSelector,
  d2ManifestSelector,
  (statOrder, defs) => {
    const halfTierMods: PluggableInventoryItemDefinition[] = [];

    // Get all the item hashes for the general sockets whitelisted plugs.
    const reusablePlugs =
      defs?.PlugSet.get(generalSocketReusablePlugSetHash)?.reusablePlugItems.map(
        (p) => p.plugItemHash
      ) || [];

    for (const plugHash of reusablePlugs) {
      const plug = defs?.InventoryItem.get(plugHash);

      // Pick out the plugs which have a +5 value for an armour stat. This has the potential to break
      // if bungie adds more mods with these stats (this looks pretty unlikely as of March 2021).
      if (
        isPluggableItem(plug) &&
        isArmor2Mod(plug) &&
        plug.investmentStats.some(
          (stat) => stat.value === 5 && armorStats.includes(stat.statTypeHash)
        )
      ) {
        halfTierMods.push(plug);
      }
    }

    // Sort the mods so they are in the same order as our stat filters. This ensures the desired stats
    // will be enhanced first.
    return halfTierMods.sort(
      compareBy((mod) => {
        const stat = mod.investmentStats.find(
          (stat) => stat.value === 5 && armorStats.includes(stat.statTypeHash)
        );
        return statOrder.indexOf(stat!.statTypeHash);
      })
    );
  }
);

/**
 * The Loadout Optimizer screen
 */
export default memo(function LoadoutBuilder({
  account,
  stores,
  urlParameters,
  preloadedLoadout,
}: {
  account: DestinyAccount;
  stores: DimStore[];
  urlParameters: LoUrlParams | undefined;
  preloadedLoadout: Loadout | undefined;
}) {
  const defs = useD2Definitions()!;
  const allLoadouts = useSelector(loadoutsSelector);
  const allItems = useSelector(allItemsSelector);
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const searchQuery = useSelector(querySelector);
  const halfTierMods = useSelector(halfTierModsSelector);
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
    },
    lbDispatch,
  ] = useLbState(stores, defs, preloadedLoadout, urlParameters);
  const isPhonePortrait = useIsPhonePortrait();

  const lockedExoticHash = loadoutParameters.exoticArmorHash;

  const autoStatMods = loadoutParameters.autoStatMods ?? false;

  const lockedMods = useMemo(
    () =>
      (loadoutParameters.mods ?? []).map((m) => defs.InventoryItem.get(m)).filter(isPluggableItem),
    [defs, loadoutParameters.mods]
  );

  const selectedStore = stores.find((store) => store.id === selectedStoreId)!;
  const classType = selectedStore.classType;

  // Save a subset of the loadout parameters to settings in order to remember them between sessions
  const setSetting = useSetSetting();
  useEffect(() => {
    // If the user is playing with an existing loadout (potentially one they received from a loadout share)
    // or a direct /optimizer link, do not overwrite the global saved loadout parameters.
    // If they decide to save that loadout, these will still be saved with the loadout.
    if (preloadedLoadout || urlParameters) {
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
    const newSavedLoadoutParams = _.pick(
      newLoadoutParameters,
      'assumeArmorMasterwork',
      'lockArmorEnergyType'
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
    preloadedLoadout,
    urlParameters,
  ]);

  const notes = urlParameters?.notes ?? preloadedLoadout?.notes;

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

  const characterItems = items[classType];

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

  const [armorEnergyRules, filteredItems] = useMemo(() => {
    const armorEnergyRules: ArmorEnergyRules = {
      ...loDefaultArmorEnergyRules,
      loadouts: {
        loadoutsByItem,
        optimizingLoadoutId,
      },
    };
    if (loadoutParameters.lockArmorEnergyType !== undefined) {
      armorEnergyRules.lockArmorEnergyType = loadoutParameters.lockArmorEnergyType;
    }
    if (loadoutParameters.assumeArmorMasterwork !== undefined) {
      armorEnergyRules.assumeArmorMasterwork = loadoutParameters.assumeArmorMasterwork;
    }
    const items = filterItems({
      defs,
      items: characterItems,
      pinnedItems,
      excludedItems,
      lockedMods,
      lockedExoticHash,
      armorEnergyRules,
      searchFilter,
    });
    return [armorEnergyRules, items];
  }, [
    loadoutParameters.lockArmorEnergyType,
    loadoutParameters.assumeArmorMasterwork,
    loadoutsByItem,
    optimizingLoadoutId,
    defs,
    characterItems,
    pinnedItems,
    excludedItems,
    lockedMods,
    lockedExoticHash,
    searchFilter,
  ]);

  const { result, processing, remainingTime } = useProcess({
    defs,
    selectedStore,
    filteredItems,
    lockedMods,
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

  const filteredSets = result?.sets;

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

  const shareBuildWithNotes = () => {
    const newNotes = prompt(t('MovePopup.Notes'), notes);
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
      {isPhonePortrait && (
        <div className={styles.guide}>
          <ol>
            <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
          </ol>
        </div>
      )}
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
        lockArmorEnergyType={loadoutParameters.lockArmorEnergyType}
        optimizingLoadoutName={preloadedLoadout?.name}
        lbDispatch={lbDispatch}
      />
      <LockArmorAndPerks
        selectedStore={selectedStore}
        pinnedItems={pinnedItems}
        excludedItems={excludedItems}
        lockedMods={lockedMods}
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
        {result && (
          <GeneratedSets
            sets={result.sets}
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
        )}
        {modPicker.open && (
          <Portal>
            <ModPicker
              classType={classType}
              owner={selectedStore.id}
              lockedMods={lockedMods}
              plugCategoryHashWhitelist={modPicker.plugCategoryHashWhitelist}
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
            <CompareDrawer
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
