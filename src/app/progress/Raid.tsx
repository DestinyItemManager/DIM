import { DestinyMilestone } from 'bungie-api-ts/destiny2';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './milestone.scss';
import { RaidDisplay, RaidActivity } from './RaidDisplay';

/**
 * Raids offer powerful rewards. Unlike Milestones, some raids have multiple tiers,
 * so this function enumerates the Activities within the Milstones
 */
export function Raid({ raid, defs }: { raid: DestinyMilestone; defs: D2ManifestDefinitions }) {
  // convert character's DestinyMilestone to manifest's DestinyMilestoneDefinition
  const raidDef = defs.Milestone.get(raid.milestoneHash);

  // nothing to display if there are no activities
  if (!raid.activities?.length) {
    return null;
  }

  const activities = raid.activities.filter((activity) => activity.phases);

  // override the sometimes cryptic individual activity names, if there's only 1 tier of the raid
  const displayName = activities.length === 1 ? raidDef.displayProperties.name : '';

  return (
    <RaidDisplay displayProperties={raidDef.displayProperties}>
      {activities.map((activity) => (
        <RaidActivity
          activity={activity}
          displayName={displayName}
          defs={defs}
          key={activity.activityHash}
        />
      ))}
    </RaidDisplay>
  );
}
