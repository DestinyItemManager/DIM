import * as React from 'react';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { DestinyObjectiveProgress } from "bungie-api-ts/destiny2";
import * as classNames from 'classnames';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';

export default function Objective({
  defs,
  objective
}: {
  defs: D2ManifestDefinitions;
  objective: DestinyObjectiveProgress;
}) {
  const objectiveDef = defs.Objective.get(objective.objectiveHash);

  const displayName = objectiveDef.progressDescription ||
      t(objective.complete ? 'Objectives.Complete' : 'Objectives.Incomplete');

  const classes = classNames('objective-row', {
    'objective-complete': objective.complete,
    'objective-boolean': objectiveDef.completionValue === 1
  });

  const progressBarStyle = {
    width: percent((objective.progress || 0) / objectiveDef.completionValue)
  };

  return (
    <div className={classes}>
      <div className="objective-checkbox"><div/></div>
      <div className="objective-progress">
        <div className="objective-progress-bar" style={progressBarStyle}/>
        <div className="objective-description">{displayName}</div>
        <div className="objective-text">{objective.progress || 0}/{objectiveDef.completionValue}</div>
      </div>
    </div>
  );
}
