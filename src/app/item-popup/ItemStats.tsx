import { isD1Item } from 'app/utils/item-utils';
import clsx from 'clsx';
import React from 'react';
import { DimItem, DimStat } from '../inventory-stores/item-types';
import ItemStat, { D1QualitySummaryStat, isD1Stat } from './ItemStat';
import styles from './ItemStats.m.scss';

export default function ItemStats({
  stats,
  item,
  className,
}: {
  stats?: DimStat[] | null;
  item?: DimItem;
  className?: string;
}) {
  stats ||= item?.stats;

  if (!stats || !stats.length) {
    return null;
  }

  const hasIcons = stats.some(
    (s) => s.displayProperties.hasIcon || (item && isD1Stat(item, s) && s.qualityPercentage?.min)
  );

  return (
    <div className={clsx(className, styles.stats, { [styles.hasIcons]: hasIcons })}>
      {stats.map((stat) => (
        <ItemStat key={stat.statHash} stat={stat} item={item} />
      ))}

      {item && isD1Item(item) && item.quality?.min && <D1QualitySummaryStat item={item} />}
    </div>
  );
}
