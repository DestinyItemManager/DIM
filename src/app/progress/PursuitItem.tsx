import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import classNames from 'classnames';
import { percent } from 'app/shell/filters';
import { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import styles from './PursuitItem.m.scss';
import pursuitComplete from 'images/pursuitComplete.svg';
import pursuitExpired from 'images/pursuitExpired.svg';
import trackedIcon from 'images/trackedIcon.svg';
import { showPursuitAsExpired } from './Pursuit';

export default function PursuitItem({ item }: { item: DimItem }) {
  const isNew = false;
  const searchHidden = false;
  const isCapped = item.amount === item.maxStackSize && item.uniqueStack;
  const expired = showPursuitAsExpired(item);
  const itemImageStyles = {
    'search-hidden': searchHidden,
    [styles.tracked]: item.tracked
  };
  return (
    <div id={item.index} className={classNames(styles.pursuit, itemImageStyles)}>
      {item.objectives && item.objectives.length > 0 && !item.complete && !expired && (
        <div className={styles.progress}>
          <div className={styles.progressAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <div style={bungieBackgroundStyle(item.icon)} className={styles.image} />
      {item.maxStackSize > 1 && item.amount > 1 && (
        <div
          className={classNames(styles.amount, {
            [styles.fullstack]: item.maxStackSize > 1 && item.amount === item.maxStackSize
          })}
        >
          {isCapped ? t('Badge.Max') : item.amount.toString()}
        </div>
      )}
      {isNew && <div className={styles.newItem} />}
      {expired && <img className={styles.expired} src={pursuitExpired} />}
      {item.tracked && <img className={styles.trackedIcon} src={trackedIcon} />}
      {item.complete && <img className={styles.complete} src={pursuitComplete} />}
    </div>
  );
}
