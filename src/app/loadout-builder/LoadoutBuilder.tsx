import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from 'app/accounts/destiny-account';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from 'app/store/reducers';
import GeneratedSets from './generated-sets/GeneratedSets';
import { filterGeneratedSets, isLoadoutBuilderItem } from './generated-sets/utils';
import { filterItems } from './preProcessFilter';
import { StatTypes, ItemsByBucket, statKeys, statHashes } from './types';
import { storesSelector } from '../inventory/selectors';
import { createSelector } from 'reselect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './generated-sets/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import SearchFilterInput from 'app/search/SearchFilterInput';
import {
  SearchConfig,
  SearchFilters,
  searchConfigSelector,
  searchFiltersConfigSelector,
} from 'app/search/search-filter';
import styles from './LoadoutBuilder.m.scss';
import LockArmorAndPerks from './LockArmorAndPerks';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { useProcess } from './hooks/useProcess';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { Loadout } from 'app/loadout/loadout-types';
import { LoadoutBuilderState, useLbState } from './loadoutBuilderReducer';
import { settingsSelector } from 'app/settings/reducer';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

// Need to force the type as lodash converts the StatTypes type to string.
const statHashToType = _.invert(statHashes) as { [hash: number]: StatTypes };

interface ProvidedProps {
  account: DestinyAccount;
  defs: D2ManifestDefinitions;
  stores: DimStore[];
  preloadedLoadout?: Loadout;
}

interface StoreProps {
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
  minimumPower: number;
  minimumStatTotal: number;
  isPhonePortrait: boolean;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  searchConfig: SearchConfig;
  filters: SearchFilters;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  const itemsSelector = createSelector(
    storesSelector,
    (
      stores
    ): Readonly<{
      [classType: number]: ItemsByBucket;
    }> => {
      const items: {
        [classType: number]: { [bucketHash: number]: DimItem[] };
      } = {};
      for (const store of stores) {
        for (const item of store.items) {
          if (!item || !item.isDestiny2() || !isLoadoutBuilderItem(item)) {
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
      }

      return items;
    }
  );

  const statOrderSelector = createSelector(
    (state: RootState) => settingsSelector(state).loStatSortOrder,
    (loStatSortOrder: number[]) => loStatSortOrder.map((hash) => statHashToType[hash])
  );

  return (state: RootState): StoreProps => {
    const { loAssumeMasterwork, loMinPower, loMinStatTotal } = settingsSelector(state);
    return {
      statOrder: statOrderSelector(state),
      assumeMasterwork: loAssumeMasterwork,
      minimumPower: loMinPower,
      minimumStatTotal: loMinStatTotal,
      isPhonePortrait: state.shell.isPhonePortrait,
      items: itemsSelector(state),
      searchConfig: searchConfigSelector(state),
      filters: searchFiltersConfigSelector(state),
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
  minimumPower,
  minimumStatTotal,
  isPhonePortrait,
  items,
  defs,
  searchConfig,
  filters,
  preloadedLoadout,
}: Props) {
  const [
    { lockedMap, lockedSeasonalMods, lockedArmor2Mods, selectedStoreId, statFilters, query },
    lbDispatch,
  ] = useLbState(stores, preloadedLoadout);

  const filter = filters.filterFunction(query);

  const selectedStore = stores.find((store) => store.id === selectedStoreId);

  const enabledStats = useMemo(
    () => new Set(statKeys.filter((statType) => !statFilters[statType].ignored)),
    [statFilters]
  );

  const characterItems: ItemsByBucket | undefined = selectedStore && items[selectedStore.classType];

  const filteredItems = useMemo(
    () =>
      filterItems(
        characterItems,
        lockedMap,
        lockedArmor2Mods,
        minimumStatTotal,
        assumeMasterwork,
        filter
      ),
    [characterItems, lockedMap, lockedArmor2Mods, minimumStatTotal, assumeMasterwork, filter]
  );

  const { result, processing } = useProcess(
    filteredItems,
    lockedMap,
    lockedArmor2Mods,
    assumeMasterwork,
    statOrder,
    statFilters,
    minimumPower
  );

  const combos = result?.combos || 0;
  const combosWithoutCaps = result?.combosWithoutCaps || 0;

  const filteredSets = useMemo(
    () =>
      filterGeneratedSets(
        lockedMap,
        lockedArmor2Mods,
        lockedSeasonalMods,
        statOrder,
        enabledStats,
        result?.sets
      ),
    [lockedMap, lockedArmor2Mods, lockedSeasonalMods, statOrder, enabledStats, result?.sets]
  );

  const loadingNodeRef = useRef<HTMLDivElement>(null);

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
        statRanges={result?.statRanges}
        selectedStore={selectedStore as D2Store}
        minimumPower={minimumPower}
        minimumStatTotal={minimumStatTotal}
        stats={statFilters}
        onStatFiltersChanged={(statFilters: LoadoutBuilderState['statFilters']) =>
          lbDispatch({ type: 'statFiltersChanged', statFilters })
        }
        defs={defs}
        order={statOrder}
        assumeMasterwork={assumeMasterwork}
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
        <TransitionGroup component={null}>
          {processing && (
            <CSSTransition
              nodeRef={loadingNodeRef}
              classNames={{
                enter: styles.processingEnter,
                enterActive: styles.processingEnterActive,
                exit: styles.processingExit,
                exitActive: styles.processingExitActive,
              }}
              timeout={{ enter: 500, exit: 500 }}
            >
              <div className={styles.processing} ref={loadingNodeRef}>
                <div>{t('LoadoutBuilder.ProcessingSets', { character: selectedStore.name })}</div>
                <AppIcon icon={refreshIcon} spinning={true} />
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
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
          />
        )}
      </PageWithMenu.Contents>

      <LoadoutDrawer />
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(LoadoutBuilder);
