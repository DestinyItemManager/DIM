import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo, Dispatch } from 'react';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { DimStore, D2Store } from '../inventory/store-types';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets } from './generated-sets/utils';
import {
  StatTypes,
  ItemsByBucket,
  LockedMap,
  MinMaxIgnored,
  LockedModBase,
  LockedArmor2ModMap,
} from './types';
import { filterItems } from './preProcessFilter';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './generated-sets/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import SearchFilterInput from 'app/search/SearchFilterInput';
import { SearchConfig, SearchFilters } from 'app/search/search-filters';
import styles from './LoadoutBuilder.m.scss';
import LockArmorAndPerks from './LockArmorAndPerks';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { LoadoutBuilderAction, LBState } from './LoadoutBuilderContainer';
import { useProcess } from './useProcess';
import { DimItem } from 'app/inventory/item-types';
import { Loading } from 'app/dim-ui/Loading';

interface Props {
  stores: DimStore[];
  selectedStore: DimStore<DimItem>;
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  defs: D2ManifestDefinitions;
  searchConfig: SearchConfig;
  filters: SearchFilters;
  lockedMap: LockedMap;
  lockedSeasonalMods: LockedModBase[];
  lockedArmor2Mods: LockedArmor2ModMap;
  selectedStoreId?: string;
  statFilters: Readonly<{ [statType in StatTypes]: MinMaxIgnored }>;
  minimumPower: number;
  query: string;
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
  enabledStats: Set<StatTypes>;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilder({
  stores,
  selectedStore,
  isPhonePortrait,
  items,
  defs,
  searchConfig,
  filters,
  lockedMap,
  lockedSeasonalMods,
  lockedArmor2Mods,
  statFilters,
  minimumPower,
  query,
  statOrder,
  assumeMasterwork,
  enabledStats,
  lbDispatch,
}: Props) {
  const filter = filters.filterFunction(query);

  const characterItems: ItemsByBucket | undefined = items[selectedStore.classType];

  const filteredItems = useMemo(
    () => filterItems(characterItems, lockedMap, lockedArmor2Mods, filter),
    [characterItems, lockedMap, lockedArmor2Mods, filter]
  );

  const result = useProcess(
    filteredItems,
    lockedMap,
    lockedArmor2Mods,
    selectedStore.id,
    assumeMasterwork
  );

  // const hydratedSets = useMemo(() => {
  //   if (!result?.sets) {
  //     return;
  //   }

  //   const start = performance.now();

  //   const sets: ArmorSet[] = [];

  //   for (const processSet of result.sets) {
  //     const set = hydrateArmorSet(processSet, filteredItems);
  //     if (set) {
  //       sets.push(set);
  //     }
  //   }

  //   console.log(`Hydrating armor took ${performance.now() - start} ms`);

  //   return sets;
  // }, [result?.sets, filteredItems]);

  const combos = result?.combos || 0;
  const combosWithoutCaps = result?.combosWithoutCaps || 0;

  const filteredSets = useMemo(
    () =>
      filterGeneratedSets(
        result?.sets,
        minimumPower,
        lockedMap,
        lockedArmor2Mods,
        lockedSeasonalMods,
        statFilters,
        statOrder,
        enabledStats
      ),
    [
      result?.sets,
      minimumPower,
      lockedMap,
      lockedArmor2Mods,
      lockedSeasonalMods,
      statFilters,
      statOrder,
      enabledStats,
    ]
  );

  const menuContent = (
    <div className={styles.menuContent}>
      <SearchFilterInput
        searchConfig={searchConfig}
        placeholder={t('LoadoutBuilder.SearchPlaceholder')}
        onQueryChanged={(query: string) => lbDispatch({ type: 'queryChanged', query })}
      />

      <FilterBuilds
        sets={result?.sets}
        selectedStore={selectedStore as D2Store}
        minimumPower={minimumPower}
        stats={statFilters}
        onMinimumPowerChanged={(minimumPower: number) =>
          lbDispatch({ type: 'minimumPowerChanged', minimumPower })
        }
        onStatFiltersChanged={(statFilters: LBState['statFilters']) =>
          lbDispatch({ type: 'statFiltersChanged', statFilters })
        }
        defs={defs}
        order={statOrder}
        onStatOrderChanged={(statOrder: StatTypes[]) =>
          lbDispatch({ type: 'statOrderChanged', statOrder })
        }
        assumeMasterwork={assumeMasterwork}
        onMasterworkAssumptionChange={(assumeMasterwork: boolean) =>
          lbDispatch({ type: 'assumeMasterworkChanged', assumeMasterwork })
        }
      />

      <LockArmorAndPerks
        items={filteredItems}
        selectedStore={selectedStore}
        lockedMap={lockedMap}
        lockedSeasonalMods={lockedSeasonalMods}
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
          vertical={!isPhonePortrait}
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
        {filteredSets ? (
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
          />
        ) : (
          <Loading message={'Processing armor sets'} />
        )}
      </PageWithMenu.Contents>

      <LoadoutDrawer />
    </PageWithMenu>
  );
}

export default React.memo(LoadoutBuilder);
