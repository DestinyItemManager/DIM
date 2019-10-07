import React from 'react';
import { StatInfo } from './Compare';
import { DimItem, D1Stat, DimStat } from '../inventory/item-types';
import { getColor } from '../shell/filters';
import { AppIcon, starIcon } from '../shell/icons';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import RecoilStat from 'app/item-popup/RecoilStat';

export default function CompareStat({
  stat,
  item,
  highlight,
  setHighlight
}: {
  stat: StatInfo;
  item: DimItem;
  highlight: number | string | undefined;
  setHighlight(value?: string | number): void;
}) {
  const itemStat = stat.getStat(item);

  return (
    <div
      className={clsx({ highlight: stat.id === highlight })}
      onMouseOver={() => setHighlight(stat.id)}
      style={getColor(statRange(itemStat, stat), 'color')}
    >
      <span>
        {stat.id === 'Rating' && <AppIcon icon={starIcon} />}
        {itemStat && itemStat.value !== undefined ? (
          itemStat.statHash === 2715839340 ? (
            <span className="stat-recoil">
              <span>{itemStat.value}</span>
              <RecoilStat stat={(itemStat as any) as DimStat} />
            </span>
          ) : (
            itemStat.value
          )
        ) : (
          t('Stats.NotApplicable')
        )}
        {Boolean(itemStat && itemStat.value) &&
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
  stat: { value?: number; statHash: number; qualityPercentage?: { min: number } } | undefined,
  statInfo: StatInfo
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
    return (100 * (statInfo.max - (stat.value || statInfo.max))) / (statInfo.max - statInfo.min);
  }
  return (100 * ((stat.value || 0) - statInfo.min)) / (statInfo.max - statInfo.min);
}
