import {
  AssumeArmorMasterwork,
  LoadoutParameters,
  LockArmorEnergyType,
} from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { activityModPlugCategoryHashes } from 'app/loadout/known-values';
import _ from 'lodash';
import React, {
  Dispatch,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { List, WindowScroller } from 'react-virtualized';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet, PinnedItems } from '../types';
import GeneratedSet from './GeneratedSet';
import styles from './GeneratedSets.m.scss';

/** Taller item groups have either the swap icon under the item, an exotic perk, or a raid mod socket. */
function hasExoticPerkRaidModOrSwapIcon(items: DimItem[]) {
  return (
    items.length > 1 ||
    items.some(
      (item) =>
        item.isExotic ||
        item.sockets?.allSockets.some(
          ({ plugged }) =>
            plugged && activityModPlugCategoryHashes.includes(plugged.plugDef.plug.plugCategoryHash)
        )
    )
  );
}

/**
 * Gets the set used to measure how high a row can be. It also returns a recalcTrigger that is
 * intended to trigger a recalculation when the value changes.
 *
 * It figures out the tallest row by looking at items with exotic perks and swap icons.
 * Exotic perks add another row to the mod icons and the swap icon sits below the item image.
 * The height they add is roughly equivalent so we treat both conditions equally.
 *
 * This algorithm is built from the portrait mobile layout but will work for any other layout
 * as well. Landscape iPad has two rows, desktop can be 1, 2, or 3 rows depending on browser
 * width.
 */
function getMeasureSet(sets: readonly ArmorSet[]) {
  // In phone portrait we have 2 columns and 3 rows of items.
  const measureSet = _.maxBy(sets, (set) => {
    let countWithExoticPerkOrSwapIcon = 0;
    // So we look on those rows for items with the swap icon or an exotic perk.
    for (const indexes of [[0, 1], [2, 3], [4]]) {
      if (indexes.some((index) => hasExoticPerkRaidModOrSwapIcon(set.armor[index]))) {
        countWithExoticPerkOrSwapIcon++;
      }
    }

    return countWithExoticPerkOrSwapIcon;
  });

  return measureSet;
}

interface Props {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  subclass: ResolvedLoadoutItem | undefined;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  statOrder: number[];
  enabledStats: Set<number>;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
  assumeArmorMasterwork: AssumeArmorMasterwork | undefined;
  lockArmorEnergyType: LockArmorEnergyType | undefined;
  notes?: string;
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default memo(function GeneratedSets({
  lockedMods,
  pinnedItems,
  selectedStore,
  sets,
  subclass,
  statOrder,
  enabledStats,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
  assumeArmorMasterwork,
  lockArmorEnergyType,
  notes,
}: Props) {
  const windowScroller = useRef<WindowScroller>(null);
  const measureSetRef = useRef<HTMLDivElement>(null);
  const [{ rowHeight, rowWidth }, setRowSize] = useState<{
    rowHeight: number;
    rowWidth: number;
  }>({ rowHeight: 0, rowWidth: 0 });

  const measureSet = useMemo(() => getMeasureSet(sets), [sets]);

  // Trigger height measurement again when needed
  useLayoutEffect(() => {
    setRowSize({ rowHeight: 0, rowWidth: 0 });
    // Sets may gain extra perks,
    // mod locks add "change element" hints above items.
  }, [sets, lockedMods]);

  useLayoutEffect(() => {
    if (measureSetRef.current) {
      setRowSize({
        rowHeight: measureSetRef.current.clientHeight,
        rowWidth: measureSetRef.current.clientWidth,
      });
    }
    // Include sets to recover after no sets were found and rowHeight stayed 0
  }, [rowHeight, sets]);

  useEffect(() => {
    const handleWindowResize = _.throttle(() => setRowSize({ rowHeight: 0, rowWidth: 0 }), 300, {
      leading: false,
      trailing: true,
    });
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    windowScroller.current?.updatePosition();
  });

  return (
    <div className={styles.sets}>
      {measureSet && rowHeight === 0 ? (
        <GeneratedSet
          ref={measureSetRef}
          style={{}}
          set={measureSet}
          subclass={subclass}
          selectedStore={selectedStore}
          lockedMods={lockedMods}
          pinnedItems={pinnedItems}
          lbDispatch={lbDispatch}
          statOrder={statOrder}
          enabledStats={enabledStats}
          loadouts={loadouts}
          params={params}
          halfTierMods={halfTierMods}
          assumeArmorMasterwork={assumeArmorMasterwork}
          lockArmorEnergyType={lockArmorEnergyType}
          notes={notes}
        />
      ) : sets.length > 0 ? (
        <WindowScroller ref={windowScroller}>
          {({ height, isScrolling, onChildScroll, scrollTop }) => (
            <List
              autoHeight={true}
              height={height}
              width={rowWidth}
              isScrolling={isScrolling}
              onScroll={onChildScroll}
              overscanRowCount={2}
              rowCount={sets.length}
              rowHeight={rowHeight || 160}
              rowRenderer={({ index, key, style }) => (
                <GeneratedSet
                  key={key}
                  style={style}
                  set={sets[index]}
                  subclass={subclass}
                  selectedStore={selectedStore}
                  lockedMods={lockedMods}
                  pinnedItems={pinnedItems}
                  lbDispatch={lbDispatch}
                  statOrder={statOrder}
                  enabledStats={enabledStats}
                  loadouts={loadouts}
                  params={params}
                  halfTierMods={halfTierMods}
                  assumeArmorMasterwork={assumeArmorMasterwork}
                  lockArmorEnergyType={lockArmorEnergyType}
                  notes={notes}
                />
              )}
              scrollTop={scrollTop}
            />
          )}
        </WindowScroller>
      ) : (
        <h3>{t('LoadoutBuilder.NoBuildsFoundWithReasons')}</h3>
      )}
    </div>
  );
});
