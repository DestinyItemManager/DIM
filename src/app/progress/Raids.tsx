import React from 'react';
import { Raid } from './Raid';
import { DestinyMilestone, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { DimStore } from 'app/inventory/store-types';

// unfortunately the API's raid .order attribute is odd
const raidOrder = [
  3660836525, // levi
  2986584050, // eow
  2683538554, // sos
  3181387331, // wish
  1342567285, // scourge
  2590427074 // crown
];

/** Displays all of the raids available to a user as milestones. */
export default function Raids({
  store,
  defs,
  profileInfo
}: {
  store: DimStore;
  defs: D2ManifestDefinitions;
  profileInfo: DestinyProfileResponse;
}) {
  const allMilestones: DestinyMilestone[] =
    profileInfo.characterProgressions &&
    profileInfo.characterProgressions.data &&
    profileInfo.characterProgressions.data[store.id]
      ? Object.values(profileInfo.characterProgressions.data[store.id].milestones)
      : [];

  // filter to milestones with child activities of type <ActivityType "Raid" 2043403989>
  const filteredMilestones = allMilestones.filter((milestone) => {
    const def = defs && defs.Milestone.get(milestone.milestoneHash);
    return (
      def &&
      def.activities &&
      def.activities.some((activity) => {
        const activitydef = defs && defs.Activity.get(activity.activityHash);
        return (
          activitydef && activitydef.activityTypeHash && activitydef.activityTypeHash === 2043403989
        );
      })
    );
  });

  const raids = _.sortBy(filteredMilestones, (f) => {
    const order = raidOrder.indexOf(f.milestoneHash);
    return order >= 0 ? order : 999 + f.order;
  });

  return (
    <div className="progress-for-character" key={store.id}>
      {raids.map((raid) => (
        <Raid raid={raid} defs={defs} key={raid.milestoneHash} />
      ))}
    </div>
  );
}
