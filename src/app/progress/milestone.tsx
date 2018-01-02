import * as React from 'react';
import * as _ from 'underscore';
import classNames from 'classnames';
import { t } from 'i18next';
import { IDestinyMilestone, IDestinyMilestoneQuest, IDestinyDisplayPropertiesDefinition, IDestinyObjectiveProgress, IDestinyChallengeStatus, IDestinyMilestoneRewardEntry } from '../bungie-api/interfaces';
import { BungieImage } from '../dim-ui/bungie-image';
import './milestone.scss';

interface MilestoneProps {
  milestone: IDestinyMilestone;
  defs;
}

/**
 * A Milestone is an activity or event that a player can complete to earn rewards.
 * There are several forms of Milestone.
 */
export function Milestone(props: MilestoneProps) {
  const { milestone, defs } = props;

  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  if (milestone.availableQuests) {
    return (
      <>
        {milestone.availableQuests.map((availableQuest) =>
          <AvailableQuest
            defs={defs}
            milestone={milestone}
            milestoneDef={milestoneDef}
            availableQuest={availableQuest}
            key={availableQuest.questItemHash}
          />
        )}
      </>
    );
  } else if (milestone.vendors) {
    return (
      <div className="milestone-quest">
        <div className="milestone-icon">
          <BungieImage src={milestoneDef.displayProperties.icon} />
        </div>
        <div className="milestone-info">
          <span className="milestone-name">{milestoneDef.displayProperties.name}</span>
          <div className="milestone-description">{milestoneDef.displayProperties.description}</div>
        </div>
      </div>
    );
  } else if (milestone.rewards) {
    const rewards = milestone.rewards[0];
    const milestoneRewardDef = milestoneDef.rewards[rewards.rewardCategoryHash];

    return (
      <div className="milestone-quest">
        <div className="milestone-icon">
          <BungieImage src={milestoneDef.displayProperties.icon} />
        </div>
        <div className="milestone-info">
          <span className="milestone-name">{milestoneDef.displayProperties.name}</span>
          <div className="milestone-description">{milestoneDef.displayProperties.description}</div>
          {rewards.entries.map((rewardEntry) =>
            <RewardActivity key={rewardEntry.rewardEntryHash} defs={defs} rewardEntry={rewardEntry} milestoneRewardDef={milestoneRewardDef} />
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface RewardActivityProps {
  defs;
  rewardEntry: IDestinyMilestoneRewardEntry;
  milestoneRewardDef;
}

/**
 * For profile-wide milestones with rewards, these show the status of each reward. So
 * far this is only used for the "Clan Objectives" milestone.
 */
function RewardActivity(props: RewardActivityProps) {
  const { defs, rewardEntry, milestoneRewardDef } = props;

  const rewardDef = milestoneRewardDef.rewardEntries[rewardEntry.rewardEntryHash];

  const checkClass = (rewardEntry.redeemed ? 'fa-check-circle' : rewardEntry.earned ? 'fa-check-circle-o' : 'fa-circle-o');
  const tooltip = (rewardEntry.redeemed ? 'Progress.RewardRedeemed' : rewardEntry.earned ? 'Progress.RewardEarned' : 'Progress.RewardNotEarned');
  console.log(rewardEntry, rewardDef);

  return (
    <div className="milestone-reward-activity" title={t(tooltip)}>
      <i className={classNames('fa', checkClass)}/>
      <BungieImage src={rewardDef.displayProperties.icon} />
      <span>{rewardDef.displayProperties.name}</span>
    </div>
  );
}

interface AvailableQuestProps {
  defs;
  milestone: IDestinyMilestone;
  milestoneDef;
  availableQuest: IDestinyMilestoneQuest;
}

function AvailableQuest(props: AvailableQuestProps) {
  const { defs, milestone, milestoneDef, availableQuest } = props;

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

  const tooltip = availableQuest.status.completed ? 'Progress.RewardEarned' : 'Progress.RewardNotEarned';

  return (
    <div className="milestone-quest">
      <div className="milestone-icon" title={t(tooltip)}>
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
    </div>
  );
}

interface MilestoneObjectiveStatus {
  objective: IDestinyObjectiveProgress | null;
  defs: any;
}

function MilestoneObjectiveStatus(props: MilestoneObjectiveStatus) {
  const { objective, defs } = props;
  if (objective) {
    const objectiveDef = defs.Objective.get(objective.objectiveHash);
    if (objective.complete) {
      return <span><i className="fa fa-check-square-o"/></span>;
    } else if (objectiveDef.completionValue > 1) {
      return <span>{objective.progress}/{objectiveDef.completionValue}</span>;
    }
  }

  return null;
}
