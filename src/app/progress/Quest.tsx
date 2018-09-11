import { DestinyItemComponent, DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { sum } from '../util';
import Objective from './Objective';
import { Reward } from './Reward';
import MilestoneDisplay from './MilestoneDisplay';

interface QuestProps {
  defs: D2ManifestDefinitions;
  item: DestinyItemComponent;
  objectives: DestinyObjectiveProgress[];
}

export default function Quest(props: QuestProps) {
  const { defs, item, objectives } = props;

  const itemDef = defs.InventoryItem.get(item.itemHash);

  const percentComplete = sum(objectives, (objective) => {
    if (objective.completionValue) {
      return Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length;
    } else {
      return 0;
    }
  });

  const rewards = itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : [];

  const progress = (
    <>
      {percentComplete > 0 &&
        <span>{Math.round(percentComplete * 100)}%</span>}
      {itemDef.inventory.maxStackSize > 1 &&
        <span>{item.quantity}</span>}
    </>
  );

  return (
    <MilestoneDisplay
      displayProperties={itemDef.displayProperties}
      progress={progress}
    >
      <div className="quest-objectives">
        {objectives.map((objective) =>
          <Objective defs={defs} objective={objective} key={objective.objectiveHash}/>
        )}
      </div>
      {rewards.map((reward) =>
        <Reward key={reward.itemHash} reward={reward} defs={defs}/>
      )}
    </MilestoneDisplay>
  );
}
