import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { Loadout } from 'app/loadout/loadout-types';
import { newLoadout } from 'app/loadout/loadout-utils';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import _ from 'lodash';
import React, { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { List, WindowScroller } from 'react-virtualized';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { someModHasEnergyRequirement } from '../mod-utils';
import { ArmorSet, LockedMap, LockedMods, StatTypes } from '../types';
import GeneratedSet from './GeneratedSet';
import styles from './GeneratedSets.m.scss';

/** Taller item groups have either the swap icon under the item of an exotic perk. */
function hasExoticPerkOrSwapIcon(items: DimItem[]) {
  return items.length > 1 || items.some((item) => item.isExotic);
}

/**
 * Gets the set used to measure how high a row can be. It also returns a recalcTrigger that is
 * intended to trigger a recalculation when the value changes.
 *
 * It figures out the tallest row by looking at items with exotic perks and swap icons.
 * Exotic perks add another row to the mod icons and the swap icon sits below the item image.
 * The height they add is roughly equivalent so we treat both conditions equally.
 */
function getMeasureSet(sets, isPhonePortrait): [ArmorSet | undefined, number] {
  // In phone portrait we have 2 columns and 3 rows of items.
  let measureSet: ArmorSet | undefined;
  let recalcTrigger = 0;
  if (isPhonePortrait) {
    measureSet = _.maxBy(sets, (set) => {
      let countWithExoticPerkOrSwapIcon = 0;
      // So we look on those rows for items with the swap icon or an exotic perk.
      for (const indexes of [[0, 1], [2, 3], [4]]) {
        if (indexes.some((index) => hasExoticPerkOrSwapIcon(set.armor[index]))) {
          countWithExoticPerkOrSwapIcon++;
        }
      }

      if (countWithExoticPerkOrSwapIcon > recalcTrigger) {
        recalcTrigger = countWithExoticPerkOrSwapIcon;
      }

      return countWithExoticPerkOrSwapIcon;
    });
  } else {
    // when not in phone portrait we just find one set that has a taller item.
    measureSet =
      sets.find((set) =>
        set.armor.some((items) => {
          const hasTaller = hasExoticPerkOrSwapIcon(items);
          if (!recalcTrigger && hasTaller) {
            recalcTrigger = 1;
          }
          return hasTaller;
        })
      ) || sets[0];
  }

  return [measureSet, recalcTrigger];
}

interface Props {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  combos: number;
  combosWithoutCaps: number;
  isPhonePortrait: boolean;
  lockedMap: LockedMap;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  enabledStats: Set<StatTypes>;
  lockedMods: LockedMods;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  params: LoadoutParameters;
  halfTierMods: PluggableInventoryItemDefinition[];
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default function GeneratedSets({
  lockedMap,
  selectedStore,
  sets,
  defs,
  statOrder,
  combos,
  combosWithoutCaps,
  enabledStats,
  lockedMods,
  loadouts,
  lbDispatch,
  params,
  halfTierMods,
  isPhonePortrait,
}: Props) {
  const windowScroller = useRef<WindowScroller>(null);
  const [{ rowHeight, rowWidth }, setRowSize] = useState<{
    rowHeight: number;
    rowWidth: number;
  }>({ rowHeight: 0, rowWidth: 0 });

  // eslint-disable-next-line prefer-const
  let [measureSet, recalcTrigger] = getMeasureSet(sets, isPhonePortrait);

  useEffect(() => {
    setRowSize({ rowHeight: 0, rowWidth: 0 });
  }, [recalcTrigger]);

  useEffect(() => {
    const handleWindowResize = () =>
      _.throttle(() => setRowSize({ rowHeight: 0, rowWidth: 0 }), 300, {
        leading: false,
        trailing: true,
      });
    window.addEventListener('resize', handleWindowResize);
    () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    windowScroller.current?.updatePosition();
  });

  const setRowHeight = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && !rowHeight) {
        setTimeout(
          () =>
            setRowSize({
              rowHeight: element.clientHeight,
              rowWidth: element.clientWidth,
            }),
          0
        );
      }
    },
    [rowHeight]
  );

  // If we already have row height we dont want to render the measure set.
  if (rowHeight !== 0) {
    measureSet = undefined;
  }

  let groupingDescription;

  const generalMods = lockedMods[armor2PlugCategoryHashesByName.general] || [];
  const raidCombatAndLegacyMods = Object.entries(lockedMods).flatMap(([plugCategoryHash, mods]) =>
    !armor2PlugCategoryHashes.includes(Number(plugCategoryHash)) && mods ? mods : []
  );

  if (someModHasEnergyRequirement(raidCombatAndLegacyMods)) {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStatsEnergyModSlot');
  } else if (raidCombatAndLegacyMods.length) {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStatsModSlot');
  } else if (someModHasEnergyRequirement(generalMods)) {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStatsEnergy');
  } else {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStats');
  }

  return (
    <div className={styles.sets}>
      <h2>
        {t('LoadoutBuilder.GeneratedBuilds')}{' '}
        <span className={styles.numSets}>
          ({t('LoadoutBuilder.NumCombinations', { count: sets.length })})
        </span>
        <button
          type="button"
          className={`dim-button ${styles.newLoadout}`}
          onClick={() => editLoadout(newLoadout('', []), { showClass: true, isNew: true })}
        >
          {t('LoadoutBuilder.NewEmptyLoadout')}
        </button>
      </h2>
      <UserGuideLink topic="Loadout_Optimizer" />
      <p>
        {t('LoadoutBuilder.OptimizerExplanation')}{' '}
        {t('LoadoutBuilder.OptimizerExplanationArmour2Mods')}
      </p>
      {combos !== combosWithoutCaps && (
        <p>{t('LoadoutBuilder.LimitedCombos', { combos, combosWithoutCaps })}</p>
      )}
      <p>{groupingDescription}</p>
      {measureSet ? (
        <GeneratedSet
          ref={setRowHeight}
          style={{}}
          set={measureSet}
          selectedStore={selectedStore}
          lockedMap={lockedMap}
          lbDispatch={lbDispatch}
          defs={defs}
          statOrder={statOrder}
          enabledStats={enabledStats}
          lockedMods={lockedMods}
          loadouts={loadouts}
          params={params}
          halfTierMods={halfTierMods}
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
                  selectedStore={selectedStore}
                  lockedMap={lockedMap}
                  lbDispatch={lbDispatch}
                  defs={defs}
                  statOrder={statOrder}
                  enabledStats={enabledStats}
                  lockedMods={lockedMods}
                  loadouts={loadouts}
                  params={params}
                  halfTierMods={halfTierMods}
                />
              )}
              scrollTop={scrollTop}
            />
          )}
        </WindowScroller>
      ) : (
        <>
          <h3>{t('LoadoutBuilder.NoBuildsFoundWithReasons')}</h3>
          <ul>
            <li className={styles.emptyListReason}>
              {t('LoadoutBuilder.NoBuildsFoundExoticsAndMods')}
            </li>
            <li className={styles.emptyListReason}>
              {t('LoadoutBuilder.NoBuildsFoundModsAreTooExpensive')}
            </li>
            <li className={styles.emptyListReason}>
              {t('LoadoutBuilder.NoBuildsFoundSeasonalModNotSatisfied')}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
