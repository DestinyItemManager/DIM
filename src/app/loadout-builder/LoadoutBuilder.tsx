import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutFromEquipped } from 'app/loadout/loadout-utils';
import { loadoutsSelector } from 'app/loadout/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { isArmor2Mod } from 'app/utils/item-utils';
import { DestinyClass, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { allItemsSelector, profileResponseSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import FilterBuilds from './filter/FilterBuilds';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import ModPicker from './filter/ModPicker';
import PerkPicker from './filter/PerkPicker';
import CompareDrawer from './generated-sets/CompareDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { useProcess } from './hooks/useProcess';
import styles from './LoadoutBuilder.m.scss';
import { LoadoutBuilderState, useLbState } from './loadoutBuilderReducer';
import { filterItems } from './preProcessFilter';
import { ItemsByBucket, statHashes, statHashToType, statKeys, StatTypes } from './types';
import { isLoadoutBuilderItem } from './utils';

interface ProvidedProps {
  account: DestinyAccount;
  defs: D2ManifestDefinitions;
  stores: DimStore[];
  preloadedLoadout?: Loadout;
}

interface StoreProps {
  allItems: DimItem[];
  profileResponse?: DestinyProfileResponse;
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  loadouts: Loadout[];
  filter: ItemFilter;
  searchQuery: string;
}

type Props = ProvidedProps & StoreProps;

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((mod) => mod.plug.energyCost?.energyType),
  compareBy((mod) => mod.plug.energyCost?.energyCost),
  compareBy((mod) => mod.displayProperties.name)
);

function mapStateToProps() {
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
        for (const classType of item.classType === DestinyClass.Unknown
          ? [DestinyClass.Hunter, DestinyClass.Titan, DestinyClass.Warlock]
          : [item.classType]) {
          if (!items[classType]) {
            items[classType] = {};
          }
          if (!items[classType][item.bucket.hash]) {
            items[classType][item.bucket.hash] = [];
          }
          items[classType][item.bucket.hash].push(item);
        }
      }

      return items;
    }
  );

  const statOrderSelector = createSelector(
    (state: RootState) => settingsSelector(state).loStatSortOrder,
    (loStatSortOrder: number[]) => loStatSortOrder.map((hash) => statHashToType[hash])
  );

  return (state: RootState): StoreProps => {
    const { loAssumeMasterwork } = settingsSelector(state);
    return {
      allItems: allItemsSelector(state),
      profileResponse: profileResponseSelector(state),
      statOrder: statOrderSelector(state),
      assumeMasterwork: loAssumeMasterwork,
      isPhonePortrait: state.shell.isPhonePortrait,
      items: itemsSelector(state),
      loadouts: loadoutsSelector(state),
      filter: searchFilterSelector(state),
      searchQuery: querySelector(state),
    };
  };
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilder({
  allItems,
  profileResponse,
  stores,
  statOrder,
  assumeMasterwork,
  isPhonePortrait,
  items,
  defs,
  loadouts,
  filter,
  preloadedLoadout,
  searchQuery,
}: Props) {
  const [
    {
      lockedMap,
      lockedArmor2Mods,
      selectedStoreId,
      statFilters,
      modPicker,
      perkPicker,
      compareSet,
    },
    lbDispatch,
  ] = useLbState(stores, preloadedLoadout);

  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  const enabledStats = useMemo(
    () => new Set(statKeys.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const characterItems: ItemsByBucket | undefined = selectedStore && items[selectedStore.classType];

  const equippedLoadout: Loadout | undefined = selectedStore && loadoutFromEquipped(selectedStore);
  loadouts = equippedLoadout ? [...loadouts, equippedLoadout] : loadouts;

  const filteredItems = useMemo(
    () => filterItems(characterItems, lockedMap, lockedArmor2Mods, filter),
    [characterItems, lockedMap, lockedArmor2Mods, filter]
  );

  const { result, processing } = useProcess(
    selectedStoreId,
    filteredItems,
    lockedMap,
    lockedArmor2Mods,
    assumeMasterwork,
    statOrder,
    statFilters
  );

  // A representation of the current loadout optimizer parameters that can be saved with generated loadouts
  // TODO: replace some of these individual params with this object
  const params: LoadoutParameters = useMemo(
    () => ({
      statConstraints: _.compact(
        _.sortBy(Object.entries(statFilters), ([statName]) =>
          statOrder.indexOf(statName as StatTypes)
        ).map(([statName, minMax]) => {
          if (minMax.ignored) {
            return undefined;
          }
          const stat: StatConstraint = {
            statHash: statHashes[statName],
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
      mods: Object.values(lockedArmor2Mods).flatMap(
        (mods) => mods?.map((m) => m.modDef.hash) || []
      ),
      query: searchQuery,
      assumeMasterworked: assumeMasterwork,
    }),
    [assumeMasterwork, lockedArmor2Mods, searchQuery, statFilters, statOrder]
  );

  const combos = result?.combos || 0;
  const combosWithoutCaps = result?.combosWithoutCaps || 0;
  const sets = result?.sets;

  const filteredSets = useMemo(() => sortGeneratedSets(lockedMap, statOrder, enabledStats, sets), [
    lockedMap,
    statOrder,
    enabledStats,
    sets,
  ]);
  // No point memoing this as allItems
  const unlockedMods = useMemo(() => {
    const plugSets: { [bucketHash: number]: Set<number> } = {};
    if (!profileResponse || selectedStore?.classType === undefined) {
      return [];
    }

    // 1. loop through all items, build up a map of mod sockets by bucket
    for (const item of allItems) {
      if (
        !item ||
        !item.sockets ||
        !isLoadoutBuilderItem(item) ||
        !(item.classType === DestinyClass.Unknown || item.classType === selectedStore.classType)
      ) {
        continue;
      }
      if (!plugSets[item.bucket.hash]) {
        plugSets[item.bucket.hash] = new Set<number>();
      }
      // build the filtered unique perks item picker
      item.sockets.allSockets
        .filter((s) => !s.isPerk)
        .forEach((socket) => {
          if (socket.socketDefinition.reusablePlugSetHash) {
            plugSets[item.bucket.hash].add(socket.socketDefinition.reusablePlugSetHash);
          } else if (socket.socketDefinition.randomizedPlugSetHash) {
            plugSets[item.bucket.hash].add(socket.socketDefinition.randomizedPlugSetHash);
          }
          // TODO: potentially also add inventory-based mods
        });
    }

    // 2. for each unique socket (type?) get a list of unlocked mods
    const allUnlockedMods = Object.values(plugSets).flatMap((sets) => {
      const unlockedPlugs: number[] = [];

      for (const plugSetHash of sets) {
        const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
        for (const plugSetItem of plugSetItems) {
          if (plugIsInsertable(plugSetItem)) {
            unlockedPlugs.push(plugSetItem.plugItemHash);
          }
        }
      }

      const finalMods: PluggableInventoryItemDefinition[] = [];

      for (const plug of unlockedPlugs) {
        const def = defs.InventoryItem.get(plug);

        if (
          isPluggableItem(def) &&
          isArmor2Mod(def) &&
          // Filters out mods that are deprecated.
          (def.plug.insertionMaterialRequirementHash !== 0 || def.plug.energyCost?.energyCost) &&
          // This string can be empty so let those cases through in the event a mod hasn't been given a itemTypeDisplayName.
          // My investigation showed that only classified items had this being undefined.
          def.itemTypeDisplayName !== undefined
        ) {
          finalMods.push(def);
        }
      }

      return finalMods.sort(sortMods);
    });

    return _.uniqBy(allUnlockedMods, (unlocked) => unlocked.hash);
  }, [allItems, defs, profileResponse, selectedStore?.classType]);

  const plusFiveMods = useMemo(() => {
    const orderedStatHashes = statOrder.map((stat) => statHashes[stat]);

    return unlockedMods
      .filter(
        (mod) =>
          mod.plug.plugCategoryHash === armor2PlugCategoryHashesByName.general &&
          mod.investmentStats.some(
            (stat) => stat.value === 5 && orderedStatHashes.includes(stat.statTypeHash)
          )
      )
      .sort((a, b) => {
        // We just filtered on these so they will never be undefined
        const aStatHash = a.investmentStats.find((stat) =>
          orderedStatHashes.includes(stat.statTypeHash)
        )!.statTypeHash;
        const bStatHash = b.investmentStats.find((stat) =>
          orderedStatHashes.includes(stat.statTypeHash)
        )!.statTypeHash;
        return orderedStatHashes.indexOf(aStatHash) - orderedStatHashes.indexOf(bStatHash);
      });
  }, [statOrder, unlockedMods]);

  // I dont think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <div className={styles.menuContent}>
      <FilterBuilds
        statRanges={result?.statRanges}
        stats={statFilters}
        onStatFiltersChanged={(statFilters: LoadoutBuilderState['statFilters']) =>
          lbDispatch({ type: 'statFiltersChanged', statFilters })
        }
        defs={defs}
        order={statOrder}
        assumeMasterwork={assumeMasterwork}
      />

      <LockArmorAndPerks
        selectedStore={selectedStore}
        lockedMap={lockedMap}
        lockedArmor2Mods={lockedArmor2Mods}
        lbDispatch={lbDispatch}
      />
    </div>
  );

  return (
    <PageWithMenu className={styles.page}>
      <PageWithMenu.Menu className={styles.menu}>
        <CharacterSelect
          selectedStore={selectedStore}
          stores={stores}
          isPhonePortrait={isPhonePortrait}
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
        {filteredSets && (
          <GeneratedSets
            sets={filteredSets}
            combos={combos}
            combosWithoutCaps={combosWithoutCaps}
            isPhonePortrait={isPhonePortrait}
            lockedMap={lockedMap}
            selectedStore={selectedStore}
            lbDispatch={lbDispatch}
            defs={defs}
            statOrder={statOrder}
            enabledStats={enabledStats}
            lockedArmor2Mods={lockedArmor2Mods}
            loadouts={loadouts}
            params={params}
            plusFiveMods={plusFiveMods}
          />
        )}
        {modPicker.open &&
          ReactDOM.createPortal(
            <ModPicker
              classType={selectedStore.classType}
              lockedArmor2Mods={lockedArmor2Mods}
              initialQuery={modPicker.initialQuery}
              lbDispatch={lbDispatch}
              onClose={() => lbDispatch({ type: 'closeModPicker' })}
            />,
            document.body
          )}
        {perkPicker.open &&
          ReactDOM.createPortal(
            <PerkPicker
              classType={selectedStore.classType}
              lockedMap={lockedMap}
              initialQuery={perkPicker.initialQuery}
              onClose={() => lbDispatch({ type: 'closePerkPicker' })}
              lbDispatch={lbDispatch}
            />,
            document.body
          )}
        {compareSet &&
          ReactDOM.createPortal(
            <CompareDrawer
              set={compareSet}
              loadouts={loadouts}
              lockedArmor2Mods={lockedArmor2Mods}
              defs={defs}
              classType={selectedStore.classType}
              statOrder={statOrder}
              enabledStats={enabledStats}
              assumeMasterwork={assumeMasterwork}
              onClose={() => lbDispatch({ type: 'closeCompareDrawer' })}
            />,
            document.body
          )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
