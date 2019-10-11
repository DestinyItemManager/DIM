import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DestinyObjectiveProgress, DestinyUnlockValueUIStyle } from 'bungie-api-ts/destiny2';
import ObjectiveDescription from './ObjectiveDescription';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import { settings } from '../settings/settings';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { percent } from '../shell/filters';
import { numberFormatter } from 'app/utils/util';

export default function Objective({
  defs,
  objective,
  suppressObjectiveDescription
}: {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  objective: DestinyObjectiveProgress;
  suppressObjectiveDescription?: boolean;
}) {
  const objectiveDef = defs.Objective.get(objective.objectiveHash);

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

  const displayName =
    (!suppressObjectiveDescription && objectiveDef.progressDescription) ||
    t(complete ? 'Objectives.Complete' : 'Objectives.Incomplete');

  const formatter = numberFormatter(settings.language);

  if (objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Integer) {
    return (
      <div className="objective-row">
        <div className="objective-integer">
          <ObjectiveDescription displayName={displayName} objectiveDef={objectiveDef} defs={defs} />
          <div className="objective-text">{formatter.format(progress)}</div>
        </div>
      </div>
    );
  }

  const isBoolean =
    objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
    (completionValue === 1 && !objectiveDef.allowOvercompletion);

  const classes = clsx('objective-row', {
    'objective-complete': complete,
    'objective-boolean': isBoolean
  });

  const progressBarStyle = {
    width: percent(progress / completionValue)
  };

  return (
    <div className={classes}>
      <div className="objective-checkbox" />
      <div className="objective-progress">
        {!isBoolean && <div className="objective-progress-bar" style={progressBarStyle} />}
        <div className="objective-description">{displayName}</div>
        {!isBoolean &&
          (objectiveDef.allowOvercompletion && completionValue === 1 ? (
            <div className="objective-text">{formatter.format(progress)}</div>
          ) : (
            <div className="objective-text">
              {formatter.format(progress)}/{formatter.format(completionValue)}
            </div>
          ))}
      </div>
    </div>
  );
}
