import { D1ObjectiveDefinition, D1ObjectiveProgress } from 'app/destiny1/d1-manifest-types';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import {
  getValueStyle,
  isBooleanObjective,
  isFlawlessObjective,
  isRoundsWonObjective,
} from 'app/inventory/store/objectives';
import { useDefinitions } from 'app/manifest/selectors';
import { percent, percentWithSingleDecimal } from 'app/shell/formatters';
import { timerDurationFromMs } from 'app/utils/time';
import {
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import * as styles from './Objective.m.scss';

/**
 * Display an Objective given Destiny Objective information. This will figure
 * out the right way to display it. If you know exactly how you want to display
 * something you can use the lower-level ObjectiveDisplay component.
 */
export default function Objective({
  objective,
  suppressObjectiveDescription,
  isTrialsPassage,
  showHidden,
  noCheckbox,
}: {
  objective: DestinyObjectiveProgress | D1ObjectiveProgress;
  suppressObjectiveDescription?: boolean;
  isTrialsPassage?: boolean;
  showHidden?: boolean;
  noCheckbox?: boolean;
}) {
  const defs = useDefinitions()!;
  const objectiveDef = defs.Objective.get(objective.objectiveHash);

  const progress = objective.progress || 0;

  if (!objectiveDef) {
    return null;
  }

  if (
    'minimumVisibilityThreshold' in objectiveDef &&
    objectiveDef.minimumVisibilityThreshold > 0 &&
    progress < objectiveDef.minimumVisibilityThreshold
  ) {
    return null;
  }

  // These two are to support D1 objectives
  const completionValue =
    'completionValue' in objective ? objective.completionValue : objectiveDef.completionValue;

  const complete = 'complete' in objective ? objective.complete : objective.isComplete;
  const isD2Def = 'progressDescription' in objectiveDef;

  const progressDescription =
    // D1 display description
    (!isD2Def && objectiveDef.displayDescription) ||
    (!suppressObjectiveDescription && isD2Def && objectiveDef.progressDescription) ||
    (complete ? t('Objectives.Complete') : t('Objectives.Incomplete'));

  const valueStyle = getValueStyle(objectiveDef, progress, completionValue);
  if (!showHidden && valueStyle === DestinyUnlockValueUIStyle.Hidden) {
    return null;
  }
  const isDate = isD2Def && valueStyle === DestinyUnlockValueUIStyle.DateTime;

  if (valueStyle === DestinyUnlockValueUIStyle.Integer) {
    const icon =
      objectiveDef && 'displayProperties' in objectiveDef && objectiveDef.displayProperties.hasIcon
        ? objectiveDef.displayProperties.icon
        : undefined;

    return (
      <ObjectiveRow>
        <div className={styles.integer}>
          <ObjectiveDescription icon={icon} description={progressDescription} />
          <ObjectiveText>{progress.toLocaleString()}</ObjectiveText>
        </div>
      </ObjectiveRow>
    );
  }

  const isBoolean = isBooleanObjective(objectiveDef, progress, completionValue);
  const showAsCounter = isTrialsPassage && isRoundsWonObjective(objective.objectiveHash);
  const passageFlawed =
    isTrialsPassage && isFlawlessObjective(objective.objectiveHash) && !complete;

  // TODO: green pips, red pips

  const showCheckbox = !noCheckbox && !showAsCounter && !isDate;
  const showProgress =
    progress !== undefined && completionValue !== undefined && !isBoolean && !isDate;
  const showComplete = complete && !showAsCounter && !isDate;

  return (
    <ObjectiveRow complete={showComplete} boolean={isBoolean}>
      {showCheckbox && (
        <ObjectiveCheckbox completed={showComplete ?? false} passageFlawed={passageFlawed} />
      )}
      <ObjectiveProgress>
        {showProgress && !showComplete && (
          <ObjectiveProgressBar progress={progress} completionValue={completionValue} />
        )}
        <ObjectiveDescription description={progressDescription} />
        {!isBoolean && (
          <ObjectiveText>
            <ObjectiveValue
              objectiveDef={objectiveDef}
              progress={progress}
              completionValue={completionValue}
            />
          </ObjectiveText>
        )}
      </ObjectiveProgress>
      {showAsCounter && <div className={styles.counter}>{progress}</div>}
    </ObjectiveRow>
  );
}

/**
 * An ObjectiveRow is the top-level container for a single objective display.
 */
export function ObjectiveRow({
  complete,
  boolean,
  children,
  className,
}: {
  complete?: boolean;
  boolean?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const classes = clsx(className, styles.objective, {
    [styles.objectiveComplete]: complete,
    [styles.boolean]: boolean,
  });

  return <div className={classes}>{children}</div>;
}

/**
 * This is the little checkbox that's shown next to an objective.
 */
export function ObjectiveCheckbox({
  completed,
  passageFlawed,
}: {
  completed: boolean;
  passageFlawed?: boolean;
}) {
  return (
    <div
      className={clsx(styles.checkbox, {
        [styles.complete]: completed,
        [styles.passageFlawed]: passageFlawed,
      })}
    />
  );
}

/**
 * This is the progress bar that's shown behind objectives that have progress.
 */
export function ObjectiveProgressBar({
  progress,
  completionValue,
  className,
}: {
  progress: number;
  completionValue: number;
  className?: string;
}) {
  return (
    <div
      className={clsx(className, styles.progressBar)}
      style={{
        width: percent(progress / completionValue),
      }}
    />
  );
}

/**
 * This is the container component for the progress bar and description.
 */
export function ObjectiveProgress({ children }: { children: React.ReactNode }) {
  return <div className={styles.progressContainer}>{children}</div>;
}

/**
 * This is the description of the objective, e.g. "kill enemies"
 */
export function ObjectiveDescription({
  icon,
  description,
}: {
  icon?: string | React.ReactNode;
  description: string;
}) {
  return (
    <div className={styles.description}>
      {icon && typeof icon === 'string' ? <BungieImage src={icon} /> : icon}
      <RichDestinyText text={description} />
    </div>
  );
}

/**
 * The text at the end of the objective, usually this shows the value of a counter (e.g. 4/10)
 */
export function ObjectiveText({ children }: { children: React.ReactNode }) {
  return <div className={styles.text}>{children}</div>;
}

/**
 * This is the formatted value of the objective, e.g. "5/10". It depends on the
 * value style of the objective.
 */
export function ObjectiveValue({
  objectiveDef,
  progress,
  completionValue = 0,
}: {
  objectiveDef: DestinyObjectiveDefinition | D1ObjectiveDefinition | undefined;
  progress: number;
  completionValue?: number;
}) {
  const valueStyle = getValueStyle(objectiveDef, progress, completionValue);

  // TODO: pips

  switch (valueStyle) {
    case DestinyUnlockValueUIStyle.DateTime:
      return (
        <time dateTime={new Date(progress * 1000).toISOString()}>
          {new Date(progress * 1000).toLocaleString()}
        </time>
      );
    case DestinyUnlockValueUIStyle.Percentage:
      if (completionValue === 100) {
        return <>{percent(progress / completionValue)}</>;
      } else if (completionValue === 1000) {
        return <>{percentWithSingleDecimal(progress / completionValue)}</>;
      }
      break;
    case DestinyUnlockValueUIStyle.ExplicitPercentage:
      return <>{`${progress}%`}</>;
    case DestinyUnlockValueUIStyle.FractionFloat:
      return <>{percent(progress * completionValue)}</>;
    case DestinyUnlockValueUIStyle.Multiplier:
      return <>{`${progress.toLocaleString()}𝗑`}</>;
    case DestinyUnlockValueUIStyle.RawFloat:
      return <>{(progress / 100).toLocaleString()}</>;
    case DestinyUnlockValueUIStyle.TimeDuration:
      return <>{timerDurationFromMs(progress)}</>;
    case DestinyUnlockValueUIStyle.Checkbox: // This was already rendered as a checkbox
    case DestinyUnlockValueUIStyle.Hidden:
      return null;
    default:
      break;
  }

  // Default
  return completionValue === 0 ||
    (objectiveDef &&
      'allowOvercompletion' in objectiveDef &&
      objectiveDef.allowOvercompletion &&
      completionValue === 1) ? (
    <>{progress.toLocaleString()}</>
  ) : (
    <>
      {progress.toLocaleString()}
      <wbr />/<wbr />
      {completionValue.toLocaleString()}
    </>
  );
}
