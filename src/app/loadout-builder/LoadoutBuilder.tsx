import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import CharacterSelect from '../dim-ui/CharacterSelect';
import { D2Store } from '../inventory/store-types';
import { RootState } from 'app/store/types';
import GeneratedSets from './generated-sets/GeneratedSets';
import { sortGeneratedSets } from './generated-sets/utils';
import { isLoadoutBuilderItem } from './utils';
import { filterItems } from './preProcessFilter';
import { StatTypes, ItemsByBucket, statKeys, statHashToType } from './types';
import { storesSelector } from '../inventory/selectors';
import { createSelector } from 'reselect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import FilterBuilds from './filter/FilterBuilds';
import LoadoutDrawer from 'app/loadout/LoadoutDrawer';
import { searchFilterSelector } from 'app/search/search-filter';
import styles from './LoadoutBuilder.m.scss';
import LockArmorAndPerks from './filter/LockArmorAndPerks';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { useProcess } from './hooks/useProcess';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { Loadout } from 'app/loadout/loadout-types';
import { LoadoutBuilderState, useLbState } from './loadoutBuilderReducer';
import { settingsSelector } from 'app/settings/reducer';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import ModPicker from './filter/ModPicker';
import ReactDOM from 'react-dom';
import PerkPicker from './filter/PerkPicker';
import { Location } from 'history';
import { withRouter, StaticContext } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import withStoresLoader from 'app/utils/withStoresLoader';
import type { StoresLoadedProps } from 'app/utils/withStoresLoader';

interface ProvidedProps {
  location: Location<{
    loadout?: Loadout | undefined;
  }>;
}

interface StoreProps {
  statOrder: StatTypes[];
  assumeMasterwork: boolean;
  minimumPower: number;
  minimumStatTotal: number;
  items: Readonly<{
    [classType: number]: ItemsByBucket;
  }>;
  filter(item: DimItem): boolean;
}

type Props = ProvidedProps &
  StoresLoadedProps &
  StoreProps &
  RouteComponentProps<{}, StaticContext, { loadout?: Loadout }>;

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
      items: itemsSelector(state),
      filter: searchFilterSelector(state),
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
  defsD2: defs,
  filter,
  location,
}: Props) {
  const [
    {
      lockedMap,
      lockedSeasonalMods,
      lockedArmor2Mods,
      selectedStoreId,
      statFilters,
      modPicker,
      perkPicker,
    },
    lbDispatch,
  ] = useLbState(stores, location.state?.loadout);

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
    lockedSeasonalMods,
    lockedArmor2Mods,
    assumeMasterwork,
    statOrder,
    statFilters,
    minimumPower
  );

  const combos = result?.combos || 0;
  const combosWithoutCaps = result?.combosWithoutCaps || 0;

  const filteredSets = useMemo(
    () => sortGeneratedSets(lockedMap, statOrder, enabledStats, result?.sets),
    [lockedMap, statOrder, enabledStats, result?.sets]
  );

  const loadingNodeRef = useRef<HTMLDivElement>(null);

  // I dont think this can actually happen?
  if (!selectedStore) {
    return null;
  }

  const menuContent = (
    <div className={styles.menuContent}>
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
            lockedSeasonalMods={lockedSeasonalMods}
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
              items={filteredItems}
              lockedMap={lockedMap}
              lockedSeasonalMods={lockedSeasonalMods}
              initialQuery={perkPicker.initialQuery}
              onClose={() => lbDispatch({ type: 'closePerkPicker' })}
              lbDispatch={lbDispatch}
            />,
            document.body
          )}
      </PageWithMenu.Contents>
      <LoadoutDrawer />
    </PageWithMenu>
  );
}

export default withRouter(withStoresLoader(connect<StoreProps>(mapStateToProps)(LoadoutBuilder)));
