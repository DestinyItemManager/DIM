import {
  DestinyMilestoneQuest,
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'underscore';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import Challenge from './Challenge';

/**
 * If this quest has associated challenges, display them.
 * There doesn't seem to be any consistency about which quests do and don't have challenges, though.
 */
export default function Challenges({
  defs,
  availableQuest
}: {
  defs: D2ManifestDefinitions;
  availableQuest: DestinyMilestoneQuest;
}) {
  if (!availableQuest.challenges) {
    return null;
  }

  // If we can, filter challenges down to the current activity.
  let filteredChallenges = availableQuest.activity ? availableQuest.challenges.filter((c) => c.objective.activityHash === availableQuest.activity.activityHash) : availableQuest.challenges;

  // Sometimes none of them match the activity, though. I don't know why.
  if (filteredChallenges.length === 0) {
    filteredChallenges = availableQuest.challenges;
  }

  // TODO: If we don't filter, there are duplicates. The duplicates are often for the prestige-mode versions.
  // Not sure if we want to show them since they're dups, but the completion values would be different between
  // them, right?

  // Sometimes a quest can be completed by doing challenges from multiple activities. If that's the case, group
  // them by activity and give each a header to help them make sense.
  const challengesByActivity = _.groupBy(filteredChallenges, (c) => c.objective.activityHash);
  return (
    <>
      {_.map(challengesByActivity, (challengeStatuses, activityHash) => {
        const activityDef = defs.Activity.get(parseInt(activityHash, 10));

        return (
          <div key={activityHash} className="milestone-challenges">
            {_.size(challengesByActivity) > 1 &&
              <div className="milestone-challenges-activity-name">{activityDef.displayProperties.name}</div>
            }
            {challengeStatuses.map((challenge) =>
              <Challenge key={challenge.objective.objectiveHash} defs={defs} challenge={challenge} />
            )}
          </div>
        );
      })}
    </>
  );
}
