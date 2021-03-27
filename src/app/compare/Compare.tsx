import { settingsSelector } from 'app/dim-api/selectors';
import { itemPop } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { setSetting } from 'app/settings/actions';
import Checkbox from 'app/settings/Checkbox';
import { AppIcon, faAngleLeft, faAngleRight } from 'app/shell/icons';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimPlug, DimSocket, DimStat } from '../inventory/item-types';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import './compare.scss';
import CompareItem from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import { CompareSession } from './reducer';
import {
  compareCategoryItemsSelector,
  compareItemsSelector,
  compareSessionSelector,
} from './selectors';
import { DimAdjustedItemStat, DimAdjustedPlugs, DimAdjustedStats } from './types';

interface StoreProps {
  /** All items matching the current compare session itemCategoryHash */
  categoryItems: DimItem[];
  /** All items matching the current compare session query and itemCategoryHash */
  compareItems: DimItem[];
  session?: CompareSession;
  compareBaseStats: boolean;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    categoryItems: compareCategoryItemsSelector(state),
    compareBaseStats: settingsSelector(state).compareBaseStats,
    compareItems: compareItemsSelector(state),
    session: compareSessionSelector(state),
  };
}

export interface StatInfo {
  id: string | number;
  displayProperties: DestinyDisplayPropertiesDefinition;
  min: number;
  max: number;
  enabled: boolean;
  lowerBetter: boolean;
  getStat: StatGetter;
}

/** a DimStat with, at minimum, a statHash */
export type MinimalStat = Partial<DimStat> & Pick<DimStat, 'statHash'>;
type StatGetter = (item: DimItem) => undefined | MinimalStat;

