import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getColor, percent } from 'app/shell/formatters';
import { StatHashes } from 'data/d2/generated-enums';
import React from 'react';
import { D1Stat, DimItem } from '../inventory/item-types';
import { MinimalStat, StatInfo } from './Compare';
import styles from './CompareStat.m.scss';

export default function CompareStat({
  stat,
  compareBaseStats,
  item,
  setHighlight,
}: {
  stat: StatInfo;
  compareBaseStats?: boolean;
  item: DimItem;
  setHighlight?(value?: string | number): void;
}) {
  const itemStat = stat.getStat(item);

  const color = getColor(statRange(itemStat, stat, compareBaseStats), 'color');

  const statValue = itemStat
    ? (compareBaseStats ? itemStat.base : itemStat.value) ?? itemStat.value
    : 0;

  return (
    <div onMouseOver={() => setHighlight?.(stat.id)} className={styles.stat} style={color}>
      {statValue && stat.bar && item.bucket.sort === 'Armor' && (
        <span className={styles.bar}>
          <span style={{ width: percent(statValue / stat.statMaximumValue) }} />
        </span>
      )}
      <span className={styles.value}>
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
            <AnimatedNumber value={statValue} />
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
  compareBaseStats = false
) {
  if (!stat) {
    return -1;
  }
  if (stat.qualityPercentage) {
    return stat.qualityPercentage.min;
  }

  if (!statInfo.enabled) {
    return -1;
  }

  const statValue = (compareBaseStats ? stat.base : stat.value) ?? stat.value;

  if (statInfo.id === StatHashes.RecoilDirection) {
    return recoilValue(statValue);
  }

  if (statInfo.lowerBetter) {
    return (100 * (statInfo.max - statValue)) / (statInfo.max - statInfo.min);
  }

  return (100 * (statValue - statInfo.min)) / (statInfo.max - statInfo.min);
}
