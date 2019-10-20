import React, { forwardRef } from 'react';
import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import { percent } from 'app/shell/filters';
import BungieImage from 'app/dim-ui/BungieImage';
import styles from './PursuitItem.m.scss';
import pursuitComplete from 'images/pursuitComplete.svg';
import pursuitExpired from 'images/pursuitExpired.svg';
import trackedIcon from 'images/trackedIcon.svg';
import { showPursuitAsExpired } from './Pursuit';
import { count } from 'app/utils/util';

function PursuitItem(
  { item, isNew }: { item: DimItem; isNew: boolean },
  ref: React.Ref<HTMLDivElement>
) {
  const isCapped = item.amount === item.maxStackSize && item.uniqueStack;
  const expired = showPursuitAsExpired(item);
  const showProgressBar =
    item.objectives &&
    item.objectives.length > 0 &&
    !item.complete &&
    !expired &&
    // Either there's a counter progress bar, or multiple checkboxes
    (item.objectives.some((o) => o.displayStyle !== 'integer' && !o.boolean) ||
      count(item.objectives, (o) => o.boolean) > 1);
  const itemImageStyles = {
    [styles.tracked]: item.tracked
  };
  return (
    <div id={item.index} className={clsx(styles.pursuit, itemImageStyles)} ref={ref}>
      {showProgressBar && (
        <div className={styles.progress}>
          <div className={styles.progressAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <BungieImage src={item.icon} className={styles.image} />
      {item.maxStackSize > 1 && item.amount > 1 && (
        <div
          className={clsx(styles.amount, {
            [styles.fullstack]: item.maxStackSize > 1 && item.amount === item.maxStackSize
          })}
        >
          {isCapped && item.amount.toString()}
        </div>
      )}
      {isNew && <div className={styles.newItem} />}
      {expired && <img className={styles.expired} src={pursuitExpired} />}
      {item.tracked && <img className={styles.trackedIcon} src={trackedIcon} />}
      {item.complete && <img className={styles.complete} src={pursuitComplete} />}
    </div>
  );
}

export default forwardRef(PursuitItem);
