import React from 'react';
import { DimStore } from 'app/inventory/store-types';
import { DestinyProfileResponse, DestinyMilestone } from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import WellRestedPerkIcon from './WellRestedPerkIcon';
import _ from 'lodash';
import idx from 'idx';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { milestoneToItems } from './milestone-items';
import Pursuit from './Pursuit';
import { sortPursuits } from './Pursuits';

/**
 * The list of Milestones for a character. Milestones are different from pursuits and
 * represent challenges, story prompts, and other stuff you can do not represented by Pursuits.
 */
export default function Milestones({
  profileInfo,
  store,
  defs,
  buckets
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
}) {
  const profileMilestones = milestonesForProfile(defs, profileInfo, store.id);
  const characterProgressions = idx(profileInfo, (p) => p.characterProgressions.data[store.id]);

  const milestoneItems = [
    ...milestonesForCharacter(defs, profileInfo, store),
    ...profileMilestones
  ].flatMap((milestone) => milestoneToItems(milestone, defs, buckets, store.classType));

  return (
    <div className="progress-for-character">
      {characterProgressions && (
        <WellRestedPerkIcon defs={defs} progressions={characterProgressions} />
      )}
      {milestoneItems.sort(sortPursuits).map((item) => (
        <Pursuit key={item.hash} item={item} />
      ))}
    </div>
  );
}

/**
 * Get all the milestones that are valid across the whole profile. This still requires a character (any character)
 * to look them up, and the assumptions underlying this may get invalidated as the game evolves.
 */
function milestonesForProfile(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  characterId: string
): DestinyMilestone[] {
  const profileMilestoneData = idx(
    profileInfo.characterProgressions,
    (p) => p.data[characterId].milestones
  );
  const allMilestones: DestinyMilestone[] = profileMilestoneData
    ? Object.values(profileMilestoneData)
    : [];

  const filteredMilestones = allMilestones.filter((milestone) => {
    return (
      !milestone.availableQuests &&
      !milestone.activities &&
      (milestone.vendors || milestone.rewards) &&
      defs.Milestone.get(milestone.milestoneHash)
    );
  });

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}

/**
 * Get all the milestones to show for a particular character, filtered to active milestones and sorted.
 */
function milestonesForCharacter(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  character: DimStore
): DestinyMilestone[] {
  const characterMilestoneData = idx(
    profileInfo.characterProgressions,
    (p) => p.data[character.id].milestones
  );
  const allMilestones: DestinyMilestone[] = characterMilestoneData
    ? Object.values(characterMilestoneData)
    : [];

  const filteredMilestones = allMilestones.filter((milestone) => {
    const def = defs.Milestone.get(milestone.milestoneHash);
    return (
      def &&
      (def.showInExplorer || def.showInMilestones) &&
      (milestone.activities ||
        (milestone.availableQuests &&
          milestone.availableQuests.every(
            (q) =>
              q.status.stepObjectives.length > 0 &&
              q.status.started &&
              (!q.status.completed || !q.status.redeemed)
          )))
    );
  });

  return _.sortBy(filteredMilestones, (milestone) => milestone.order);
}
