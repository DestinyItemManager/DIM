import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyMilestone } from 'bungie-api-ts/destiny2';
import { RaidActivity, RaidDisplay } from './RaidDisplay';
import './milestone.scss';

/**
 * Raids offer powerful rewards. Unlike Milestones, some raids have multiple tiers,
 * so this function enumerates the Activities within the Milstones
 */
export function Raid({ raid }: { raid: DestinyMilestone }) {
  const defs = useD2Definitions()!;
  // convert character's DestinyMilestone to manifest's DestinyMilestoneDefinition
  const raidDef = defs.Milestone.get(raid.milestoneHash);

  // try to find the version of the raid with phase data
  let activities = raid.activities?.filter((activity) => activity.phases) || [];
  // we may have overfiltered. maybe this raid has no available phase data
  if (activities.length === 0) {
    activities = raid.activities || [];
  }

  // can be used to override the sometimes cryptic individual activity names
  let displayNameOverride: string | undefined;
  if (activities.length === 1 && activities[0].activityHash === 2122313384) {
    // this used to be a more general check, but ultimately, it is just to override
    // this goofy activity named "Last Wish: Level 55". the milestone is a
    // clean "Last Wish Raid" so we provide an override
    displayNameOverride = raidDef.displayProperties.name;
  }

  return (
    <RaidDisplay displayProperties={raidDef.displayProperties}>
      {activities.length === 0 && (
        <span className="milestone-name">{raidDef.displayProperties.name}</span>
      )}
      {activities.map((activity) => (
        <RaidActivity
          activity={activity}
          displayName={displayNameOverride}
          key={activity.activityHash}
        />
      ))}
    </RaidDisplay>
  );
}
