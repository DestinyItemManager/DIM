import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import {
  applySocketOverrides,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { recoilValue } from 'app/item-popup/RecoilStat';
import { useD2Definitions } from 'app/manifest/selectors';
import { statLabels } from 'app/organizer/Columns';
import Checkbox from 'app/settings/Checkbox';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faAngleLeft, faAngleRight, faList } from 'app/shell/icons';
import { acquisitionRecencyComparator } from 'app/shell/item-comparators';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { isEventFromFirefoxScrollbar } from 'app/utils/browsers';
import { emptyArray } from 'app/utils/empty';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimSocket } from '../inventory/item-types';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import styles from './Compare.m.scss';
import './compare.scss';
import CompareItem from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import {
  compareItemsSelector,
  compareOrganizerLinkSelector,
  compareSessionSelector,
} from './selectors';

export interface StatInfo {
  id: number | 'EnergyCapacity';
  displayProperties: DestinyDisplayPropertiesDefinition;
  min: number;
  max: number;
  statMaximumValue: number;
  bar: boolean;
  enabled: boolean;
  lowerBetter: boolean;
  getStat: StatGetter;
}

/** a DimStat with, at minimum, a statHash */
export interface MinimalStat {
  statHash: number;
  value: number;
  base?: number;
}
type StatGetter = (item: DimItem) => undefined | MinimalStat;

const isTouch = 'ontouchstart' in window;

// TODO: replace rows with Column from organizer
// TODO: CSS grid-with-sticky layout
// TODO: dropdowns for query buttons
// TODO: freeform query
// TODO: Allow minimizing the sheet (to make selection easier)
// TODO: memoize
export default function Compare() {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const [compareBaseStats, setCompareBaseStats] = useSetting('compareBaseStats');
  const session = useSelector(compareSessionSelector);
  const rawCompareItems = useSelector(compareItemsSelector(session?.vendorCharacterId));
  const organizerLink = useSelector(compareOrganizerLinkSelector);

  /** The stat row to highlight */
  const [highlight, setHighlight] = useState<string | number>();
  /** The stat row to sort by */
  const [sortedHash, setSortedHash] = useState<string | number>();
  const [sortBetterFirst, setSortBetterFirst] = useState<boolean>(true);
  const [socketOverrides, onPlugClicked, resetSocketOverrides] = useSocketOverridesForItems();

  // Produce new items which have had their sockets changed
  const compareItems = useMemo(
    () =>
      defs
        ? rawCompareItems.map((i) => applySocketOverrides(defs, i, socketOverrides[i.id]))
        : rawCompareItems,
    [defs, rawCompareItems, socketOverrides]
  );

  const cancel = useCallback(() => {
    // TODO: this is why we need a container, right? So we don't have to reset state
    setHighlight(undefined);
    setSortedHash(undefined);
    resetSocketOverrides();
    dispatch(endCompareSession());
  }, [dispatch, resetSocketOverrides]);

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
    () => getAllStats(compareItems, compareBaseStats),
    [compareItems, compareBaseStats]
  );

  const comparingArmor = firstCompareItem?.bucket.inArmor;
  const doCompareBaseStats = Boolean(compareBaseStats && comparingArmor);

  const updateQuery = useCallback(
    (newQuery: string) => {
      dispatch(updateCompareQuery(newQuery));
    },
    [dispatch]
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

  // If the session was started with a specific item, this is it
  const initialItem = session?.initialItemId
    ? compareItems.find((i) => i.id === session.initialItemId)
    : undefined;
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || firstCompareItem;

  const comparator = sortCompareItemsComparator(
    sortedHash,
    sortBetterFirst,
    doCompareBaseStats,
    allStats,
    initialItem
  );
  const sortedComparisonItems = Array.from(compareItems).sort(comparator);

  const items = useMemo(
    () => (
      <CompareItems
        items={sortedComparisonItems}
        allStats={allStats}
        remove={remove}
        setHighlight={isTouch ? undefined : setHighlight}
        onPlugClicked={onPlugClicked}
        doCompareBaseStats={doCompareBaseStats}
        initialItemId={session?.initialItemId}
      />
    ),
    [
      allStats,
      doCompareBaseStats,
      onPlugClicked,
      remove,
      session?.initialItemId,
      sortedComparisonItems,
    ]
  );

  if (!show) {
    return null;
  }

  const header = (
    <div className={styles.options}>
      {comparingArmor && (
        <Checkbox
          label={t('Compare.CompareBaseStats')}
          name="compareBaseStats"
          value={compareBaseStats}
          onChange={setCompareBaseStats}
        />
      )}
      {exampleItem && <CompareSuggestions exampleItem={exampleItem} onQueryChanged={updateQuery} />}
      {organizerLink && (
        <Link className={styles.organizerLink} to={organizerLink}>
          <AppIcon icon={faList} />
          <span>{t('Organizer.OpenIn')}</span>
        </Link>
      )}
    </div>
  );

  return (
    <Sheet onClose={cancel} header={header} allowClickThrough>
      <div className="loadout-drawer compare">
        <div
          className={styles.bucket}
          onMouseLeave={isTouch ? undefined : () => setHighlight(undefined)}
        >
          <div className={clsx('compare-item', styles.fixedLeft)}>
            <div className={styles.spacer} />
            {allStats.map((stat) => (
              <div
                key={stat.id}
                className={clsx(styles.statLabel, {
                  [styles.sorted]: stat.id === sortedHash,
                })}
                onMouseOver={isTouch ? undefined : () => setHighlight(stat.id)}
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
          </div>
          {items}
        </div>
      </div>
    </Sheet>
  );
}

function CompareItems({
  items,
  doCompareBaseStats,
  allStats,
  remove,
  setHighlight,
  onPlugClicked,
  initialItemId,
}: {
  initialItemId: string | undefined;
  doCompareBaseStats: boolean;
  items: DimItem[];
  allStats: StatInfo[];
  remove: (item: DimItem) => void;
  setHighlight?: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  // This uses pointer events to directly set the scroll position based on
  // dragging the items. This works around an iOS bug around nested draggables,
  // but also is kinda nice on desktop. I wasn't able to get it to do an
  // inertial animation after releasing.

  const ref = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ scrollPosition: number; pointerDownPosition: number }>();
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isEventFromFirefoxScrollbar(e)) {
      return;
    }

    dragStateRef.current = {
      pointerDownPosition: e.clientX,
      scrollPosition: ref.current!.scrollLeft,
    };
    ref.current!.setPointerCapture(e.pointerId);
  }, []);
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragStateRef.current = undefined;
    ref.current!.releasePointerCapture(e.pointerId);
  }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStateRef.current !== undefined) {
      const { scrollPosition, pointerDownPosition } = dragStateRef.current;
      ref.current!.scrollLeft = scrollPosition - (e.clientX - pointerDownPosition);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={styles.items}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {items.map((item) => (
        <CompareItem
          item={item}
          key={item.id}
          stats={allStats}
          itemClick={locateItem}
          remove={remove}
          setHighlight={setHighlight}
          onPlugClicked={onPlugClicked}
          compareBaseStats={doCompareBaseStats}
          isInitialItem={initialItemId === item.id}
        />
      ))}
    </div>
  );
}

