import * as React from 'react';
import * as _ from 'underscore';
import classNames from 'classnames';
import { DestinyObjectiveProgress, DestinyItemComponent } from 'bungie-api-ts/destiny2';
import { sum } from '../util';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import { BungieImage } from '../dim-ui/bungie-image';
import './quest.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

interface QuestProps {
  defs: D2ManifestDefinitions;
  item: DestinyItemComponent;
  objectives: DestinyObjectiveProgress[];
}

export function Quest(props: QuestProps) {
  const { defs, item, objectives } = props;

  const itemDef = defs.InventoryItem.get(item.itemHash);

  const percentComplete = sum(objectives, (objective) => {
    const objectiveDef = defs.Objective.get(objective.objectiveHash);
    if (objectiveDef.completionValue) {
      return Math.min(1, (objective.progress || 0) / objectiveDef.completionValue) / objectives.length;
    } else {
      return 0;
    }
  });

  return (
    <div className="milestone-quest item-quest">
      <div className="milestone-icon">
        <BungieImage src={itemDef.displayProperties.icon} />
        {percentComplete > 0 &&
          <span>{Math.floor(percentComplete * 100)}%</span>}
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{itemDef.displayProperties.name}</span>
        <div className="milestone-description">{itemDef.displayProperties.description}</div>
        <div className="quest-objectives">
          {objectives.map((objective) =>
            <Objective defs={defs} objective={objective} key={objective.objectiveHash}/>
          )}
        </div>
      </div>
    </div>
  );
}

interface ObjectiveProps {
  defs: D2ManifestDefinitions;
  objective: DestinyObjectiveProgress;
}
function Objective(props: ObjectiveProps) {
  const { defs, objective } = props;

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
