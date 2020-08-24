import React from 'react';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { DimItem } from './item-types';
import styles from './ItemPowerSet.m.scss';

export function ItemPowerSet(items: DimItem[], powerFloor: number) {
  let lastSort: string | undefined;
  return (
    <div className={styles.itemPowerSet}>
      {items.map((i, j) => {
        const sortChanged = Boolean(j) && lastSort !== i.bucket.sort;
        lastSort = i.bucket.sort;
        const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
        const diffSymbol = powerDiff > 0 ? '+' : '';
        return (
          <React.Fragment key={i.id}>
            {sortChanged && (
              <span className={styles.spanGrid}>
                <hr />
              </span>
            )}
            <span className={styles.bucketName}>{i.bucket.name}</span>
            <BucketIcon className={styles.invert} item={i} />
            <span>{i.primStat?.value}</span>
            <span className={styles.powerDiff}>{powerDiff ? `${diffSymbol}${powerDiff}` : ''}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// the plaintext version
// maxLightSet
//   .map((i) => {
//     const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
//     const diffSymbol = powerDiff > 0 ? '+' : '';
//     return `${i.primStat?.value} -- ${i.bucket.name} (${diffSymbol}${powerDiff})`;
//   })
//   .join('\n');