function sortCompareItemsComparator(
  sortedHash: string | number | undefined,
  sortBetterFirst: boolean,
  compareBaseStats: boolean,
  allStats: StatInfo[],
  initialItem?: DimItem
) {
  if (!sortedHash) {
    return chainComparator(
      compareBy((item) => item !== initialItem),
      acquisitionRecencyComparator
    );
  }

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
        if (stat.statHash === StatHashes.RecoilDirection) {
          return recoilValue(stat.value);
        }
        return shouldReverse ? -statValue : statValue;
      }),
      compareBy((i) => i.index),
      compareBy((i) => i.name)
    )
  );
}

function getAllStats(comparisonItems: DimItem[], compareBaseStats: boolean): StatInfo[] {
  if (!comparisonItems.length) {
    return emptyArray<StatInfo>();
  }

  const firstComparison = comparisonItems[0];
  compareBaseStats = Boolean(compareBaseStats && firstComparison.bucket.inArmor);
  const stats: StatInfo[] = [];

  if (firstComparison.primaryStat) {
    stats.push(
      makeFakeStat(
        firstComparison.primaryStat.statHash,
        firstComparison.primaryStat.stat.displayProperties,
        (item: DimItem) => item.primaryStat || undefined
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
          undefined,
        10,
        false
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
            lowerBetter: stat.smallerIsBetter,
            statMaximumValue: stat.maximumValue,
            bar: stat.bar,
            getStat(item: DimItem) {
              const itemStat = item.stats
                ? item.stats.find((s) => s.statHash === stat.statHash)
                : undefined;
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
      if (itemStat) {
        stat.min = Math.min(
          stat.min,
          (compareBaseStats ? itemStat.base ?? itemStat.value : itemStat.value) || 0
        );
        stat.max = Math.max(
          stat.max,
          (compareBaseStats ? itemStat.base ?? itemStat.value : itemStat.value) || 0
        );
        stat.enabled = stat.min !== stat.max;
      }
    }
  }

  return stats;
}

function makeFakeStat(
  id: StatInfo['id'],
  displayProperties: DestinyDisplayPropertiesDefinition | string,
  getStat: StatGetter,
  statMaximumValue = 0,
  bar = false,
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
    statMaximumValue,
    getStat,
    bar,
  };
}
