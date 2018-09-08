import { DestinyItemComponent, DestinyObjectiveProgress, DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
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
    if (objective.completionValue) {
      return Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length;
    } else {
      return 0;
    }
  });

  const rewards = itemDef.value ? itemDef.value.itemValue.filter((v) => v.quantity && v.itemHash) : [];

  return (
    <div className="milestone-quest item-quest">
      <div className="milestone-icon">
        <BungieImage src={itemDef.displayProperties.icon} />
        {percentComplete > 0 &&
          <span>{Math.floor(percentComplete * 100)}%</span>}
        {itemDef.inventory.maxStackSize > 1 &&
          <span>{item.quantity}</span>}
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{itemDef.displayProperties.name}</span>
        <div className="milestone-description">{itemDef.displayProperties.description}</div>
        <div className="quest-objectives">
          {objectives.map((objective) =>
            <Objective defs={defs} objective={objective} key={objective.objectiveHash}/>
          )}
        </div>
        {rewards.map((reward) =>
          <Reward key={reward.itemHash} reward={reward} defs={defs}/>
        )}
      </div>
    </div>
  );
}

export function Reward({
  reward,
  defs
}: {
  reward: DestinyItemQuantity;
  defs: D2ManifestDefinitions;
}) {
  return (
    <div className="milestone-reward">
      <BungieImage src={defs.InventoryItem.get(reward.itemHash).displayProperties.icon} />
      <span>{defs.InventoryItem.get(reward.itemHash).displayProperties.name}{reward.quantity > 1 && ` +${reward.quantity}`}</span>
    </div>
  );
}
