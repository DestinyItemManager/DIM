import React from 'react';
import { StatInfo } from './Compare';
import { DimItem, D1Stat } from '../inventory/item-types';
import { getColor } from '../shell/filters';
import { AppIcon, starIcon } from '../shell/icons';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import RecoilStat from 'app/item-popup/RecoilStat';
import ElementIcon from 'app/inventory/ElementIcon';
import { StatHashes } from 'data/d2/generated-enums';

export default function CompareStat({
  stat,
  item,
  highlight,
  setHighlight,
  adjustedItemStats,
}: {
  stat: StatInfo;
  item: DimItem;
  highlight?: number | string | undefined;
  setHighlight?(value?: string | number): void;
  adjustedItemStats?: { [statHash: number]: number } | undefined;
}) {
  const itemStat = stat.getStat(item);
  const adjustedStatValue = itemStat ? adjustedItemStats?.[itemStat.statHash] : undefined;

  return (
    <div
      className={clsx({ highlight: stat.id === highlight })}
      onMouseOver={() => setHighlight?.(stat.id)}
      style={getColor(statRange(itemStat, stat, adjustedStatValue), 'color')}
    >
      <span>
        {stat.id === 'Rating' && <AppIcon icon={starIcon} />}
        {item.isDestiny2() && stat.id === 'EnergyCapacity' && itemStat && item.energy && (
          <ElementIcon element={item.element} />
        )}
        {itemStat?.value !== undefined ? (
          itemStat.statHash === StatHashes.RecoilDirection ? (
            <span className="stat-recoil">
              <span>{adjustedItemStats?.[itemStat.statHash] ?? itemStat.value}</span>
              <RecoilStat value={adjustedItemStats?.[itemStat.statHash] ?? itemStat.value} />
            </span>
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
  stat: { value?: number; statHash: number; qualityPercentage?: { min: number } } | undefined,
  statInfo: StatInfo,
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
        (100 * (statInfo.max - (adjustedStatValue || statInfo.max))) / (statInfo.max - statInfo.min)
      );
    }
    return (100 * (statInfo.max - (stat.value || statInfo.max))) / (statInfo.max - statInfo.min);
  }
  if (adjustedStatValue) {
    return (100 * ((adjustedStatValue || 0) - statInfo.min)) / (statInfo.max - statInfo.min);
  }
  return (100 * ((stat.value || 0) - statInfo.min)) / (statInfo.max - statInfo.min);
}
