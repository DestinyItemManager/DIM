import React from 'react';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { CrucibleRank } from './CrucibleRank';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';

/**
 * displays all Crucible and Gambit ranks for the account
 */
export default function Ranks({
  profileInfo,
  defs
}: {
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
}) {
  const firstCharacterProgression = profileInfo.characterProgressions.data
    ? Object.values(profileInfo.characterProgressions.data)[0].progressions
    : {};

  // there are 2 similar DestinyProgression entries for each crucible point system
  // progressionInfo contains detailed rank names, resetInfo has valor/infamy resets
  let valorResetInfo = firstCharacterProgression[3882308435];
  let gloryResetInfo = firstCharacterProgression[2679551909];

  // this map manually places the progression with currentResetCount into valor and other into glory
  // remove this and put above values directly into activityRanks once Bungie-net/api#986 is resolved
  [2679551909, 3882308435].map((progHash) => {
    if (
      firstCharacterProgression[progHash] &&
      firstCharacterProgression[progHash].currentResetCount
    ) {
      valorResetInfo = firstCharacterProgression[progHash];
    }
    if (
      firstCharacterProgression[progHash] &&
      !firstCharacterProgression[progHash].currentResetCount
    ) {
      gloryResetInfo = firstCharacterProgression[progHash];
    }
  });

  const activityRanks = [
    {
      // Valor
      progressionInfo: firstCharacterProgression[2626549951],
      resetInfo: valorResetInfo
    },
    {
      // Glory
      progressionInfo: firstCharacterProgression[2000925172],
      resetInfo: gloryResetInfo
    },
    {
      // Infamy
      progressionInfo: firstCharacterProgression[2772425241],
      resetInfo: firstCharacterProgression[2772425241]
    }
  ];

  return (
    <div className="progress-for-character ranks-for-character">
      {activityRanks.map(
        (activityRank) =>
          activityRank.progressionInfo && (
            <CrucibleRank
              key={activityRank.progressionInfo.progressionHash}
              defs={defs}
              progress={activityRank.progressionInfo}
              resets={activityRank.resetInfo}
            />
          )
      )}
    </div>
  );
}
