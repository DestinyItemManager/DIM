import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { RAID_ACTIVITY_TYPE_HASH, RAID_MILESTONE_HASHES } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { DestinyMilestone, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import PursuitGrid from './PursuitGrid';
import { Raid } from './Raid';
import { getCharacterProgressions } from './selectors';

/**
 * Displays all of the raids available to a user as milestones
 * reverses raid release order for maximum relevance first
 */
export default function Raids({
  store,
  profileInfo,
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;
  const characterMilestoneData = getCharacterProgressions(profileInfo, store.id)?.milestones;
  const allMilestones: DestinyMilestone[] = characterMilestoneData
    ? Object.values(characterMilestoneData)
    : [];

  // filter to milestones with child activities that are raids
  const filteredMilestones = allMilestones.filter((milestone) => {
    const milestoneActivities = defs.Milestone.get(milestone.milestoneHash)?.activities;
    return (
      RAID_MILESTONE_HASHES.includes(milestone.milestoneHash) ||
      milestoneActivities?.some(
        (activity) =>
          defs.Activity.get(activity.activityHash)?.activityTypeHash === RAID_ACTIVITY_TYPE_HASH,
        // prefer to use DestinyActivityModeType.Raid, but it appears inconsistently in activity defs
      )
    );
  });

  const raids = filteredMilestones.sort(compareBy((f) => f.order));

  return (
    <PursuitGrid>
      {raids.map((raid) => (
        <Raid raid={raid} key={raid.milestoneHash} />
      ))}
    </PursuitGrid>
  );
}
