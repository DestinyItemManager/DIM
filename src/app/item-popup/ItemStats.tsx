import React from 'react';
import { DimItem } from '../inventory/item-types';
import _ from 'lodash';
import ItemStat, { isD1Stat, D1QualitySummaryStat } from './ItemStat';
import clsx from 'clsx';
import styles from './ItemStats.m.scss';

export default function ItemStats({ item }: { item: DimItem }) {
  if (!item.stats || !item.stats.length) {
    return null;
  }

  const hasIcons = item.stats.some(
    (s) =>
      s.displayProperties.hasIcon ||
      (isD1Stat(item, s) && s.qualityPercentage && s.qualityPercentage.min > 0)
  );

  return (
    <div className={clsx(styles.stats, { [styles.hasIcons]: hasIcons })}>
      {item.stats.map((stat) => (
        <ItemStat key={stat.statHash} stat={stat} item={item} />
      ))}

      {item.isDestiny1() && item.quality && item.quality.min && (
        <D1QualitySummaryStat item={item} />
      )}
    </div>
  );
}
