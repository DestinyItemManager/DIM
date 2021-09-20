import { settingsSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { statLabels } from 'app/organizer/Columns';
import { setSettingAction } from 'app/settings/actions';
import Checkbox from 'app/settings/Checkbox';
import { Settings } from 'app/settings/initial-settings';
import { AppIcon, faAngleLeft, faAngleRight, faList } from 'app/shell/icons';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { isiOSBrowser } from 'app/utils/browsers';
import { emptyArray } from 'app/utils/empty';
import { getSocketByIndex } from 'app/utils/socket-utils';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimPlug, DimSocket, DimStat } from '../inventory/item-types';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import styles from './Compare.m.scss';
import './compare.scss';
import CompareItem from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import { CompareSession } from './reducer';
import {
  compareCategoryItemsSelector,
  compareItemsSelector,
  compareOrganizerLinkSelector,
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
  organizerLink?: string;
  isPhonePortrait: boolean;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    categoryItems: compareCategoryItemsSelector(state),
    compareBaseStats: settingsSelector(state).compareBaseStats,
    compareItems: compareItemsSelector(state),
    session: compareSessionSelector(state),
    organizerLink: compareOrganizerLinkSelector(state),
    isPhonePortrait: isPhonePortraitSelector(state),
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
export type MinimalStat = { statHash: number; value: number; base?: number };
type StatGetter = (item: DimItem) => undefined | MinimalStat;

// TODO: Allow minimizing the sheet (to make selection easier)
// TODO: memoize
function Compare({
  categoryItems,
  compareBaseStats,
  compareItems,
  session,
  organizerLink,
  isPhonePortrait,
  dispatch,
}: Props) {
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

  const hasSession = Boolean(session);
  const hasItems = compareItems.length > 0;
  const show = hasSession && hasItems;

  const firstCompareItem = compareItems.length > 0 ? compareItems[0] : undefined;
  const destinyVersion = show ? firstCompareItem?.destinyVersion : 2;
  useEffect(() => {
    if (show && destinyVersion !== undefined) {
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
      cancel();
    },
    [cancel]
  );

  // Reset if there ever are no items
  useEffect(() => {
    if (hasSession && !hasItems) {
      cancel();
    }
  }, [cancel, hasItems, hasSession]);

  // TODO: make a function that takes items and perk overrides and produces new items!

  // Memoize computing the list of stats
  const allStats = useMemo(
    () => getAllStats(compareItems, compareBaseStats, adjustedStats),
    [compareItems, compareBaseStats, adjustedStats]
  );

  const comparingArmor = firstCompareItem?.bucket.inArmor;
  const doCompareBaseStats = Boolean(compareBaseStats && comparingArmor);

  const updateQuery = useCallback(
    (newQuery: string) => {
      dispatch(updateCompareQuery(newQuery));
    },
    [dispatch]
  );

  const doUpdateSocketComparePlug = useCallback(
    ({ item, socket, plug }: { item: DimItem; socket: DimSocket; plug: DimPlug }) => {
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
    },
    [adjustedPlugs, adjustedStats]
  );

  const remove = useCallback(
    (item: DimItem) => {
      if (compareItems.length <= 1) {
        cancel();
      } else {
        dispatch(removeCompareItem(item));
      }
    },
    [cancel, compareItems.length, dispatch]
  );

  const changeSort = (newSortedHash?: string | number) => {
    // TODO: put sorting together?
    setSortedHash(newSortedHash);
    setSortBetterFirst(sortedHash === newSortedHash ? !sortBetterFirst : true);
  };

  const onChangeSetting = (checked: boolean, name: keyof Settings) => {
    dispatch(setSettingAction(name, checked));
  };

  const comparator = sortCompareItemsComparator(
    sortedHash,
    sortBetterFirst,
    doCompareBaseStats,
    allStats
  );
  const sortedComparisonItems = !sortedHash
    ? Array.from(compareItems).sort(reverseComparator(compareBy((i) => i.index)))
    : Array.from(compareItems).sort(comparator);

  const items = useMemo(
    () => (
      <div className={styles.items}>
        {sortedComparisonItems.map((item) => (
          <CompareItem
            item={item}
            key={item.id}
            stats={allStats}
            itemClick={locateItem}
            remove={remove}
            setHighlight={setHighlight}
            updateSocketComparePlug={doUpdateSocketComparePlug}
            adjustedItemPlugs={adjustedPlugs?.[item.id]}
            adjustedItemStats={adjustedStats?.[item.id]}
            compareBaseStats={doCompareBaseStats}
            isInitialItem={session?.initialItemId === item.id}
          />
        ))}
      </div>
    ),
    [
      adjustedPlugs,
      adjustedStats,
      allStats,
      doCompareBaseStats,
      doUpdateSocketComparePlug,
      remove,
      session?.initialItemId,
      sortedComparisonItems,
    ]
  );

  if (!show) {
    return null;
  }

  // If the session was started with a specific item, this is it
  const initialItem = session?.initialItemId
    ? categoryItems.find((i) => i.id === session.initialItemId)
    : undefined;
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || firstCompareItem;

  const header = (
    <div className={styles.options}>
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
      {organizerLink && (
        <Link className={styles.organizerLink} to={organizerLink}>
          <AppIcon icon={faList} />
          <span>{t('Organizer.OpenIn')}</span>
        </Link>
      )}
    </div>
  );

  return (
    <Sheet onClose={cancel} allowClickThrough={true} header={header}>
      <div className="loadout-drawer compare">
        <div className={styles.bucket} onMouseLeave={() => setHighlight(undefined)}>
          <div className={clsx('compare-item', styles.fixedLeft)}>
            <div className={styles.spacer} />
            {allStats.map((stat) => (
              <div
                key={stat.id}
                className={clsx(styles.statLabel, {
                  [styles.sorted]: stat.id === sortedHash,
                })}
                onMouseOver={() => setHighlight(stat.id)}
                onClick={() => changeSort(stat.id)}
              >
                {stat.displayProperties.hasIcon && (
                  <span title={stat.displayProperties.name}>
                    <BungieImage src={stat.displayProperties.icon} />
                  </span>
                )}
                {stat.id in statLabels ? t(statLabels[stat.id]) : stat.displayProperties.name}{' '}
                {stat.id === sortedHash && (
                  <AppIcon icon={sortBetterFirst ? faAngleRight : faAngleLeft} />
                )}
                {stat.id === highlight && <div className={styles.highlightBar} />}
              </div>
            ))}
            {isPhonePortrait && isiOSBrowser() && (
              <div className={styles.swipeAdvice}>{t('Compare.SwipeAdvice')}</div>
            )}
          </div>
          {items}
        </div>
      </div>
    </Sheet>
  );
}

function sortCompareItemsComparator(
  sortedHash: string | number | undefined,
  sortBetterFirst: boolean,
  compareBaseStats: boolean,
  allStats: StatInfo[]
) {
  const sortStat = allStats.find((s) => s.id === sortedHash);

  if (!sortStat) {
    return (_a: DimItem, _b: DimItem) => 0;
  }

  const shouldReverse = sortStat.lowerBetter ? sortBetterFirst : !sortBetterFirst;

  return reverseComparator(
    chainComparator<DimItem>(
      compareBy((item) => {
        const stat = sortStat.getStat(item);
        if (!stat) {
          return -1;
        }
        const statValue = compareBaseStats ? stat.base ?? stat.value : stat.value;
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
  const pluggedPlug = item.sockets
    ? getSocketByIndex(item.sockets, socketIndex)?.plugged
    : undefined;

  /**
   * Exit early if this plug / socket isn't a clickable target
   * TODO: check the socket index detail
   * */
  if (
    item.destinyVersion === 1 ||
    !item.sockets ||
    !item.stats ||
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

  return produce(adjustedStats ?? {}, (draft) => {
    for (const statHash in plugStats) {
      const itemStatIndex = itemStats.findIndex((stat) => stat.statHash === parseInt(statHash));
      const calcStat: number = draft?.[statHash] ?? itemStats[itemStatIndex]?.value;

      if (calcStat) {
        draft[statHash] =
          mode === 'add' ? calcStat + plugStats[statHash] : calcStat - plugStats[statHash];
      }
    }
  });
}

function getAllStats(
  comparisonItems: DimItem[],
  compareBaseStats: boolean,
  adjustedStats?: DimAdjustedStats
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
              const itemStat = item.stats
                ? item.stats.find((s) => s.statHash === stat.statHash)
                : undefined;
              if (itemStat) {
                const adjustedStatValue = adjustedStats?.[item.id]?.[itemStat.statHash];
                if (adjustedStatValue) {
                  return {
                    ...itemStat,
                    value: adjustedStatValue,
                  };
                }
              }
              return itemStat;
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

function isDimStat(stat: DimStat | unknown): stat is DimStat {
  return Object.prototype.hasOwnProperty.call(stat as DimStat, 'smallerIsBetter');
}

function makeFakeStat(
  id: string | number,
  displayProperties: DestinyDisplayPropertiesDefinition | string,
  getStat: StatGetter,
  lowerBetter = false
): StatInfo {
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
