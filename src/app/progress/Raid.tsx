import { DestinyMilestone } from 'bungie-api-ts/destiny2';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './milestone.scss';
import Encounter from './Encounter';
import { Reward } from './Reward';
import MilestoneDisplay from './MilestoneDisplay';
import { ActivityModifier } from './ActivityModifier';

/**
 * A Milestone is an activity or event that a player can complete to earn rewards.
 * There are several forms of Milestone.
 */
export function Raid({
  milestone,
  defs
}: {
  milestone: DestinyMilestone;
  defs: D2ManifestDefinitions;
}) {
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);
  // console.log(milestone.milestoneHash);
  if (milestone.activities && milestone.activities.length) {
    // TODO: loadoutRequirementIndex

    console.log('hello mom');
    const phases = milestone.activities[0].phases.map((a) => a);
    if (phases.every((phase) => phase.complete)) {
      return null;
    }

    const modifiers = (milestone.activities[0].modifierHashes || []).map((h) =>
      defs.ActivityModifier.get(h)
    );

    return (
      <MilestoneDisplay displayProperties={milestoneDef.displayProperties}>
        <div className="quest-modifiers">
          {modifiers.map((modifier) => (
            <ActivityModifier key={modifier.hash} modifier={modifier} />
          ))}
        </div>
        <div className="quest-objectives">
          {milestone.activities[0].phases.map((phase, index) => (
            <Encounter
              defs={defs}
              index={index}
              key={phase.phaseHash}
              completed={phase.complete}
              phasehash={phase.phaseHash}
            />
          ))}
        </div>
        {milestone.rewards &&
          milestone.rewards.map((reward) =>
            Object.values(milestoneDef.rewards[reward.rewardCategoryHash].rewardEntries).map(
              (entry) =>
                entry.items.map((reward) => (
                  <Reward key={reward.itemHash} reward={reward} defs={defs} />
                ))
            )
          )}
      </MilestoneDisplay>
    );
  }

  return null;
}
