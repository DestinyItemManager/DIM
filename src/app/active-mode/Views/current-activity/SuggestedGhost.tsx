import {
  ghostTypeToActivityHash,
  ghostTypeToPlaceHash,
} from 'app/active-mode/Views/current-activity/util';
import { ghostBadgeContent } from 'app/inventory/BadgeInfo';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import StoreInventoryItem from 'app/inventory/StoreInventoryItem';
import { DestinyActivityDefinition, DestinyActivityModeType } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';

/** Find the ghost based on your current activity */
export default function SuggestedGhosts({
  store,
  activity,
}: {
  store: DimStore;
  activity: DestinyActivityDefinition;
}) {
  const allItems = useSelector(allItemsSelector);

  // Ignore suggested ghost for now...
  return null;

  if (
    !activity.activityModeTypes.length ||
    activity.activityModeTypes.includes(DestinyActivityModeType.Social)
  ) {
    return null;
  }

  const isGhostActivity = [
    DestinyActivityModeType.AllPvP,
    DestinyActivityModeType.Gambit,
    DestinyActivityModeType.Raid,
    DestinyActivityModeType.AllStrikes,
  ].some((modeType) => activity.activityModeTypes.includes(modeType));

  const possibleGhosts: DimItem[] = allItems.filter((item) => {
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

  const ghostHashes = possibleGhosts.map(({ index }) => index);

  const alreadyEquipped = store.items.some(
    ({ index, equipped }) => equipped && ghostHashes.includes(index)
  );
  if (alreadyEquipped) {
    // Don't suggest ghosts if you already have the right one equipped
    return null;
  }

  return (
    <>
      {possibleGhosts.map((item) => (
        <StoreInventoryItem key={item.id} item={item} />
      ))}
    </>
  );
}
