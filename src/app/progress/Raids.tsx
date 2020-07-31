import React from 'react';
import { Raid } from './Raid';
import { DestinyMilestone, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimStore } from 'app/inventory/store-types';
import { raidOrder, RAID_ACTIVITY_TYPE } from 'app/search/d2-known-values';

/**
 * Displays all of the raids available to a user as milestones
 * reverses raid release order for maximum relevance first
 */
export default function Raids({
  store,
  defs,
  profileInfo,
}: {
  store: DimStore;
  defs: D2ManifestDefinitions;
  profileInfo: DestinyProfileResponse;
}) {
  const profileMilestoneData = profileInfo?.characterProgressions?.data?.[store.id]?.milestones;
  const allMilestones: DestinyMilestone[] = profileMilestoneData
    ? Object.values(profileMilestoneData)
    : [];

  // filter to milestones with child activities of type <ActivityType "Raid" 2043403989>
  const filteredMilestones = allMilestones.filter((milestone) => {
    const milestoneActivities = (defs.Milestone.get(milestone.milestoneHash) || {}).activities;
    return milestoneActivities?.some(
      (activity) =>
        defs.Activity.get(activity.activityHash)?.activityTypeHash === RAID_ACTIVITY_TYPE
    );
  });

  const raids = _.sortBy(filteredMilestones, (f) => {
    const order = raidOrder.indexOf(f.milestoneHash);
    // return reverse order by index
    return order >= 0 ? -order : -999 - f.order;
  });

  return (
    <div className="progress-for-character" key={store.id}>
      {raids.map((raid) => (
        <Raid raid={raid} defs={defs} key={raid.milestoneHash} />
      ))}
    </div>
  );
}
