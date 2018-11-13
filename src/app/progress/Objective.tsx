import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyObjectiveProgress, DestinyUnlockValueUIStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import BungieImage from '../dim-ui/BungieImage';
import { settings } from '../settings/settings';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { createSelector } from 'reselect';

// TODO: just use memoizeone
const formatterSelector = createSelector(
  (language: string) => language,
  (language) => new Intl.NumberFormat(language)
);

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

  const formatter = formatterSelector(settings.language);

  if (objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Integer) {
    return (
      <div className="objective-row">
        <div className="objective-integer">
          <div className="objective-description">
            {objectiveDef.displayProperties.hasIcon && (
              <BungieImage src={objectiveDef.displayProperties.icon} />
            )}
            {displayName}
          </div>
          <div className="objective-text">{formatter.format(progress)}</div>
        </div>
      </div>
    );
  }

  const classes = classNames('objective-row', {
    'objective-complete': complete,
    'objective-boolean':
      objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
      (completionValue === 1 && !objectiveDef.allowOvercompletion)
  });

  const progressBarStyle = {
    width: percent(progress / completionValue)
  };

  return (
    <div className={classes}>
      <div className="objective-checkbox">
        <div />
      </div>
      <div className="objective-progress">
        <div className="objective-progress-bar" style={progressBarStyle} />
        <div className="objective-description">{displayName}</div>
        {objectiveDef.allowOvercompletion && completionValue === 1 ? (
          <div className="objective-text">{formatter.format(progress)}</div>
        ) : (
          <div className="objective-text">
            {formatter.format(progress)}/{formatter.format(completionValue)}
          </div>
        )}
      </div>
    </div>
  );
}
