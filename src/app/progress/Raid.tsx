import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyMilestone } from 'bungie-api-ts/destiny2';
import React from 'react';
import './milestone.scss';
import { RaidActivity, RaidDisplay } from './RaidDisplay';

/**
 * Raids offer powerful rewards. Unlike Milestones, some raids have multiple tiers,
 * so this function enumerates the Activities within the Milstones
 */
export function Raid({ raid }: { raid: DestinyMilestone }) {
  const defs = useD2Definitions()!;
  // convert character's DestinyMilestone to manifest's DestinyMilestoneDefinition
  const raidDef = defs.Milestone.get(raid.milestoneHash);

  const activities = raid.activities?.filter((activity) => activity.phases) || [];

  // override the sometimes cryptic individual activity names, if there's only 1 tier of the raid
  const displayName = activities.length === 1 ? raidDef.displayProperties.name : '';

  return (
    <RaidDisplay displayProperties={raidDef.displayProperties}>
      {activities.length === 0 && (
        <span className="milestone-name">{raidDef.displayProperties.name}</span>
      )}
      {activities.map((activity) => (
        <RaidActivity activity={activity} displayName={displayName} key={activity.activityHash} />
      ))}
    </RaidDisplay>
  );
}
