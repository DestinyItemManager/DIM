import React from 'react';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { CrucibleRank } from './CrucibleRank';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

/**
 * displays all Crucible and Gambit ranks for the account
 */
export default function Ranks({
  profileInfo,
  defs,
}: {
  profileInfo: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
}) {
  const firstCharacterProgression = profileInfo.characterProgressions.data
    ? Object.values(profileInfo.characterProgressions.data)[0].progressions
    : {};

  // there are 2 similar DestinyProgression entries for each crucible point system
  // progressionInfo contains detailed rank names, resetInfo has valor/infamy resets
  const activityRanks = [
    {
      // Valor
      progressionInfo: firstCharacterProgression[2626549951],
      resetInfo: firstCharacterProgression[3882308435],
      streakInfo: firstCharacterProgression[2203850209],
    },
    {
      // Glory
      progressionInfo: firstCharacterProgression[2000925172],
      resetInfo: firstCharacterProgression[2679551909],
      streakInfo: firstCharacterProgression[2572719399],
    },
    {
      // Infamy
      progressionInfo: firstCharacterProgression[2772425241],
      resetInfo: firstCharacterProgression[2772425241],
      streakInfo: firstCharacterProgression[2939151659],
    },
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
              streak={activityRank.streakInfo}
            />
          )
      )}
    </div>
  );
}
