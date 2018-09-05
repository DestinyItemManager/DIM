import {
  DestinyMilestoneRewardCategoryDefinition,
  DestinyMilestoneRewardEntry,
    } from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';

/**
 * For profile-wide milestones with rewards, these show the status of each reward. So
 * far this is only used for the "Clan Objectives" milestone.
 */
export default function RewardActivity({
  rewardEntry,
  milestoneRewardDef
}: {
  rewardEntry: DestinyMilestoneRewardEntry;
  milestoneRewardDef: DestinyMilestoneRewardCategoryDefinition;
}) {
  const rewardDef = milestoneRewardDef.rewardEntries[rewardEntry.rewardEntryHash];

  const checkClass = (rewardEntry.redeemed ? 'fa-check-circle' : rewardEntry.earned ? 'fa-check-circle-o' : 'fa-circle-o');
  const tooltip = (rewardEntry.redeemed ? 'Progress.RewardRedeemed' : rewardEntry.earned ? 'Progress.RewardEarned' : 'Progress.RewardNotEarned');

  return (
    <div className={classNames('milestone-reward-activity', { complete: rewardEntry.earned })} title={t(tooltip)}>
      <i className={classNames('fa', checkClass)}/>
      {rewardDef.displayProperties.icon && <BungieImage src={rewardDef.displayProperties.icon} />}
      <span>{rewardDef.displayProperties.name}</span>
    </div>
  );
}
