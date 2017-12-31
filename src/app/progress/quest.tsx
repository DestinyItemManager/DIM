import * as React from 'react';
import * as _ from 'underscore';
import { IDestinyObjectiveProgress, IDestinyInventoryComponent, IDestinyItemInstanceComponent, IDestinyItemComponent } from '../bungie-api/interfaces';
import { sum } from '../util';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import './quest.scss';

interface QuestProps {
  defs;
  item: IDestinyItemComponent;
  objectives: IDestinyObjectiveProgress[];
}

export function Quest(props: QuestProps) {
  const { defs, item, objectives } = props;

  const itemDef = defs.InventoryItem.get(item.itemHash);

  const percentComplete = sum(objectives, (objective) => {
    const objectiveDef = defs.Objective.get(objective.objectiveHash);
    if (objectiveDef.completionValue) {
      return Math.min(1.0, (objective.progress || 0) / objectiveDef.completionValue) / objectives.length;
    } else {
      return 0;
    }
  });

  return <div className="milestone-quest item-quest">
    <div className="milestone-icon">
      <img src={`https://www.bungie.net${itemDef.displayProperties.icon}`} />
      {percentComplete > 0 &&
        <span>{Math.floor(percentComplete * 100.0)}%</span>}
    </div>
    <div className="milestone-info">
      <span className="milestone-name">{itemDef.displayProperties.name}</span>
      <div className="milestone-description">{itemDef.displayProperties.description}</div>
      <div className="quest-objectives">
        {objectives.map((objective) =>
          <Objective defs={defs} objective={objective} />
        )}
      </div>
    </div>
  </div>;
}

interface ObjectiveProps {
  defs;
  objective: IDestinyObjectiveProgress;
}
function Objective(props: ObjectiveProps) {
  const { defs, objective } = props;

  const objectiveDef = defs.Objective.get(objective.objectiveHash);

  const classNames = `objective-row ${objective.complete ? 'objective-complete' : ''} ${objectiveDef.completionValue === 1 ? 'objective-boolean' : ''}`

  const displayName = objectiveDef.progressDescription ||
      (objective.complete
        ? t('Objectives.Complete')
        : t('Objectives.Incomplete'));
  const display = `${objective.progress || 0}/${objectiveDef.completionValue}`;

  return <div className={classNames}>
    <div className="objective-checkbox"><div></div></div>
    <div className="objective-progress">
      <div className="objective-progress-bar" style={ { width: percent((objective.progress || 0) / objectiveDef.completionValue) } }></div>
      <div className="objective-description">{displayName}</div>
      <div className="objective-text">{display}</div>
    </div>
  </div>
}