// TODO: Allow minimizing the sheet (to make selection easier)
// TODO: memoize
function Compare(
  this: void,
  { categoryItems, compareBaseStats, compareItems, session, dispatch }: Props
) {
  /** The stat row to highlight */
  const [highlight, setHighlight] = useState<string | number>();
  /** The stat row to sort by */
  const [sortedHash, setSortedHash] = useState<string | number>();
  const [sortBetterFirst, setSortBetterFirst] = useState<boolean>(true);
  // TODO: combine these
  const [adjustedPlugs, setAdjustedPlugs] = useState<DimAdjustedPlugs>({});
  const [adjustedStats, setAdjustedStats] = useState<DimAdjustedStats>({});

  const cancel = useCallback(() => {
    // TODO: this is why we need a container, right? So we don't have to reset state
    setHighlight(undefined);
    setSortedHash(undefined);
    setAdjustedPlugs({});
    setAdjustedStats({});
    dispatch(endCompareSession());
  }, [dispatch]);

  const show = Boolean(session);
  const destinyVersion = show ? compareItems[0].destinyVersion : 2;
  useEffect(() => {
    if (show) {
      ga('send', 'pageview', `/profileMembershipId/d${destinyVersion}/compare`);
    }
  }, [show, destinyVersion]);

  // Reset on path changes
  const { pathname } = useLocation();
  useEffect(() => {
    cancel();
  }, [pathname, cancel]);

  // Clear the session on unmount
  useEffect(
    () => () => {
      dispatch(endCompareSession());
    },
    [dispatch]
  );

  // TODO: make a function that takes items and perk overrides and produces new items!

  // Memoize computing the list of stats
  const allStats = useMemo(() => getAllStats(compareItems, compareBaseStats, adjustedStats), [
    compareItems,
    compareBaseStats,
    adjustedStats,
  ]);

  const comparingArmor = compareItems[0]?.bucket.inArmor;
  const doCompareBaseStats = Boolean(compareBaseStats && comparingArmor);

  if (!show) {
    return null;
  }

  const updateQuery = (newQuery: string) => {
    dispatch(updateCompareQuery(newQuery));
  };

  const sort = (newSortedHash?: string | number) => {
    // TODO: put sorting together?
    setSortedHash(newSortedHash);
    setSortBetterFirst(sortedHash === newSortedHash ? !sortBetterFirst : true);
  };

  const remove = (item: DimItem) => {
    if (compareItems.length <= 1) {
      cancel();
    } else {
      dispatch(removeCompareItem(item));
    }
  };

  const onChangeSetting: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    dispatch(setSetting(e.target.name as any, e.target.checked));
  };

  const comparator = sortCompareItemsComparator(sortedHash, sortBetterFirst, doCompareBaseStats);
  const sortedComparisonItems = !sortedHash
    ? compareItems
    : Array.from(compareItems).sort(comparator);

  const doUpdateSocketComparePlug = ({
    item,
    socket,
    plug,
  }: {
    item: DimItem;
    socket: DimSocket;
    plug: DimPlug;
  }) => {
    const updatedPlugs = updateSocketComparePlug({
      item,
      socket,
      plug,
      adjustedPlugs,
      adjustedStats,
    });
    if (!updatedPlugs) {
      return;
    }
    // TODO: put these together
    setAdjustedPlugs(updatedPlugs.adjustedPlugs);
    setAdjustedStats(updatedPlugs.adjustedStats);
  };

  // TODO: test/handle removing all items (no results)

  // If the session was started with a specific item, this is it
  // TODO: highlight this item
  const initialItem =
    session?.initialItemId && categoryItems.find((i) => i.id === session.initialItemId);
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || compareItems[0];

  return (
    <Sheet
      onClose={cancel}
      header={
        <div className="compare-options">
          {comparingArmor && (
            <Checkbox
              label={t('Compare.CompareBaseStats')}
              name="compareBaseStats"
              value={compareBaseStats}
              onChange={onChangeSetting}
            />
          )}
          {exampleItem && (
            <CompareSuggestions
              exampleItem={exampleItem}
              categoryItems={categoryItems}
              onQueryChanged={updateQuery}
            />
          )}
        </div>
      }
    >
      <div id="loadout-drawer" className="compare">
        <div className="compare-bucket" onMouseLeave={() => setHighlight(undefined)}>
          <div className="compare-item fixed-left">
            <div className="spacer" />
            {allStats.map((stat) => (
              <div
                key={stat.id}
                className={clsx('compare-stat-label', {
                  highlight: stat.id === highlight,
                  sorted: stat.id === sortedHash,
                })}
                onMouseOver={() => setHighlight(stat.id)}
                onClick={() => sort(stat.id)}
              >
                {stat.displayProperties.name}{' '}
                {stat.id === sortedHash && (
                  <AppIcon icon={sortBetterFirst ? faAngleRight : faAngleLeft} />
                )}
              </div>
            ))}
          </div>
          <div className="compare-items">
            {sortedComparisonItems.map((item) => (
              <CompareItem
                item={item}
                key={item.id}
                stats={allStats}
                itemClick={itemPop}
                remove={remove}
                setHighlight={setHighlight}
                highlight={highlight}
                updateSocketComparePlug={doUpdateSocketComparePlug}
                adjustedItemPlugs={adjustedPlugs?.[item.id]}
                adjustedItemStats={adjustedStats?.[item.id]}
                compareBaseStats={doCompareBaseStats}
                isInitialItem={session?.initialItemId === item.id}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function sortCompareItemsComparator(
  sortedHash: string | number | undefined,
  sortBetterFirst: boolean,
  compareBaseStats: boolean
) {
  return reverseComparator(
    chainComparator(
      compareBy((item: DimItem) => {
        const stat =
          item.primStat && sortedHash === item.primStat.statHash
            ? (item.primStat as MinimalStat)
            : sortedHash === 'EnergyCapacity'
            ? {
                value: item.energy?.energyCapacity || 0,
                base: undefined,
              }
            : (item.stats || []).find((s) => s.statHash === sortedHash);

        if (!stat) {
          return -1;
        }

        const shouldReverse =
          isDimStat(stat) && stat.smallerIsBetter ? sortBetterFirst : !sortBetterFirst;

        const statValue = (compareBaseStats ? stat.base ?? stat.value : stat.value) || 0;
        return shouldReverse ? -statValue : statValue;
      }),
      compareBy((i) => i.index),
      compareBy((i) => i.name)
    )
  );
}

function updateSocketComparePlug({
  item,
  socket,
  plug: clickedPlug,
  adjustedPlugs,
  adjustedStats,
}: {
  item: DimItem;
  socket: DimSocket;
  plug: DimPlug;
  adjustedPlugs: DimAdjustedPlugs;
  adjustedStats: DimAdjustedStats;
}):
  | {
      adjustedPlugs: DimAdjustedPlugs;
      adjustedStats: DimAdjustedStats;
    }
  | undefined {
  const { socketIndex } = socket;
  const currentAdjustedPlug = adjustedPlugs?.[item.id]?.[socketIndex];
  const pluggedPlug = item.sockets?.allSockets[socketIndex]?.plugged;

  /**
   * Exit early if this plug / socket isn't a clickable target
   * TODO: check the socket index detail
   * */
  if (
    item.destinyVersion === 1 ||
    !item.sockets ||
    !item.stats ||
    socketIndex > 2 ||
    !pluggedPlug ||
    (clickedPlug.plugDef.hash === pluggedPlug?.plugDef.hash && currentAdjustedPlug === undefined)
  ) {
    return undefined;
  }

  /**
   * Determine the next plug
   * If the clicked plug is the currently adjusted plug,
   * the next should be the original plug in the socket
   */
  const nextPlug =
    clickedPlug.plugDef.hash === currentAdjustedPlug?.plugDef.hash ? pluggedPlug : clickedPlug;

  /**
   * Determine the previous plug
   * If the clicked plug is the currently adjusted plug,
   * the previous should be the clicked plug
   */
  const prevPlug =
    clickedPlug.plugDef.hash === currentAdjustedPlug?.plugDef.hash
      ? clickedPlug
      : currentAdjustedPlug ?? pluggedPlug;

  /**
   * Update the adjustedPlugs object
   * If the next plug is the original plug, delete the adjustedPlug entry
   * Else add the next plug to the item socket entry
   */
  const updatedPlugs =
    nextPlug.plugDef.hash === pluggedPlug.plugDef.hash
      ? produce(adjustedPlugs, (draft) => {
          delete draft?.[item.id]?.[socketIndex];
        })
      : adjustedPlugs?.[item.id] !== undefined
      ? produce(adjustedPlugs, (draft) => {
          draft[item.id][socketIndex] = nextPlug;
        })
      : produce(adjustedPlugs ?? {}, (draft) => {
          draft[item.id] = { [socketIndex]: nextPlug };
        });

  /**
   * If there are no more adjustedPlugs for the item
   * delete the associated adjustedPlugs and adjustedStats entries and exit
   */
  if (isEmpty(updatedPlugs?.[item.id])) {
    const emptiedPlugs = produce(updatedPlugs, (draft) => {
      delete draft?.[item.id];
    });
    const emptiedStats = produce(adjustedStats, (draft) => {
      delete draft?.[item.id];
    });
    return {
      adjustedPlugs: emptiedPlugs,
      adjustedStats: emptiedStats,
    };
  }

  // Remove the stats listed on the previous plug from adjustedStats
  const itemStatsAfterRemoval: DimAdjustedItemStat | undefined = calculateUpdatedStats({
    itemStats: item.stats,
    adjustedStats: adjustedStats?.[item.id] ?? {},
    plugStats: prevPlug.stats,
    mode: 'remove',
  });

  // Add the stats listed on the next plug to adjustedStats
  const itemStatsAfterAddition: DimAdjustedItemStat | undefined = calculateUpdatedStats({
    itemStats: item.stats,
    adjustedStats: itemStatsAfterRemoval ?? adjustedStats?.[item.id] ?? {},
    plugStats: nextPlug.stats,
    mode: 'add',
  });

  // Update the adjustedStats object
  const updatedStats = produce(adjustedStats ?? {}, (draft) => {
    if (itemStatsAfterAddition) {
      draft[item.id] = itemStatsAfterAddition;
    }
  });

  return {
    adjustedPlugs: updatedPlugs,
    adjustedStats: updatedStats,
  };
}

function calculateUpdatedStats({
  itemStats,
  adjustedStats,
  plugStats,
  mode,
}: {
  itemStats: DimStat[];
  adjustedStats: DimAdjustedItemStat;
  plugStats: DimPlug['stats'];
  mode: string;
}): DimAdjustedItemStat | undefined {
  if (!plugStats) {
    return adjustedStats;
  }

  const updatedStats = produce(adjustedStats ?? {}, (draft) => {
    for (const statHash in plugStats) {
      const itemStatIndex = itemStats.findIndex((stat) => stat.statHash === parseInt(statHash));
      const calcStat: number = draft?.[statHash] ?? itemStats[itemStatIndex]?.value;

      if (calcStat) {
        draft[statHash] =
          mode === 'add' ? calcStat + plugStats[statHash] : calcStat - plugStats[statHash];
      }
    }
  });

  return updatedStats;
}

function getAllStats(
  comparisonItems: DimItem[],
  compareBaseStats: boolean,
  adjustedStats?: { [itemId: string]: { [statHash: number]: number } }
): StatInfo[] {
  if (!comparisonItems.length) {
    return emptyArray<StatInfo>();
  }

  const firstComparison = comparisonItems[0];
  compareBaseStats = Boolean(compareBaseStats && firstComparison.bucket.inArmor);
  const stats: StatInfo[] = [];

  if (firstComparison.primStat) {
    stats.push(
      makeFakeStat(
        firstComparison.primStat.statHash,
        firstComparison.primStat.stat.displayProperties,
        (item: DimItem) => item.primStat || undefined
      )
    );
  }

  if (firstComparison.destinyVersion === 2 && firstComparison.bucket.inArmor) {
    stats.push(
      makeFakeStat(
        'EnergyCapacity',
        t('EnergyMeter.Energy'),
        (item: DimItem) =>
          (item.energy && {
            statHash: item.energy.energyType,
            value: item.energy.energyCapacity,
            base: undefined,
          }) ||
          undefined
      )
    );
  }

  // Todo: map of stat id => stat object
  // add 'em up
  const statsByHash: { [statHash: string]: StatInfo } = {};
  for (const item of comparisonItems) {
    if (item.stats) {
      for (const stat of item.stats) {
        let statInfo = statsByHash[stat.statHash];
        if (!statInfo) {
          statInfo = {
            id: stat.statHash,
            displayProperties: stat.displayProperties,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            enabled: false,
            lowerBetter: false,
            getStat(item: DimItem) {
              return item.stats ? item.stats.find((s) => s.statHash === stat.statHash) : undefined;
            },
          };
          statsByHash[stat.statHash] = statInfo;
          stats.push(statInfo);
        }
      }
    }
  }

  for (const stat of stats) {
    for (const item of comparisonItems) {
      const itemStat = stat.getStat(item);
      const adjustedStatValue = adjustedStats?.[item.id]?.[stat.id];
      if (itemStat) {
        stat.min = Math.min(
          stat.min,
          (compareBaseStats
            ? itemStat.base ?? adjustedStatValue ?? itemStat.value
            : adjustedStatValue ?? itemStat.value) || 0
        );
        stat.max = Math.max(
          stat.max,
          (compareBaseStats
            ? itemStat.base ?? adjustedStatValue ?? itemStat.value
            : adjustedStatValue ?? itemStat.value) || 0
        );
        stat.enabled = stat.min !== stat.max;
        stat.lowerBetter = isDimStat(itemStat) ? itemStat.smallerIsBetter : false;
      }
    }
  }

  return stats;
}

function isDimStat(stat: DimStat | any): stat is DimStat {
  return Object.prototype.hasOwnProperty.call(stat as DimStat, 'smallerIsBetter');
}

function makeFakeStat(
  id: string | number,
  displayProperties: DestinyDisplayPropertiesDefinition | string,
  getStat: StatGetter,
  lowerBetter = false
) {
  if (typeof displayProperties === 'string') {
    displayProperties = { name: displayProperties } as DestinyDisplayPropertiesDefinition;
  }
  return {
    id,
    displayProperties,
    min: Number.MAX_SAFE_INTEGER,
    max: 0,
    enabled: false,
    lowerBetter,
    getStat,
  };
}

export default connect<StoreProps>(mapStateToProps)(Compare);
