import {
  DestinyMilestone,
  DestinyCharacterComponent
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import './milestone.scss';
import RewardActivity from './RewardActivity';
import AvailableQuest from './AvailableQuest';
import { UISref } from '@uirouter/react';
import Objective from './Objective';
import { Reward } from './Reward';

/**
 * A Milestone is an activity or event that a player can complete to earn rewards.
 * There are several forms of Milestone.
 */
export function Milestone({
  milestone,
  defs,
  character
}: {
  milestone: DestinyMilestone;
  defs: D2ManifestDefinitions;
  character: DestinyCharacterComponent;
}) {
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  if (milestone.availableQuests) {
    // A regular milestone
    return (
      <>
        {milestone.availableQuests.map((availableQuest) =>
          <AvailableQuest
            defs={defs}
            milestoneDef={milestoneDef}
            availableQuest={availableQuest}
            key={availableQuest.questItemHash}
            characterClass={character.classType}
          />
        )}
      </>
    );
  } else if (milestone.vendors) {
    // A vendor milestone (Xur)
    return (
      <div className="milestone-quest">
        {milestoneDef.displayProperties.icon &&
          <div className="milestone-icon">
            <BungieImage src={milestoneDef.displayProperties.icon} />
          </div>}
        <div className="milestone-info">
          <span className="milestone-name">{milestoneDef.displayProperties.name}</span>
          <div className="milestone-description">
            {$featureFlags.vendors
              ? <UISref to='destiny2.vendor' params={{ id: milestone.vendors[0].vendorHash, characterId: character.characterId }}>
                  <a>{milestoneDef.displayProperties.description}</a>
                </UISref>
              : milestoneDef.displayProperties.description
            }
          </div>
        </div>
      </div>
    );
  } else if (milestone.activities && milestone.activities.length && milestone.rewards) {
    // TODO: skip if the challenge is complete
    // TODO: loadoutRequirementIndex
    // TODO: split this from the non-activity version

    const objectives = milestone.activities[0].challenges.map((a) => a.objective);
    if (objectives.every((objective) => objective.complete)) {
      return null;
    }

    return (
      <div className="milestone-quest">
        {milestoneDef.displayProperties.icon && <div className="milestone-icon">
          <BungieImage src={milestoneDef.displayProperties.icon} />
        </div>}
        <div className="milestone-info">
          <span className="milestone-name">{milestoneDef.displayProperties.name}</span>
          <div className="milestone-description">{milestoneDef.displayProperties.description}</div>
          {milestone.activities.length > 0 &&
            <div className="quest-objectives">
              {milestone.activities[0].challenges.map((challenge) =>
                <Objective defs={defs} objective={challenge.objective} key={challenge.objective.objectiveHash}/>
              )}
            </div>}
          {milestone.rewards.map((reward) =>
            Object.values(milestoneDef.rewards[reward.rewardCategoryHash].rewardEntries).map((entry) =>
              entry.items.map((reward) =>
                <Reward key={reward.itemHash} reward={reward} defs={defs}/>
              )
            )
          )}
        </div>
      </div>
    );
  } else if (milestone.rewards) {
    const rewards = milestone.rewards[0];
    const milestoneRewardDef = milestoneDef.rewards[rewards.rewardCategoryHash];

    return (
      <div className="milestone-quest">
        {milestoneDef.displayProperties.icon && <div className="milestone-icon">
          <BungieImage src={milestoneDef.displayProperties.icon} />
        </div>}
        <div className="milestone-info">
          <span className="milestone-name">{milestoneDef.displayProperties.name}</span>
          <div className="milestone-description">{milestoneDef.displayProperties.description}</div>
          {rewards.entries.map((rewardEntry) =>
            <RewardActivity key={rewardEntry.rewardEntryHash} rewardEntry={rewardEntry} milestoneRewardDef={milestoneRewardDef} />
          )}
        </div>
      </div>
    );
  }

  return null;
}
