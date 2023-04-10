import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import clsx from 'clsx';
import React from 'react';
import styles from './ItemPowerSet.m.scss';
import { DimItem } from './item-types';

export function ItemPowerSet({ items, powerFloor }: { items: DimItem[]; powerFloor: number }) {
  let lastSort: string | undefined;
  return (
    <div className={styles.itemPowerSet}>
      {items.map((i, j) => {
        const sortChanged = Boolean(j) && lastSort !== i.bucket.sort;
        lastSort = i.bucket.sort;
        const powerDiff = (powerFloor - i.power) * -1;
        const diffSymbol = powerDiff > 0 ? '+' : '';
        return (
          <React.Fragment key={i.id}>
            {sortChanged && (
              <span className={styles.spanGrid}>
                <hr />
              </span>
            )}
            <span className={styles.bucketName}>{i.bucket.name}</span>
            <BucketIcon bucketHash={i.bucket.hash} />
            <span>{i.power}</span>
            <span
              className={clsx(styles.powerDiff, {
                [styles.positive]: powerDiff > 0,
                [styles.negative]: powerDiff < 0,
              })}
            >
              {powerDiff ? `${diffSymbol}${powerDiff}` : ''}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
