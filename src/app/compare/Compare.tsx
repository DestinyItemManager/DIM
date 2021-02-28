import { settingsSelector } from 'app/dim-api/selectors';
import { itemPop } from 'app/dim-ui/scroll';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { powerCapPlugSetHash } from 'app/search/d2-known-values';
import { setSetting } from 'app/settings/actions';
import Checkbox from 'app/settings/Checkbox';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import { isEmpty } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimPlug, DimSocket, DimStat } from '../inventory/item-types';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { endCompareSession, removeCompareItem } from './actions';
import './compare.scss';
import CompareItem from './CompareItem';
import { CompareSession } from './reducer';
import { compareItemsSelector, compareSessionSelector } from './selectors';
import { DimAdjustedItemStat, DimAdjustedPlugs, DimAdjustedStats } from './types';

interface StoreProps {
  allItems: DimItem[];
  compareItems: DimItem[];
  session?: CompareSession;
  defs?: D2ManifestDefinitions;
  compareBaseStats: boolean;
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & RouteComponentProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    allItems: allItemsSelector(state),
    defs: state.manifest.d2Manifest,
    compareBaseStats: settingsSelector(state).compareBaseStats,
    compareItems: compareItemsSelector(state),
    session: compareSessionSelector(state),
  };
}

// TODO: There's far too much state here.
// TODO: maybe have a holder/state component and a connected display component
/*
interface State {
  highlight?: string | number;
  sortedHash?: string | number;
  sortBetterFirst: boolean;
  comparisonSets: CompareButton[];
  adjustedPlugs?: DimAdjustedPlugs;
  adjustedStats?: DimAdjustedStats;
}
*/

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

// TODO: Minimize?
function Compare(this: void, { compareBaseStats, compareItems, session }: Props) {
  /** The stat row to highlight */
  const [highlight, setHighlight] = useState<string | number>();
  /** The stat row to sort by */
  const [sortedHash, setSortedHash] = useState<string | number>();
  const [sortBetterFirst, setSortBetterFirst] = useState<boolean>(true);
  const [adjustedPlugs, setAdjustedPlugs] = useState<DimAdjustedPlugs>();
  const [adjustedStats, setAdjustedStats] = useState<DimAdjustedStats>();

  const dispatch = useDispatch();
  //const location = useLocation();

  const show = Boolean(session);
  const destinyVersion = show ? compareItems[0].destinyVersion : 2;
  useEffect(() => {
    if (show) {
      ga('send', 'pageview', `/profileMembershipId/d${destinyVersion}/compare`);
    }
  }, [show, destinyVersion]);

  // TODO: close on unmount?
  // TODO: close on navigation?
  /*
    componentDidUpdate(prevProps: Props) {
      if (prevProps.location.pathname !== this.props.location.pathname) {
        this.cancel();
      }
    }
    */

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

  const cancel = () => {
    // TODO: this is why we need a container, right? So we don't have to reset state
    setHighlight(undefined);
    setSortedHash(undefined);
    setAdjustedPlugs(undefined);
    setAdjustedStats(undefined);
    dispatch(endCompareSession());
  };

  /*
    const compareSimilar = (e: React.MouseEvent, comparisonSetItems: DimItem[]) => {
      e.preventDefault();
      // Uhhh what's the query
      dispatch(updateCompareQuery(newQuery));
    };
    */

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

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setSetting(e.target.name as any, e.target.checked);
  };

  const comparator = reverseComparator(
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
            : sortedHash === 'PowerCap'
            ? {
                value: item.powerCap || 99999999,
                base: undefined,
              }
            : (item.stats || []).find((s) => s.statHash === sortedHash);

        if (!stat) {
          return -1;
        }

        const shouldReverse =
          isDimStat(stat) && stat.smallerIsBetter ? sortBetterFirst : !sortBetterFirst;

        const statValue = (doCompareBaseStats ? stat.base ?? stat.value : stat.value) || 0;
        return shouldReverse ? -statValue : statValue;
      }),
      compareBy((i) => i.index),
      compareBy((i) => i.name)
    )
  );

  const sortedComparisonItems = !sortedHash
    ? compareItems
    : Array.from(compareItems).sort(comparator);

  // TODO: factor out
  const updateSocketComparePlug = ({
    item,
    socket,
    plug: clickedPlug,
  }: {
    item: DimItem;
    socket: DimSocket;
    plug: DimPlug;
  }) => {
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
      return;
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
      clickedPlug.plugDef.hash === currentAdjustedPlug?.plugDef?.hash
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
      // TODO: put these together
      setAdjustedPlugs(emptiedPlugs);
      setAdjustedStats(emptiedStats);
      return;
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

    setAdjustedPlugs(updatedPlugs);
    setAdjustedStats(updatedStats);
  };

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
              onChange={onChange}
            />
          )}
          {/*
            {comparisonSets.map(({ buttonLabel, items }, index) => (
              <button
                type="button"
                key={index}
                className="dim-button"
                onClick={(e) => compareSimilar(e, items)}
              >
                {buttonLabel} {`(${items.length})`}
              </button>
            ))}
            */}
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
                {stat.id === sortedHash && (sortBetterFirst ? '>' : '<')}
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
                updateSocketComparePlug={updateSocketComparePlug}
                adjustedItemPlugs={adjustedPlugs?.[item.id]}
                adjustedItemStats={adjustedStats?.[item.id]}
                compareBaseStats={doCompareBaseStats}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
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
  if (
    firstComparison.destinyVersion === 2 &&
    (firstComparison.bucket.inArmor || firstComparison.bucket.inWeapons)
  ) {
    stats.push(
      makeFakeStat('PowerCap', t('Stats.PowerCap'), (item: DimItem) => ({
        statHash: powerCapPlugSetHash,
        value: item.powerCap ?? undefined,
        base: undefined,
      }))
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

export default withRouter(
  connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(Compare)
);
