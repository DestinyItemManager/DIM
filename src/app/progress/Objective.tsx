import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import {
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
  DestinyObjectiveDefinition
} from 'bungie-api-ts/destiny2';
import ObjectiveDescription from './ObjectiveDescription';
import RichDestinyText from 'app/dim-ui/RichDestinyText';

import clsx from 'clsx';
import { t } from 'app/i18next-t';
import { percent } from '../shell/filters';
import { isBooleanObjective } from 'app/inventory/store/objectives';
import '../item-popup/ItemObjectives.scss';

export default function Objective({
  defs,
  objective,
  suppressObjectiveDescription
}: {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  objective: DestinyObjectiveProgress;
  suppressObjectiveDescription?: boolean;
}) {
  const objectiveDef = defs.Objective.get(objective.objectiveHash) as DestinyObjectiveDefinition;

  const progress = objective.progress || 0;

  if (
    objectiveDef.minimumVisibilityThreshold > 0 &&
    progress < objectiveDef.minimumVisibilityThreshold
  ) {
    return null;
  }

  // These two are to support D1 objectives
  const completionValue =
    objective.completionValue !== undefined
      ? objective.completionValue
      : objectiveDef.completionValue;

  const complete = objective.complete || (objective as any).isComplete;

  const progressDescription =
    // D1 display description
    (objectiveDef as any).displayDescription ||
    (!suppressObjectiveDescription && objectiveDef.progressDescription) ||
    (complete ? t('Objectives.Complete') : t('Objectives.Incomplete'));

  if (objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Integer) {
    return (
      <div className="objective-row">
        <div className="objective-integer">
          <ObjectiveDescription
            progressDescription={progressDescription}
            objectiveDef={objectiveDef}
            defs={defs}
          />
          <div className="objective-text">{progress.toLocaleString()}</div>
        </div>
      </div>
    );
  }

  const isBoolean = isBooleanObjective(objectiveDef, completionValue);

  const classes = clsx('objective-row', {
    'objective-complete': complete,
    'objective-boolean': isBoolean
  });

  const progressBarStyle = {
    width: percent(progress / completionValue)
  };

  // TODO: green pips, red pips

  return (
    <div className={classes}>
      <div className="objective-checkbox" />
      <div className="objective-progress">
        {!isBoolean && <div className="objective-progress-bar" style={progressBarStyle} />}
        <div className="objective-description">
          <RichDestinyText text={progressDescription} defs={defs} />
        </div>
        {!isBoolean && (
          <div className="objective-text">
            <ObjectiveValue
              objectiveDef={objectiveDef}
              progress={progress}
              completionValue={completionValue}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ObjectiveValue({
  objectiveDef,
  progress,
  completionValue = 0
}: {
  objectiveDef: DestinyObjectiveDefinition | undefined;
  progress: number;
  completionValue?: number;
}) {
  const valueStyle = objectiveDef
    ? (progress < completionValue
        ? objectiveDef.inProgressValueStyle
        : objectiveDef.completedValueStyle) ?? objectiveDef.valueStyle
    : DestinyUnlockValueUIStyle.Automatic;

  // TODO: pips

  switch (valueStyle) {
    case DestinyUnlockValueUIStyle.DateTime:
      return <>{new Date(progress).toLocaleString()}</>;
    case DestinyUnlockValueUIStyle.Percentage:
      if (completionValue === 100) {
        return <>{percent(progress / completionValue)}</>;
      }
      break;
    case DestinyUnlockValueUIStyle.ExplicitPercentage:
      return <>{progress + '%'}</>;
    case DestinyUnlockValueUIStyle.FractionFloat:
      return <>{percent(progress * completionValue)}</>;
    case DestinyUnlockValueUIStyle.Multiplier:
      return <>{progress.toLocaleString() + '𝗑'}</>;
    case DestinyUnlockValueUIStyle.RawFloat:
      return <>{(progress / 100).toLocaleString()}</>;
    case DestinyUnlockValueUIStyle.TimeDuration:
      return <>{duration(progress)}</>;
    case DestinyUnlockValueUIStyle.Checkbox:
      return <></>;
  }

  // Default
  return completionValue === 0 || (objectiveDef?.allowOvercompletion && completionValue === 1) ? (
    <>{progress.toLocaleString()}</>
  ) : (
    <>
      {progress.toLocaleString()}
      <wbr />/<wbr />
      {completionValue.toLocaleString()}
    </>
  );
}

function duration(d: number) {
  let ret = '';
  const days = d % (60 * 60 * 24);
  if (days > 0) {
    d = d - days * 60 * 60 * 24;
    ret += `${days}:`;
  }
  const hours = d % (60 * 60);
  if (days > 0 || hours > 0) {
    d = d - hours * 60 * 60;
    ret += `${hours}:`;
  }
  const minutes = d % 60;
  if (days > 0 || hours > 0 || minutes > 0) {
    d = d - minutes * 60;
    ret += `${minutes}:`;
  }
  const seconds = d;
  ret += `${seconds}`;
  return ret;
}
