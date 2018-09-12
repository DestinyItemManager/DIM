import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyObjectiveProgress, DestinyUnlockValueUIStyle } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import BungieImage from '../dim-ui/BungieImage';
import { settings } from '../settings/settings';

export default function Objective({
  defs,
  objective,
  suppressObjectiveDescription
}: {
  defs: D2ManifestDefinitions;
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

  const displayName =
    (!suppressObjectiveDescription && objectiveDef.progressDescription) ||
    t(objective.complete ? 'Objectives.Complete' : 'Objectives.Incomplete');

  const formatter = new Intl.NumberFormat(settings.language);

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
    'objective-complete': objective.complete,
    'objective-boolean':
      objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
      (objective.completionValue === 1 && !objectiveDef.allowOvercompletion)
  });

  const progressBarStyle = {
    width: percent(progress / objective.completionValue)
  };

  return (
    <div className={classes}>
      <div className="objective-checkbox">
        <div />
      </div>
      <div className="objective-progress">
        <div className="objective-progress-bar" style={progressBarStyle} />
        <div className="objective-description">{displayName}</div>
        {objectiveDef.allowOvercompletion && objective.completionValue === 1 ? (
          <div className="objective-text">{formatter.format(progress)}</div>
        ) : (
          <div className="objective-text">
            {formatter.format(progress)}/{formatter.format(objective.completionValue)}
          </div>
        )}
      </div>
    </div>
  );
}
