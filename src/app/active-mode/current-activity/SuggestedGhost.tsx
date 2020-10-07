import {
  ghostTypeToActivityHash,
  ghostTypeToPlaceHash,
} from 'app/active-mode/current-activity/util';
import { ghostBadgeContent } from 'app/inventory/BadgeInfo';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import StoreInventoryItem from 'app/inventory/StoreInventoryItem';
import { DestinyActivityDefinition, DestinyActivityModeType } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';

/** Find the ghost based on your current activity */
export default function SuggestedGhosts({
  store,
  activity,
}: {
  store: DimStore;
  activity: DestinyActivityDefinition;
}) {
  if (!activity.activityModeTypes.length) {
    return null;
  }

  const isGhostActivity = [
    DestinyActivityModeType.AllPvP,
    DestinyActivityModeType.Gambit,
    DestinyActivityModeType.Raid,
    DestinyActivityModeType.AllStrikes,
  ].some((modeType) => activity.activityModeTypes.includes(modeType));

  const possibleGhosts: DimItem[] = store.items.filter((item) => {
    if (item.bucket.hash !== BucketHashes.Ghost) {
      return;
    }

    const [planetName] = ghostBadgeContent(item);

    if (isGhostActivity) {
      return activity.activityModeTypes.includes(ghostTypeToActivityHash[planetName]);
    } else {
      return ghostTypeToPlaceHash[planetName] === activity.placeHash;
    }
  });

  return (
    <>
      {possibleGhosts.map((item) => (
        <StoreInventoryItem key={item.id} item={item} />
      ))}
    </>
  );
}
