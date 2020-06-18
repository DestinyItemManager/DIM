import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo } from 'react';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { DimStore, D2Store } from '../inventory/store-types';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets } from './generated-sets/utils';
import { StatTypes, ItemsByBucket } from './types';
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
import { useProcess } from './hooks/useProcess';
import { Loading } from 'app/dim-ui/Loading';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { useLbState, LoadoutBuilderState } from './loadoutBuilderReducer';
import { statKeys } from './utils';
import { Location } from 'history';
import { Loadout } from 'app/loadout/loadout-types';

interface Props {
  stores: DimStore[];
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  defs: D2ManifestDefinitions;
  searchConfig: SearchConfig;
  filters: SearchFilters;
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}

/**
 * The Loadout Optimizer screen
 */
function LoadoutBuilder({
  stores,
  isPhonePortrait,
  items,
  defs,
  searchConfig,
  filters,
  location,
}: Props) {
  const [
    {
      selectedStoreId,
      lockedMap,
      lockedSeasonalMods,
      lockedArmor2Mods,
      statFilters,
      minimumPower,
      query,
      statOrder,
      assumeMasterwork,
    },
    lbDispatch,
  ] = useLbState(stores, location);

  const filter = filters.filterFunction(query);

  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  const enabledStats = useMemo(
    () => new Set(statKeys.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const characterItems: ItemsByBucket | undefined = selectedStore && items[selectedStore.classType];

  const filteredItems = useMemo(
    () => filterItems(characterItems, lockedMap, lockedArmor2Mods, filter),
    [characterItems, lockedMap, lockedArmor2Mods, filter]
  );

  const { result, processing } = useProcess(
    filteredItems,
    lockedMap,
    lockedArmor2Mods,
    selectedStore?.id,
    assumeMasterwork
  );

  const combos = result?.combos || 0;
  const combosWithoutCaps = result?.combosWithoutCaps || 0;

  const filteredSets = useMemo(
    () =>
      filterGeneratedSets(
        minimumPower,
        lockedMap,
        lockedArmor2Mods,
        lockedSeasonalMods,
        statFilters,
        statOrder,
        enabledStats,
        result?.sets
      ),
    [
      minimumPower,
      lockedMap,
      lockedArmor2Mods,
      lockedSeasonalMods,
      statFilters,
      statOrder,
      enabledStats,
      result?.sets,
    ]
  );

  // I dont think this can actually happen?
  if (!selectedStore) {
    return null;
  }

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
        onStatFiltersChanged={(statFilters: LoadoutBuilderState['statFilters']) =>
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
        {filteredSets && processing && (
          <div className={styles.processing}>
            <AppIcon icon={refreshIcon} spinning={true} />
          </div>
        )}
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
