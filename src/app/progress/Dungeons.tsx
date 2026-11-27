import { DimStore } from 'app/inventory/store-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import Dungeon from './Dungeon';
import {
  EQUILIBRIUM_ACTIVITY_HASH,
  isRotatingDungeonActivityHash,
  resolveRotatingDungeonHashes,
} from './dungeon-rotation';
import PursuitGrid from './PursuitGrid';

/**
 * Find rotating dungeons whose Weekly Dungeon Challenge is still present on
 * at least one character.
 */
export function getLiveRotatingDungeonHashes(profileInfo: DestinyProfileResponse): number[] {
  const liveHashes = new Set<number>();

  for (const characterActivities of Object.values(profileInfo.characterActivities?.data ?? {})) {
    for (const activity of characterActivities.availableActivities ?? []) {
      if (
        isRotatingDungeonActivityHash(activity.activityHash) &&
        activity.challenges?.some((challenge) => challenge.objective.visible)
      ) {
        liveHashes.add(activity.activityHash);
      }
    }
  }

  return [...liveHashes];
}

export default function Dungeons({
  store,
  profileInfo,
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
}) {
  const liveRotatingDungeonHashes = getLiveRotatingDungeonHashes(profileInfo);

  const rotatingDungeonHashes = resolveRotatingDungeonHashes(liveRotatingDungeonHashes);

  const currentDungeonHashes = [...rotatingDungeonHashes, EQUILIBRIUM_ACTIVITY_HASH];

  return (
    <PursuitGrid>
      {currentDungeonHashes.map((activityHash) => (
        <Dungeon
          key={activityHash}
          activityHash={activityHash}
          store={store}
          profileInfo={profileInfo}
        />
      ))}
    </PursuitGrid>
  );
}
