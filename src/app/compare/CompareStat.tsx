import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { StatHashes } from 'data/d2/generated-enums';
import React from 'react';
import { D1Stat, DimItem } from '../inventory/item-types';
import { getColor } from '../shell/filters';
import { MinimalStat, StatInfo } from './Compare';
import styles from './CompareStat.m.scss';
import { DimAdjustedItemStat } from './types';

export default function CompareStat({
  stat,
  compareBaseStats,
  item,
  setHighlight,
  adjustedItemStats,
}: {
  stat: StatInfo;
  compareBaseStats?: boolean;
  item: DimItem;
  setHighlight?(value?: string | number): void;
  adjustedItemStats?: DimAdjustedItemStat;
}) {
  const itemStat = stat.getStat(item);
  const adjustedStatValue = itemStat ? adjustedItemStats?.[itemStat.statHash] : undefined;

  const color = getColor(statRange(itemStat, stat, compareBaseStats, adjustedStatValue), 'color');

  const statValue = itemStat
    ? (compareBaseStats ? itemStat.base : adjustedStatValue) ?? itemStat.value
    : 0;

  return (
    <div onMouseOver={() => setHighlight?.(stat.id)} className={styles.stat} style={color}>
      <span>
        {stat.id === 'EnergyCapacity' && itemStat && item.energy && (
          <ElementIcon element={item.element} />
        )}
        {itemStat?.value !== undefined ? (
          itemStat.statHash === StatHashes.RecoilDirection ? (
            <span className={styles.recoil}>
              <span>{statValue}</span>
              <RecoilStat value={statValue} />
            </span>
          ) : (
            statValue
          )
        ) : (
          t('Stats.NotApplicable')
        )}
        {Boolean(itemStat?.value) &&
          (itemStat as D1Stat).qualityPercentage &&
          Boolean((itemStat as D1Stat).qualityPercentage!.range) && (
            <span className={styles.range}>({(itemStat as D1Stat).qualityPercentage!.range})</span>
          )}
      </span>
    </div>
  );
}

// Turns a stat and a list of ranges into a 0-100 scale
function statRange(
  stat: (MinimalStat & { qualityPercentage?: { min: number } }) | undefined,
  statInfo: StatInfo,
  compareBaseStats = false,
  adjustedStatValue: number | undefined
) {
  if (!stat) {
    return -1;
  }
  if (stat.qualityPercentage) {
    return stat.qualityPercentage.min;
  }

  if (!statInfo || !statInfo.enabled) {
    return -1;
  }

  const statValue = (compareBaseStats ? stat.base : adjustedStatValue ?? stat.value) ?? 0;

  if (statInfo.id === StatHashes.RecoilDirection) {
    return recoilValue(statValue);
  }

  if (statInfo.lowerBetter) {
    return (100 * (statInfo.max - statValue)) / (statInfo.max - statInfo.min);
  }

  return (100 * (statValue - statInfo.min)) / (statInfo.max - statInfo.min);
}
