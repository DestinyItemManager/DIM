import { LoadoutParameters, StatConstraint } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutFromEquipped } from 'app/loadout/loadout-utils';
import { loadoutsSelector } from 'app/loadout/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { querySelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { allItemsSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import FilterBuilds from './filter/FilterBuilds';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import ModPicker from './filter/ModPicker';
import PerkPicker from './filter/PerkPicker';
import CompareDrawer from './generated-sets/CompareDrawer';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { filterItems } from './item-filter';
import { LoadoutBuilderState, useLbState } from './loadout-builder-reducer';
import styles from './LoadoutBuilder.m.scss';
import { useProcess } from './process/useProcess';
import { ItemsByBucket, statHashes, statHashToType, statKeys, StatTypes } from './types';
import { isLoadoutBuilderItem } from './utils';

interface ProvidedProps {
  account: DestinyAccount;
  defs: D2ManifestDefinitions;
  stores: DimStore[];
  preloadedLoadout?: Loadout;
}

interface StoreProps {
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
    selectedStore,
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
