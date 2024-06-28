import BungieImage from 'app/dim-ui/BungieImage';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import { DimItem } from 'app/inventory/item-types';
import {
  isBooleanObjective,
  isFlawlessPassage,
  isTrialsPassage,
} from 'app/inventory/store/objectives';
import { useD2Definitions } from 'app/manifest/selectors';
import { percent } from 'app/shell/formatters';
import { count } from 'app/utils/collections';
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import dimTrackedIcon from 'images/dimTrackedIcon.svg';
import pursuitComplete from 'images/pursuitComplete.svg';
import pursuitExpired from 'images/pursuitExpired.svg';
import trackedIcon from 'images/trackedIcon.svg';
import React, { forwardRef } from 'react';
import { showPursuitAsExpired } from './Pursuit';
import styles from './PursuitItem.m.scss';

function PursuitItem(
  { item, isNew }: { item: DimItem; isNew: boolean },
  ref: React.Ref<HTMLDivElement>,
) {
  const defs = useD2Definitions()!;
  const expired = showPursuitAsExpired(item);

  // Either there's a counter progress bar, or multiple checkboxes
  const showProgressBoolean = (objectives: DestinyObjectiveProgress[]) => {
    const numBooleans = count(objectives, (o) =>
      isBooleanObjective(defs.Objective.get(o.objectiveHash), o.progress, o.completionValue),
    );
    return numBooleans > 1 || objectives.length !== numBooleans;
  };

  const isFlawedTrialsPassage = isTrialsPassage(item.hash) && !isFlawlessPassage(item.objectives);

  const showProgressBar =
    item.objectives &&
    item.objectives.length > 0 &&
    !item.complete &&
    !expired &&
    showProgressBoolean(item.objectives);

  const trackedInGame = item.tracked && (!item.pursuit?.recordHash || item.pursuit.trackedInGame);
  const trackedInDim = Boolean(
    item.tracked && item.pursuit?.recordHash && !item.pursuit.trackedInGame,
  );

  const itemImageStyles = {
    [styles.tracked]: trackedInGame,
    [styles.tracked]: trackedInDim,
    [styles.flawedPassage]: isFlawedTrialsPassage,
  };
  return (
    <div
      id={item.index}
      className={clsx(styles.pursuit, itemImageStyles)}
      ref={ref}
      title={item.name}
    >
      {showProgressBar && <ProgressBar percentComplete={item.percentComplete} />}
      <BungieImage src={item.icon} className={styles.image} alt="" />
      {item.maxStackSize > 1 && item.amount > 1 && (
        <StackAmount
          amount={item.amount}
          full={item.maxStackSize > 1 && item.amount === item.maxStackSize}
        />
      )}
      {isNew && <NewItemIndicator />}
      {expired && <img className={styles.expired} src={pursuitExpired} />}
      {trackedInGame && <img className={styles.trackedIcon} src={trackedIcon} />}
      {trackedInDim && <img className={styles.trackedIcon} src={dimTrackedIcon} />}
      {item.complete && <img className={styles.complete} src={pursuitComplete} />}
    </div>
  );
}

export default forwardRef(PursuitItem);

export function ProgressBar({
  percentComplete,
  className,
}: {
  percentComplete: number;
  className?: string;
}) {
  return (
    <div className={clsx(styles.progress, className)}>
      <div className={styles.progressAmount} style={{ width: percent(percentComplete) }} />
    </div>
  );
}

export function StackAmount({ amount, full }: { amount: number; full?: boolean }) {
  return (
    <div
      className={clsx(styles.amount, {
        [styles.fullstack]: full,
      })}
    >
      {amount.toLocaleString()}
    </div>
  );
}
