import ElementIcon from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import RecoilStat from 'app/item-popup/RecoilStat';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import React from 'react';
import { D1Stat, DimItem } from '../inventory/item-types';
import { getColor } from '../shell/filters';
import { AppIcon, starIcon } from '../shell/icons';
import { MinimalStat, StatInfo } from './Compare';
import { DimAdjustedItemStat } from './types';

export default function CompareStat({
  stat,
  compareBaseStats,
  item,
  highlight,
  setHighlight,
  adjustedItemStats,
}: {
  stat: StatInfo;
  compareBaseStats?: boolean;
  item: DimItem;
  highlight?: number | string | undefined;
  setHighlight?(value?: string | number): void;
  adjustedItemStats?: DimAdjustedItemStat;
}) {
  const itemStat = stat.getStat(item);
  const adjustedStatValue = itemStat ? adjustedItemStats?.[itemStat.statHash] : undefined;

  return (
    <div
      className={clsx({ highlight: stat.id === highlight })}
      onMouseOver={() => setHighlight?.(stat.id)}
      style={getColor(statRange(itemStat, stat, compareBaseStats, adjustedStatValue), 'color')}
    >
      <span>
        {stat.id === 'Rating' && <AppIcon icon={starIcon} />}
        {stat.id === 'EnergyCapacity' && itemStat && item.energy && (
          <ElementIcon element={item.element} />
        )}
        {itemStat?.value !== undefined ? (
          itemStat.statHash === StatHashes.RecoilDirection ? (
            <span className="stat-recoil">
              <span>{adjustedItemStats?.[itemStat.statHash] ?? itemStat.value}</span>
              <RecoilStat value={adjustedItemStats?.[itemStat.statHash] ?? itemStat.value} />
            </span>
          ) : compareBaseStats ? (
            itemStat.base ?? itemStat.value
          ) : (
            adjustedItemStats?.[itemStat.statHash] ?? itemStat.value
          )
        ) : (
          t('Stats.NotApplicable')
        )}
        {Boolean(itemStat?.value) &&
          (itemStat as D1Stat).qualityPercentage &&
          Boolean((itemStat as D1Stat).qualityPercentage!.range) && (
            <span className="range">({(itemStat as D1Stat).qualityPercentage!.range})</span>
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

  if (statInfo.lowerBetter) {
    if (adjustedStatValue) {
      return (
        (100 *
          (statInfo.max -
            (compareBaseStats
              ? stat.base ?? adjustedStatValue
              : adjustedStatValue || statInfo.max))) /
        (statInfo.max - statInfo.min)
      );
    }

    return (
      (100 *
        (statInfo.max -
          ((compareBaseStats ? stat.base ?? stat.value : stat.value) || statInfo.max))) /
      (statInfo.max - statInfo.min)
    );
  }

  if (adjustedStatValue) {
    return (
      (100 *
        ((compareBaseStats ? stat.base ?? adjustedStatValue : adjustedStatValue || 0) -
          statInfo.min)) /
      (statInfo.max - statInfo.min)
    );
  }

  return (
    (100 * (((compareBaseStats ? stat.base ?? stat.value : stat.value) || 0) - statInfo.min)) /
    (statInfo.max - statInfo.min)
  );
}
