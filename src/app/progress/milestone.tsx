import * as React from 'react';
import * as _ from 'underscore';
import { IDestinyMilestone, IDestinyMilestoneQuest, IDestinyDisplayPropertiesDefinition, IDestinyObjectiveProgress } from '../bungie-api/interfaces';
import { percent } from '../inventory/dimPercentWidth.directive';
import { t } from 'i18next';
import { BungieImage } from '../dim-ui/bungie-image';
import './milestone.scss';

interface MilestoneProps {
  milestone: IDestinyMilestone;
  defs;
}

export function Milestone(props: MilestoneProps) {
  const { milestone, defs } = props;

  // TODO: no typings for manifest types yet
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  // TODO: there are also "vendor milestones" which have no quest but have vendors (Xur)

  return <>
    {(milestone.availableQuests || []).map((availableQuest) =>
      <AvailableQuest defs={defs} milestoneDef={milestoneDef} availableQuest={availableQuest} key={availableQuest.questItemHash} />
    )}
  </>;
}

interface AvailableQuestProps {
  defs;
  milestoneDef;
  availableQuest: IDestinyMilestoneQuest;
}

function AvailableQuest(props: AvailableQuestProps) {
  const { defs, milestoneDef, availableQuest } = props;

  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: IDestinyDisplayPropertiesDefinition = questDef.displayProperties || milestoneDef.displayProperties;

  let activityDef: any = null;
  if (availableQuest.activity) {
    activityDef = defs.Activity.get(availableQuest.activity.activityHash);
  }
  // Only look at the first reward, the rest are screwy (old, etc)
  const questRewards = questDef.questRewards ? _.take(questDef.questRewards.items, 1).map((r: any) => defs.InventoryItem.get(r.itemHash)) : [];
  // TODO: some quests don't have a description, but they have an Activity (questDef.activities)!

  // TODO: show activity challenges

  const objectives = availableQuest.status.stepObjectives;
  const objective = objectives.length ? objectives[0] : null;

  return <div className="milestone-quest">
    <div className="milestone-icon">
      <BungieImage src={displayProperties.icon} />
      <MilestoneObjectiveStatus objective={objective} defs={defs} />
    </div>
    <div className="milestone-info">
      <span className="milestone-name">{displayProperties.name}</span>
      {activityDef && activityDef.displayProperties.name !== displayProperties.name &&
        <div className="milestone-location">{activityDef.displayProperties.name}</div>}
      <div className="milestone-description">{displayProperties.description}</div>
      {questRewards.map((questReward) =>
        <div className="milestone-reward" key={questReward.hash}>
          <BungieImage src={questReward.displayProperties.icon} />
          <span>{questReward.displayProperties.name}</span>
        </div>
      )}
    </div>
  </div>;

interface MilestoneObjectiveStatus {
  objective: IDestinyObjectiveProgress | null;
  defs: any;
}

function MilestoneObjectiveStatus(props: MilestoneObjectiveStatus) {
  const { objective, defs } = props;
  if (objective) {
    const objectiveDef = defs.Objective.get(objective.objectiveHash);
    if (objective.complete) {
      return <span><i className="fa fa-check-square-o"></i></span>;
    } else if (objectiveDef.completionValue > 1) {
      return <span>{objective.progress}/{objectiveDef.completionValue}</span>;
    }
  }

  return null;
}