import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { newLoadout } from 'app/loadout/loadout-utils';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import _ from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, WindowScroller } from 'react-virtualized';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { ArmorSet, LockedArmor2ModMap, LockedMap, ModPickerCategories, StatTypes } from '../types';
import { someModHasEnergyRequirement } from '../utils';
import GeneratedSet from './GeneratedSet';
import styles from './GeneratedSets.m.scss';

const statsWarning =
  'https://destinyitemmanager.fandom.com/wiki/Loadout_Optimizer#A_Warning_on_Mods_and_Stats';
const statsWarningLink = `<a href='${statsWarning}' target='_blank' rel='noopener noreferrer'>A Warning on Mods and Stats</a>`;

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
  lockedArmor2Mods: LockedArmor2ModMap;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

function numColumns(set: ArmorSet) {
  return _.sumBy(set.armor, (items) => {
    const item = items[0];
    return (item.sockets && _.max(item.sockets.categories.map((c) => c.sockets.length))) || 0;
  });
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
  isPhonePortrait,
  combos,
  combosWithoutCaps,
  enabledStats,
  lockedArmor2Mods,
  loadouts,
  lbDispatch,
}: Props) {
  const windowScroller = useRef<WindowScroller>(null);
  const [{ rowHeight, rowWidth }, setRowSize] = useState<{
    rowHeight: number;
    rowWidth: number;
  }>({ rowHeight: 0, rowWidth: 0 });
  const rowColumns = useMemo(() => sets.reduce((memo, set) => Math.max(memo, numColumns(set)), 0), [
    sets,
  ]);

  useEffect(() => {
    setRowSize({ rowHeight: 0, rowWidth: 0 });
  }, [rowColumns]);

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

  let measureSet: ArmorSet | undefined;
  if (sets.length > 0 && rowHeight === 0 && rowColumns !== 0) {
    measureSet = _.maxBy(sets, numColumns);
  }

  let groupingDescription;

  if (
    someModHasEnergyRequirement(lockedArmor2Mods[ModPickerCategories.seasonal]) ||
    (someModHasEnergyRequirement(lockedArmor2Mods[ModPickerCategories.general]) &&
      lockedArmor2Mods[ModPickerCategories.seasonal].length)
  ) {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStatsEnergyModSlot');
  } else if (lockedArmor2Mods[ModPickerCategories.seasonal].length) {
    groupingDescription = t('LoadoutBuilder.ItemsGroupedByStatsModSlot');
  } else if (someModHasEnergyRequirement(lockedArmor2Mods[ModPickerCategories.general])) {
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
      {combos !== combosWithoutCaps && (
        <p className={styles.warning}>
          {t('LoadoutBuilder.LimitedCombos', { combos, combosWithoutCaps })}
        </p>
      )}
      <p>
        {t('LoadoutBuilder.OptimizerExplanation')}{' '}
        {!isPhonePortrait && t('LoadoutBuilder.OptimizerExplanationDesktop')}
        {'\n'}
        <span
          dangerouslySetInnerHTML={{
            __html: t('LoadoutBuilder.OptimizerExplanationArmour2Mods', {
              link: statsWarningLink,
            }),
          }}
        />{' '}
        <UserGuideLink topic="Loadout_Optimizer" />
      </p>
      <p>{groupingDescription}</p>
      <p>
        <span className={styles.altPerkKey}>{t('LoadoutBuilder.AltPerkKey')}</span>{' '}
        <span className={styles.selectedPerkKey}>{t('LoadoutBuilder.SelectedPerkKey')}</span>
      </p>
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
          lockedArmor2Mods={lockedArmor2Mods}
          loadouts={loadouts}
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
                  lockedArmor2Mods={lockedArmor2Mods}
                  loadouts={loadouts}
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
