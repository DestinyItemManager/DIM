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
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import { isBooleanObjective } from 'app/inventory/store/objectives';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

function PursuitItem(
  { item, isNew, defs }: { item: DimItem; isNew: boolean; defs: D2ManifestDefinitions },
  ref: React.Ref<HTMLDivElement>
) {
  const expired = showPursuitAsExpired(item);

  // Either there's a counter progress bar, or multiple checkboxes
  const showProgressBoolean = (objectives: DestinyObjectiveProgress[]) => {
    const numBooleans = count(objectives, (o) =>
      isBooleanObjective(defs.Objective.get(o.objectiveHash), o.completionValue)
    );
    return numBooleans > 1 || objectives.length !== numBooleans;
  };

  const showProgressBar =
    item.objectives &&
    item.objectives.length > 0 &&
    !item.complete &&
    !expired &&
    showProgressBoolean(item.objectives);
  const itemImageStyles = {
    [styles.tracked]: item.tracked
  };
  return (
    <div
      id={item.index}
      className={clsx(styles.pursuit, itemImageStyles)}
      ref={ref}
      title={item.name}
    >
      {showProgressBar && (
        <div className={styles.progress}>
          <div className={styles.progressAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <BungieImage src={item.icon} className={styles.image} alt="" />
      {item.maxStackSize > 1 && item.amount > 1 && (
        <div
          className={clsx(styles.amount, {
            [styles.fullstack]: item.maxStackSize > 1 && item.amount === item.maxStackSize
          })}
        >
          {item.amount.toString()}
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
