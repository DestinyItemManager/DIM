import {
  LoadoutParameters,
  StatConstraint,
  UpgradeSpendTier,
} from '@destinyitemmanager/dim-api-types';
import { settingsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { loadoutFromEquipped, newLoadout } from 'app/loadout-drawer/loadout-utils';
import { editLoadout } from 'app/loadout-drawer/LoadoutDrawer';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { d2ManifestSelector, useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { allItemsSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { isLoadoutBuilderItem } from '../loadout/item-utils';
import ModPicker from '../loadout/mod-picker/ModPicker';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import TierSelect from './filter/TierSelect';
import CompareDrawer from './generated-sets/CompareDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { defaultStatFilters, useLbState } from './loadout-builder-reducer';
import styles from './LoadoutBuilder.m.scss';
import { useProcess } from './process/useProcess';
import { ArmorStatHashes, generalSocketReusablePlugSetHash, ItemsByBucket } from './types';

interface ProvidedProps {
  stores: DimStore[];
  preloadedLoadout?: Loadout;
}

interface StoreProps {
  statOrder: ArmorStatHashes[]; // stat hashes, including disabled stats
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  loadouts: Loadout[];
  searchFilter: ItemFilter;
  searchQuery: string;
  halfTierMods: PluggableInventoryItemDefinition[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Gets items for the loadout builder and creates a mapping of classType -> bucketHash -> item array. */
  const itemsSelector = createSelector(
    allItemsSelector,
    (
      allItems
    ): Readonly<{
      [classType: number]: ItemsByBucket;
    }> => {
      const items: {
        [classType: number]: { [bucketHash: number]: DimItem[] };
      } = {};
      for (const item of allItems) {
        if (!item || !isLoadoutBuilderItem(item)) {
          continue;
        }
        const { classType, bucket } = item;
        ((items[classType] ??= {})[bucket.hash] ??= []).push(item);
      }
      return items;
    }
  );

  /** A selector to pull out all half tier general mods so we can quick add them to sets. */
  const halfTierModsSelector = createSelector(
    (state: RootState) => settingsSelector(state).loStatSortOrder,
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

  return (state: RootState): StoreProps => {
    const { loUpgradeSpendTier, loLockItemEnergyType } = settingsSelector(state);
    return {
      statOrder: settingsSelector(state).loStatSortOrder,
      upgradeSpendTier: loUpgradeSpendTier,
      lockItemEnergyType: loLockItemEnergyType,
      items: itemsSelector(state),
      loadouts: loadoutsSelector(state),
      searchFilter: searchFilterSelector(state),
      searchQuery: querySelector(state),
      halfTierMods: halfTierModsSelector(state),
    };
  };
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilder({
  stores,
  statOrder,
  upgradeSpendTier,
  lockItemEnergyType,
  items,
  loadouts,
  searchFilter,
  preloadedLoadout,
  searchQuery,
  halfTierMods,
}: Props) {
  const [
    {
      lockedMap,
      lockedMods,
      lockedExoticHash,
      selectedStoreId,
      statFilters,
      modPicker,
      compareSet,
    },
    lbDispatch,
  ] = useLbState(stores, preloadedLoadout);
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();

  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  const enabledStats = useMemo(
    () => new Set(armorStats.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const characterItems: ItemsByBucket | undefined = selectedStore && items[selectedStore.classType];

  const equippedLoadout: Loadout | undefined = selectedStore && loadoutFromEquipped(selectedStore);
  loadouts = equippedLoadout ? [...loadouts, equippedLoadout] : loadouts;

  const filteredItems = useMemo(
    () =>
      filterItems(
        defs,
        characterItems,
        lockedMap,
        lockedMods,
        lockedExoticHash,
        upgradeSpendTier,
        searchFilter
      ),
    [defs, characterItems, lockedMap, lockedMods, lockedExoticHash, upgradeSpendTier, searchFilter]
  );

  const { result, processing } = useProcess(
    defs,
    selectedStore,
    filteredItems,
    lockedMap,
    lockedMods,
    upgradeSpendTier,
    lockItemEnergyType,
    statOrder,
    statFilters
  );

  // A representation of the current loadout optimizer parameters that can be saved with generated loadouts
  // TODO: replace some of these individual params with this object
  const params: LoadoutParameters = useMemo(
    () => ({
      statConstraints: _.compact(
        statOrder.map((statHash) => {
          const minMax = statFilters[statHash];
          if (minMax.ignored) {
            return undefined;
          }
          const stat: StatConstraint = {
            statHash,
          };
          if (minMax.min > 0) {
            stat.minTier = minMax.min;
          }
          if (minMax.max < 10) {
            stat.maxTier = minMax.max;
          }
          return stat;
        })
      ),
      mods: lockedMods.map((mod) => mod.hash),
      query: searchQuery,
      upgradeSpendTier,
      exoticArmorHash: lockedExoticHash,
    }),
    [upgradeSpendTier, lockedMods, searchQuery, statFilters, statOrder, lockedExoticHash]
  );

  const sets = result?.sets;

  const filteredSets = useMemo(
    () => sortGeneratedSets(statOrder, enabledStats, sets),
    [statOrder, enabledStats, sets]
  );

  const setSetting = useSetSetting();

  const onStatOrderChanged = (sortOrder: number[]) => setSetting('loStatSortOrder', sortOrder);

  const workingStatRanges = result?.statRanges || defaultStatFilters;

  // I dont think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <div className={styles.menuContent}>
      <TierSelect
        stats={statFilters}
        statRanges={workingStatRanges}
        order={statOrder}
        onStatFiltersChanged={(statFilters) =>
          lbDispatch({ type: 'statFiltersChanged', statFilters })
        }
        onStatOrderChanged={onStatOrderChanged}
      />

      <LockArmorAndPerks
        selectedStore={selectedStore}
        lockedMap={lockedMap}
        lockedMods={lockedMods}
        upgradeSpendTier={upgradeSpendTier}
        lockItemEnergyType={lockItemEnergyType}
        lockedExoticHash={lockedExoticHash}
        lbDispatch={lbDispatch}
      />
    </div>
  );

  return (
    <PageWithMenu className={styles.page}>
      <PageWithMenu.Menu>
        <CharacterSelect
          selectedStore={selectedStore}
          stores={stores}
          onCharacterChanged={(storeId: string) => lbDispatch({ type: 'changeCharacter', storeId })}
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
              <div>{t('LoadoutBuilder.ProcessingSets', { character: selectedStore.name })}</div>
              <AppIcon icon={refreshIcon} spinning={true} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className={styles.toolbar}>
          <UserGuideLink topic="Loadout_Optimizer" />
          <button
            type="button"
            className="dim-button"
            onClick={() => editLoadout(newLoadout('', []), { showClass: true, isNew: true })}
          >
            {t('LoadoutBuilder.NewEmptyLoadout')}
          </button>
        </div>
        <div className={styles.guide}>
          <ol>
            <li>{t('LoadoutBuilder.OptimizerExplanationStats')}</li>
            <li>{t('LoadoutBuilder.OptimizerExplanationMods')}</li>
            <li>{t('LoadoutBuilder.OptimizerExplanationUpgrades')}</li>
            <li>{t('LoadoutBuilder.OptimizerExplanationSearch')}</li>
          </ol>
          <p>{t('LoadoutBuilder.OptimizerExplanationGuide')}</p>
        </div>
        {filteredSets && (
          <GeneratedSets
            sets={filteredSets}
            lockedMap={lockedMap}
            selectedStore={selectedStore}
            lbDispatch={lbDispatch}
            statOrder={statOrder}
            enabledStats={enabledStats}
            loadouts={loadouts}
            params={params}
            halfTierMods={halfTierMods}
          />
        )}
        {modPicker.open &&
          ReactDOM.createPortal(
            <ModPicker
              classType={selectedStore.classType}
              lockedMods={lockedMods}
              initialQuery={modPicker.initialQuery}
              onAccept={(newLockedMods: PluggableInventoryItemDefinition[]) =>
                lbDispatch({
                  type: 'lockedModsChanged',
                  lockedMods: newLockedMods,
                })
              }
              onClose={() => lbDispatch({ type: 'closeModPicker' })}
            />,
            document.body
          )}
        {compareSet &&
          ReactDOM.createPortal(
            <CompareDrawer
              set={compareSet}
              loadouts={loadouts}
              lockedMods={lockedMods}
              classType={selectedStore.classType}
              statOrder={statOrder}
              enabledStats={enabledStats}
              upgradeSpendTier={upgradeSpendTier}
              onClose={() => lbDispatch({ type: 'closeCompareDrawer' })}
            />,
            document.body
          )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
