import { DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';
import React from 'react';

const formatter = new Intl.NumberFormat();

export function ArtifactXP(characterProgress: DestinyCharacterProgressionComponent | undefined) {
  const artifactProgress =
    characterProgress?.progressions[1793560787] ??
    ({} as { progressToNextLevel: undefined; nextLevelAt: undefined; level: undefined });
  const { progressToNextLevel, nextLevelAt, level } = artifactProgress;
  return progressToNextLevel && nextLevelAt && level !== undefined ? (
    <>
      <b>{level + 1}:</b> {formatter.format(progressToNextLevel)} / {formatter.format(nextLevelAt)}
    </>
  ) : undefined;
}
