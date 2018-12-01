import * as React from 'react';
import { StatInfo } from './Compare';
import { DimItem, D1Stat } from '../inventory/item-types';
import { getColor } from '../shell/dimAngularFilters.filter';
import { AppIcon, starIcon } from '../shell/icons';
import classNames from 'classnames';
import { t } from 'i18next';

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
      className={classNames({ highlight: stat.id === highlight })}
      onMouseOver={() => setHighlight(stat.id)}
      style={getColor(statRange(itemStat, stat), 'color')}
    >
      <span>
        {stat.id === 'Rating' && <AppIcon icon={starIcon} />}
        {itemStat && itemStat.value !== undefined ? itemStat.value : t('Stats.NotApplicable')}
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

  return (100 * ((stat.value || 0) - statInfo.min)) / (statInfo.max - statInfo.min);
}
