import {
  DestinyActivityDefinition,
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneDefinition,
  DestinyMilestoneQuest,
  DestinyActivityModifierDefinition
} from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import MilestoneObjectiveStatus from './MilestoneObjectiveStatus';
import Challenges from './Challenges';

/**
 * Most milestones are represented as a quest, with some objectives and a reward associated with them.
 */
export default function AvailableQuest({
  defs,
  milestoneDef,
  availableQuest
}: {
  defs: D2ManifestDefinitions;
  milestoneDef: DestinyMilestoneDefinition;
  availableQuest: DestinyMilestoneQuest;
}) {
  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: DestinyDisplayPropertiesDefinition = questDef.displayProperties || milestoneDef.displayProperties;

  let activityDef: DestinyActivityDefinition | null = null;
  let modifiers: DestinyActivityModifierDefinition[] = [];
  if (availableQuest.activity) {
    activityDef = defs.Activity.get(availableQuest.activity.activityHash);
    if (availableQuest.activity.modifierHashes) {
      modifiers = availableQuest.activity.modifierHashes.map((h) => defs.ActivityModifier.get(h));
    }
  }

  // Only look at the first reward, the rest are screwy (old engram versions, etc)
  const questRewards = questDef.questRewards ? _.take(questDef.questRewards.items, 1).map((r) => defs.InventoryItem.get(r.itemHash)) : [];

  const objectives = availableQuest.status.stepObjectives;
  const objective = objectives.length ? objectives[0] : null;
  const objectiveDef = objective ? defs.Objective.get(objective.objectiveHash) : null;

  const tooltip = availableQuest.status.completed ? 'Progress.RewardEarned' : 'Progress.RewardNotEarned';

  return (
    <div className="milestone-quest">
      <div className="milestone-icon" title={t(tooltip)}>
        <BungieImage src={displayProperties.icon} />
        <MilestoneObjectiveStatus objective={objective} status={availableQuest.status} defs={defs} />
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{displayProperties.name}</span>
        {activityDef && activityDef.displayProperties.name !== displayProperties.name &&
          <div className="milestone-location">{activityDef.displayProperties.name}</div>}
        <div className="milestone-description">{objectiveDef ? objectiveDef.progressDescription : displayProperties.description}</div>
        {modifiers.map((modifier) =>
          <ActivityModifier key={modifier.hash} modifier={modifier}/>
        )}
        {questRewards.map((questReward) =>
          <div className="milestone-reward" key={questReward.hash}>
            <BungieImage src={questReward.displayProperties.icon} />
            <span>{questReward.displayProperties.name}</span>
          </div>
        )}
        <Challenges defs={defs} availableQuest={availableQuest} />
      </div>
    </div>
  );
}

function ActivityModifier(props: {
  modifier: DestinyActivityModifierDefinition;
}) {
  const { modifier } = props;

  return (
    <div className="milestone-modifier">
      <BungieImage src={modifier.displayProperties.icon}/>
      <div className="milestone-modifier-info">
        <div className="milestone-modifier-name">{modifier.displayProperties.name}</div>
        <div className="milestone-modifier-description">{modifier.displayProperties.description}</div>
      </div>
    </div>
  );
}
