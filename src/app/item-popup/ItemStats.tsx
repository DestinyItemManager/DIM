import React from 'react';
import { DimItem, DimStat } from '../inventory/item-types';
import _ from 'lodash';
import ItemStat, { D1QualitySummaryStat, isD1Stat } from './ItemStat';
import clsx from 'clsx';
import styles from './ItemStats.m.scss';

export default function ItemStats({
  stats,
  item,
  className,
}: {
  stats?: DimStat[];
  item?: DimItem;
  className?: string;
}) {
  stats = stats || item?.stats || undefined;

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

      {item?.isDestiny1() && item.quality?.min && <D1QualitySummaryStat item={item} />}
    </div>
  );
}
