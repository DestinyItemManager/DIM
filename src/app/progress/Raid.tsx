import { DestinyMilestone } from 'bungie-api-ts/destiny2';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './milestone.scss';
import { RaidDisplay, RaidActivity } from './RaidDisplay';

/**
 * Raids offer powerful rewards. Unlike Milestones, raids have multiple tiers,
 * so this function enumerates the Activities within the Milstones
 */
export function Raid({ raid, defs }: { raid: DestinyMilestone; defs: D2ManifestDefinitions }) {
  const raidDef = defs.Milestone.get(raid.milestoneHash);

  if (raid.activities && raid.activities.length) {
    const activities = raid.activities.filter((activity) => activity.phases);

    // check all phases of all activities
    if (activities.every((activity) => activity.phases.every((phase) => phase.complete))) {
      return null;
    }

    // set a canonical raid name if there's only 1 tier of the raid
    const displayName = activities.length === 1 ? raidDef.displayProperties.name : '';

    return (
      <RaidDisplay displayProperties={raidDef.displayProperties}>
        {activities.map((activity) => (
          <RaidActivity
            activity={activity}
            displayName={displayName}
            phases={activity.phases}
            defs={defs}
            key={activity.activityHash}
          />
        ))}
      </RaidDisplay>
    );
  }

  return null;
}
