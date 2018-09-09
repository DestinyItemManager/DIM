import {
  DestinyMilestone,
  DestinyCharacterComponent
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './milestone.scss';
import RewardActivity from './RewardActivity';
import AvailableQuest from './AvailableQuest';
import { UISref } from '@uirouter/react';
import Objective from './Objective';
import { Reward } from './Reward';
import MilestoneDisplay from './MilestoneDisplay';

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
      <MilestoneDisplay
        displayProperties={milestoneDef.displayProperties}
        description={$featureFlags.vendors
          ? <UISref to='destiny2.vendor' params={{ id: milestone.vendors[0].vendorHash, characterId: character.characterId }}>
              <a>{milestoneDef.displayProperties.description}</a>
            </UISref>
          : milestoneDef.displayProperties.description
        }
      />
    );
  } else if (milestone.activities && milestone.activities.length && milestone.rewards) {
    // TODO: loadoutRequirementIndex

    const objectives = milestone.activities[0].challenges.map((a) => a.objective);
    if (objectives.every((objective) => objective.complete)) {
      return null;
    }

    return (
      <MilestoneDisplay
        displayProperties={milestoneDef.displayProperties}
      >
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
      </MilestoneDisplay>
    );
  } else if (milestone.rewards) {
    const rewards = milestone.rewards[0];
    const milestoneRewardDef = milestoneDef.rewards[rewards.rewardCategoryHash];

    return (
      <MilestoneDisplay
        displayProperties={milestoneDef.displayProperties}
      >
        {rewards.entries.map((rewardEntry) =>
          <RewardActivity key={rewardEntry.rewardEntryHash} rewardEntry={rewardEntry} milestoneRewardDef={milestoneRewardDef} />
        )}
      </MilestoneDisplay>
    );
  }

  return null;
}
