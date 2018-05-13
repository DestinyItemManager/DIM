import { DestinyItemComponent, DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { BungieImage } from '../dim-ui/bungie-image';
import { sum } from '../util';
import './quest.scss';
import Objective from './Objective';

interface QuestProps {
  defs: D2ManifestDefinitions;
  item: DestinyItemComponent;
  objectives: DestinyObjectiveProgress[];
}

export default function Quest(props: QuestProps) {
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
